# Implementation Plan: Apply 6-Role Design System to FRSMS

Apply the comprehensive 6-role UI design system and Role-Based Access Control (RBAC) to **FRSMS (Barangay Culiat Fire & Rescue Station Management System)** across frontend and backend.

## User Review Required

> [!IMPORTANT]
> **Role Mapping to FRSMS Domain:**
> 1. **Super Admin (`super_admin`)**: Full system access, all operational modules, AI configuration & tuning, audit logs, staff accounts & role assignment.
> 2. **Admin (`admin`)**: Station Commander / Deputy Chief — department oversight, approval workflows, reports, staff scheduling, dispatch recommendations.
> 3. **Staff (`staff`)**: Duty Firefighter / Dispatcher / Field Inspector — daily operational queues (Incidents & Dispatch intake, Post-Incident Reports, Vehicles, Equipment, Attendance, GPS tracking).
> 4. **Barangay Official (`brgy_official`)**: Barangay Captain / Kagawad on Public Safety — Executive dashboard, localized community risk analytics, high-priority incident escalations, fire clearance sign-offs, and public advisories.
> 5. **Citizen (`citizen`)**: Verified Barangay Culiat Resident — Citizen portal, hazard & emergency reporting, fire safety inspection & certificate request tracking with live progress timeline, announcements.
> 6. **Non-Citizen / Guest (`non_citizen`)**: Public Visitor — Public safety hub, fire station directory, emergency hotlines, safety guidelines, and registration/login CTA.

> [!NOTE]
> An interactive **Role Switcher** will be added to the top navigation header in demo/test mode, enabling 1-click preview and testing of all 6 roles directly in the browser without re-logging.

---

## Open Questions

None currently. The 6-role hierarchy aligns directly with the user's handwritten notes (`Super Admin`, `Admin`, `Staff`, `Citizen`, `Non-Citizen`, `Brgy Official`).

---

## Proposed Changes

### 1. Types & Authentication Layer

#### [MODIFY] [AuthContext.tsx](file:///c:/Users/Jameer%20Mangalleno/OneDrive/Desktop/git/frsmssystem/frontend/src/context/AuthContext.tsx)
- Expand `UserRole` union type:
  ```ts
  export type UserRole =
    | 'super_admin'
    | 'admin'
    | 'staff'
    | 'brgy_official'
    | 'citizen'
    | 'non_citizen'
    | 'user'
    | 'super admin';
  ```
- Add `switchDemoRole(role: UserRole)` to `AuthContextValue` to allow instantaneous role switching in Demo Mode.
- Define mock profiles for all 6 roles with appropriate full names and titles.

#### [MODIFY] [demoData.ts](file:///c:/Users/Jameer%20Mangalleno/OneDrive/Desktop/git/frsmssystem/frontend/src/lib/demoData.ts)
- Add demo profiles and staff roster entries for all 6 roles:
  - `Demo Super Admin` (`super_admin`)
  - `Demo Station Commander` (`admin`)
  - `Ramon Santos - Firefighter II` (`staff`)
  - `Kgd. Pedro Lim - Public Safety Chair` (`brgy_official`)
  - `Juan dela Cruz - Purok 3 Resident` (`citizen`)
  - `Guest Visitor` (`non_citizen`)
- Add mock citizen requests (e.g. FSIC clearance, home fire inspection) and community announcements.

---

### 2. UI Components & Design System Tokens

#### [MODIFY] [Badge.tsx](file:///c:/Users/Jameer%20Mangalleno/OneDrive/Desktop/git/frsmssystem/frontend/src/components/Badge.tsx)
- Update role badge colors and labels for all 6 roles:
  - `super_admin`: Deep Purple / Navy (`#0f2a4a`)
  - `admin`: Indigo / Navy (`#1e4d7b`)
  - `staff`: Emerald / Blue (`#2563a8`)
  - `brgy_official`: Amber / Gold (`#b45309`)
  - `citizen`: Forest Green (`#15803d`)
  - `non_citizen`: Slate Gray (`#64748b`)
