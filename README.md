# QueueEase — Smart Civic Queue Management System

> **A modern, inclusive, and resilient queue management system engineered for high-density public civic centers, municipal halls, and healthcare facilities.**

---

## 🏛️ Project Overview

QueueEase eliminates chaotic waiting room hallways by providing a seamless, dignified digital queue flow for citizens, staff officers, and municipal supervisors:
- **Citizens** generate instant mobile passes with QR codes, monitor live queue steps in real-time, and receive voice and vibration alerts.
- **Staff** operate an ergonomic counter dispatch console to call, serve, transfer, or recall citizens with one tap.
- **Hall Lounges** display 16:9 4K TV digital signage with dual-tone audio chimes and multi-lingual voice announcements.
- **Administrators** monitor system-wide throughput, manage desk clusters, configure statutory SLAs, and enforce ADA-compliant priority policies.

---

## ⚡ Architectural Ground Rules & Compliance

- **Zero External Frameworks**: 100% plain HTML5, CSS3, and vanilla JavaScript (ES modules). Zero React, zero Tailwind, zero Bootstrap, and zero runtime build tool dependencies.
- **Design System (*Civic Flow*)**:
  - Primary Navy (`#142D4E`), Secondary Blue (`#2563EB`), Tertiary Teal (`#14B8A6`), Background (`#F8FAFC`), Text (`#0B1C30`).
  - Strict 4px/8px spatial rhythm, levels 0–3 elevation shadows, and rounded radius tokens defined in `/assets/css/tokens.css`.
  - Accessible typography using Google Font **Hanken Grotesk** (400, 600, 700) with JetBrains Mono for token numerals.
- **Mobile-First & Touch Ergonomics**:
  - Designed for 360–430px viewports first, enhanced with min-width media queries at 768px and 1280px. Zero horizontal scrolling at any width.
  - Touch targets $\ge 44 \times 44\text{px}$, form inputs $\ge 16\text{px}$ to prevent iOS Safari auto-zoom, and safe-area inset protection (`env(safe-area-inset-bottom)`).
- **Zero External Media Assets**:
  - Dual-tone auditory chime synthesized live via **Web Audio API** ($523.25\text{ Hz} \rightarrow 659.25\text{ Hz}$).
  - Spoken announcements rendered via **Web Speech API** (`speechSynthesis`).
  - Zero chart/QR libraries: fully responsive vector SVG charts and canvas 2D matrix ticket rendering.
- **Progressive Web App (PWA)**:
  - Valid `manifest.json` with 192px/512px icons and maskable assets.
  - Native service worker (`sw.js`) caching the citizen shell for offline pass inspection.
  - In-app install banner with iOS Safari guidance.

---

## 🚀 How to Run the Application

### Option A: VS Code Live Server / Static Web Server (Recommended)
1. Open the project folder in VS Code or your preferred editor.
2. Right-click `/index.html` and select **"Open with Live Server"** (or run `npx serve .`).
3. Navigate to `http://localhost:5500` or the port displayed in your terminal.

### Option B: Local Vite Dev Server
```bash
# Start the local development server (port 3000)
npm run dev
```

---

## 🔐 Demo Credentials

### Staff Operations Portal (`/staff/login.html`)
| Field | Value | Notes |
| :--- | :--- | :--- |
| **Staff ID** | `STF-4409` | Or `m.jenkins@civic.gov` / `staff` |
| **Password** | `civic123` | |
| **Workstation** | `Counter 02 - Birth & Civil Registry (Desk 104)` | Pre-selected default |
| *Quick Action* | Tap **"Autofill Session"** | Loads credentials automatically |

### Admin Governance Portal (`/admin/login.html`)
| Field | Value | Notes |
| :--- | :--- | :--- |
| **Admin ID** | `STF-ADM-01` | Or `m.vance@civic.gov` / `admin` |
| **Password** | `admin123` | |
| **6-Digit TOTP** | `123456` | Synchronized with 30s countdown ring |
| *Quick Action* | Tap **"Autofill Session"** | Loads credentials and TOTP code |

