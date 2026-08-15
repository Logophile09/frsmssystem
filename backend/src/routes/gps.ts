import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { requireAuth } from '../middleware/auth';
import { barangayCentroid, computeGeofencedEta, listBarangayNames } from '../lib/geofenceEta';

const router = Router();

const SIGNAL_LOST_MINUTES = 15;

async function flagStaleDevices() {
  const cutoff = new Date(Date.now() - SIGNAL_LOST_MINUTES * 60_000).toISOString();
  await supabaseAdmin
    .from('gps_devices')
    .update({ status: 'signal_lost' })
    .lt('last_ping_at', cutoff)
    .eq('status', 'online');
}

// Dashboard: list devices with last known position. Requires login.
router.get('/devices', requireAuth, async (_req, res) => {
  await flagStaleDevices();
  const { data, error } = await supabaseAdmin
    .from('gps_devices')
    .select('*, vehicles(unit_code, vehicle_type)')
    .order('device_code', { ascending: true });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.get('/devices/:id/history', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('gps_location_history')
    .select('*')
    .eq('device_id', req.params.id)
    .order('recorded_at', { ascending: false })
    .limit(50);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Register a new device against a vehicle. Requires login.
router.post('/devices', requireAuth, async (req, res) => {
  const { device_code, vehicle_id } = req.body ?? {};
  if (!device_code) return res.status(400).json({ error: 'device_code is required' });
  const { data, error } = await supabaseAdmin
    .from('gps_devices')
    .insert({ device_code, vehicle_id: vehicle_id ?? null, status: 'offline' })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

router.delete('/devices/:id', requireAuth, async (req, res) => {
  const { error } = await supabaseAdmin.from('gps_devices').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});

/**
 * Real ingestion endpoint for physical IoT units. NOT behind requireAuth
 * -- it's machine-to-machine, authenticated instead with the device's
 * own device_code + token (issued when the device was registered).
 *
 * POST /api/gps/ping  { device_code, token, lat, lng, speed_kph?, heading? }
 */
router.post('/ping', async (req, res) => {
  const { device_code, token, lat, lng, speed_kph, heading } = req.body ?? {};
  if (!device_code || !token || lat === undefined || lng === undefined) {
    return res.status(400).json({ error: 'device_code, token, lat, and lng are required' });
  }

  const { data: device, error: findError } = await supabaseAdmin
    .from('gps_devices')
    .select('id')
    .eq('device_code', device_code)
    .eq('device_token', token)
    .single();

  if (findError || !device) return res.status(401).json({ error: 'Unknown device or bad token' });

  await supabaseAdmin.from('gps_location_history').insert({
    device_id: device.id,
    lat,
    lng,
    speed_kph: speed_kph ?? null,
    heading: heading ?? null,
  });

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('gps_devices')
    .update({
      status: 'online',
      last_lat: lat,
      last_lng: lng,
      last_speed_kph: speed_kph ?? null,
      last_heading: heading ?? null,
      last_ping_at: new Date().toISOString(),
    })
    .eq('id', device.id)
    .select()
    .single();

  if (updateError) return res.status(400).json({ error: updateError.message });
  res.json(updated);
});

/**
 * "Simulate Ping" button for demos, without real hardware. Uses the
 * normal logged-in session (unlike /ping above). Jitters the device's
 * last known position slightly to fake movement.
 */
router.post('/devices/:id/simulate-ping', requireAuth, async (req, res) => {
  const { data: device, error: findError } = await supabaseAdmin
    .from('gps_devices')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (findError || !device) return res.status(404).json({ error: 'Device not found' });

  const jitter = () => (Math.random() - 0.5) * 0.01;
  const lat = Number(device.last_lat ?? 14.676) + jitter();
  const lng = Number(device.last_lng ?? 121.044) + jitter();
  const speed_kph = Math.round(Math.random() * 60);
  const heading = Math.round(Math.random() * 359);

  await supabaseAdmin.from('gps_location_history').insert({ device_id: device.id, lat, lng, speed_kph, heading });

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('gps_devices')
    .update({ status: 'online', last_lat: lat, last_lng: lng, last_speed_kph: speed_kph, last_heading: heading, last_ping_at: new Date().toISOString() })
    .eq('id', device.id)
    .select()
    .single();

  if (updateError) return res.status(400).json({ error: updateError.message });
  res.json(updated);
});

/**
 * Geofenced ETA calculations for real-time fleet management.
 *
 * GET /api/gps/eta?targetLat=&targetLng=              -> ETA from every
 *   online device's last known position to an explicit point.
 * GET /api/gps/eta?barangay=Culiat                     -> same, but the
 *   target point is that barangay's centroid instead of raw coordinates.
 *
 * Returns devices sorted by ETA ascending so the fastest-arriving unit
 * for a given incident is first -- this is what feeds the "nearest
 * available unit" hint on the Dispatch Recommendation page.
 */
router.get('/eta', requireAuth, async (req, res) => {
  const { targetLat, targetLng, barangay } = req.query as { targetLat?: string; targetLng?: string; barangay?: string };

  let target: { lat: number; lng: number } | null = null;
  if (barangay) {
    target = barangayCentroid(barangay);
    if (!target) return res.status(400).json({ error: `Unknown barangay: ${barangay}` });
  } else if (targetLat && targetLng) {
    target = { lat: Number(targetLat), lng: Number(targetLng) };
  }
  if (!target || Number.isNaN(target.lat) || Number.isNaN(target.lng)) {
    return res.status(400).json({ error: 'Provide either ?barangay=<name> or ?targetLat=&targetLng=' });
  }

  await flagStaleDevices();
  const { data: devices, error } = await supabaseAdmin
    .from('gps_devices')
    .select('*, vehicles(id, unit_code, vehicle_type, status)')
    .not('last_lat', 'is', null)
    .not('last_lng', 'is', null);
  if (error) return res.status(400).json({ error: error.message });

  const results = (devices ?? [])
    .map((d) => ({
      device_id: d.id,
      device_code: d.device_code,
      vehicle: d.vehicles ?? null,
      status: d.status,
      ...computeGeofencedEta({ lat: Number(d.last_lat), lng: Number(d.last_lng), speedKph: d.last_speed_kph }, target as { lat: number; lng: number }),
    }))
    .sort((a, b) => a.etaMinutes - b.etaMinutes);

  res.json({ target, results });
});

/** List of QC barangay names, for the ETA-target dropdown on the GPS Tracker page. */
router.get('/barangays', requireAuth, async (_req, res) => {
  res.json(listBarangayNames());
});

export default router;
