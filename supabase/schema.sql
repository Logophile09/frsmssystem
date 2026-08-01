-- =====================================================================
-- FRSMS v2 :: Fire And Rescue Service Management System
-- Supabase (PostgreSQL) schema
--
-- Run this in Supabase Studio -> SQL Editor (whole file, once), on a
-- fresh project. Safe to re-run individual CREATE ... IF NOT EXISTS
-- blocks, but DROP/CREATE on the enum types will fail if they already
-- exist -- this file is meant for a first-time setup.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
create type user_role as enum ('admin', 'staff');
create type account_status as enum ('active', 'disabled', 'pending');

create type personnel_status as enum ('on_duty', 'off_duty', 'on_leave');
create type vehicle_status as enum ('available', 'dispatched', 'maintenance', 'out_of_service');
create type equipment_condition as enum ('good', 'fair', 'poor', 'damaged');

create type incident_severity as enum ('low', 'moderate', 'high', 'critical');
create type incident_status as enum ('reported', 'dispatched', 'on_scene', 'resolved', 'closed');

create type attendance_status as enum ('present', 'late', 'absent', 'on_leave');

create type establishment_status as enum ('Active', 'Inactive');
create type inspection_type as enum ('Initial', 'Annual', 'Follow-up', 'Renewal', 'Complaint-based');
create type inspection_status as enum ('Compliant', 'Non-Compliant', 'Pending', 'Scheduled');
create type certificate_type as enum ('FSIC-Business Permit', 'FSIC-Occupancy', 'FSEC');
create type certificate_status as enum ('Active', 'Expired', 'Revoked');
create type violation_severity as enum ('Minor', 'Major', 'Critical');
create type violation_status as enum ('Open', 'Resolved', 'Overdue');

create type gps_device_status as enum ('online', 'offline', 'signal_lost');
create type false_alarm_review_status as enum ('pending', 'confirmed_false', 'confirmed_real');