- Ensure WCAG AA compliance with colored indicator dots and readable high-contrast text.

#### [NEW] [RoleSwitcher.tsx](file:///c:/Users/Jameer%20Mangalleno/OneDrive/Desktop/git/frsmssystem/frontend/src/components/RoleSwitcher.tsx)
- An accessible, elegant role-switcher pill for the top header allowing instant switching between the 6 roles in demo mode.
- Shows current active role icon, role title, and dropdown menu with role descriptions.

---

### 3. Role-Based Navigation & Layout

#### [MODIFY] [Layout.tsx](file:///c:/Users/Jameer%20Mangalleno/OneDrive/Desktop/git/frsmssystem/frontend/src/components/Layout.tsx)
- Implement dynamic role-based navigation structure:
  - **Super Admin**: System Dashboard, Operations, IoT & AI, Fire Safety Compliance, Admin (Reports, Staff Accounts, AI Tuning, System Config).
  - **Admin**: Station Dashboard, Operations (Incidents, Reports, Personnel, Vehicles, Equipment, Attendance), IoT & AI, Fire Safety Compliance, Reports.
  - **Staff**: Duty Dashboard, Incidents & Dispatch, Post-Incident Reports, Vehicle/Equipment Checklist, Attendance, GPS Tracker, Inspection Logs.
  - **Barangay Official**: Executive Dashboard, Community Risk Analytics, Escalated Incidents, Clearance Approvals, Ordinances & Advisories.
  - **Citizen**: Citizen Dashboard, Request Inspection/Certificates, Report Fire Hazard, Track My Requests, Community Announcements, Emergency Hotlines.
  - **Non-Citizen**: Public Safety Directory, Fire Safety Tips, Station Hotlines, Announcements, Citizen Registration.
- Update sidebar header with role badge, icon, and role-tinted accent border.
- Mount `<RoleSwitcher />` in the top header.

#### [MODIFY] [ProtectedRoute.tsx](file:///c:/Users/Jameer%20Mangalleno/OneDrive/Desktop/git/frsmssystem/frontend/src/components/ProtectedRoute.tsx)
- Support granular role gates:
  - `adminOnly`: Super Admin and Admin
  - `staffOnly`: Staff, Admin, Super Admin
  - `officialOnly`: Brgy Official, Admin, Super Admin
  - `citizenOnly`: Citizen, Admin, Super Admin
- Graceful unauthorized page with fallback link to the user's role-appropriate home.

---

### 4. Role Dashboards & Pages

#### [NEW] [CitizenDashboard.tsx](file:///c:/Users/Jameer%20Mangalleno/OneDrive/Desktop/git/frsmssystem/frontend/src/pages/CitizenDashboard.tsx)
- Public-facing citizen portal view:
  - Resident welcome banner with verified resident badge.
  - **Emergency Action Bar**: "Report Fire / Smoke Emergency", "Request Home/Business Inspection", "Direct Fire Station Hotline".
  - **Active Request Tracker**: Step-by-step visual timeline for pending inspection/clearance applications (`Submitted` → `Verified` → `Inspection Scheduled` → `Approved` → `Issued`).
  - **Community Fire Safety Advisories**: Real-time announcements from Barangay Culiat Fire Station.
  - **Emergency Preparedness & Evacuation Map**: Quick guide to barangay assembly areas and fire hydrants.

#### [NEW] [OfficialDashboard.tsx](file:///c:/Users/Jameer%20Mangalleno/OneDrive/Desktop/git/frsmssystem/frontend/src/pages/OfficialDashboard.tsx)
- Executive oversight dashboard for Barangay Captain & Public Safety Councilors:
  - **Barangay Culiat Community Risk Metrics**: Incident counts by purok/zone, avg response time, fire hazard density.
  - **Escalated Incidents Queue**: High-severity incidents (Level 3+ fires, structural collapses, hazardous materials) requiring barangay council awareness & relief coordination.
  - **Clearance Sign-Offs**: Pending Fire Safety Inspection Endorsements and Business Clearance approvals.
  - **Emergency Broadcast Tool**: Post public safety warnings to the Citizen portal.

