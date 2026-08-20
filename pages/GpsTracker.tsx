import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Plus } from 'lucide-react';
import { api } from '../lib/api';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import qcBarangays from '../lib/qcBarangays.json';

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

// Frames the map around the full Quezon City barangay layer on load, so
// the choropleth is fully visible without the person needing to manually
// zoom out first.
function FitToBounds({ bounds }: { bounds: L.LatLngBounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [16, 16] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
  const [barangayNames, setBarangayNames] = useState<string[]>([]);
  const [etaTarget, setEtaTarget] = useState('');
  const [etaLoading, setEtaLoading] = useState(false);
  const [etaResults, setEtaResults] = useState<
    { device_id: number; device_code: string; vehicle: { unit_code: string; vehicle_type: string } | null; status: string; distanceKm: number; etaMinutes: number; withinGeofence: boolean }[] | null
  >(null);

  async function load() {
    setLoading(true);
    const [d, v] = await Promise.all([api.get('/gps/devices'), api.get('/vehicles')]);
    setDevices(d);
    setVehicles(v);
    setLoading(false);
  }

  useEffect(() => {
    load();
    api.get('/gps/barangays').then((names) => setBarangayNames(names ?? []));
  }, []);

  // Geofenced ETA: for real-time fleet management, ranks every located
  // vehicle by estimated time of arrival at a target barangay, and flags
  // which ones are already physically inside that barangay's boundary.
  async function computeEta() {
    if (!etaTarget) return;
    setEtaLoading(true);
    try {
      const res = await api.get(`/gps/eta?barangay=${encodeURIComponent(etaTarget)}`);
      setEtaResults(res?.results ?? []);
    } finally {
      setEtaLoading(false);
    }
  }

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

  // Quezon City's 142 barangay boundaries, used only to fit/center the map.
  const qcBounds = useMemo(() => L.geoJSON(qcBarangays as any).getBounds(), []);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-leaf-50 text-leaf-600 dark:bg-white/[0.06] dark:text-leaf-300">
            <MapPin size={20} />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-navy-900 dark:text-slate-100">GPS Tracker</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Live device map, dark basemap by CARTO (free, no API key required).
            </p>
          </div>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 rounded-lg bg-leaf-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm shadow-leaf-500/20 transition-colors duration-200 hover:bg-leaf-600"
        >
          <Plus size={15} /> Register Device
        </button>
      </div>

      <div className="relative isolate mb-6 overflow-hidden rounded-2xl border border-leaf-100 bg-white shadow-sm dark:border-leaf-400/10 dark:bg-navy-800">
        <MapContainer center={DEFAULT_CENTER} zoom={12} scrollWheelZoom style={{ height: '24rem', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <FitToBounds bounds={qcBounds} />
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

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-navy-800">
        <p className="mb-1 text-sm font-semibold text-navy-900 dark:text-slate-100">Geofenced ETA — real-time fleet management</p>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          Pick a barangay and every located vehicle is ranked by estimated time of arrival (haversine distance ÷
          live/average speed), with a flag for units already inside that barangay's boundary.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Target barangay</label>
            <select
              value={etaTarget}
              onChange={(e) => setEtaTarget(e.target.value)}
              className="w-56 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-leaf-400 focus:outline-none dark:border-white/10 dark:bg-navy-900 dark:text-slate-100"
            >
              <option value="">Select…</option>
              {barangayNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={computeEta}
            disabled={!etaTarget || etaLoading}
            className="rounded-lg bg-leaf-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-leaf-600 disabled:opacity-50"
          >
            {etaLoading ? 'Calculating…' : 'Compute ETA'}
          </button>
        </div>

        {etaResults && (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-white/10">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Vehicle</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Distance</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">ETA</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Geofence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {etaResults.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center text-slate-400 dark:text-slate-500">
                      No located vehicles yet.
                    </td>
                  </tr>
                )}
                {etaResults.map((r) => (
                  <tr key={r.device_id}>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                      {r.vehicle?.unit_code ?? r.device_code} {r.vehicle?.vehicle_type ? `· ${r.vehicle.vehicle_type}` : ''}
                    </td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{r.distanceKm} km</td>
                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">~{r.etaMinutes} min</td>
                    <td className="px-3 py-2">
                      {r.withinGeofence ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">Inside</span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">Outside</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-navy-800">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-white/10">
          <thead className="bg-slate-50 dark:bg-white/[0.03]">
            <tr>
              <th className="px-5 py-2.5 text-left font-semibold text-slate-500 dark:text-slate-400">Device</th>
              <th className="px-5 py-2.5 text-left font-semibold text-slate-500 dark:text-slate-400">Vehicle</th>
              <th className="px-5 py-2.5 text-left font-semibold text-slate-500 dark:text-slate-400">Status</th>
              <th className="px-5 py-2.5 text-left font-semibold text-slate-500 dark:text-slate-400">Last Position</th>
              <th className="px-5 py-2.5 text-left font-semibold text-slate-500 dark:text-slate-400">Speed</th>
              <th className="px-5 py-2.5 text-left font-semibold text-slate-500 dark:text-slate-400">Last Ping</th>
              <th className="px-5 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {loading && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-slate-400 dark:text-slate-500">
                  Loading…
                </td>
              </tr>
            )}
            {devices.map((d) => (
              <tr key={d.id} className="transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-white/[0.04]">
                <td className="px-5 py-2.5 font-medium text-slate-700 dark:text-slate-300">{d.device_code}</td>
                <td className="px-5 py-2.5 text-slate-700 dark:text-slate-300">{d.vehicles?.unit_code ?? '—'}</td>
                <td className="px-5 py-2.5">
                  <Badge value={d.status} />
                </td>
                <td className="px-5 py-2.5 text-slate-700 dark:text-slate-300">{d.last_lat && d.last_lng ? `${Number(d.last_lat).toFixed(4)}, ${Number(d.last_lng).toFixed(4)}` : '—'}</td>
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