import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

/**
 * Super Admin Icon: Outlined Master Shield with Key / System Control
 */
export function SuperAdminRoleIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
      <circle cx="12" cy="11" r="3" strokeWidth="1.8" />
    </svg>
  );
}

/**
 * Admin Icon (Station Commander / Approvals):
 * Modeled directly on the user's image — Folder containing a document,
 * overlaid with a magnifying glass inspection lens with a checkmark!
 */
export function AdminRoleIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Document sticking out of folder */}
      <path d="M7 4V2.5a.5.5 0 0 1 .5-.5h7l3 3v2" />
      <path d="M14.5 2v3h3" />
      <path d="M9 5.5h3" />
      
      {/* Folder body */}
      <path d="M2.5 7.5A1.5 1.5 0 0 1 4 6h3.2a1.5 1.5 0 0 1 1.06.44L9.8 7.5H19a1.5 1.5 0 0 1 1.5 1.5v1.5" />
      <path d="M2 10.5h9" />
      <path d="M2 10.5v8A1.5 1.5 0 0 0 3.5 20H11" />
      
      {/* Magnifying Glass with Checkmark */}
      <circle cx="16" cy="15" r="4.5" strokeWidth="2" />
      <path d="M14.3 15.1l1.1 1.1 2.3-2.3" strokeWidth="2" />
      <path d="M19.2 18.2l2.3 2.3" strokeWidth="2.2" />
    </svg>
  );
}

/**
 * Staff Icon: Operational Firefighter Helmet & Checklist
 */
export function StaffRoleIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Firefighter / Safety Helmet outline */}
      <path d="M2 16h20" />
      <path d="M4 16c0-5 3.5-9 8-9s8 4 8 9" />
      <path d="M10 7V3h4v4" />
      <path d="M9 16v3a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-3" />
      {/* Front shield badge */}
      <path d="M11 11h2v3h-2z" />
    </svg>
  );
}

/**
 * Barangay Official Icon: Executive Council Ribbon & Star/Seal
 */
export function OfficialRoleIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Medal / Council Seal Ribbon */}
      <circle cx="12" cy="8.5" r="5.5" strokeWidth="2" />
      <path d="M10.2 8.7l1.2 1.2 2.4-2.4" strokeWidth="2" />
      {/* Ribbons hanging down */}
      <path d="M8.2 13.5l-1.7 7.5 5.5-2.5 5.5 2.5-1.7-7.5" />
    </svg>
  );
}

/**
 * Citizen Icon: Verified Resident Home & Identity Badge
 */
export function CitizenRoleIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* House outline */}
      <path d="M3 10.5L12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-9z" />
      {/* Resident silhouette with verified check */}
      <circle cx="12" cy="11.5" r="2" />
      <path d="M9 17c0-1.7 1.3-3 3-3s3 1.3 3 3" />
    </svg>
  );
}

/**
 * Non-Citizen Icon: Public Portal Globe with Directory Search
 */
export function NonCitizenRoleIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9.5" strokeWidth="2" />
      <path d="M2.5 12h19" />
      <path d="M12 2.5a15.3 15.3 0 0 1 4 9.5 15.3 15.3 0 0 1-4 9.5 15.3 15.3 0 0 1-4-9.5 15.3 15.3 0 0 1 4-9.5z" />
    </svg>
  );
}