#### [NEW] [PublicPortal.tsx](file:///c:/Users/Jameer%20Mangalleno/OneDrive/Desktop/git/frsmssystem/frontend/src/pages/PublicPortal.tsx)
- Non-citizen / guest public directory:
  - Barangay Culiat Fire Station Directory & 24/7 hotline numbers.
  - Public fire prevention guidelines & ordinance summaries.
  - Recent public announcements.
  - Call to action to register as a verified resident or log in.

#### [MODIFY] [App.tsx](file:///c:/Users/Jameer%20Mangalleno/OneDrive/Desktop/git/frsmssystem/frontend/src/App.tsx)
- Wire up new routes:
  - `/citizen-portal` or role-routed `/dashboard` (routes to `CitizenDashboard`, `OfficialDashboard`, or operational `Dashboard` based on active role).
  - `/public-portal` for guest / non-citizen view.
  - Maintain all existing operational routes (`/incidents`, `/vehicles`, `/equipment`, etc.) for staff and admins.

---

### 5. Staff Accounts Management & Backend RBAC

#### [MODIFY] [StaffAccounts.tsx](file:///c:/Users/Jameer%20Mangalleno/OneDrive/Desktop/git/frsmssystem/frontend/src/pages/StaffAccounts.tsx)
- Update role select dropdowns to support all roles:
  - `Staff`
  - `Admin`
  - `Super Admin`
  - `Barangay Official`
  - `Citizen`
  - `Non-Citizen`
- Add role filter tabs/buttons to filter accounts by role.

#### [MODIFY] [backend/src/middleware/auth.ts](file:///c:/Users/Jameer%20Mangalleno/OneDrive/Desktop/git/frsmssystem/backend/src/middleware/auth.ts)
- Update `UserRole` type and add role verification helpers:
  - `isSuperAdmin(role)`
  - `isAdmin(role)`
  - `isOfficial(role)`
  - `isStaffOrAbove(role)`
  - `requireOfficial` middleware

#### [MODIFY] [backend/src/routes/staffAccounts.ts](file:///c:/Users/Jameer%20Mangalleno/OneDrive/Desktop/git/frsmssystem/backend/src/routes/staffAccounts.ts)
- Update `normalizeRole` to support all 6 roles.
- Enforce role creation and modification hierarchies.

---

## Verification Plan

### Automated Tests
- Run TypeScript build check:
  ```powershell
  cd "c:\Users\Jameer Mangalleno\OneDrive\Desktop\git\frsmssystem\frontend"
  npm run build
  ```
- Run backend TypeScript build check:
  ```powershell
  cd "c:\Users\Jameer Mangalleno\OneDrive\Desktop\git\frsmssystem\backend"
  npm run build
  ```

### Manual Verification
1. **Interactive Role Switcher Verification**:
   - Open FRSMS in browser (or check components).
   - Switch to **Super Admin**: Verify full menu, system settings, AI tuning, staff accounts.
   - Switch to **Admin**: Verify station commander view, department reports, approval workflows.
   - Switch to **Staff**: Verify operational queues (incidents, vehicles, attendance, GPS tracker).
   - Switch to **Barangay Official**: Verify Executive Dashboard with Culiat community risk analytics, escalated incidents, and clearance approvals.
   - Switch to **Citizen**: Verify Citizen Portal with active request tracker timeline, emergency report trigger, community announcements.
   - Switch to **Non-Citizen**: Verify Public Portal with station directory, emergency hotlines, and registration CTA.
2. **Badge & Color Tokens Verification**:
   - Verify all 6 roles display the correct color badge with WCAG AA compliance (dot + text label).
3. **Staff Accounts Page**:
   - Verify adding and updating accounts with the 6 roles works cleanly.
