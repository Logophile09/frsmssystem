import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../lib/api';
import Badge from '../components/Badge';
import Modal from '../components/Modal';

interface GpsDevice {
  id: number;
  device_code: string;
  device_token: string;
  vehicle_id: number | null;
  status: string;
  last_lat: number | null;
  last_lng: number | null;
  last_speed_kph: number | null;
  last_heading: number | null;
  last_ping_at: string | null;
  vehicles?: { unit_code: string; vehicle_type: string } | null;
}

const STATUS_COLOR: Record<string, string> = {
  online: '#3fa367',
  signal_lost: '#e11d48',
  offline: '#94a3b8',
};

// Quezon City, PH -- used as the map's default center before any
// devices have reported a position yet.
const DEFAULT_CENTER: [number, number] = [14.676, 121.045];

// Keeps the map framed around whichever devices currently have a known
// position, without forcing the person to manually pan/zoom on load.
function FitToMarkers({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
    } else {
      map.fitBounds(points, { padding: [30, 30] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(points)]);
  return null;
}

export default function GpsTrackerPage() {
  const [devices, setDevices] = useState<GpsDevice[]>([]);
  const [vehicles, setVehicles] = useState<{ id: number; unit_code: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinging, setPinging] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newVehicle, setNewVehicle] = useState('');

  async function load() {
    setLoading(true);
    const [d, v] = await Promise.all([api.get('/gps/devices'), api.get('/vehicles')]);
    setDevices(d);
    setVehicles(v);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function simulatePing(id: number) {
    setPinging(id);
    try {
      await api.post(`/gps/devices/${id}/simulate-ping`, {});
      await load();
    } finally {
      setPinging(null);
    }
  }

  async function addDevice() {
    if (!newCode) return;
    await api.post('/gps/devices', { device_code: newCode, vehicle_id: newVehicle ? Number(newVehicle) : null });
    setAdding(false);
    setNewCode('');
    setNewVehicle('');
    await load();
  }

  async function removeDevice(id: number) {
    if (!confirm('Remove this GPS device?')) return;
    await api.del(`/gps/devices/${id}`);
    await load();
  }

  const located = devices.filter((d) => d.last_lat != null && d.last_lng != null);
  const points: [number, number][] = located.map((d) => [Number(d.last_lat), Number(d.last_lng)]);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-navy-900 dark:text-slate-100">GPS Tracker</h1>
          <p className="text-sm text-slate-500">Live map + device roster, powered by OpenStreetMap (free, no API key required).</p>
        </div>
        <button onClick={() => setAdding(true)} className="rounded-lg bg-leaf-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-leaf-600">
          + Register Device
        </button>
      </div>

      <div className="mb-6 overflow-hidden rounded-xl border border-leaf-100 bg-white shadow-sm dark:border-leaf-400/10 dark:bg-navy-800">
        <MapContainer center={DEFAULT_CENTER} zoom={12} scrollWheelZoom style={{ height: '18rem', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitToMarkers points={points} />
          {located.map((d) => (
            <CircleMarker
              key={d.id}
              center={[Number(d.last_lat), Number(d.last_lng)]}
              radius={9}
              pathOptions={{
                color: '#ffffff',
                weight: 2,
                fillColor: STATUS_COLOR[d.status] ?? '#94a3b8',
                fillOpacity: 1,
              }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{d.device_code}</p>
                  <p className="text-slate-600">
                    {d.vehicles?.unit_code ?? 'Unassigned'} {d.vehicles?.vehicle_type ? `· ${d.vehicles.vehicle_type}` : ''}
                  </p>
                  <p className="capitalize text-slate-600">{d.status.replace(/_/g, ' ')}</p>
                  {d.last_speed_kph != null && <p className="text-slate-600">{d.last_speed_kph} kph</p>}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-navy-800">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-white/10">
          <thead className="bg-slate-50 dark:bg-white/5">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500 dark:text-slate-400">Device</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500 dark:text-slate-400">Vehicle</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500 dark:text-slate-400">Status</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500 dark:text-slate-400">Last Position</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500 dark:text-slate-400">Speed</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500 dark:text-slate-400">Last Ping</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {devices.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{d.device_code}</td>
                <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{d.vehicles?.unit_code ?? '—'}</td>
                <td className="px-4 py-2.5">
                  <Badge value={d.status} />
                </td>
                <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{d.last_lat && d.last_lng ? `${Number(d.last_lat).toFixed(4)}, ${Number(d.last_lng).toFixed(4)}` : '—'}</td>
                <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{d.last_speed_kph != null ? `${d.last_speed_kph} kph` : '—'}</td>
                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{d.last_ping_at ? new Date(d.last_ping_at).toLocaleString() : 'never'}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right">
                  <button
                    onClick={() => simulatePing(d.id)}
                    disabled={pinging === d.id}
                    className="mr-3 text-leaf-500 hover:underline disabled:opacity-50"
                  >
                    {pinging === d.id ? 'Pinging…' : 'Simulate Ping'}
                  </button>
                  <button onClick={() => removeDevice(d.id)} className="text-rose-600 hover:underline">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {adding && (
        <Modal title="Register GPS Device" onClose={() => setAdding(false)}>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Device Code</label>
              <input
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="GPS-ENG-03"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-leaf-400 focus:outline-none dark:border-white/10 dark:bg-navy-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Vehicle</label>
              <select
                value={newVehicle}
                onChange={(e) => setNewVehicle(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-leaf-400 focus:outline-none dark:border-white/10 dark:bg-navy-800 dark:text-slate-100"
              >
                <option value="">None</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.unit_code}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              A random device token is generated on save -- that's the credential the physical IoT unit POSTs to{' '}
              <code>/api/gps/ping</code> with.
            </p>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setAdding(false)} className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5">
              Cancel
            </button>
            <button onClick={addDevice} className="rounded-lg bg-leaf-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-leaf-600">
              Register
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
