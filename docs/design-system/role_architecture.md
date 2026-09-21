# BMS Design System — Architecture & Reference

> Barangay Management System · UI Design System v1.0 · WCAG 2.1 AA Compliant

---

## 1. Role Matrix & Permission Hierarchy

| Feature | Super Admin | Admin | Staff | Citizen | Non-Citizen | Brgy Official |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| System Config & Security | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| User Role Management | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Audit Logs | ✅ | View only | ❌ | ❌ | ❌ | ❌ |
| All-Department Reports | ✅ | Own dept | ❌ | ❌ | ❌ | Summary |
| Approve Workflows | ✅ | ✅ | ❌ | ❌ | ❌ | Final sig |
| Staff Management | ✅ | Own dept | ❌ | ❌ | ❌ | ❌ |
| Process Requests | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create Requests | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Track Own Requests | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Announcements | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Post Announcements | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| View Services Directory | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Escalation Management | ✅ | ✅ | Raise only | ❌ | ❌ | ✅ |
| Clearance Final Approval | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Community Analytics | ✅ | Dept only | ❌ | ❌ | ❌ | ✅ |
| Ordinance Management | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 2. Sidebar Navigation Structure Per Role

### 🔐 Super Admin — `#0f2a4a` (Deep Navy)
```
├── Overview
│   ├── 📊 System Dashboard
│   ├── 📈 Analytics & Reports
│   └── 📋 Audit Logs
├── User Management
│   ├── 👥 All Users
│   ├── 🔑 Roles & Permissions
│   └── 🛡️ Access Control
├── System
│   ├── ⚙️ System Configuration
│   ├── 🔒 Security Settings
│   ├── 🔄 Backup & Restore
│   └── 📡 API & Integrations
└── Operations
    ├── 📑 All Requests [badge: count]
    ├── 🏢 Departments
    └── 📢 Announcements
```

### 🏢 Admin — `#1e4d7b` (Navy Blue)
```
├── Overview
│   ├── 📊 Admin Dashboard
│   └── 📈 Department Reports
├── Department
│   ├── 📑 Request Queue [badge: urgent]
│   ├── ✅ Approval Workflows
│   ├── 👥 Staff Management
│   └── 📅 Schedules
└── Content
    ├── 📢 Announcements
    └── 📋 Document Templates
```

### 👩‍💼 Staff — `#2563a8` (Primary Blue)
```
├── My Work
│   ├── 📋 My Queue [badge: urgent]
│   ├── ➕ New Request
│   └── 🔍 Search Records
├── Operations
│   ├── 📑 All Requests
│   ├── 📅 Appointments
│   └── 📊 My Reports
└── Resources
    ├── 📁 Document Forms
    └── 📢 Announcements
```

### 🏠 Citizen — `#15803d` (Forest Green)
```
├── My Portal
│   ├── 🏠 My Dashboard
│   ├── 📑 My Requests [badge: count]
│   └── 📄 My Documents
├── Services
│   ├── ➕ Request a Document
│   ├── 💬 File a Complaint
│   └── 📅 Book Appointment
└── Community
    ├── 📢 Announcements [badge: new]
    ├── 📋 Community Board
    └── 📞 Contact Barangay
```

### 🌐 Non-Citizen — `#475569` (Slate Gray)
```
├── Public
│   ├── 🏛️ Public Home
│   ├── 📢 Announcements
│   ├── 📋 Services Directory
│   └── 📞 Contact Directory
├── Information
│   ├── ℹ️ About the Barangay
│   ├── 📜 Ordinances (Public)
│   └── 🗺️ Barangay Map
└── Account
    └── 🔑 Log In / Register [highlighted CTA]
```

### ⭐ Brgy Official — `#92400e` (Amber Brown)
```
├── Executive
│   ├── 📊 Executive Dashboard
│   ├── 📈 Community Analytics
│   └── 🚨 Escalations [badge: urgent]
├── Legislative
│   ├── 📜 Ordinance Overview
│   ├── 🗳️ Resolutions
│   └── 📅 Session Calendar
├── Clearance
│   ├── ✅ Clearance Approvals [badge: count]
│   └── 🔄 Review Queue
└── Community
    ├── 📢 Issue Announcements
    └── 📋 Programs & Projects
```

