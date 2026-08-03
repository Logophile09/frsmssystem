import { useEffect, useState } from 'react';
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

// Schematic bounding box roughly covering Quezon City, used only to place
// dots on the simple SVG map below -- no external map API/key needed.
const BOUNDS = { minLat: 14.60, maxLat: 14.76, minLng: 120.98, maxLng: 121.12 };

function project(lat: number, lng: number) {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100;
  const y = 100 - ((lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;
  return { x: Math.min(97, Math.max(3, x)), y: Math.min(97, Math.max(3, y)) };
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

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">GPS Tracker</h1>
          <p className="text-sm text-slate-500">Live schematic map + device roster. No external map API/key required.</p>
        </div>
        <button onClick={() => setAdding(true)} className="rounded-lg bg-leaf-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-leaf-600">
          + Register Device
        </button>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <svg viewBox="0 0 100 100" className="h-72 w-full rounded-lg bg-slate-50">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
          {located.map((d) => {
            const { x, y } = project(Number(d.last_lat), Number(d.last_lng));
            const color = d.status === 'online' ? '#10b981' : d.status === 'signal_lost' ? '#e11d48' : '#94a3b8';
            return (
              <g key={d.id}>
                <circle cx={x} cy={y} r={2.2} fill={color} stroke="white" strokeWidth={0.5} />
                <text x={x + 2.5} y={y + 1} fontSize={3} fill="#334155">
                  {d.device_code}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500">Device</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500">Vehicle</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500">Status</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500">Last Position</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500">Speed</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-500">Last Ping</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {devices.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 text-slate-700">{d.device_code}</td>
                <td className="px-4 py-2.5 text-slate-700">{d.vehicles?.unit_code ?? '—'}</td>
                <td className="px-4 py-2.5">
                  <Badge value={d.status} />
                </td>
                <td className="px-4 py-2.5 text-slate-700">{d.last_lat && d.last_lng ? `${Number(d.last_lat).toFixed(4)}, ${Number(d.last_lng).toFixed(4)}` : '—'}</td>
                <td className="px-4 py-2.5 text-slate-700">{d.last_speed_kph != null ? `${d.last_speed_kph} kph` : '—'}</td>
                <td className="px-4 py-2.5 text-slate-500">{d.last_ping_at ? new Date(d.last_ping_at).toLocaleString() : 'never'}</td>
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
              <label className="mb-1 block text-xs font-medium text-slate-600">Device Code</label>
              <input
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="GPS-ENG-03"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-leaf-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Vehicle</label>
              <select
                value={newVehicle}
                onChange={(e) => setNewVehicle(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-leaf-400 focus:outline-none"
              >
                <option value="">None</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.unit_code}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-400">
              A random device token is generated on save -- that's the credential the physical IoT unit POSTs to{' '}
              <code>/api/gps/ping</code> with.
            </p>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setAdding(false)} className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
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
