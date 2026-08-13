// ---------------------------------------------------------------------
// Fire-risk score per Quezon City barangay, used to color the choropleth
// zones on the GPS Tracker map.
//
// FRSMS only has real fire-safety records (establishments, inspections,
// violations) for Barangay Culiat -- incidents don't carry a barangay
// field yet. So Culiat's score is grounded in real seeded counts, while
// every other barangay gets a deterministic demo estimate (same number
// on every load, but not an official statistic). This is surfaced
// honestly in the UI via the "Estimated" legend label -- once incidents
// are tagged with a barangay, swap this out for a real GROUP BY query.
// ---------------------------------------------------------------------
import { establishments, inspections, violations } from './demoData';

// Small deterministic string hash -> 0..1, so the same barangay always
// gets the same demo number instead of reshuffling on every render.
function seededUnit(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

// Barangays bordering Culiat read moderately on the demo scale instead
// of being flat -- makes the map look like a real hot-spot radiating out
// from the station rather than one red square in a sea of random noise.
const NEIGHBORS_OF_CULIAT = new Set([
  'Talipapa',
  'Sauyo',
  'Pasong Tamo',
  'Bagbag',
  'Novaliches Proper',
  'San Bartolome',
  'Capri',
  'Santa Lucia',
]);

export interface BarangayRisk {
  score: number; // 0-100
  isReal: boolean; // true only for Culiat (backed by actual seeded records)
}

export function getBarangayRisk(barangayName: string): BarangayRisk {
  if (barangayName === 'Culiat') {
    const openViolations = violations.filter((v) => v.status !== 'Resolved').length;
    const nonCompliant = inspections.filter((i) => i.status === 'Non-Compliant').length;
    const score = Math.min(100, establishments.length * 6 + openViolations * 10 + nonCompliant * 8);
    return { score, isReal: true };
  }

  const base = seededUnit(barangayName) * 45;
  const bump = NEIGHBORS_OF_CULIAT.has(barangayName) ? 20 : 0;
  return { score: Math.round(Math.min(70, base + bump)), isReal: false };
}

// Brand "leaf" red scale (matches tailwind.config.js) so the choropleth
// stays on-palette with the rest of the app instead of introducing a new
// color system.
const SCALE: { max: number; color: string }[] = [
  { max: 10, color: '#fdf2f2' },
  { max: 20, color: '#fbdede' },
  { max: 30, color: '#f5b8b8' },
  { max: 40, color: '#ea8888' },
  { max: 55, color: '#dd4b4b' },
  { max: 70, color: '#ce1126' },
  { max: 85, color: '#a90d1f' },
  { max: 95, color: '#830a18' },
  { max: 101, color: '#5c0711' },
];

export function riskColor(score: number): string {
  return (SCALE.find((s) => score < s.max) ?? SCALE[SCALE.length - 1]).color;
}

export function riskLabel(score: number): string {
  if (score < 20) return 'Low';
  if (score < 40) return 'Moderate';
  if (score < 70) return 'Elevated';
  if (score < 95) return 'High';
  return 'Critical';
}

export const RISK_LEGEND = [
  { label: 'Low', color: '#fbdede' },
  { label: 'Moderate', color: '#ea8888' },
  { label: 'Elevated', color: '#ce1126' },
  { label: 'High', color: '#a90d1f' },
  { label: 'Critical', color: '#5c0711' },
];