---

## 📂 Complete Folder Map

```text
/
├── 404.html                     # Municipal Route Not Found handler
├── index.html                   # S0: Enterprise Marketing Landing Page
├── components.html              # Civic Flow Component Styleguide & Tokens
├── manifest.json                # PWA Web App Manifest
├── sw.js                        # PWA Service Worker (Offline Citizen Shell)
├── metadata.json                # AI Studio application metadata
│
├── admin/                       # Admin Governance Suite
│   ├── index.html               # Admin Router (redirects to overview or login)
│   ├── login.html               # S11: Tier-4 Admin Login with 30s TOTP Ring
│   ├── overview.html            # S12: Executive Operations & SLA Overview
│   ├── staff.html               # S13: Civic Staff Roster & Desk Matrix
│   ├── counters.html            # S14: Counter Fleet & Automated Dispatch Rules
│   ├── services.html            # S15: Service Catalog & Turnaround SLA Config
│   ├── tokens.html              # S16: Centralized Token Registry & Master Ledger
│   ├── settings.html            # S17: System Configuration & Operational Policies
│   └── reports.html             # S18: Business Intelligence & Civic Reports
│
├── citizen/                     # Citizen Self-Service Mobile Portal
│   ├── home.html                # S1: Digital Civic Hall Live Home
│   ├── services.html            # S2: Service Hub Catalog & Filtering
│   ├── issue.html               # S3: Token Pass Generation Form
│   ├── token.html               # S4: Token Generated & Offline Canvas Pass
│   ├── track.html               # S5: Live Real-Time Queue Tracker & Audio Chime
│   ├── assist.html              # S6: Accessibility & Inclusive Care Toolset
│   ├── assistance.html          # S6: Alias route for assist.html
│   └── profile.html             # Citizen Profile, Active Passes & History
│
├── display/                     # Public Digital Displays
│   └── signage.html             # S19: 16:9 Full-Screen TV Lounge Signage
│
├── staff/                       # Staff Operations Suite
│   ├── index.html               # Staff Router (redirects to dashboard or login)
│   ├── login.html               # S7: Staff Workstation Sign-In
│   ├── dashboard.html           # S8: Shift Overview & Queue Velocity KPI Terminal
│   ├── console.html             # S9: Counter Dispatch Terminal & Calling Console
│   └── history.html             # S10: Token History & Real CSV Audit Ledger
│
├── assets/
│   ├── css/
│   │   ├── tokens.css           # Design tokens (colors, typography, elevation, spacing)
│   │   ├── base.css             # Modern reset, container, layout utilities
│   │   ├── components.css       # Reusable components (buttons, cards, modals, tables)
│   │   ├── citizen.css          # Citizen mobile layout & ticket styles
│   │   ├── dashboard.css        # Responsive dashboard shell & data tables
│   │   ├── landing.css          # Marketing landing animations & responsive grids
│   │   └── signage.css          # 16:9 TV lounge typography & summon flash keyframes
│   ├── js/
│   │   ├── store.js             # Reactive mock store synced via storage events
│   │   ├── ui.js                # Shell headers, bottom nav, modals, toasts
│   │   ├── ticket.js            # Deterministic canvas QR generator & pass downloader
│   │   ├── track.js             # Live tracking stepper, timeline, audio announcer
│   │   ├── citizen.js           # Citizen home telemetry, filters, and active pass cards
│   │   ├── staff.js             # Staff session manager, duration timers, CSV export
│   │   ├── admin.js             # Admin session controller & drawer navigation
│   │   ├── charts.js            # Zero-dependency SVG vector charts (line, donut, radar)
│   │   ├── signage.js           # TV signage board controller & Web Audio chime
│   │   ├── a11y.js              # High-contrast mode, text scaling, speech synthesis
│   │   └── pwa.js               # Service worker registration & mobile install prompt
│   └── icons/
│       ├── icon.svg             # High-contrast brand SVG vector icon
│       ├── pwa-192x192.png      # PWA 192x192 icon
│       ├── pwa-512x512.png      # PWA 512x512 icon
│       ├── pwa-maskable-512x512.png # PWA maskable safe-zone icon
│       └── apple-touch-icon.png # iOS Safari home-screen icon
│
└── public/                      # Static assets served at root
    ├── manifest.json
    ├── sw.js
    ├── pwa-192x192.png
    ├── pwa-512x512.png
    └── apple-touch-icon.png
```

