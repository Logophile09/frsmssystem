// ---------------------------------------------------------------------
// Offline demo dataset + tiny in-memory "API".
//
// This mirrors the exact seed data in supabase/schema.sql. It exists so
// the app ALWAYS has something real to show -- every module, fully
// populated -- even if VITE_API_URL / Supabase isn't reachable (wrong
// env vars, backend asleep, no internet during a demo, etc).
//
// api.ts tries the real backend first. Only if that call fails does it
// fall back to the functions in this file, so once your backend +
// Supabase are wired up correctly, the app automatically uses real,
// live data instead -- nothing here gets in the way of that.
// ---------------------------------------------------------------------

import { computeFalseAlarmScore } from './falseAlarmScoring';
import qcBarangays from './qcBarangays.json';

// Lightweight demo-mode mirrors of backend/src/lib/geofenceEta.ts --
// just enough to keep the ETA panel populated while offline, without
// duplicating the full point-in-polygon geofence check.
function haversineKmDemo(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
function barangayCentroidDemo(name: string): { lat: number; lng: number } | null {
  const feature: any = (qcBarangays as any).features.find((f: any) => f.properties?.name?.toLowerCase() === name.toLowerCase());
  const ring = feature?.geometry?.type === 'Polygon' ? feature.geometry.coordinates[0] : feature?.geometry?.type === 'MultiPolygon' ? feature.geometry.coordinates[0][0] : null;
  if (!ring) return null;
  let sumLat = 0;
  let sumLng = 0;
  for (const [lng, lat] of ring) {
    sumLat += lat;
    sumLng += lng;
  }
  return { lat: sumLat / ring.length, lng: sumLng / ring.length };
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const hoursAgo = (n: number) => new Date(Date.now() - n * 3600000).toISOString();
const minutesAgo = (n: number) => new Date(Date.now() - n * 60000).toISOString();
const offset = (iso: string, hours: number) => new Date(new Date(iso).getTime() + hours * 3600000).toISOString();

// ---------------------------------------------------------------------
// Personnel
// ---------------------------------------------------------------------
export const personnel = [
  { id: 1, employee_no: 'EMP-1001', full_name: 'Ramon Santos', rank_title: 'Fire Officer 1', phone: '0917-200-1001', email: 'r.santos@frsms.gov', status: 'on_duty', hire_date: '2019-06-01' , profile_id: null },
  { id: 2, employee_no: 'EMP-1002', full_name: 'Marites Cruz', rank_title: 'Fire Officer 2', phone: '0917-200-1002', email: 'm.cruz@frsms.gov', status: 'on_duty', hire_date: '2018-03-14' , profile_id: null },
  { id: 3, employee_no: 'EMP-1003', full_name: 'Jericho Reyes', rank_title: 'Fire Officer 3', phone: '0917-200-1003', email: 'j.reyes@frsms.gov', status: 'off_duty', hire_date: '2020-11-20' , profile_id: null },
  { id: 4, employee_no: 'EMP-1004', full_name: 'Angelo Bautista', rank_title: 'Fire Inspector', phone: '0917-200-1004', email: 'a.bautista@frsms.gov', status: 'on_duty', hire_date: '2021-01-10' , profile_id: null },
  { id: 5, employee_no: 'EMP-1005', full_name: 'Liza Fernandez', rank_title: 'Fire Officer 1', phone: '0917-200-1005', email: 'l.fernandez@frsms.gov', status: 'on_leave', hire_date: '2022-07-05' , profile_id: null },
  { id: 6, employee_no: 'EMP-1006', full_name: 'Carlo Villanueva', rank_title: 'Senior Fire Officer', phone: '0917-200-1006', email: 'c.villanueva@frsms.gov', status: 'on_duty', hire_date: '2016-02-18' , profile_id: null },
  { id: 7, employee_no: 'EMP-1007', full_name: 'Dennis Ocampo', rank_title: 'Fire Officer 2', phone: '0917-200-1007', email: 'd.ocampo@frsms.gov', status: 'off_duty', hire_date: '2019-09-09' , profile_id: null },
  { id: 8, employee_no: 'EMP-1008', full_name: 'Grace Manalo', rank_title: 'Fire Inspector', phone: '0917-200-1008', email: 'g.manalo@frsms.gov', status: 'on_duty', hire_date: '2020-05-22' , profile_id: null },
  { id: 9, employee_no: 'EMP-1009', full_name: 'Paolo Diaz', rank_title: 'Fire Officer 1', phone: '0917-200-1009', email: 'p.diaz@frsms.gov', status: 'on_duty', hire_date: '2023-01-30' , profile_id: null },
  { id: 10, employee_no: 'EMP-1010', full_name: 'Christine Aguilar', rank_title: 'Fire Officer 3', phone: '0917-200-1010', email: 'c.aguilar@frsms.gov', status: 'off_duty', hire_date: '2017-11-02' , profile_id: null },
  { id: 11, employee_no: 'EMP-1011', full_name: 'Miguel Torres', rank_title: 'Station Chief', phone: '0917-200-1011', email: 'm.torres@frsms.gov', status: 'on_duty', hire_date: '2014-04-01' , profile_id: null },
  { id: 12, employee_no: 'EMP-1012', full_name: 'Bea Salonga-Cruz', rank_title: 'Fire Officer 2', phone: '0917-200-1012', email: 'b.cruz@frsms.gov', status: 'on_leave', hire_date: '2021-08-19' , profile_id: null },
];

// ---------------------------------------------------------------------
// Vehicles
// ---------------------------------------------------------------------
export const vehicles = [
  { id: 1, unit_code: 'ENG-01', vehicle_type: 'Fire Engine', plate_number: 'FR-1234', status: 'available', capacity: 6, last_maintenance: '2026-05-01' },
  { id: 2, unit_code: 'ENG-02', vehicle_type: 'Fire Engine', plate_number: 'FR-5678', status: 'dispatched', capacity: 6, last_maintenance: '2026-04-15' },
  { id: 3, unit_code: 'ENG-03', vehicle_type: 'Fire Engine', plate_number: 'FR-3345', status: 'available', capacity: 6, last_maintenance: '2026-06-20' },
  { id: 4, unit_code: 'AMB-01', vehicle_type: 'Ambulance', plate_number: 'FR-2222', status: 'available', capacity: 3, last_maintenance: '2026-06-10' },
  { id: 5, unit_code: 'AMB-02', vehicle_type: 'Ambulance', plate_number: 'FR-2244', status: 'dispatched', capacity: 3, last_maintenance: '2026-05-28' },
  { id: 6, unit_code: 'LDR-01', vehicle_type: 'Ladder Truck', plate_number: 'FR-9911', status: 'maintenance', capacity: 4, last_maintenance: '2026-03-20' },
  { id: 7, unit_code: 'RES-01', vehicle_type: 'Rescue Vehicle', plate_number: 'FR-7712', status: 'available', capacity: 5, last_maintenance: '2026-06-01' },
  { id: 8, unit_code: 'HZM-01', vehicle_type: 'Hazmat Unit', plate_number: 'FR-8850', status: 'out_of_service', capacity: 3, last_maintenance: '2026-02-14' },
];
const vehicleById = (id: number | null) => (id ? vehicles.find((v) => v.id === id) ?? null : null);

// ---------------------------------------------------------------------
// Equipment
// ---------------------------------------------------------------------
export const equipment = [
  { id: 1, name: 'Fire Extinguisher (ABC)', category: 'Suppression', quantity: 12, condition_status: 'good', vehicle_id: 1, location: 'ENG-01 compartment' },
  { id: 2, name: 'Breathing Apparatus (SCBA)', category: 'PPE', quantity: 6, condition_status: 'fair', vehicle_id: 1, location: 'ENG-01 compartment' },
  { id: 3, name: 'First Aid Kit', category: 'Medical', quantity: 4, condition_status: 'good', vehicle_id: 4, location: 'AMB-01' },
  { id: 4, name: 'Hydraulic Rescue Tool', category: 'Rescue', quantity: 2, condition_status: 'good', vehicle_id: 2, location: 'ENG-02 compartment' },
  { id: 5, name: 'Fire Hose (30m)', category: 'Suppression', quantity: 10, condition_status: 'good', vehicle_id: null, location: 'Station storage' },
  { id: 6, name: 'Thermal Imaging Camera', category: 'Detection', quantity: 3, condition_status: 'good', vehicle_id: 3, location: 'ENG-03 compartment' },
  { id: 7, name: 'Turnout Gear (Set)', category: 'PPE', quantity: 20, condition_status: 'good', vehicle_id: null, location: 'Station gear room' },
  { id: 8, name: 'Portable Generator', category: 'Support', quantity: 2, condition_status: 'fair', vehicle_id: 7, location: 'RES-01 compartment' },
  { id: 9, name: 'Chemical Spill Kit', category: 'Hazmat', quantity: 5, condition_status: 'good', vehicle_id: 8, location: 'HZM-01 compartment' },
  { id: 10, name: 'Defibrillator (AED)', category: 'Medical', quantity: 2, condition_status: 'good', vehicle_id: 5, location: 'AMB-02' },
  { id: 11, name: 'Jaws of Life', category: 'Rescue', quantity: 1, condition_status: 'good', vehicle_id: 7, location: 'RES-01 compartment' },
  { id: 12, name: 'Ladder (10m extension)', category: 'Rescue', quantity: 2, condition_status: 'fair', vehicle_id: 6, location: 'LDR-01 compartment' },
].map((e) => ({ ...e, vehicles: vehicleById(e.vehicle_id) ? { unit_code: vehicleById(e.vehicle_id)!.unit_code } : null }));

// ---------------------------------------------------------------------
// Incidents (+ personnel/vehicle assignments, + AI false-alarm scoring)
//
// Every incident's ai_false_alarm_* fields below are computed live by
// computeFalseAlarmScore() from the caller/sensor inputs on each row --
// NOT hand-written numbers. That keeps demo mode honest about how the
// AI module actually works (see False_Alarm_AI_Module_Notes.txt).
// ---------------------------------------------------------------------
const rawIncidents = [
  { id: 1, incident_number: 'INC-2026-0001', incident_type: 'Structure Fire', description: 'Reported fire on the 2nd floor of a residential building.', location: 'Tandang Sora Ave., Brgy. Culiat, Quezon City', severity: '4', status: 'resolved', created_at: daysAgo(14), resolved_at: offset(daysAgo(14), 3),
    is_anonymous_caller: false, caller_count: 3, smoke_sensor_triggered: true, fire_personnel_confirmed_smoke: true, false_alarm_review_status: 'confirmed_real' },
  { id: 2, incident_number: 'INC-2026-0002', incident_type: 'Vehicular Accident', description: 'Two-vehicle collision, one injured.', location: 'Visayas Ave., Brgy. Culiat, Quezon City', severity: '3', status: 'resolved', created_at: daysAgo(12), resolved_at: offset(daysAgo(12), 2),
    is_anonymous_caller: false, caller_count: 2, smoke_sensor_triggered: false, fire_personnel_confirmed_smoke: false, false_alarm_review_status: 'confirmed_real' },
  { id: 3, incident_number: 'INC-2026-0003', incident_type: 'Grass Fire', description: 'Small grass fire near a vacant lot, contained quickly.', location: 'Culiat Road, Brgy. Culiat, Quezon City', severity: '1', status: 'resolved', created_at: daysAgo(11), resolved_at: offset(daysAgo(11), 1),
    is_anonymous_caller: false, caller_count: 1, smoke_sensor_triggered: false, fire_personnel_confirmed_smoke: true, false_alarm_review_status: 'confirmed_real' },
  { id: 4, incident_number: 'INC-2026-0004', incident_type: 'Medical Emergency', description: 'Elderly patient with chest pains.', location: 'Kalayaan St., Brgy. Culiat, Quezon City', severity: '3', status: 'resolved', created_at: daysAgo(9), resolved_at: offset(daysAgo(9), 1.5),
    is_anonymous_caller: false, caller_count: 2, smoke_sensor_triggered: false, fire_personnel_confirmed_smoke: false, false_alarm_review_status: 'confirmed_real' },
  { id: 5, incident_number: 'INC-2026-0005', incident_type: 'Structure Fire', description: 'Possible false alarm - smoke detector triggered, no visible fire on arrival.', location: 'Brgy. Culiat, Quezon City', severity: '1', status: 'resolved', created_at: daysAgo(8), resolved_at: offset(daysAgo(8), 0.75),
    is_anonymous_caller: true, caller_count: 1, smoke_sensor_triggered: false, fire_personnel_confirmed_smoke: false, false_alarm_review_status: 'confirmed_false' },
  { id: 6, incident_number: 'INC-2026-0006', incident_type: 'Medical Emergency', description: 'Patient with chest pains.', location: 'Mabuhay St., Brgy. Culiat, Quezon City', severity: '3', status: 'reported', created_at: daysAgo(6), resolved_at: null,
    is_anonymous_caller: false, caller_count: 2, smoke_sensor_triggered: false, fire_personnel_confirmed_smoke: false, false_alarm_review_status: 'pending' },
  { id: 7, incident_number: 'INC-2026-0007', incident_type: 'Medical Emergency', description: 'Fall injury, ambulance requested.', location: 'Tandang Sora Ave. corner Visayas Ave., Brgy. Culiat, Quezon City', severity: '3', status: 'reported', created_at: daysAgo(5), resolved_at: null,
    is_anonymous_caller: false, caller_count: 1, smoke_sensor_triggered: false, fire_personnel_confirmed_smoke: false, false_alarm_review_status: 'pending' },
  { id: 8, incident_number: 'INC-2026-0008', incident_type: 'Grass Fire', description: 'Small brush fire spreading toward fence line.', location: 'Brgy. Culiat, Quezon City', severity: '1', status: 'reported', created_at: daysAgo(4), resolved_at: null,
    is_anonymous_caller: false, caller_count: 3, smoke_sensor_triggered: false, fire_personnel_confirmed_smoke: false, false_alarm_review_status: 'pending' },
  { id: 9, incident_number: 'INC-2026-0009', incident_type: 'Vehicular Accident', description: 'Rear-end collision, minor injuries reported.', location: 'Visayas Ave. corner Tandang Sora Ave., Brgy. Culiat, Quezon City', severity: '1', status: 'reported', created_at: daysAgo(3), resolved_at: null,
    is_anonymous_caller: false, caller_count: 2, smoke_sensor_triggered: false, fire_personnel_confirmed_smoke: false, false_alarm_review_status: 'pending' },
  { id: 10, incident_number: 'INC-2026-0010', incident_type: 'Structure Fire', description: 'Fire reported at commercial building, crews on site.', location: 'Brgy. Culiat, Quezon City', severity: '4', status: 'resolved', created_at: daysAgo(2), resolved_at: offset(daysAgo(2), 4),
    is_anonymous_caller: false, caller_count: 4, smoke_sensor_triggered: true, fire_personnel_confirmed_smoke: true, false_alarm_review_status: 'confirmed_real' },
  { id: 11, incident_number: 'INC-2026-0011', incident_type: 'Structure Fire', description: 'Possible false alarm - smoke detector triggered, no visible fire on arrival.', location: 'Brgy. Culiat, Quezon City', severity: '1', status: 'dispatched', created_at: hoursAgo(5), resolved_at: null,
    is_anonymous_caller: true, caller_count: 1, smoke_sensor_triggered: false, fire_personnel_confirmed_smoke: false, false_alarm_review_status: 'pending' },
  { id: 12, incident_number: 'INC-2026-0012', incident_type: 'Structure Fire', description: 'Active fire, occupants trapped on 3rd floor, multiple casualties reported.', location: 'Culiat Road, Brgy. Culiat, Quezon City', severity: '5', status: 'on_scene', created_at: minutesAgo(40), resolved_at: null,
    is_anonymous_caller: false, caller_count: 6, smoke_sensor_triggered: true, fire_personnel_confirmed_smoke: true, false_alarm_review_status: 'pending' },
];

const incidentPersonnelPairs: [number, number][] = [
  [1, 1], [1, 2], [2, 2], [3, 1], [4, 4], [5, 3],
  [6, 8], [7, 4], [8, 1], [9, 2], [10, 6], [10, 11],
  [11, 3], [12, 1], [12, 2], [12, 4], [12, 6],
];
const incidentVehiclePairs: [number, number][] = [
  [1, 1], [2, 4], [3, 1], [4, 4], [5, 2],
  [6, 4], [7, 5], [8, 3], [9, 4], [10, 1], [10, 3],
  [11, 2], [12, 1], [12, 2], [12, 7],
];

/** Does `list` already contain a *confirmed* false alarm at this location? Mirrors the backend's live DB check. */
function hasConfirmedFalseAt(list: { location: string; false_alarm_review_status: string }[], location: string) {
  return list.some((i) => i.location === location && i.false_alarm_review_status === 'confirmed_false');
}

function scoreIncident(
  priorIncidents: { location: string; false_alarm_review_status: string }[],
  location: string,
  reportedAt: string,
  inputs: { is_anonymous_caller?: boolean; caller_count?: number; smoke_sensor_triggered?: boolean; fire_personnel_confirmed_smoke?: boolean },
) {
  return computeFalseAlarmScore({
    isAnonymousCaller: !!inputs.is_anonymous_caller,
    repeatedFalseAlarmLocation: hasConfirmedFalseAt(priorIncidents, location),
    smokeSensorTriggered: !!inputs.smoke_sensor_triggered,
    callerCount: inputs.caller_count ?? 1,
    firePersonnelConfirmedSmoke: !!inputs.fire_personnel_confirmed_smoke,
    reported_at: reportedAt,
  });
}

function buildIncident(raw: (typeof rawIncidents)[number], priorIncidents: (typeof rawIncidents)[number][]) {
  const scoring = scoreIncident(priorIncidents, raw.location, raw.created_at, raw);
  return {
    ...raw,
    ai_false_alarm_score: scoring.score,
    ai_false_alarm_label: scoring.label,
    ai_false_alarm_factors: scoring.factors,
    incident_personnel: incidentPersonnelPairs
      .filter(([iid]) => iid === raw.id)
      .map(([, pid]) => ({ personnel_id: pid, personnel: personnel.find((p) => p.id === pid) })),
    incident_vehicles: incidentVehiclePairs
      .filter(([iid]) => iid === raw.id)
      .map(([, vid]) => ({ vehicle_id: vid, vehicles: vehicles.find((v) => v.id === vid) })),
  };
}

// Score sequentially (each incident's "repeated location" check only sees
// incidents that came before it), same as the real system scores an
// incident once, at the moment it's reported.
export const incidents: any[] = [];
for (const raw of rawIncidents) {
  incidents.push(buildIncident(raw, incidents));
}

// ---------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------
const today = new Date().toISOString().slice(0, 10);
const dateOffset = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
const rawAttendance = [
  { personnel_id: 1, attendance_date: today, time_in: '08:00', time_out: null, status: 'present', remarks: null },
  { personnel_id: 2, attendance_date: today, time_in: '08:05', time_out: null, status: 'late', remarks: 'Traffic' },
  { personnel_id: 3, attendance_date: today, time_in: null, time_out: null, status: 'on_leave', remarks: null },
  { personnel_id: 4, attendance_date: today, time_in: '07:55', time_out: null, status: 'present', remarks: null },
  { personnel_id: 6, attendance_date: today, time_in: '08:00', time_out: null, status: 'present', remarks: null },
  { personnel_id: 8, attendance_date: today, time_in: '08:10', time_out: null, status: 'late', remarks: 'Vehicle issue' },
  { personnel_id: 9, attendance_date: today, time_in: '07:50', time_out: null, status: 'present', remarks: null },
  { personnel_id: 11, attendance_date: today, time_in: '07:45', time_out: null, status: 'present', remarks: null },
  { personnel_id: 1, attendance_date: dateOffset(1), time_in: '08:02', time_out: '17:00', status: 'present', remarks: null },
  { personnel_id: 2, attendance_date: dateOffset(1), time_in: '08:00', time_out: '17:05', status: 'present', remarks: null },
  { personnel_id: 4, attendance_date: dateOffset(1), time_in: '08:15', time_out: '17:00', status: 'late', remarks: 'Overslept' },
  { personnel_id: 6, attendance_date: dateOffset(1), time_in: '07:58', time_out: '17:00', status: 'present', remarks: null },
  { personnel_id: 7, attendance_date: dateOffset(1), time_in: null, time_out: null, status: 'absent', remarks: 'Called in sick' },
  { personnel_id: 9, attendance_date: dateOffset(1), time_in: '08:00', time_out: '17:00', status: 'present', remarks: null },
  { personnel_id: 10, attendance_date: dateOffset(1), time_in: '08:05', time_out: '17:00', status: 'present', remarks: null },
  { personnel_id: 1, attendance_date: dateOffset(2), time_in: '08:00', time_out: '17:00', status: 'present', remarks: null },
  { personnel_id: 3, attendance_date: dateOffset(2), time_in: '08:03', time_out: '17:00', status: 'present', remarks: null },
  { personnel_id: 5, attendance_date: dateOffset(2), time_in: null, time_out: null, status: 'on_leave', remarks: null },
  { personnel_id: 8, attendance_date: dateOffset(2), time_in: '08:00', time_out: '17:00', status: 'present', remarks: null },
  { personnel_id: 11, attendance_date: dateOffset(2), time_in: '07:50', time_out: '17:00', status: 'present', remarks: null },
];
export const attendance = rawAttendance.map((a, i) => ({
  id: i + 1,
  ...a,
  personnel: (() => {
    const p = personnel.find((x) => x.id === a.personnel_id);
    return p ? { full_name: p.full_name, employee_no: p.employee_no } : null;
  })(),
}));

// ---------------------------------------------------------------------
// Fire Safety Compliance: establishments / inspections / certificates / violations
// ---------------------------------------------------------------------
export const establishments = [
  { id: 1, business_name: 'Culiat Grand Mall', business_type: 'Mall / Commercial Complex', owner_name: 'Realty Holdings Corp.', barangay: 'Culiat', address: 'Tandang Sora Ave., Brgy. Culiat, Quezon City', occupancy_type: 'Mercantile', storeys: 4, floor_area_sqm: 12500.0, contact_number: '0917-100-1001', date_registered: '2021-03-15', status: 'Active' },
  { id: 2, business_name: 'Culiat Fuel Station', business_type: 'Gasoline Station', owner_name: 'Petrolink Inc.', barangay: 'Culiat', address: 'Visayas Ave. corner Tandang Sora Ave., Brgy. Culiat, Quezon City', occupancy_type: 'Hazardous', storeys: 1, floor_area_sqm: 850.0, contact_number: '0917-100-1002', date_registered: '2020-06-02', status: 'Active' },
  { id: 3, business_name: 'Culiat Medical Center', business_type: 'Hospital / Clinic', owner_name: 'Dra. Lourdes Aquino', barangay: 'Culiat', address: 'Brgy. Culiat, Quezon City', occupancy_type: 'Institutional', storeys: 5, floor_area_sqm: 6200.0, contact_number: '0917-100-1003', date_registered: '2019-01-20', status: 'Active' },
  { id: 4, business_name: 'Culiat Central School', business_type: 'School', owner_name: 'DepEd Quezon City', barangay: 'Culiat', address: 'Culiat Road, Brgy. Culiat, Quezon City', occupancy_type: 'Educational', storeys: 3, floor_area_sqm: 4300.0, contact_number: '0917-100-1004', date_registered: '2018-08-10', status: 'Active' },
  { id: 5, business_name: 'Culiat Grand Hotel', business_type: 'Hotel', owner_name: 'Culiat Hospitality Group', barangay: 'Culiat', address: 'Tandang Sora Ave., Brgy. Culiat, Quezon City', occupancy_type: 'Residential', storeys: 6, floor_area_sqm: 8900.0, contact_number: '0917-100-1005', date_registered: '2022-02-11', status: 'Active' },
  { id: 6, business_name: 'Culiat Public Market', business_type: 'Public Market', owner_name: 'Quezon City Market Board', barangay: 'Culiat', address: 'Kalayaan St., Brgy. Culiat, Quezon City', occupancy_type: 'Mercantile', storeys: 1, floor_area_sqm: 3200.0, contact_number: '0917-100-1006', date_registered: '2017-05-09', status: 'Active' },
  { id: 7, business_name: 'Culiat Elementary School', business_type: 'School', owner_name: 'DepEd Quezon City', barangay: 'Culiat', address: 'Mabuhay St., Brgy. Culiat, Quezon City', occupancy_type: 'Educational', storeys: 2, floor_area_sqm: 2600.0, contact_number: '0917-100-1007', date_registered: '2016-06-01', status: 'Active' },
  { id: 8, business_name: 'Culiat Business Center', business_type: 'Office Building', owner_name: 'Regalado Properties Inc.', barangay: 'Culiat', address: 'Visayas Ave., Brgy. Culiat, Quezon City', occupancy_type: 'Business', storeys: 8, floor_area_sqm: 9800.0, contact_number: '0917-100-1008', date_registered: '2020-01-14', status: 'Active' },
  { id: 9, business_name: 'Culiat Cold Storage', business_type: 'Warehouse', owner_name: 'ColdChain Logistics Corp.', barangay: 'Culiat', address: 'Culiat Road, Brgy. Culiat, Quezon City', occupancy_type: 'Storage', storeys: 1, floor_area_sqm: 5400.0, contact_number: '0917-100-1009', date_registered: '2015-09-30', status: 'Inactive' },
];
const establishmentRef = (id: number) => {
  const e = establishments.find((x) => x.id === id);
  return e ? { business_name: e.business_name } : null;
};

export const inspections = [
  { id: 1, establishment_id: 1, inspection_type: 'Annual', inspection_date: '2026-02-10', inspector_name: 'FO1 R. Santos', status: 'Compliant', findings_summary: 'All fire exits clear, extinguishers tagged and current.', next_inspection_due: '2027-02-10' },
  { id: 2, establishment_id: 2, inspection_type: 'Annual', inspection_date: '2026-02-18', inspector_name: 'FO2 M. Cruz', status: 'Non-Compliant', findings_summary: 'Missing fire suppression system for fuel dispensing area.', next_inspection_due: '2026-08-18' },
  { id: 3, establishment_id: 3, inspection_type: 'Annual', inspection_date: '2026-03-02', inspector_name: 'FO1 R. Santos', status: 'Compliant', findings_summary: 'Sprinkler system tested and functional.', next_inspection_due: '2027-03-02' },
  { id: 4, establishment_id: 4, inspection_type: 'Initial', inspection_date: '2026-03-15', inspector_name: 'FO3 J. Reyes', status: 'Non-Compliant', findings_summary: 'Blocked secondary fire exit in west wing.', next_inspection_due: '2026-09-15' },
  { id: 5, establishment_id: 1, inspection_type: 'Follow-up', inspection_date: '2026-08-05', inspector_name: 'FO1 R. Santos', status: 'Scheduled', findings_summary: 'Routine annual recheck.', next_inspection_due: null },
  { id: 6, establishment_id: 6, inspection_type: 'Annual', inspection_date: '2026-04-01', inspector_name: 'Insp. G. Manalo', status: 'Compliant', findings_summary: 'Market stalls meet spacing and extinguisher requirements.', next_inspection_due: '2027-04-01' },
  { id: 7, establishment_id: 7, inspection_type: 'Initial', inspection_date: '2026-04-20', inspector_name: 'Insp. G. Manalo', status: 'Pending', findings_summary: 'Awaiting fire drill documentation from school administration.', next_inspection_due: null },
  { id: 8, establishment_id: 8, inspection_type: 'Annual', inspection_date: '2026-05-05', inspector_name: 'Insp. G. Manalo', status: 'Compliant', findings_summary: 'Sprinkler and alarm systems tested, all floors passed.', next_inspection_due: '2027-05-05' },
  { id: 9, establishment_id: 9, inspection_type: 'Complaint-based', inspection_date: '2026-05-22', inspector_name: 'FO3 J. Reyes', status: 'Non-Compliant', findings_summary: 'Blocked emergency exits due to pallet storage.', next_inspection_due: '2026-07-22' },
].map((i) => ({ ...i, establishments: establishmentRef(i.establishment_id) }));

export const certificates = [
  { id: 1, establishment_id: 1, certificate_type: 'FSIC-Business Permit', certificate_number: 'FSIC-2026-00101', issue_date: '2026-02-10', expiry_date: '2027-02-10', status: 'Active' },
  { id: 2, establishment_id: 3, certificate_type: 'FSIC-Occupancy', certificate_number: 'FSIC-2026-00102', issue_date: '2026-03-02', expiry_date: '2027-03-02', status: 'Active' },
  { id: 3, establishment_id: 2, certificate_type: 'FSIC-Occupancy', certificate_number: 'FSIC-2024-00045', issue_date: '2024-06-01', expiry_date: '2025-06-01', status: 'Expired' },
  { id: 4, establishment_id: 6, certificate_type: 'FSIC-Business Permit', certificate_number: 'FSIC-2026-00103', issue_date: '2026-04-01', expiry_date: '2027-04-01', status: 'Active' },
  { id: 5, establishment_id: 8, certificate_type: 'FSIC-Occupancy', certificate_number: 'FSIC-2026-00104', issue_date: '2026-05-05', expiry_date: '2027-05-05', status: 'Active' },
  { id: 6, establishment_id: 4, certificate_type: 'FSEC', certificate_number: 'FSEC-2025-00071', issue_date: '2025-08-10', expiry_date: '2026-08-10', status: 'Active' },
  { id: 7, establishment_id: 9, certificate_type: 'FSIC-Business Permit', certificate_number: 'FSIC-2023-00032', issue_date: '2023-05-22', expiry_date: '2024-05-22', status: 'Expired' },
].map((c) => ({ ...c, establishments: establishmentRef(c.establishment_id) }));

export const violations = [
  { id: 1, establishment_id: 2, inspection_id: 2, violation_code: 'FC-105', description: 'No automatic fire suppression system in hazardous fuel area', severity: 'Critical', date_issued: '2026-02-18', compliance_deadline: '2026-08-18', status: 'Open' },
  { id: 2, establishment_id: 4, inspection_id: 4, violation_code: 'FC-212', description: 'Secondary fire exit obstructed by stored furniture', severity: 'Major', date_issued: '2026-03-15', compliance_deadline: '2026-09-15', status: 'Open' },
  { id: 3, establishment_id: 3, inspection_id: 3, violation_code: 'FC-045', description: 'Minor: fire exit signage faded, needs replacement', severity: 'Minor', date_issued: '2026-03-02', compliance_deadline: '2026-04-02', status: 'Resolved' },
  { id: 4, establishment_id: 9, inspection_id: 9, violation_code: 'FC-212', description: 'Emergency exits blocked by pallet storage in warehouse', severity: 'Critical', date_issued: '2026-05-22', compliance_deadline: '2026-07-22', status: 'Overdue' },
  { id: 5, establishment_id: 7, inspection_id: 7, violation_code: 'FC-301', description: 'Missing fire drill records for current school year', severity: 'Major', date_issued: '2026-04-20', compliance_deadline: '2026-06-20', status: 'Open' },
].map((v) => ({ ...v, establishments: establishmentRef(v.establishment_id) }));

// ---------------------------------------------------------------------
// GPS Tracker
// ---------------------------------------------------------------------
export const gpsDevices = [
  { id: 1, device_code: 'GPS-ENG-01', device_token: 'demo-token-1', vehicle_id: 1, status: 'online', last_lat: 14.697, last_lng: 121.068, last_speed_kph: 0, last_heading: 0, last_ping_at: minutesAgo(2) },
  { id: 2, device_code: 'GPS-ENG-02', device_token: 'demo-token-2', vehicle_id: 2, status: 'online', last_lat: 14.689, last_lng: 121.0455, last_speed_kph: 34.5, last_heading: 90, last_ping_at: minutesAgo(1) },
  { id: 3, device_code: 'GPS-ENG-03', device_token: 'demo-token-3', vehicle_id: 3, status: 'online', last_lat: 14.7012, last_lng: 121.0521, last_speed_kph: 12.0, last_heading: 180, last_ping_at: minutesAgo(3) },
  { id: 4, device_code: 'GPS-AMB-01', device_token: 'demo-token-4', vehicle_id: 4, status: 'offline', last_lat: 14.6761, last_lng: 121.044, last_speed_kph: 0, last_heading: 0, last_ping_at: hoursAgo(3) },
  { id: 5, device_code: 'GPS-AMB-02', device_token: 'demo-token-5', vehicle_id: 5, status: 'online', last_lat: 14.6825, last_lng: 121.0512, last_speed_kph: 45.0, last_heading: 270, last_ping_at: minutesAgo(0.5) },
  { id: 6, device_code: 'GPS-RES-01', device_token: 'demo-token-6', vehicle_id: 7, status: 'signal_lost', last_lat: 14.71, last_lng: 121.07, last_speed_kph: 0, last_heading: 0, last_ping_at: minutesAgo(20) },
].map((d) => ({ ...d, vehicles: vehicleById(d.vehicle_id) ? { unit_code: vehicleById(d.vehicle_id)!.unit_code, vehicle_type: vehicleById(d.vehicle_id)!.vehicle_type } : null }));

// ---------------------------------------------------------------------
// Staff accounts (demo)
// ---------------------------------------------------------------------
export const staffAccounts = [
  { id: 'demo-admin', username: 'admin', full_name: 'Demo Administrator', role: 'admin' as const, status: 'active' as const, last_login_at: minutesAgo(5), created_at: daysAgo(200) },
  { id: 'demo-staff-1', username: 'r.santos', full_name: 'Ramon Santos', role: 'staff' as const, status: 'active' as const, last_login_at: hoursAgo(6), created_at: daysAgo(180) },
  { id: 'demo-staff-2', username: 'g.manalo', full_name: 'Grace Manalo', role: 'staff' as const, status: 'active' as const, last_login_at: daysAgo(3), created_at: daysAgo(150) },
];

export const demoProfile = {
  id: 'demo-admin',
  email: 'demo@frsms.local',
  role: 'admin' as const,
  username: 'admin',
  full_name: 'Demo Administrator',
};

// ---------------------------------------------------------------------
// Dashboard summary (computed live from the arrays above, same shape
// the real /dashboard/summary endpoint returns)
// ---------------------------------------------------------------------
function tally(rows: { [k: string]: any }[], key: string) {
  const out: Record<string, number> = {};
  rows.forEach((r) => {
    out[r[key]] = (out[r[key]] ?? 0) + 1;
  });
  return out;
}

export function getDashboardSummary() {
  const activeStatuses = ['reported', 'dispatched', 'on_scene'];
  const active = incidents.filter((i) => activeStatuses.includes(i.status));
  return {
    totalIncidents: incidents.length,
    activeIncidents: active.length,
    criticalUnresolved: active.filter((i) => Number(i.severity) >= 4).length,
    totalPersonnel: personnel.length,
    onDutyPersonnel: personnel.filter((p) => p.status === 'on_duty').length,
    totalVehicles: vehicles.length,
    availableVehicles: vehicles.filter((v) => v.status === 'available').length,
    pendingFalseAlarmReviews: incidents.filter((i) => i.false_alarm_review_status === 'pending').length,
    certificatesExpiringSoon: certificates.filter((c) => c.status === 'Active' && new Date(c.expiry_date).getTime() - Date.now() < 30 * 86400000).length,
    incidentsBySeverity: tally(incidents, 'severity'),
    incidentsByStatus: tally(incidents, 'status'),
    recentIncidents: [...incidents]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6)
      .map(({ id, incident_number, incident_type, location, severity, status, created_at }) => ({
        id, incident_number, incident_type, location, severity, status, created_at,
      })),
    gpsIssues: gpsDevices.filter((d) => d.status !== 'online').map((d) => ({ device_code: d.device_code, status: d.status })),
  };
}

export function getFalseAlarmQueue() {
  // Every scored incident shows here, sorted highest-risk first -- not
  // just the ones that already look suspicious. That's the whole point
  // of a transparent review queue: the dispatcher sees the AI's read on
  // everything, not a pre-filtered subset.
  return [...incidents]
    .sort((a, b) => (b.ai_false_alarm_score ?? 0) - (a.ai_false_alarm_score ?? 0))
    .map((i) => ({
      id: i.id,
      incident_number: i.incident_number,
      incident_type: i.incident_type,
      location: i.location,
      severity: i.severity,
      ai_false_alarm_score: i.ai_false_alarm_score,
      ai_false_alarm_label: i.ai_false_alarm_label,
      ai_false_alarm_factors: i.ai_false_alarm_factors,
      false_alarm_review_status: i.false_alarm_review_status,
      created_at: i.created_at,
    }));
}

// ---------------------------------------------------------------------
// Generic in-memory table registry -- used by demoRequest() below to
// serve GET/POST/PUT/DELETE against any of the simple CRUD endpoints
// so the "+ Add / Edit / Delete" buttons keep working while offline.
// ---------------------------------------------------------------------
type Table = { rows: any[]; nextId: number };
const tables: Record<string, Table> = {
  personnel: { rows: personnel, nextId: 100 },
  vehicles: { rows: vehicles, nextId: 100 },
  equipment: { rows: equipment, nextId: 100 },
  attendance: { rows: attendance, nextId: 100 },
  establishments: { rows: establishments, nextId: 100 },
  inspections: { rows: inspections, nextId: 100 },
  certificates: { rows: certificates, nextId: 100 },
  violations: { rows: violations, nextId: 100 },
  'gps/devices': { rows: gpsDevices, nextId: 100 },
  'staff-accounts': { rows: staffAccounts, nextId: 100 },
  incidents: { rows: incidents, nextId: 100 },
};

/**
 * Serves a single request entirely from the in-memory demo dataset.
 * Mirrors the shape of the real Express API closely enough for every
 * page in this app to render normally while offline.
 */
export function demoRequest(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: any): any {
  const clean = path.replace(/^\/+/, '').replace(/\?.*$/, '');

  if (clean === 'dashboard/summary') return getDashboardSummary();
  if (clean === 'false-alarms') return getFalseAlarmQueue();
  if (/^false-alarms\/\d+\/review$/.test(clean)) {
    const id = Number(clean.split('/')[1]);
    const inc = incidents.find((i) => i.id === id);
    if (inc) (inc as any).false_alarm_review_status = body?.decision ?? 'pending';
    return { ok: true };
  }
  if (clean === 'me') return demoProfile;

  // AI-assist endpoints (Groq API) need a live backend + GROQ_API_KEY,
  // so in offline demo mode they return a clearly-labeled placeholder
  // instead of pretending to have called the model.
  if (clean === 'ai/dispatch-analysis') {
    return { analysis: '(Offline demo mode) Connect to the live backend with GROQ_API_KEY set to see Groq\'s plain-language analysis of this decision-tree result.' };
  }
  if (clean === 'ai/incident-summary') {
    return { summary: '(Offline demo mode) Connect to the live backend with GROQ_API_KEY set to generate a Groq-drafted incident summary.' };
  }

  if (clean === 'gps/barangays') {
    return Array.from(new Set(qcBarangays.features.map((f: any) => f.properties?.name).filter(Boolean))).sort();
  }
  if (clean.startsWith('gps/eta')) {
    const params = new URLSearchParams(path.split('?')[1] ?? '');
    const barangayName = params.get('barangay');
    const target = barangayName ? barangayCentroidDemo(barangayName) : { lat: Number(params.get('targetLat')), lng: Number(params.get('targetLng')) };
    if (!target || Number.isNaN(target.lat) || Number.isNaN(target.lng)) return { error: 'Provide ?barangay= or ?targetLat=&targetLng=' };
    const results = gpsDevices
      .filter((d: any) => d.last_lat != null && d.last_lng != null)
      .map((d: any) => {
        const distanceKm = haversineKmDemo({ lat: Number(d.last_lat), lng: Number(d.last_lng) }, target as any);
        const speed = d.last_speed_kph && d.last_speed_kph > 5 ? d.last_speed_kph : 30;
        const etaMinutes = Math.max(1, Math.round((distanceKm / speed) * 60 + 1.5));
        return {
          device_id: d.id,
          device_code: d.device_code,
          vehicle: d.vehicles ?? null,
          status: d.status,
          distanceKm: Math.round(distanceKm * 100) / 100,
          etaMinutes,
          withinGeofence: distanceKm < 1.5,
        };
      })
      .sort((a: any, b: any) => a.etaMinutes - b.etaMinutes);
    return { target, results };
  }

  // Incidents carry nested incident_personnel / incident_vehicles joins
  // (built from personnel_ids / vehicle_ids on the form) that the
  // generic table handler below doesn't know how to construct.
  if (clean === 'incidents' && method === 'POST') {
    const nextId = Math.max(0, ...incidents.map((i) => i.id)) + 1;
    const now = new Date().toISOString();
    const aiInputs = {
      is_anonymous_caller: !!body?.is_anonymous_caller,
      caller_count: body?.caller_count ?? 1,
      smoke_sensor_triggered: !!body?.smoke_sensor_triggered,
      fire_personnel_confirmed_smoke: !!body?.fire_personnel_confirmed_smoke,
    };
    const location = body?.location ?? '';
    const scoring = scoreIncident(incidents, location, now, aiInputs);
    const record: any = {
      id: nextId,
      incident_number: `INC-2026-${String(nextId).padStart(4, '0')}`,
      incident_type: body?.incident_type ?? 'Unspecified',
      description: body?.description ?? null,
      location,
      severity: body?.severity ?? '3',
      status: 'reported',
      created_at: now,
      resolved_at: null,
      ...aiInputs,
      false_alarm_review_status: 'pending',
      ai_false_alarm_score: scoring.score,
      ai_false_alarm_label: scoring.label,
      ai_false_alarm_factors: scoring.factors,
    };
    record.incident_personnel = (body?.personnel_ids ?? []).map((pid: number) => ({ personnel_id: pid, personnel: personnel.find((p) => p.id === pid) }));
    record.incident_vehicles = (body?.vehicle_ids ?? []).map((vid: number) => ({ vehicle_id: vid, vehicles: vehicles.find((v) => v.id === vid) }));
    incidents.unshift(record);
    return record;
  }
  if (/^incidents\/\d+$/.test(clean) && method === 'PUT') {
    const id = Number(clean.split('/')[1]);
    const idx = incidents.findIndex((i) => i.id === id);
    if (idx >= 0) {
      const existing: any = incidents[idx];
      const updated: any = {
        ...existing,
        incident_type: body?.incident_type ?? existing.incident_type,
        description: body?.description ?? existing.description,
        location: body?.location ?? existing.location,
        severity: body?.severity ?? existing.severity,
        status: body?.status ?? existing.status,
        is_anonymous_caller: body?.is_anonymous_caller !== undefined ? !!body.is_anonymous_caller : existing.is_anonymous_caller,
        caller_count: body?.caller_count !== undefined ? body.caller_count : existing.caller_count,
        smoke_sensor_triggered: body?.smoke_sensor_triggered !== undefined ? !!body.smoke_sensor_triggered : existing.smoke_sensor_triggered,
        fire_personnel_confirmed_smoke:
          body?.fire_personnel_confirmed_smoke !== undefined ? !!body.fire_personnel_confirmed_smoke : existing.fire_personnel_confirmed_smoke,
      };

      const scoringFieldsChanged = ['location', 'is_anonymous_caller', 'caller_count', 'smoke_sensor_triggered', 'fire_personnel_confirmed_smoke'].some(
        (k) => body?.[k] !== undefined,
      );
      if (scoringFieldsChanged) {
        const priorIncidents = incidents.filter((i) => i.id !== id);
        const scoring = scoreIncident(priorIncidents, updated.location, existing.created_at, updated);
        updated.ai_false_alarm_score = scoring.score;
        updated.ai_false_alarm_label = scoring.label;
        updated.ai_false_alarm_factors = scoring.factors;
      }

      if (body?.personnel_ids) {
        updated.incident_personnel = body.personnel_ids.map((pid: number) => ({ personnel_id: pid, personnel: personnel.find((p) => p.id === pid) }));
      }
      if (body?.vehicle_ids) {
        updated.incident_vehicles = body.vehicle_ids.map((vid: number) => ({ vehicle_id: vid, vehicles: vehicles.find((v) => v.id === vid) }));
      }
      incidents[idx] = updated;
      return updated;
    }
    return null;
  }

  if (/^gps\/devices\/\d+\/simulate-ping$/.test(clean)) {
    const id = Number(clean.split('/')[2]);
    const d = gpsDevices.find((x) => x.id === id) as any;
    if (d) {
      d.last_lat = Number(d.last_lat) + (Math.random() - 0.5) * 0.01;
      d.last_lng = Number(d.last_lng) + (Math.random() - 0.5) * 0.01;
      d.last_speed_kph = Math.round(Math.random() * 60);
      d.last_ping_at = new Date().toISOString();
      d.status = 'online';
    }
    return { ok: true };
  }

  // matches "table" or "table/:id"
  const match = clean.match(/^([a-z/-]+?)(?:\/(\d+))?$/);
  const tableName = match?.[1];
  const id = match?.[2] ? Number(match[2]) : null;
  const table = tableName ? tables[tableName] : undefined;

  if (!table) {
    // Unknown endpoint -- fail soft so callers using .catch(() => []) degrade gracefully.
    if (method === 'GET') return [];
    return { ok: true };
  }

  if (method === 'GET') {
    return id ? table.rows.find((r) => r.id === id) ?? null : table.rows;
  }
  if (method === 'POST') {
    const record = { id: table.nextId++, ...body };
    table.rows.unshift(record);
    return record;
  }
  if (method === 'PUT') {
    const idx = table.rows.findIndex((r) => r.id === id);
    if (idx >= 0) table.rows[idx] = { ...table.rows[idx], ...body };
    return table.rows[idx] ?? null;
  }
  if (method === 'DELETE') {
    const idx = table.rows.findIndex((r) => r.id === id);
    if (idx >= 0) table.rows.splice(idx, 1);
    return null;
  }
  return null;
}