---

## 3. Component Architecture

### Core Components (Shared Across Roles)

| Component | Description | Variants |
|---|---|---|
| `<NavSidebar>` | Role-aware collapsible sidebar | 6 color themes |
| `<TopBar>` | Breadcrumb + search + notifications + avatar | Internal / Public |
| `<StatusBadge>` | Request status indicator | pending/processing/approved/rejected/escalated/completed |
| `<DataTable>` | Sortable/filterable grid with pagination | Full (admin) / Compact (staff) / Read-only (citizen) |
| `<NotificationBanner>` | System alerts | info/success/warning/error |
| `<ModalForm>` | Focus-trapped dialog | Request form / Approval / Confirmation |
| `<PermissionGate>` | Wrapper that conditionally renders or disables | Read/Write/Admin/SuperAdmin |
| `<KPICard>` | Metric display with delta | Numbered / Percentage / Status |
| `<RequestTimeline>` | Step-by-step status tracker | 5-step horizontal / 4-step vertical |
| `<FormInput>` | Accessible labeled input | Text / Select / Textarea / File / Date |
| `<ActionButton>` | Permission-aware action trigger | Primary / Secondary / Danger / Ghost / Gated |
| `<AvatarPill>` | User identity with role badge | Internal / Public |

### Permission Gate Implementation Logic
```
PermissionGate(requiredRole, userRole):
  if userRole >= requiredRole:
    render: <button class="btn-primary"> (enabled)
  elif userRole can SEE but not USE:
    render: <button class="btn-permission-gated" aria-disabled="true" title="Requires [role]">
  else:
    render: null (completely hidden)
```

### Request Reference Number Format
```
[TYPE]-[YEAR]-[6-digit-seq]
Examples:
  BRG-2026-004523  → Barangay Clearance
  IND-2026-001892  → Indigency Certificate  
  COR-2026-000892  → Certificate of Residency
  BP-2026-000347   → Business Permit
```

---

## 4. Design Tokens Reference

### Color Tokens
```css
/* Role Primaries */
--role-super-admin:    #0f2a4a;
--role-admin:          #1e4d7b;
--role-staff:          #2563a8;
--role-citizen:        #15803d;
--role-non-citizen:    #64748b;
--role-brgy-official:  #b45309;

/* Semantic */
--color-success:       #22c55e;
--color-danger:        #ef4444;
--color-warning:       #f59e0b;
--color-info:          #3b82f6;
--color-escalated:     #f97316;

/* Text */
--text-primary:        #0f172a;
--text-secondary:      #334155;
--text-muted:          #64748b;
--text-placeholder:    #94a3b8;

/* Surfaces */
--surface-page:        #f8fafc;
--surface-card:        #ffffff;
--surface-sidebar:     role-specific;
--border-default:      #e2e8f0;
--border-subtle:       #f1f5f9;
```

### Typography Scale
```css
--text-display:  36px / 800 weight / -1px tracking
--text-h1:       28px / 700 weight / -0.5px tracking
--text-h2:       22px / 700 weight
--text-h3:       18px / 600 weight
--text-lg:       16px / 500 weight / 1.6 line-height
--text-base:     14px / 400 weight / 1.5 line-height
--text-sm:       13px / 400 weight
--text-xs:       11px / 600 weight / UPPERCASE (labels only)
--text-mono:     13px / Courier New (reference IDs)
```

### Spacing System (4px grid)
```
4px   → xs  (inline gap)
8px   → sm  (icon gap, tight padding)
12px  → md  (component internal)
16px  → lg  (card padding)
20px  → xl  (section gap)
24px  → 2xl (page padding)
32px  → 3xl (section spacing)
40px  → 4xl (major sections)
```

