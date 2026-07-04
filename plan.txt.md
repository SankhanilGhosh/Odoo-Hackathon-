# QuantumCore AG-LMS Implementation Plan

We will build the **QuantumCore** Antigravity R&D Lab Management System (AG-LMS) web application. Since there is currently no active workspace, we will create a subdirectory `quantumcore` under `C:\Users\Abhirup\.gemini\antigravity\scratch` and implement the application there.

We recommend the user to set `C:\Users\Abhirup\.gemini\antigravity\scratch\quantumcore` as the active workspace once created.

---

## Technical Stack & Architecture

- **Framework:** Next.js 14 (App Router, TypeScript)
- **Styling:** Tailwind CSS with a sci-fi/cyberpunk dark theme (Monochromatic charcoal background with neon cyan, amber, and emergency-red accents)
- **Database & Auth:** Supabase (PostgreSQL, Auth, Row Level Security)
- **Fallback Simulation:** A client-side mock Supabase wrapper that runs on local storage if environment variables are not supplied, allowing instant out-of-the-box local testing.
- **Charts:** `recharts` for live-rendering telemetry logs (field density, power draw, thrust, graviton flux) and calendar usage maps.
- **Icons:** `lucide-react` for terminal-style icons.

---

## Database Schema Design

We will write SQL DDL scripts that can be directly executed in the Supabase SQL editor. Additionally, these schemas will be fully mocked in our local-storage client.

### 1. `users` (Supabase Auth / Custom Profiles)
We will extend user metadata or link a custom profile table. We use a `profiles` table to store metadata linked to Supabase's `auth.users`.
- `id` (uuid, PK, references `auth.users`)
- `email` (text)
- `clearance_level` (text: `'researcher'` | `'director'`)
- `created_at` (timestamp)

### 2. `researcher_profiles`
- `id` (uuid, PK)
- `user_id` (uuid, FK references `profiles.id` or `auth.users`)
- `personnel_id` (text, e.g., `QC-4089`)
- `full_name` (text)
- `division` (text: `'Theoretical'` | `'Propulsion'` | `'Safety'`)
- `assigned_reactor_id` (text, e.g., `BAY-01`)
- `flight_status` (text: `'grounded'` | `'cleared'`)

### 3. `telemetry_logs`
- `id` (uuid, PK)
- `researcher_id` (uuid, FK references `researcher_profiles.id`)
- `timestamp` (timestamp)
- `graviton_flux` (float)
- `core_stability_pct` (int)
- `status` (text: `'stable'` | `'fluctuating'` | `'critical'`)

### 4. `flight_clearance_requests`
- `id` (uuid, PK)
- `researcher_id` (uuid, FK references `researcher_profiles.id`)
- `destination_vector` (text, e.g., `L4-ORBIT`)
- `micro_grav_duration` (text, e.g., `45s`)
- `justification` (text)
- `status` (text: `'pending'` | `'approved'` | `'denied'`)
- `director_notes` (text, nullable)
- `created_at` (timestamp)

### 5. `propulsion_metrics`
- `id` (uuid, PK)
- `base_frequency` (float, e.g., `1420.4`)
- `power_draw_mw` (float)
- `field_density_tesla` (float)
- `net_thrust_newtons` (float)
- `timestamp` (timestamp)

---

## App Routing and Pages

We will create the routing system outlined below:

- `/sign-in` — Terminal-style sign-in page. Users can login as a pre-seeded Researcher or Director.
- `/dashboard` — Landing dashboard with automatic redirection depending on role (`/dashboard/telemetry` for researchers, `/admin/reactor-control` for directors).
- `/dashboard/telemetry` — Live telemetry monitor (flux, stability), vector check-in logs, and status updates.
- `/dashboard/clearance` — Personal flight clearance submission desk.
- `/admin/personnel` — Directory-level controls for updating divisions and overriding flight statuses.
- `/admin/reactor-control` — Reactor grid panel, emergency core vent action, and propulsion metrics monitor.
- `/admin/clearance-board` — Director authorization panel for pending flight clearance requests.

---

## Proposed Changes

### [Component Name: QuantumCore Application Core]

We will create the following files inside `C:\Users\Abhirup\.gemini\antigravity\scratch\quantumcore`:

#### [NEW] `schema.sql`
Supabase SQL setup file containing tables, custom functions, triggers, and Row Level Security (RLS) policies.

#### [NEW] `src/lib/supabase.ts` and `src/lib/mockDb.ts`
Database client module that handles reading/writing to either a real Supabase backend (if env variables are set) or falls back to a fully responsive browser local-storage database.

#### [NEW] `src/middleware.ts`
Access-control guard to redirect users based on their active role ('researcher' or 'director') and protect admin routes.

#### [NEW] `src/app/sign-in/page.tsx`
A full-screen terminal sign-in UI with simulated command line, authentication prompts, and instant-login selector shortcuts for the pre-seeded profiles.

#### [NEW] `src/app/dashboard/layout.tsx` and `src/app/dashboard/page.tsx`
Side navigation panel styled with neon border aesthetics and role-based routes. Automatic redirection to core page.

#### [NEW] `src/app/dashboard/telemetry/page.tsx`
Live metric HUD with Recharts graphs showing simulated fluctuations, stability status, and interactive "Register Telemetry Vector Log" buttons.

#### [NEW] `src/app/dashboard/clearance/page.tsx`
Flight clearance requests dashboard and submission form.

#### [NEW] `src/app/admin/layout.tsx` and `src/app/admin/personnel/page.tsx`
Personnel management roster table for lab directors to toggle flight authorization.

#### [NEW] `src/app/admin/reactor-control/page.tsx`
Reactor bays live-grid. Contains aggregate metrics and the "Emergency Vent Core" trigger with dynamic emergency warnings.

#### [NEW] `src/app/admin/clearance-board/page.tsx`
Director override portal for managing incoming research flight requests.

---

## Visual Design Style (Sci-Fi Cyberpunk Terminal)

- **Palette:** Dark Slate `#0b0f19` and Charcoal `#111827`, accented with:
  - Cyber Cyan (`#06b6d4` / `text-cyan-400`)
  - Warning Amber (`#f59e0b` / `text-amber-500`)
  - Emergency Red (`#ef4444` / `text-red-500`)
  - Neon Green (`#22c55e` / `text-green-500`)
- **UI Architecture:** Card containers with thin, glowing borders (`border-cyan-500/20`), backdrop blurs, scanline effects, and crisp monospace text (`font-mono`) mimicking a high-security tactical terminal.
- **Interactions:** Sound-less terminal micro-animations, flashing status rings, and toast banners notifying users of state transitions.

---

## Verification Plan

### Automated Verification
- Verify the TypeScript build compiles with no errors using `npm run build`.

### Manual Verification
- Launch the application locally using `npm run dev`.
- Log in as **Researcher (e.g. Dr. Eleanor Vance)** and submit a flight clearance request. Verify she can view her historical telemetry log and see live flux graphs updating.
- Log in as **Lab Director (Dr. Marcus Vance)**. Verify the reactor console displays the telemetry aggregate, and approve the clearance request.
- Confirm Dr. Vance's status updates from "Grounded" to "Cleared" on both panels.