---

## 📱 Complete Screen Map (S0 to S19)

| Screen ID | Screen Name | File Path | Primary Features |
| :---: | :--- | :--- | :--- |
| **S0** | **Marketing Landing Page** | `/index.html` | Hero with live ticket mock, feature architecture grid, story section, institutional use-cases, FAQ accordion, role-based login sheet. |
| **S1** | **Citizen Home** | `/citizen/home.html` | Digital Civic Hall Live pill, active desk counts, Track Existing Token input, Active Passes container, 2x2 Department grid, lounge status card. |
| **S2** | **Service Catalog** | `/citizen/services.html` | Search box, horizontal filter chips, service cards with wait tags and counter clusters, real-time processing pulse, accessibility banner. |
| **S3** | **Issue Token Pass** | `/citizen/issue.html` | Assigned hub card, citizen legal name input, SMS checkbox, 2x2 priority cards (Standard, Senior 65+, Mobility, Expectant), sticky bottom button. |
| **S4** | **Token Generated** | `/citizen/token.html` | Ticket card with radial cut-outs, deterministic canvas QR code, estimated arrival time, PNG pass download, directions to Hall B. |
| **S5** | **Live Queue Tracking** | `/citizen/track.html` | Dark gradient token hero, 5-step queue stepper, live board list, status timeline, notification checkboxes, Web Speech audio announcement. |
| **S6** | **Accessibility Care** | `/citizen/assist.html` | High contrast mode toggle, text size scaling, auditory guidance test button, multilingual picker, escort request modal, induction loop desks. |
| **S7** | **Staff Workstation Login** | `/staff/login.html` | Workstation picker, password show/hide, remember session, autofill session button, 1.2s verification delay, credential validation. |
| **S8** | **Staff Shift Dashboard** | `/staff/dashboard.html` | 4 KPI cards, elapsed session timer, hourly velocity SVG bar chart, live activity feed stream, 6 counter status cards, duty SLA ring gauge. |
| **S9** | **Counter Dispatch Console** | `/staff/console.html` | Active citizen hero (A008), live timer, *Complete*, *Call Next*, *Recall*, *Skip (No Show)*, *Transfer Desk*, lounge broadcast modal, waiting queue table. |
| **S10** | **Token History & Audit Log** | `/staff/history.html` | 4 KPI cards, multi-criteria filters, real CSV Blob download, stacked responsive audit table, receipt modal, case notes modal, transfer route modal. |
| **S11** | **Admin Security Sign-In** | `/admin/login.html` | Tier-4 admin ID, password, 6-digit TOTP input with 30s countdown ring, autofill session button, telemetry metadata. |
| **S12** | **Executive Operations Overview** | `/admin/overview.html` | 6 KPI cards, hourly throughput bar chart, service distribution SVG donut, lifecycle disposition, shift line chart with 15m SLA cap, telemetry stream. |
| **S13** | **Staff Directory & Stations** | `/admin/staff.html` | Staff KPI tiles, role/shift filters, roster table, counter staffing matrix, shift handover notice, add staff modal, reassign desk modal. |
| **S14** | **Counter Fleet & Dispatch Rules**| `/admin/counters.html` | 6 desk cards with state toggles (*Serving*, *Online Idle*, *Paused Recess*, *Offline Standby*), automated dispatch rules cascade panel with sliders. |
| **S15** | **Service Catalog & SLA Config** | `/admin/services.html` | Service table (stacked on mobile), Add Service slide-over sheet, edit/pause/delete controls, JSON schema export Blob download. |
| **S16** | **Live Master Token Ledger** | `/admin/tokens.html` | Real-time synchronized ledger with 1.2s pulse, 5 KPI cards, saved views, table row supervisor actions (*Force Call*, *Recall*, *Transfer*, *Cancel*). |
| **S17** | **System Policies & Config** | `/admin/settings.html` | Civic center parameters, operating hours, day toggles, algorithm selector, chime preview, ADA priority ratio slider with load simulation curve. |
| **S18** | **Business Intelligence Reports** | `/admin/reports.html` | 30-day audited KPI cards, daily trends line chart, counter efficiency matrix, peak-hour congestion heatmap, SLA breach diagnostics, PDF export. |
| **S19** | **TV Lounge Digital Signage** | `/display/signage.html` | 16:9 full-screen lounge display, live digital clock, now-serving hero panel with flashing animation, up-next carousel, ticker bar. |

