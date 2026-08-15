/**
 * Geofenced ETA calculation for the GPS Tracker module.
 *
 * Given a responding unit's last-known GPS position and a target point
 * (an incident location, picked either from the map or from a barangay
 * dropdown), this returns:
 *   - straight-line distance in km (haversine)
 *   - an estimated time of arrival in minutes, using the unit's live
 *     reported speed when it's moving, and a conservative average urban
 *     emergency-response speed otherwise
 *   - whether the unit is currently inside the same barangay geofence as
 *     the target (a simple point-in-polygon test against the QC
 *     barangay boundaries already used for the risk choropleth)
 *
 * This mirrors falseAlarmScoring.ts / dispatchRecommendation.ts in being
 * an explicit, auditable calculation (not a model) -- every number
 * returned can be traced back to a formula, not a black box.
 */
import qcBarangays from '../data/qcBarangays.json';

const EARTH_RADIUS_KM = 6371;

// Used when a device hasn't reported a live speed (e.g. parked, or the
// "Simulate Ping" demo button). Conservative average for an emergency
// vehicle moving through Quezon City traffic with lights/siren.
const DEFAULT_RESPONSE_SPEED_KPH = 30;

// Added to every ETA to account for crew turnout time (getting the
// truck moving) before it's actually rolling toward the incident.
const TURNOUT_BUFFER_MINUTES = 1.5;

export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeofenceEtaInput extends LatLng {
  speedKph?: number | null;
}

export interface GeofenceEtaResult {
  distanceKm: number;
  etaMinutes: number;
  withinGeofence: boolean;
  vehicleBarangay: string | null;
  targetBarangay: string | null;
}

type Ring = [number, number][]; // [lng, lat] pairs, per GeoJSON

interface BarangayFeature {
  type: 'Feature';
  properties: { name: string };
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown } | null;
}

const FEATURES = (qcBarangays as { features: BarangayFeature[] }).features;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance between two lat/lng points, in kilometers. */
export function haversineDistanceKm(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Ray-casting point-in-polygon test. `point` is [lng, lat] to match GeoJSON. */
function pointInRing(point: [number, number], ring: Ring): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInPolygon(lat: number, lng: number, feature: BarangayFeature): boolean {
  if (!feature.geometry) return false;
  const point: [number, number] = [lng, lat];

  if (feature.geometry.type === 'Polygon') {
    const rings = feature.geometry.coordinates as Ring[];
    // First ring is the outer boundary; any further rings are holes.
    if (!pointInRing(point, rings[0])) return false;
    for (let i = 1; i < rings.length; i++) {
      if (pointInRing(point, rings[i])) return false;
    }
    return true;
  }

  if (feature.geometry.type === 'MultiPolygon') {
    const polygons = feature.geometry.coordinates as Ring[][];
    return polygons.some((rings) => {
      if (!pointInRing(point, rings[0])) return false;
      for (let i = 1; i < rings.length; i++) {
        if (pointInRing(point, rings[i])) return false;
      }
      return true;
    });
  }

  return false;
}

/** Returns the QC barangay whose boundary contains (lat, lng), or null if none matched. */
export function locateBarangay(lat: number, lng: number): string | null {
  const hit = FEATURES.find((f) => pointInPolygon(lat, lng, f));
  return hit?.properties?.name ?? null;
}

export function listBarangayNames(): string[] {
  return FEATURES.map((f) => f.properties?.name).filter((n): n is string => !!n).sort();
}

/** Centroid of a barangay's outer ring -- used as the "target" when a dispatcher picks a barangay by name instead of a map click. */
export function barangayCentroid(name: string): LatLng | null {
  const feature = FEATURES.find((f) => f.properties?.name?.toLowerCase() === name.toLowerCase());
  if (!feature?.geometry) return null;

  const rings = feature.geometry.type === 'Polygon' ? (feature.geometry.coordinates as Ring[]) : (feature.geometry.coordinates as Ring[][]).map((p) => p[0]);
  const outer = rings[0];
  let sumLat = 0;
  let sumLng = 0;
  for (const [lng, lat] of outer) {
    sumLat += lat;
    sumLng += lng;
  }
  return { lat: sumLat / outer.length, lng: sumLng / outer.length };
}

/**
 * Computes distance, ETA, and geofence status for one responding unit
 * heading toward `target`.
 */
export function computeGeofencedEta(vehicle: GeofenceEtaInput, target: LatLng): GeofenceEtaResult {
  const distanceKm = haversineDistanceKm(vehicle, target);
  const speed = vehicle.speedKph && vehicle.speedKph > 5 ? vehicle.speedKph : DEFAULT_RESPONSE_SPEED_KPH;
  const etaMinutes = Math.round((distanceKm / speed) * 60 + TURNOUT_BUFFER_MINUTES);

  const vehicleBarangay = locateBarangay(vehicle.lat, vehicle.lng);
  const targetBarangay = locateBarangay(target.lat, target.lng);

  return {
    distanceKm: Math.round(distanceKm * 100) / 100,
    etaMinutes: Math.max(1, etaMinutes),
    withinGeofence: !!vehicleBarangay && vehicleBarangay === targetBarangay,
    vehicleBarangay,
    targetBarangay,
  };
}
