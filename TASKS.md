# FestFlow — Execution Tasks

This checklist is derived from `PRD.md` and `ROADMAP.md`. It is written for “build in phases, always demo-able”.

## Decisions (locked)

Chosen stack (lock these before coding Phase 1+):

- [x] Routing: TanStack Router
- [x] Web app: React + Vite (served by the Node server in production)
- [x] Repo structure: single repo with workspaces (`apps/web`, `apps/server`)
- [x] Package manager: pnpm workspaces
- [x] Server framework: Express (single URL; serves SPA + API) + `ws` for realtime
- [x] Language/build: TypeScript everywhere; server built with `tsup`, dev with `tsx`
- [x] Data layer: Prisma + SQLite
- [x] Realtime transport: WebSockets via custom Node server (`ws`)
- [x] UI approach: Tailwind + simple components (no heavy UI kit; no CDN assets)
- [x] Auth: short PIN login per user/role

## Global Non‑Negotiables (apply to every phase)

- [x] Browser-only, single URL; role decides what you see (`/waiter`, `/kitchen`, `/bar`, `/admin`)
- [x] Works without internet: no external CDNs (fonts, scripts); all assets bundled locally
- [ ] Reversible actions: cancel orders, undo “done”, restore sold-out items, edit last order
- [x] Fast, simple UI: big tap targets, standard form controls, minimal steps
- [x] Clear status everywhere: “sent / in progress / done / canceled”

## Phase 1 — Skeleton (click-through demo)

**Deliverable:** Open all four pages in separate tabs; each looks distinct and shows role clearly; demo data only.

- [x] Scaffold web app (Vite + React + TypeScript + TanStack Router)
- [x] Scaffold server app (Node + TypeScript) to serve API + WebSockets (and the built web app in production)
- [x] Add basic layout + navigation (dev-friendly; role screens remain distinct)
- [ ] Create routes:
  - [x] `/waiter`
  - [x] `/kitchen`
  - [x] `/bar`
  - [x] `/admin`
- [x] Add hardcoded demo data (tables, menu, orders) and render read-only views
- [x] Add a simple “role badge” header component used across pages

## Phase 2 — Data Model & Storage (real data, persists)

**Deliverable:** Admin creates tables + menu items; waiter creates real orders; refresh persists.

### Schema + migrations

- [x] Create SQLite database setup (file path configurable via env)
- [ ] Define schema (minimum viable):
  - [x] `users` (name, role, pinHash or pinCode for MVP)
  - [x] `tables` (name/number, active)
  - [x] `stations` (kitchen, bar, grill, coffee, etc.)
  - [x] `menu_categories` (name, sortOrder)
  - [x] `menu_items` (name, priceCents, stationId, categoryId, soldOut)
  - [x] `orders` (tableId, createdByUserId, status, createdAt, updatedAt)
  - [x] `order_lines` (orderId, menuItemId, qty, note, stationId, status, createdAt, updatedAt)
- [x] Add seed script for demo data that can be reset between events

### API (server endpoints)

- [x] Implement CRUD for admin:
  - [x] Create/edit/disable tables
  - [x] Create/edit menu categories + items
  - [x] Create/edit stations
  - [x] Toggle sold-out on menu items
- [x] Implement waiter order creation:
  - [x] Create order for table with multiple lines + optional line notes
  - [x] Validation (qty ≥ 1, menu item exists, not sold-out)
- [ ] Implement order lifecycle:
  - [x] Cancel order (with reason)
  - [ ] Edit last order (constraints: only newest open order per table or per waiter)

### Basic read views (wired to DB)

- [x] `/waiter`: list tables, menu, “my open orders”
- [x] `/kitchen` + `/bar`: list open order lines filtered by station
- [x] `/admin`: editors for tables/menu/stations + simple dashboard counters

## Phase 3 — Realtime Updates (no refresh)

**Deliverable:** Waiter creates order; kitchen/bar see instantly; status changes reflect instantly to waiter.

- [x] Add realtime server (WebSocket endpoint) and client connection per page
- [ ] Define event types (minimum):
  - [ ] `order.created`
  - [ ] `order.updated` (status / lines changed)
  - [ ] `orderLine.updated` (station status changes)
  - [ ] `menuItem.updated` (sold-out changes)
  - [ ] `table.updated`
- [x] Broadcast events on writes (create/edit/cancel/mark-done/sold-out) [coarse `db.change`]
- [x] Client state strategy:
  - [x] Initial load from DB
  - [x] Apply incremental events [refetch on change]
  - [x] Reconnect + resync on disconnect
- [x] Show connection status unobtrusively (e.g., “Live / Reconnecting…”)

## Phase 4 — Waiter UX (fast one-hand flow)