-- ---------------------------------------------------------------------
-- profiles  (1:1 with auth.users -- role/status live here, Supabase
-- Auth owns email + password)
-- ---------------------------------------------------------------------
create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text unique not null,
  full_name       text not null,
  role            user_role not null default 'staff',
  status          account_status not null default 'active',
  last_login_at   timestamptz,
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- personnel
-- ---------------------------------------------------------------------
create table personnel (
  id           bigserial primary key,
  employee_no  text unique not null,
  full_name    text not null,
  rank_title   text not null,
  phone        text,
  email        text,
  status       personnel_status not null default 'off_duty',
  hire_date    date not null,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- vehicles
-- ---------------------------------------------------------------------
create table vehicles (
  id                bigserial primary key,
  unit_code         text unique not null,
  vehicle_type      text not null,
  plate_number      text unique not null,
  status            vehicle_status not null default 'available',
  capacity          integer,
  last_maintenance  date,
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- equipment
-- ---------------------------------------------------------------------
create table equipment (
  id                bigserial primary key,
  name              text not null,
  category          text not null,
  quantity          integer not null default 1,
  condition_status  equipment_condition not null default 'good',
  vehicle_id        bigint references vehicles(id) on delete set null,
  location          text,
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- incidents  (+ AI false-alarm scoring columns baked in from the start)
-- ---------------------------------------------------------------------
create table incidents (
  id                          bigserial primary key,
  incident_number             text unique not null,
  incident_type               text not null,
  description                 text,
  location                    text not null,
  severity                    incident_severity not null default 'moderate',
  status                      incident_status not null default 'reported',
  created_by                  uuid references profiles(id) on delete set null,
  created_at                  timestamptz not null default now(),
  resolved_at                 timestamptz,
  ai_false_alarm_score        numeric,
  ai_false_alarm_label        text,
  ai_false_alarm_factors      jsonb,
  false_alarm_review_status   false_alarm_review_status not null default 'pending',
  false_alarm_reviewed_by     uuid references profiles(id) on delete set null,
  false_alarm_reviewed_at     timestamptz
);

create table incident_personnel (
  incident_id   bigint not null references incidents(id) on delete cascade,
  personnel_id  bigint not null references personnel(id) on delete cascade,
  primary key (incident_id, personnel_id)
);

create table incident_vehicles (
  incident_id  bigint not null references incidents(id) on delete cascade,
  vehicle_id   bigint not null references vehicles(id) on delete cascade,
  primary key (incident_id, vehicle_id)
);

-- ---------------------------------------------------------------------
-- attendance
-- ---------------------------------------------------------------------
create table attendance (
  id                bigserial primary key,
  personnel_id      bigint not null references personnel(id) on delete cascade,
  attendance_date   date not null,
  time_in           time,
  time_out          time,
  status            attendance_status not null default 'present',
  remarks           text,
  recorded_by       uuid references profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  unique (personnel_id, attendance_date)
);

-- ---------------------------------------------------------------------
-- Fire Safety Compliance module: establishments / inspections /
-- certificates / violations
-- ---------------------------------------------------------------------
create table establishments (
  id                bigserial primary key,
  business_name     text not null,
  business_type     text not null,
  owner_name        text not null,
  barangay          text not null,
  address           text not null,
  occupancy_type    text not null,
  storeys           smallint default 1,
  floor_area_sqm    numeric(10, 2),
  contact_number    text,
  date_registered   date not null,
  status            establishment_status not null default 'Active',
  created_at        timestamptz not null default now()
);

create table inspections (
  id                    bigserial primary key,
  establishment_id      bigint not null references establishments(id) on delete cascade,
  inspection_type       inspection_type not null,
  inspection_date       date not null,
  inspector_name        text not null,
  status                inspection_status not null,
  findings_summary      text,
  next_inspection_due   date,
  created_at            timestamptz not null default now()
);

create table certificates (
  id                  bigserial primary key,
  establishment_id    bigint not null references establishments(id) on delete cascade,
  certificate_type    certificate_type not null,
  certificate_number  text not null,
  issue_date          date not null,
  expiry_date         date not null,
  status              certificate_status not null default 'Active',
  created_at          timestamptz not null default now()
);

create table violations (
  id                    bigserial primary key,
  establishment_id      bigint not null references establishments(id) on delete cascade,
  inspection_id         bigint references inspections(id) on delete set null,
  violation_code        text not null,
  description           text not null,
  severity              violation_severity not null,
  date_issued           date not null,
  compliance_deadline   date not null,
  status                violation_status not null default 'Open',
  created_at            timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- GPS Tracker (IoT) module
-- ---------------------------------------------------------------------
create table gps_devices (
  id               bigserial primary key,
  device_code      text unique not null,
  device_token     text unique not null default encode(gen_random_bytes(20), 'hex'),
  vehicle_id       bigint references vehicles(id) on delete set null,
  status           gps_device_status not null default 'offline',
  last_lat         numeric(9, 6),
  last_lng         numeric(9, 6),
  last_speed_kph   numeric(6, 2),
  last_heading     numeric(5, 1),
  last_ping_at     timestamptz,
  created_at       timestamptz not null default now()
);

create table gps_location_history (
  id            bigserial primary key,
  device_id     bigint not null references gps_devices(id) on delete cascade,
  lat           numeric(9, 6) not null,
  lng           numeric(9, 6) not null,
  speed_kph     numeric(6, 2),
  heading       numeric(5, 1),
  recorded_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------
create index idx_incidents_status on incidents(status);
create index idx_incidents_created_at on incidents(created_at desc);
create index idx_attendance_date on attendance(attendance_date);
create index idx_inspections_establishment on inspections(establishment_id);
create index idx_certificates_establishment on certificates(establishment_id);
create index idx_violations_establishment on violations(establishment_id);
create index idx_gps_history_device on gps_location_history(device_id, recorded_at desc);

-- ---------------------------------------------------------------------
-- Row Level Security
--
-- The Express backend talks to Supabase using the SERVICE ROLE key,
-- which bypasses RLS entirely -- the backend is the trust boundary and
-- does its own auth/role checks (see backend/src/middleware/auth.ts).
-- RLS is still enabled here as defense-in-depth in case a client key
-- is ever used directly against these tables: authenticated users get
-- read access, writes are blocked for the anon/authenticated roles
-- (only the service role, used by the backend, can write).
-- ---------------------------------------------------------------------
alter table profiles enable row level security;
alter table personnel enable row level security;
alter table vehicles enable row level security;
alter table equipment enable row level security;
alter table incidents enable row level security;
alter table incident_personnel enable row level security;
alter table incident_vehicles enable row level security;
alter table attendance enable row level security;
alter table establishments enable row level security;
alter table inspections enable row level security;
alter table certificates enable row level security;
alter table violations enable row level security;
alter table gps_devices enable row level security;
alter table gps_location_history enable row level security;

create policy "authenticated read profiles" on profiles for select using (auth.role() = 'authenticated');
create policy "authenticated read personnel" on personnel for select using (auth.role() = 'authenticated');
create policy "authenticated read vehicles" on vehicles for select using (auth.role() = 'authenticated');
create policy "authenticated read equipment" on equipment for select using (auth.role() = 'authenticated');
create policy "authenticated read incidents" on incidents for select using (auth.role() = 'authenticated');
create policy "authenticated read incident_personnel" on incident_personnel for select using (auth.role() = 'authenticated');
create policy "authenticated read incident_vehicles" on incident_vehicles for select using (auth.role() = 'authenticated');
create policy "authenticated read attendance" on attendance for select using (auth.role() = 'authenticated');
create policy "authenticated read establishments" on establishments for select using (auth.role() = 'authenticated');
create policy "authenticated read inspections" on inspections for select using (auth.role() = 'authenticated');
create policy "authenticated read certificates" on certificates for select using (auth.role() = 'authenticated');
create policy "authenticated read violations" on violations for select using (auth.role() = 'authenticated');
create policy "authenticated read gps_devices" on gps_devices for select using (auth.role() = 'authenticated');
create policy "authenticated read gps_location_history" on gps_location_history for select using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------
-- Seed / demo data
-- ---------------------------------------------------------------------
insert into personnel (employee_no, full_name, rank_title, phone, email, status, hire_date) values
('EMP-1001', 'Ramon Santos',    'Fire Officer 1',  '0917-200-1001', 'r.santos@frsms.gov',    'on_duty',  '2019-06-01'),
('EMP-1002', 'Marites Cruz',    'Fire Officer 2',  '0917-200-1002', 'm.cruz@frsms.gov',      'on_duty',  '2018-03-14'),
('EMP-1003', 'Jericho Reyes',   'Fire Officer 3',  '0917-200-1003', 'j.reyes@frsms.gov',     'off_duty', '2020-11-20'),
('EMP-1004', 'Angelo Bautista', 'Fire Inspector',  '0917-200-1004', 'a.bautista@frsms.gov',  'on_duty',  '2021-01-10'),
('EMP-1005', 'Liza Fernandez',  'Fire Officer 1',  '0917-200-1005', 'l.fernandez@frsms.gov', 'on_leave', '2022-07-05'),
('EMP-1006', 'Carlo Villanueva','Senior Fire Officer', '0917-200-1006', 'c.villanueva@frsms.gov', 'on_duty',  '2016-02-18'),
('EMP-1007', 'Dennis Ocampo',   'Fire Officer 2',  '0917-200-1007', 'd.ocampo@frsms.gov',    'off_duty', '2019-09-09'),
('EMP-1008', 'Grace Manalo',    'Fire Inspector',  '0917-200-1008', 'g.manalo@frsms.gov',    'on_duty',  '2020-05-22'),
('EMP-1009', 'Paolo Diaz',      'Fire Officer 1',  '0917-200-1009', 'p.diaz@frsms.gov',      'on_duty',  '2023-01-30'),
('EMP-1010', 'Christine Aguilar','Fire Officer 3', '0917-200-1010', 'c.aguilar@frsms.gov',   'off_duty', '2017-11-02'),
('EMP-1011', 'Miguel Torres',   'Station Chief',   '0917-200-1011', 'm.torres@frsms.gov',    'on_duty',  '2014-04-01'),
('EMP-1012', 'Bea Salonga-Cruz','Fire Officer 2',  '0917-200-1012', 'b.cruz@frsms.gov',      'on_leave', '2021-08-19');

insert into vehicles (unit_code, vehicle_type, plate_number, status, capacity, last_maintenance) values
('ENG-01', 'Fire Engine',      'FR-1234', 'available',    6, '2026-05-01'),
('ENG-02', 'Fire Engine',      'FR-5678', 'dispatched',   6, '2026-04-15'),
('ENG-03', 'Fire Engine',      'FR-3345', 'available',    6, '2026-06-20'),
('AMB-01', 'Ambulance',        'FR-2222', 'available',    3, '2026-06-10'),
('AMB-02', 'Ambulance',        'FR-2244', 'dispatched',   3, '2026-05-28'),
('LDR-01', 'Ladder Truck',     'FR-9911', 'maintenance',  4, '2026-03-20'),
('RES-01', 'Rescue Vehicle',   'FR-7712', 'available',    5, '2026-06-01'),
('HZM-01', 'Hazmat Unit',      'FR-8850', 'out_of_service',3,'2026-02-14');

insert into equipment (name, category, quantity, condition_status, vehicle_id, location) values
('Fire Extinguisher (ABC)', 'Suppression', 12, 'good', 1, 'ENG-01 compartment'),
('Breathing Apparatus (SCBA)', 'PPE', 6, 'fair', 1, 'ENG-01 compartment'),
('First Aid Kit', 'Medical', 4, 'good', 4, 'AMB-01'),
('Hydraulic Rescue Tool', 'Rescue', 2, 'good', 2, 'ENG-02 compartment'),
('Fire Hose (30m)', 'Suppression', 10, 'good', null, 'Station storage'),
('Thermal Imaging Camera', 'Detection', 3, 'good', 3, 'ENG-03 compartment'),
('Turnout Gear (Set)', 'PPE', 20, 'good', null, 'Station gear room'),
('Portable Generator', 'Support', 2, 'fair', 7, 'RES-01 compartment'),
('Chemical Spill Kit', 'Hazmat', 5, 'good', 8, 'HZM-01 compartment'),
('Defibrillator (AED)', 'Medical', 2, 'good', 5, 'AMB-02'),
('Jaws of Life', 'Rescue', 1, 'good', 7, 'RES-01 compartment'),
('Ladder (10m extension)', 'Rescue', 2, 'fair', 6, 'LDR-01 compartment');

insert into incidents (incident_number, incident_type, description, location, severity, status, created_at, resolved_at) values
('INC-2026-0001', 'Structure Fire', 'Reported fire on the 2nd floor of a residential building.', 'Fairview, Quezon City', 'high', 'resolved', now() - interval '14 days', now() - interval '14 days' + interval '3 hours'),
('INC-2026-0002', 'Vehicular Accident', 'Two-vehicle collision, one injured.', 'Commonwealth Ave.', 'moderate', 'resolved', now() - interval '12 days', now() - interval '12 days' + interval '2 hours'),
('INC-2026-0003', 'Grass Fire', 'Small grass fire near a vacant lot, contained quickly.', 'Novaliches, Quezon City', 'low', 'resolved', now() - interval '11 days', now() - interval '11 days' + interval '1 hour'),
('INC-2026-0004', 'Medical Emergency', 'Elderly patient with chest pains.', 'Batasan Hills', 'moderate', 'resolved', now() - interval '9 days', now() - interval '9 days' + interval '90 minutes'),
('INC-2026-0005', 'Structure Fire', 'Possible false alarm - smoke detector triggered, no visible fire on arrival.', 'Culiat, Quezon City', 'low', 'resolved', now() - interval '8 days', now() - interval '8 days' + interval '45 minutes'),
('INC-2026-0006', 'Medical Emergency', 'Patient with chest pains.', 'Brgy. Sauyo', 'moderate', 'reported', now() - interval '6 days', null),
('INC-2026-0007', 'Medical Emergency', 'Fall injury, ambulance requested.', 'Talipapa', 'moderate', 'reported', now() - interval '5 days', null),
('INC-2026-0008', 'Grass Fire', 'Small brush fire spreading toward fence line.', 'Brgy. Fairview, Quezon City', 'low', 'reported', now() - interval '4 days', null),
('INC-2026-0009', 'Vehicular Accident', 'Rear-end collision, minor injuries reported.', 'Commonwealth Ave. corner Regalado', 'low', 'reported', now() - interval '3 days', null),
('INC-2026-0010', 'Structure Fire', 'Fire reported at commercial building, crews on site.', 'Brgy. Commonwealth, Quezon City', 'high', 'resolved', now() - interval '2 days', now() - interval '2 days' + interval '4 hours'),
('INC-2026-0011', 'Structure Fire', 'Possible false alarm - smoke detector triggered, no visible fire on arrival.', 'Culiat, Quezon City', 'low', 'dispatched', now() - interval '5 hours', null),
('INC-2026-0012', 'Structure Fire', 'Active fire, occupants trapped on 3rd floor, multiple casualties reported.', 'Payatas, Quezon City', 'critical', 'on_scene', now() - interval '40 minutes', null);

insert into incident_personnel (incident_id, personnel_id) values
(1,1),(1,2),(2,2),(3,1),(4,4),(5,3),
(6,8),(7,4),(8,1),(9,2),(10,6),(10,11),
(11,3),(12,1),(12,2),(12,4),(12,6);

insert into incident_vehicles (incident_id, vehicle_id) values
(1,1),(2,4),(3,1),(4,4),(5,2),
(6,4),(7,5),(8,3),(9,4),(10,1),(10,3),
(11,2),(12,1),(12,2),(12,7);

insert into attendance (personnel_id, attendance_date, time_in, time_out, status, remarks) values
(1,  current_date,     '08:00', null,    'present', null),
(2,  current_date,     '08:05', null,    'late',    'Traffic'),
(3,  current_date,     null,    null,    'on_leave', null),
(4,  current_date,     '07:55', null,    'present', null),
(6,  current_date,     '08:00', null,    'present', null),
(8,  current_date,     '08:10', null,    'late',    'Vehicle issue'),
(9,  current_date,     '07:50', null,    'present', null),
(11, current_date,     '07:45', null,    'present', null),
(1,  current_date - 1, '08:02', '17:00', 'present', null),
(2,  current_date - 1, '08:00', '17:05', 'present', null),
(4,  current_date - 1, '08:15', '17:00', 'late',    'Overslept'),
(6,  current_date - 1, '07:58', '17:00', 'present', null),
(7,  current_date - 1, null,    null,    'absent',  'Called in sick'),
(9,  current_date - 1, '08:00', '17:00', 'present', null),
(10, current_date - 1, '08:05', '17:00', 'present', null),
(1,  current_date - 2, '08:00', '17:00', 'present', null),
(3,  current_date - 2, '08:03', '17:00', 'present', null),
(5,  current_date - 2, null,    null,    'on_leave', null),
(8,  current_date - 2, '08:00', '17:00', 'present', null),
(11, current_date - 2, '07:50', '17:00', 'present', null)
on conflict do nothing;

insert into establishments (business_name, business_type, owner_name, barangay, address, occupancy_type, storeys, floor_area_sqm, contact_number, date_registered, status) values
('Fairview Grand Mall', 'Mall / Commercial Complex', 'Realty Holdings Corp.', 'Fairview', 'Maligaya St., Fairview, Quezon City', 'Mercantile', 4, 12500.00, '0917-100-1001', '2021-03-15', 'Active'),
('Commonwealth Fuel Station', 'Gasoline Station', 'Petrolink Inc.', 'Commonwealth', 'Commonwealth Ave. corner Regalado', 'Hazardous', 1, 850.00, '0917-100-1002', '2020-06-02', 'Active'),
('Batasan Hills Medical Center', 'Hospital / Clinic', 'Dra. Lourdes Aquino', 'Batasan Hills', 'Brgy. Batasan Hills, Quezon City', 'Institutional', 5, 6200.00, '0917-100-1003', '2019-01-20', 'Active'),
('Novaliches Central School', 'School', 'DepEd Quezon City', 'Novaliches', 'Regalado Ave., Novaliches, Quezon City', 'Educational', 3, 4300.00, '0917-100-1004', '2018-08-10', 'Active'),
('Culiat Grand Hotel', 'Hotel', 'Culiat Hospitality Group', 'Culiat', 'Tandang Sora Ave., Culiat, Quezon City', 'Residential', 6, 8900.00, '0917-100-1005', '2022-02-11', 'Active'),
('Talipapa Public Market', 'Public Market', 'Quezon City Market Board', 'Talipapa', 'Talipapa Rd., Quezon City', 'Mercantile', 1, 3200.00, '0917-100-1006', '2017-05-09', 'Active'),
('Sauyo Elementary School', 'School', 'DepEd Quezon City', 'Sauyo', 'Sauyo Rd., Quezon City', 'Educational', 2, 2600.00, '0917-100-1007', '2016-06-01', 'Active'),
('Regalado Business Center', 'Office Building', 'Regalado Properties Inc.', 'Fairview', 'Regalado Ave., Fairview, Quezon City', 'Business', 8, 9800.00, '0917-100-1008', '2020-01-14', 'Active'),
('Payatas Cold Storage', 'Warehouse', 'ColdChain Logistics Corp.', 'Payatas', 'Payatas Rd., Quezon City', 'Storage', 1, 5400.00, '0917-100-1009', '2015-09-30', 'Inactive');

insert into inspections (establishment_id, inspection_type, inspection_date, inspector_name, status, findings_summary, next_inspection_due) values
(1, 'Annual', '2026-02-10', 'FO1 R. Santos', 'Compliant', 'All fire exits clear, extinguishers tagged and current.', '2027-02-10'),
(2, 'Annual', '2026-02-18', 'FO2 M. Cruz', 'Non-Compliant', 'Missing fire suppression system for fuel dispensing area.', '2026-08-18'),
(3, 'Annual', '2026-03-02', 'FO1 R. Santos', 'Compliant', 'Sprinkler system tested and functional.', '2027-03-02'),
(4, 'Initial', '2026-03-15', 'FO3 J. Reyes', 'Non-Compliant', 'Blocked secondary fire exit in west wing.', '2026-09-15'),
(1, 'Follow-up', '2026-08-05', 'FO1 R. Santos', 'Scheduled', 'Routine annual recheck.', null),
(6, 'Annual', '2026-04-01', 'Insp. G. Manalo', 'Compliant', 'Market stalls meet spacing and extinguisher requirements.', '2027-04-01'),
(7, 'Initial', '2026-04-20', 'Insp. G. Manalo', 'Pending', 'Awaiting fire drill documentation from school administration.', null),
(8, 'Annual', '2026-05-05', 'Insp. G. Manalo', 'Compliant', 'Sprinkler and alarm systems tested, all floors passed.', '2027-05-05'),
(9, 'Complaint-based', '2026-05-22', 'FO3 J. Reyes', 'Non-Compliant', 'Blocked emergency exits due to pallet storage.', '2026-07-22');

insert into certificates (establishment_id, certificate_type, certificate_number, issue_date, expiry_date, status) values
(1, 'FSIC-Business Permit', 'FSIC-2026-00101', '2026-02-10', '2027-02-10', 'Active'),
(3, 'FSIC-Occupancy', 'FSIC-2026-00102', '2026-03-02', '2027-03-02', 'Active'),
(2, 'FSIC-Occupancy', 'FSIC-2024-00045', '2024-06-01', '2025-06-01', 'Expired'),
(6, 'FSIC-Business Permit', 'FSIC-2026-00103', '2026-04-01', '2027-04-01', 'Active'),
(8, 'FSIC-Occupancy', 'FSIC-2026-00104', '2026-05-05', '2027-05-05', 'Active'),
(4, 'FSEC', 'FSEC-2025-00071', '2025-08-10', '2026-08-10', 'Active'),
(9, 'FSIC-Business Permit', 'FSIC-2023-00032', '2023-05-22', '2024-05-22', 'Expired');

insert into violations (establishment_id, inspection_id, violation_code, description, severity, date_issued, compliance_deadline, status) values
(2, 2, 'FC-105', 'No automatic fire suppression system in hazardous fuel area', 'Critical', '2026-02-18', '2026-08-18', 'Open'),
(4, 4, 'FC-212', 'Secondary fire exit obstructed by stored furniture', 'Major', '2026-03-15', '2026-09-15', 'Open'),
(3, 3, 'FC-045', 'Minor: fire exit signage faded, needs replacement', 'Minor', '2026-03-02', '2026-04-02', 'Resolved'),
(9, 9, 'FC-212', 'Emergency exits blocked by pallet storage in warehouse', 'Critical', '2026-05-22', '2026-07-22', 'Overdue'),
(7, 7, 'FC-301', 'Missing fire drill records for current school year', 'Major', '2026-04-20', '2026-06-20', 'Open');

insert into gps_devices (device_code, vehicle_id, status, last_lat, last_lng, last_speed_kph, last_heading, last_ping_at) values
('GPS-ENG-01', 1, 'online', 14.6970, 121.0680, 0, 0, now() - interval '2 minutes'),
('GPS-ENG-02', 2, 'online', 14.6890, 121.0455, 34.5, 90, now() - interval '1 minute'),
('GPS-ENG-03', 3, 'online', 14.7012, 121.0521, 12.0, 180, now() - interval '3 minutes'),
('GPS-AMB-01', 4, 'offline', 14.6761, 121.0440, 0, 0, now() - interval '3 hours'),
('GPS-AMB-02', 5, 'online', 14.6825, 121.0512, 45.0, 270, now() - interval '30 seconds'),
('GPS-RES-01', 7, 'signal_lost', 14.7100, 121.0700, 0, 0, now() - interval '20 minutes');


