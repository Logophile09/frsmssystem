# Walkthrough: Applying the 6-Role Design System to FRSMS

We have applied the comprehensive **6-Role UI Design System & RBAC** to the **FRSMS (Barangay Culiat Fire & Rescue Station Management System)** codebase across the frontend and backend.

---

## 1. Summary of Changes

### Types & Authentication
- **[AuthContext.tsx](file:///c:/Users/Jameer%20Mangalleno/OneDrive/Desktop/git/frsmssystem/frontend/src/context/AuthContext.tsx)**:
  - Expanded `UserRole` union:
    `'super_admin' | 'admin' | 'staff' | 'brgy_official' | 'citizen' | 'non_citizen' | 'user' | 'super admin'`
  - Added `switchDemoRole(role: UserRole)` to allow instant 1-click role toggling in Demo Mode.
- **[demoData.ts](file:///c:/Users/Jameer%20Mangalleno/OneDrive/Desktop/git/frsmssystem/frontend/src/lib/demoData.ts)**:
  - Added `demoProfilesByRole` for all 6 roles:
    1. **Super Admin**: `Demo Super Admin` (HQ - Culiat)
    2. **Admin**: `Capt. Eduardo Morales` (Station Commander)
    3. **Staff**: `FO2 Ramon Santos` (Duty Firefighter / Dispatcher)
    4. **Barangay Official**: `Kgd. Pedro Lim` (Public Safety Chair)
    5. **Citizen**: `Juan dela Cruz` (Purok 3 Verified Resident)
    6. **Non-Citizen**: `Guest Visitor` (Public Portal)
  - Added mock citizen requests dataset (`demoCitizenRequests`) with multi-step status timeline (`Submitted` → `Verified` → `Inspection Scheduled` → `Approved` → `Issued`).
  - Added mock community announcements dataset (`demoCommunityAnnouncements`) for advisories and fire drills.

### UI Components & Navigation
- **[Badge.tsx](file:///c:/Users/Jameer%20Mangalleno/OneDrive/Desktop/git/frsmssystem/frontend/src/components/Badge.tsx)**:
  - Added WCAG AA color tokens, high-contrast text, and status dots for all 6 roles:
    - `super_admin`: Deep Purple / Navy
    - `admin`: Indigo / Navy
    - `staff`: Sky / Blue
    - `brgy_official`: Amber / Gold
    - `citizen`: Emerald / Forest Green
    - `non_citizen`: Slate Gray
- **[RoleSwitcher.tsx](file:///c:/Users/Jameer%20Mangalleno/OneDrive/Desktop/git/frsmssystem/frontend/src/components/RoleSwitcher.tsx)**:
  - Created a 1-click role-switcher pill in the top header.
  - Allows toggling between all 6 roles directly in the browser to preview role-tailored dashboards and sidebars in real time.
- **[Layout.tsx](file:///c:/Users/Jameer%20Mangalleno/OneDrive/Desktop/git/frsmssystem/frontend/src/components/Layout.tsx)**:
  - Replaced static navigation with dynamic `getNavGroups(role)`.
  - Added role badge in the sidebar header under the Barangay Culiat Seal.
  - Mounted `<RoleSwitcher />` in the top header.

### Dedicated Role Dashboards & Smart Routing
- **[CitizenDashboard.tsx](file:///c:/Users/Jameer%20Mangalleno/OneDrive/Desktop/git/frsmssystem/frontend/src/pages/CitizenDashboard.tsx)**:
  - Resident welcome hero with verified resident badge.
  - Emergency action bar: **Report Fire / Hazard**, **Request FSIC / Clearance**, **Hotline 8-928-0000**.
  - Visual 5-step progress tracker for citizen applications with status badges and detail modals.
  - Designated Barangay Culiat emergency assembly and evacuation zones.
  - Modals to file hazard reports and fire safety inspection requests.
- **[OfficialDashboard.tsx](file:///c:/Users/Jameer%20Mangalleno/OneDrive/Desktop/git/frsmssystem/frontend/src/pages/OfficialDashboard.tsx)**:
  - Executive council overview for Barangay Captain & Public Safety Chair.
  - High-priority escalations queue (Level 3+ fires, gas leaks, damaged hydrants).
  - Localized Purok risk & hydrant availability table.
  - Pending fire safety clearance endorsements with 1-click sign-off.
  - Emergency advisory broadcast modal to push real-time alerts to the Citizen Portal.
- **[PublicPortal.tsx](file:///c:/Users/Jameer%20Mangalleno/OneDrive/Desktop/git/frsmssystem/frontend/src/pages/PublicPortal.tsx)**:
  - Public guest view with station location, 24/7 hotlines, and station officers directory.
  - Fire prevention guidelines (electrical safety, LPG handling, clear egress).
  - Call-to-action banner to register as a verified resident.
- **[App.tsx](file:///c:/Users/Jameer%20Mangalleno/OneDrive/Desktop/git/frsmssystem/frontend/src/App.tsx)**:
  - Integrated `SmartDashboard`: automatically renders `CitizenDashboard`, `OfficialDashboard`, `PublicPortal`, or operational `Dashboard` depending on the active user role.
  - Added dedicated routes: `/citizen-portal`, `/official-portal`, `/public-portal`.

### Management & Backend RBAC
- **[StaffAccounts.tsx](file:///c:/Users/Jameer%20Mangalleno/OneDrive/Desktop/git/frsmssystem/frontend/src/pages/StaffAccounts.tsx)**:
  - Expanded role select dropdowns to support all 6 roles when creating and updating user accounts.
- **[backend/src/middleware/auth.ts](file:///c:/Users/Jameer%20Mangalleno/OneDrive/Desktop/git/frsmssystem/backend/src/middleware/auth.ts)**:
  - Updated `UserRole` type and added role verification helpers (`isOfficial`, `isStaffOrAbove`, `requireOfficial`).
- **[backend/src/routes/staffAccounts.ts](file:///c:/Users/Jameer%20Mangalleno/OneDrive/Desktop/git/frsmssystem/backend/src/routes/staffAccounts.ts)**:
  - Updated `normalizeRole` to handle `brgy_official`, `citizen`, and `non_citizen`.

---

## 2. Validation & Build Results

### Frontend TypeScript & Vite Production Build
```powershell
npm run build
```
- Transformed 2,449 modules.
- Output: `dist/index.html`, `dist/assets/index-Cqj5afTl.css`, `dist/assets/index-NbLWKZwT.js`.
- Result: **0 compilation or lint errors (Exit Code 0)**.

### Backend TypeScript Build
```powershell
npm run build
```
- Compiled `backend/src` with `tsconfig.json`.
- Result: **0 compilation errors (Exit Code 0)**.

---

## 3. How to Test the 6 Roles in the Browser

1. Start the frontend:
   ```powershell
   cd frontend
   npm run dev
   ```
2. Open `http://localhost:5173/login` and click **Continue with Demo Mode**.
3. In the top navigation header next to the live clock, locate the **Role pill**:
   - Click it to reveal the **Switch Role (Preview)** menu.
   - Select any of the 6 roles:
     - **Super Admin**: Access all operational modules, AI settings, and staff accounts.
     - **Admin**: Station Commander view with department-level operations and reports.
     - **Staff**: Duty Firefighter operational queues (Incidents, Vehicles, Equipment, Attendance, GPS Tracker).
     - **Brgy Official**: Executive Dashboard with Barangay Culiat risk analytics, high-priority escalations, and clearance sign-offs.
     - **Citizen**: Citizen Portal with request tracking timeline, hazard reporting modal, and emergency hotlines.
     - **Non-Citizen**: Public safety hub with station directory, safety rules, and registration CTA.
4. Watch the sidebar, header badge, and dashboard instantly transform to match that role's exact access level and UI theme.