**Deliverable:** A waiter can take and send an order in under ~10 seconds.

- [x] Table picker optimized for speed:
  - [x] Big grid/list, favorites/recent tables
  - [ ] Current table always visible in header
- [ ] Menu UX:
  - [x] Categories with large buttons
  - [ ] Search by name
  - [x] Sold-out items hidden/disabled clearly
- [x] Cart + send flow:
  - [x] Review screen with editable qty + notes
  - [x] “Send order” confirmation (prevents accidental sends)
  - [ ] Clear success state + haptic-like feedback (visual)
- [x] “My open orders”:
  - [x] Filter to waiter’s orders by default
  - [x] Show per-station status (kitchen/bar progress)
  - [x] Estimated waiting time (simple heuristic acceptable for v1)
- [ ] Error handling:
  - [ ] Offline/reconnect messaging
  - [ ] Prevent double-submits

## Phase 5 — Kitchen / Bar UX (production view)

**Deliverable:** Staff understands what to do in <30 seconds; can mark items done reliably.

- [x] Station views:
  - [x] `/kitchen` shows only relevant items (food stations)
  - [x] `/bar` shows only drinks station(s)
- [x] Order cards:
  - [x] Sort by oldest / waiting time
  - [ ] Highlight priority (oldest, large orders, etc.)
  - [x] Clear table number + time since sent
- [x] Actions:
  - [x] Mark line “in progress” (optional) and “done”
  - [x] Undo “done”
  - [ ] Cancel line / report issue back to waiter (optional v1)
- [ ] Optional “group by product” mode (prep batching)
- [ ] Dark mode for kitchen/bar screens

## Phase 6 — Admin Panel (setup + control)

**Deliverable:** Organizer can set up menu/tables/stations in ~10 minutes; can see busyness.

- [x] Auth gate for `/admin` (PIN login)
- [x] User management (create waiter users)
- [x] Setup pages:
  - [x] Stations editor (kitchen/bar/grill/coffee)
  - [ ] Tables editor (bulk create, rename)
  - [x] Tables enable/disable
  - [x] Menu editor (categories, items, prices, station assignment)
- [x] Live control:
  - [x] Sold-out toggles (instant update to waiter menu)
  - [x] Simple dashboard: open orders per station + oldest age
- [ ] Event operations:
  - [ ] “Reset for event” (archive/close open orders, optional reseed)
  - [ ] Data backup/export (at least copy SQLite file, plus CSV in Phase 9)

## Phase 7 — Printing (tickets + receipts)

**Deliverable:** Clean tickets print per station when items are finished (or when order is sent, if chosen).

- [ ] Decide print trigger per station:
  - [ ] On “order sent” vs “line done” (PRD suggests “when finished”)
- [ ] Print templates:
  - [ ] Station ticket (table, time, items, notes, waiter)
  - [ ] Direct sale receipt (optional v1)
- [ ] Print queue:
  - [ ] Retry on failure
  - [ ] Idempotency (don’t print duplicates on reconnect)
  - [ ] Per-station printer configuration

## Phase 8 — Stock Control (sold out + limits)

**Deliverable:** No one can order something that is gone.

- [ ] Add optional stock fields to menu items (limit, remaining)
- [ ] Decrement stock on send (or on done; decide)
- [ ] Prevent ordering beyond remaining; show “sold out” immediately
- [ ] Admin quick-adjust stock + sold-out toggle

## Phase 9 — Reporting (exports)

**Deliverable:** Excel-friendly download with totals and breakdowns.

- [ ] Create report queries:
  - [ ] Total revenue
  - [ ] Revenue per product
  - [ ] Revenue per waiter
  - [ ] Best-selling items
  - [ ] Busy hours (orders/time bucket)
- [ ] Implement CSV export download (and optional “event summary” screen)
- [ ] Ensure canceled items/orders excluded (or clearly labeled)

## Phase 10 — Polishing (trust + stability)

- [x] PIN login UX for all roles (fast switch user)
- [ ] Auto-reconnect + resync behavior hardened (including backoff)
- [ ] Kiosk mode for TVs/tablets (full-screen styling, minimal UI chrome)
- [ ] Accessibility basics: high contrast, large targets, no tiny text
- [ ] Operational hardening:
  - [ ] Simple health page (`/health`)
  - [ ] Minimal logging for debugging without internet
  - [ ] “Export diagnostics” (optional)

## Acceptance Criteria (end-to-end)

- [ ] A waiter can: pick table → pick items → add notes → send → see open orders and statuses
- [ ] Kitchen/bar can: see only relevant items → sort by waiting time → mark done → undo done
- [ ] Admin can: manage menu/tables/stations → toggle sold-out → see busyness → export reports
- [ ] System works on a local WiFi with no internet; all role screens update live