---

## 🔄 End-to-End Flow Validation Guide

To verify real-time cross-tab synchronization:

1. **Tab 1 (Citizen Mobile)**:
   - Navigate to `/citizen/services.html`.
   - Tap **"Select Service"** on *Certificate Application*.
   - Enter name (e.g., `Eleanor Vance`), select *Standard Queue*, and tap **"Generate Token Now"**.
   - Note the generated token number (e.g., `A008`) and tap **"Track Live Queue Progress"**.
2. **Tab 2 (Lounge TV Signage)**:
   - In a separate window or tab, open `/display/signage.html`.
   - The display shows active and up-next queues in real-time.
3. **Tab 3 (Staff Console)**:
   - Navigate to `/staff/console.html` (sign in with `STF-4409` / `civic123` if prompted).
   - In the waiting roster table, observe the new token appearing automatically.
   - Tap **"Call Next Citizen"**.
   - Within 1 second:
     - **Tab 3 (Staff Console)** updates active token to `A008`.
     - **Tab 2 (TV Signage)** flashes the hero panel and emits a dual-tone chime ($523.25\text{ Hz} \rightarrow 659.25\text{ Hz}$).
     - **Tab 1 (Citizen Mobile)** updates the status hero to **"NOW SERVING"**, triggers phone vibration, and displays a prominent notification toast.
4. **Tab 4 (Admin Ledger)**:
   - Open `/admin/tokens.html`.
   - In Tab 3, tap **"Mark Completed"**.
   - Tab 4 immediately reflects the token status as **"Completed"** with SLA compliance tags.

---

## ♿ Accessibility (WCAG 2.2 AAA Standards)

- **Contrast Ratios**: Normal text exceeds $4.5:1$; Dark Mode (`data-theme="dark"`) utilizes a comfortable civic navy palette (`#0B1220` / `#111B2E` / `#16233A`) maintaining full WCAG AA/AAA readability without harsh glare.
- **Auditory Guidance**: Screen readers and visually impaired citizens can tap **"Listen to Queue Announcement"** to hear their token status spoken aloud.
- **Focus Management**: Modals and off-canvas drawers feature complete keyboard focus trapping with `Escape` key dismissal and focus restoration.
- **ARIA Declarations**: Live queue boards and status indicators use `aria-live="polite"` and `aria-atomic="true"` for seamless assistive technology integration.
- **Reduced Motion**: All animations and transitions automatically disable when `prefers-reduced-motion: reduce` is detected.

---

## 📄 License & Public Sector Usage
Developed for municipal government centers, public civil registries, and healthcare clinics under the **Civic Infrastructure Public License**.
