-- Fixes incident locations that were set to far-away Quezon City places
-- (Commonwealth, Batasan Hills, Fairview, Novaliches, Talipapa) so every
-- incident sits within Brgy. Culiat or one of its real bordering barangays:
-- Pasong Tamo, Matandang Balara, New Era, U.P. Campus, Vasra, Bahay Toro.
-- Run this in the Supabase SQL editor for your project.

update incidents set location = 'Culiat Road, Brgy. Culiat, Quezon City'
where incident_number = 'INC-2026-0001';

update incidents set location = 'Tandang Sora Ave., Brgy. Culiat, Quezon City'
where incident_number = 'INC-2026-0002';

update incidents set location = 'Visayas Ave., Brgy. Vasra, Quezon City'
where incident_number = 'INC-2026-0003';

update incidents set location = 'Commonwealth Ave., Brgy. Matandang Balara, Quezon City'
where incident_number = 'INC-2026-0004';

update incidents set location = 'Mindanao Ave., Brgy. Bahay Toro, Quezon City'
where incident_number = 'INC-2026-0007';

update incidents set location = 'Central Ave., Brgy. New Era, Quezon City'
where incident_number = 'INC-2026-0008';

update incidents set location = 'Commonwealth Ave. corner Katipunan Ave., Brgy. U.P. Campus, Quezon City'
where incident_number = 'INC-2026-0009';

update incidents set location = 'Pasong Tamo St., Brgy. Pasong Tamo, Quezon City'
where incident_number = 'INC-2026-0010';