### Border Radius
```
4px  → inputs, tags
8px  → buttons, small cards
10px → cards, panels
12px → large cards, modals
16px → modal dialogs
9999px → pills, badges
```

### Shadow Scale
```
shadow-sm:  0 1px 3px rgba(0,0,0,0.08)
shadow-md:  0 4px 12px rgba(0,0,0,0.1)
shadow-lg:  0 8px 24px rgba(0,0,0,0.12)
shadow-xl:  0 20px 60px rgba(0,0,0,0.2)  (modals)
```

---

## 5. WCAG AA Compliance Summary

### Contrast Ratios (All Pass ≥ 4.5:1)

| Combination | Ratio | Result |
|---|---|---|
| `#0f2a4a` bg / white text | 14.2:1 | ✅ AAA |
| `#1e4d7b` bg / white text | 8.7:1 | ✅ AAA |
| `#2563a8` bg / white text | 5.2:1 | ✅ AA |
| `#15803d` bg / white text | 5.7:1 | ✅ AA |
| `#b45309` bg / white text | 4.6:1 | ✅ AA |
| `#0f172a` text / white bg | 18.5:1 | ✅ AAA |
| `#334155` text / white bg | 9.1:1 | ✅ AAA |
| `#64748b` text / white bg | 4.6:1 | ✅ AA |

### Key Accessibility Rules
- **1.4.1 Use of Color**: All status badges use dot + text label (not color alone)
- **1.4.3 Contrast**: All text/background pairs meet 4.5:1 minimum
- **2.1.1 Keyboard**: All interactive elements keyboard-navigable
- **2.4.7 Focus Visible**: 3px solid `#2563a8` focus ring, 2px offset
- **3.3.1 Error Identification**: Error messages identify field + corrective guidance
- **4.1.2 Name/Role/Value**: All custom components use appropriate ARIA roles

---

## 6. Recommended Tech Stack

| Layer | Recommendation | Rationale |
|---|---|---|
| Frontend Framework | **Next.js 14** (App Router) | SSR for SEO + fast citizen pages; RSC for auth |
| UI Library | **Tailwind CSS** + **shadcn/ui** | Token-based, accessible components |
| Auth & RBAC | **NextAuth.js** + **Casbin** | Role-based policy engine |
| State Management | **Zustand** + **React Query** | Lightweight global state + server sync |
| Database | **PostgreSQL** + **Prisma** | Relational data for requests/roles/audit |
| File Storage | **S3-compatible** (MinIO self-hosted) | Document uploads (clearances, IDs) |
| Real-time | **Supabase Realtime** | Live queue updates for staff |
| PDF Generation | **Puppeteer** | Official document generation |
| Accessibility | **axe-core** CI integration | Automated WCAG checks in pipeline |
| i18n | **next-intl** | Filipino/English bilingual support |

---

## 7. Screen Inventory

### Internal Screens (Admin / Staff / Super Admin)
1. System Dashboard (Super Admin)
2. Admin Department Dashboard
3. Staff Queue Dashboard
4. Request Detail View + Approval Workflow
5. User Management Table (Super Admin)
6. Role & Permissions Editor (Super Admin)
7. Audit Log Viewer (Super Admin)
8. Staff Management Panel (Admin)
9. Reports & Analytics (Admin/Super Admin)
10. Announcement Manager
11. Document Template Manager
12. System Configuration (Super Admin)

### Public Screens (Citizen / Non-Citizen / Brgy Official)
1. Citizen Dashboard + Welcome Hero
2. Request Submission Form (Multi-step)
3. Request Tracker (Status timeline)
4. My Documents Library
5. Complaint Form
6. Appointment Booking
7. Community Announcements Feed
8. Public Home (Non-Citizen landing)
9. Services Directory (Public)
10. Executive Dashboard (Brgy Official)
11. Escalation Manager (Brgy Official)
12. Clearance Approval Interface (Brgy Official)
13. Ordinance Overview (Brgy Official)
14. Login / Registration / Identity Verification
