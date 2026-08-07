-- =====================================================================
-- FRSMS v2 :: Additional seed data
--
-- Use this INSTEAD of re-running the whole schema.sql if you already
-- ran the original schema once (re-running the full file would hit
-- duplicate-key errors on rows that already exist, e.g. EMP-1001,
-- ENG-01, etc.). This file only adds the NEW rows introduced later,
-- so every module has enough data to not look empty in a demo.
--
-- Run this in Supabase Studio -> SQL Editor, once, on a database that
-- already has the original schema.sql seed data loaded.
-- =====================================================================

insert into personnel (employee_no, full_name, rank_title, phone, email, status, hire_date) values
('EMP-1006', 'Carlo Villanueva','Senior Fire Officer', '0917-200-1006', 'c.villanueva@frsms.gov', 'on_duty',  '2016-02-18'),
('EMP-1007', 'Dennis Ocampo',   'Fire Officer 2',  '0917-200-1007', 'd.ocampo@frsms.gov',    'off_duty', '2019-09-09'),
('EMP-1008', 'Grace Manalo',    'Fire Inspector',  '0917-200-1008', 'g.manalo@frsms.gov',    'on_duty',  '2020-05-22'),
('EMP-1009', 'Paolo Diaz',      'Fire Officer 1',  '0917-200-1009', 'p.diaz@frsms.gov',      'on_duty',  '2023-01-30'),
('EMP-1010', 'Christine Aguilar','Fire Officer 3', '0917-200-1010', 'c.aguilar@frsms.gov',   'off_duty', '2017-11-02'),
('EMP-1011', 'Miguel Torres',   'Station Chief',   '0917-200-1011', 'm.torres@frsms.gov',    'on_duty',  '2014-04-01'),
('EMP-1012', 'Bea Salonga-Cruz','Fire Officer 2',  '0917-200-1012', 'b.cruz@frsms.gov',      'on_leave', '2021-08-19')
on conflict (employee_no) do nothing;

insert into vehicles (unit_code, vehicle_type, plate_number, status, capacity, last_maintenance) values
('ENG-03', 'Fire Engine',      'FR-3345', 'available',    6, '2026-06-20'),
('AMB-02', 'Ambulance',        'FR-2244', 'dispatched',   3, '2026-05-28'),
('RES-01', 'Rescue Vehicle',   'FR-7712', 'available',    5, '2026-06-01'),
('HZM-01', 'Hazmat Unit',      'FR-8850', 'out_of_service',3,'2026-02-14')
on conflict (unit_code) do nothing;

insert into equipment (name, category, quantity, condition_status, vehicle_id, location) values
('Thermal Imaging Camera', 'Detection', 3, 'good', (select id from vehicles where unit_code = 'ENG-03'), 'ENG-03 compartment'),
('Turnout Gear (Set)', 'PPE', 20, 'good', null, 'Station gear room'),
('Portable Generator', 'Support', 2, 'fair', (select id from vehicles where unit_code = 'RES-01'), 'RES-01 compartment'),
('Chemical Spill Kit', 'Hazmat', 5, 'good', (select id from vehicles where unit_code = 'HZM-01'), 'HZM-01 compartment'),
('Defibrillator (AED)', 'Medical', 2, 'good', (select id from vehicles where unit_code = 'AMB-02'), 'AMB-02'),
('Jaws of Life', 'Rescue', 1, 'good', (select id from vehicles where unit_code = 'RES-01'), 'RES-01 compartment'),
('Ladder (10m extension)', 'Rescue', 2, 'fair', (select id from vehicles where unit_code = 'LDR-01'), 'LDR-01 compartment');

insert into incidents (incident_number, incident_type, description, location, severity, status, created_at, resolved_at) values
('INC-2026-0006', 'Medical Emergency', 'Patient with chest pains.', 'Mabuhay St., Brgy. Culiat, Quezon City', 'moderate', 'reported', now() - interval '6 days', null),
('INC-2026-0007', 'Medical Emergency', 'Fall injury, ambulance requested.', 'Tandang Sora Ave. corner Visayas Ave., Brgy. Culiat, Quezon City', 'moderate', 'reported', now() - interval '5 days', null),
('INC-2026-0008', 'Grass Fire', 'Small brush fire spreading toward fence line.', 'Brgy. Culiat, Quezon City', 'low', 'reported', now() - interval '4 days', null),
('INC-2026-0009', 'Vehicular Accident', 'Rear-end collision, minor injuries reported.', 'Visayas Ave. corner Tandang Sora Ave., Brgy. Culiat, Quezon City', 'low', 'reported', now() - interval '3 days', null),
('INC-2026-0010', 'Structure Fire', 'Fire reported at commercial building, crews on site.', 'Brgy. Culiat, Quezon City', 'high', 'resolved', now() - interval '2 days', now() - interval '2 days' + interval '4 hours')
on conflict (incident_number) do nothing;

insert into establishments (business_name, business_type, owner_name, barangay, address, occupancy_type, storeys, floor_area_sqm, contact_number, date_registered, status) values
('Culiat Public Market', 'Public Market', 'Quezon City Market Board', 'Culiat', 'Kalayaan St., Brgy. Culiat, Quezon City', 'Mercantile', 1, 3200.00, '0917-100-1006', '2017-05-09', 'Active'),
('Culiat Elementary School', 'School', 'DepEd Quezon City', 'Culiat', 'Mabuhay St., Brgy. Culiat, Quezon City', 'Educational', 2, 2600.00, '0917-100-1007', '2016-06-01', 'Active'),
('Culiat Business Center', 'Office Building', 'Regalado Properties Inc.', 'Culiat', 'Visayas Ave., Brgy. Culiat, Quezon City', 'Business', 8, 9800.00, '0917-100-1008', '2020-01-14', 'Active'),
('Culiat Cold Storage', 'Warehouse', 'ColdChain Logistics Corp.', 'Culiat', 'Culiat Road, Brgy. Culiat, Quezon City', 'Storage', 1, 5400.00, '0917-100-1009', '2015-09-30', 'Inactive');

insert into gps_devices (device_code, vehicle_id, status, last_lat, last_lng, last_speed_kph, last_heading, last_ping_at) values
('GPS-ENG-03', (select id from vehicles where unit_code = 'ENG-03'), 'online', 14.7012, 121.0521, 12.0, 180, now() - interval '3 minutes'),
('GPS-AMB-02', (select id from vehicles where unit_code = 'AMB-02'), 'online', 14.6825, 121.0512, 45.0, 270, now() - interval '30 seconds'),
('GPS-RES-01', (select id from vehicles where unit_code = 'RES-01'), 'signal_lost', 14.7100, 121.0700, 0, 0, now() - interval '20 minutes')
on conflict (device_code) do nothing;

-- Note: incident_personnel / incident_vehicles / inspections / certificates /
-- violations / attendance reference specific numeric IDs that depend on
-- insert order, so they're not included here to avoid mismatches. Add
-- those manually through the app's UI (Incidents, Inspections, etc.) --
-- that's exactly the CRUD workflow those screens are built for.
