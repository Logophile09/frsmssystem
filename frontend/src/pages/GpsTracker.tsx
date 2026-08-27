import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Radio, Trash2, Gauge, Clock } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { SkeletonTableRow } from '../components/Skeleton';
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

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'never';
  const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

// Quezon City, PH -- used as the map's default center before any
// devices have reported a position yet.
const DEFAULT_CENTER: [number, number] = [14.676, 121.045];

// Free at carto.com/basemaps/apikey. Left undefined in dev/preview
// deployments that haven't set it yet -- tiles still load, just with
// CARTO's "API KEY REQUIRED" watermark until a key is added.
const CARTO_API_KEY = import.meta.env.VITE_CARTO_API_KEY as string | undefined;

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
  const toast = useToast();
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
  const [deletingDevice, setDeletingDevice] = useState<GpsDevice | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [d, v] = await Promise.all([api.get('/gps/devices'), api.get('/vehicles')]);
      setDevices(d ?? []);
      setVehicles(v ?? []);
    } catch (e: any) {
      toast.error(e.message, 'Failed to load GPS devices');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    api.get('/gps/barangays').then((names) => setBarangayNames(names ?? []));
  }, []);

  async function computeEta() {
    if (!etaTarget) return;
    setEtaLoading(true);
    try {
      const res = await api.get(`/gps/eta?barangay=${encodeURIComponent(etaTarget)}`);
      setEtaResults(res?.results ?? []);
      toast.info(`ETA computed for ${etaTarget}`);
    } catch (e: any) {
      toast.error(e.message, 'ETA calculation failed');
    } finally {
      setEtaLoading(false);
    }
  }

  async function simulatePing(id: number) {
    setPinging(id);
    try {
      await api.post(`/gps/devices/${id}/simulate-ping`, {});
      toast.success('Simulated GPS ping received.');
      await load();
    } catch (e: any) {
      toast.error(e.message, 'Simulation failed');
    } finally {
      setPinging(null);
    }
  }

  async function addDevice() {
    if (!newCode) return;
    try {
      await api.post('/gps/devices', { device_code: newCode, vehicle_id: newVehicle ? Number(newVehicle) : null });
      setAdding(false);
      setNewCode('');
      setNewVehicle('');
      toast.success(`Registered GPS device ${newCode}.`);
      await load();
    } catch (e: any) {
      toast.error(e.message, 'Registration failed');
    }
  }

  async function confirmRemove() {
    if (!deletingDevice) return;
    setActionLoading(true);
    try {
      await api.del(`/gps/devices/${deletingDevice.id}`);
      toast.success(`Removed GPS device ${deletingDevice.device_code}.`);
      setDeletingDevice(null);
      await load();
    } catch (e: any) {
      toast.error(e.message, 'Delete failed');
    } finally {
      setActionLoading(false);
    }
  }

  const located = devices.filter((d) => d.last_lat != null && d.last_lng != null);

  // Quezon City's 142 barangay boundaries, used only to fit/center the map.
  const qcBounds = useMemo(() => L.geoJSON(qcBarangays as any).getBounds(), []);

  return (
    <div>
      <div className="module-header">
        <div className="flex items-center gap-4">
          <div className="module-icon">
            <MapPin size={21} />
          </div>
          <div>
            <h1 className="module-title">GPS Tracker</h1>
            <p className="module-description">Live device map, dark basemap by CARTO.</p>
          </div>
        </div>
        <button onClick={() => setAdding(true)} className="btn-primary">
          <Radio size={15} /> Register Device
        </button>
      </div>

      <div className="relative isolate mb-6 overflow-hidden rounded-2xl border border-leaf-100 bg-white shadow-sm dark:border-leaf-400/10 dark:bg-navy-800">
        <MapContainer center={DEFAULT_CENTER} zoom={12} scrollWheelZoom style={{ height: '24rem', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            // CARTO's raster basemaps started requiring a (free) API key in
            // 2026 -- without it every tile gets an "API KEY REQUIRED"
            // watermark. Get one at carto.com/basemaps/apikey and set
            // VITE_CARTO_API_KEY in frontend/.env.local (and in Vercel's
            // project env vars for production).
            url={`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png${
              CARTO_API_KEY ? `?key=${CARTO_API_KEY}` : ''
            }`}
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

      <div className="surface-card mb-6 p-5">
        <p className="surface-card-title">Geofenced ETA — real-time fleet management</p>
        <p className="surface-card-subtitle mb-3">
          Pick a barangay and every located vehicle is ranked by estimated time of arrival (haversine distance ÷
          live/average speed), with a flag for units already inside that barangay's boundary.
        </p>
        <div className="flex flex-wrap items-end gap-2.5">
          <div>
            <label className="field-label">Target barangay</label>
            <select value={etaTarget} onChange={(e) => setEtaTarget(e.target.value)} className="field-input w-56">
              <option value="">Select…</option>
              {barangayNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <button onClick={computeEta} disabled={!etaTarget || etaLoading} className="btn-primary">
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
                    <td colSpan={4} className="px-3 py-4 text-center text-slate-400">
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
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" /> Inside
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" /> Outside
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-white/5">
            <thead className="bg-slate-50/70 dark:bg-white/[0.03]">
              <tr>
                <th className="table-head-cell">Device</th>
                <th className="table-head-cell">Vehicle</th>
                <th className="table-head-cell">Status</th>
                <th className="table-head-cell">Last Position</th>
                <th className="table-head-cell">Speed</th>
                <th className="table-head-cell">Last Ping</th>
                <th className="table-head-cell text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonTableRow key={i} cols={7} />
                ))}
              {!loading && devices.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-slate-400 dark:text-slate-500">
                    No GPS devices registered yet.
                  </td>
                </tr>
              )}
              {!loading &&
                devices.map((d) => (
                  <tr key={d.id} className="table-row">
                    <td className="table-cell font-semibold text-navy-900 dark:text-slate-100">{d.device_code}</td>
                    <td className="table-cell">
                      {d.vehicles ? (
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {d.vehicles.unit_code}{' '}
                          <span className="text-xs font-normal text-slate-400">({d.vehicles.vehicle_type})</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <Badge value={d.status} />
                    </td>
                    <td className="table-cell">
                      {d.last_lat && d.last_lng ? (
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                          {Number(d.last_lat).toFixed(4)}, {Number(d.last_lng).toFixed(4)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="table-cell">
                      {d.last_speed_kph != null ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                          <Gauge size={13} className="text-leaf-500" />
                          {d.last_speed_kph} kph
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="table-cell text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} className="opacity-60" />
                        {formatRelativeTime(d.last_ping_at)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => simulatePing(d.id)}
                          disabled={pinging === d.id}
                          className="btn-outline !px-3 !py-1 !text-xs disabled:opacity-50"
                        >
                          {pinging === d.id ? 'Pinging…' : 'Simulate Ping'}
                        </button>
                        <button
                          onClick={() => setDeletingDevice(d)}
                          title="Remove"
                          className="btn-icon-danger"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {adding && (
        <Modal title="Register GPS Device" onClose={() => setAdding(false)}>
          <div className="space-y-3">
            <div>
              <label className="field-label">Device Code</label>
              <input
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="GPS-ENG-03"
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Vehicle</label>
              <select value={newVehicle} onChange={(e) => setNewVehicle(e.target.value)} className="field-input">
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
            <button onClick={() => setAdding(false)} className="btn-outline">
              Cancel
            </button>
            <button onClick={addDevice} className="btn-primary">
              Register
            </button>
          </div>
        </Modal>
      )}

      {/* Confirm Deletion Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingDevice)}
        title="Remove GPS Device"
        message={
          <span>
            Are you sure you want to unregister GPS device{' '}
            <strong>{deletingDevice?.device_code}</strong>? IoT pings from this device will be rejected.
          </span>
        }
        confirmText="Remove Device"
        isDestructive={true}
        loading={actionLoading}
        onConfirm={confirmRemove}
        onCancel={() => setDeletingDevice(null)}
      />
    </div>
  );
}