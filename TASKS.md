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

- [ ] Browser-only, single URL; role decides what you see (`/waiter`, `/kitchen`, `/bar`, `/admin`)
- [ ] Works without internet: no external CDNs (fonts, scripts); all assets bundled locally
- [ ] Reversible actions: cancel orders, undo “done”, restore sold-out items, edit last order
- [ ] Fast, simple UI: big tap targets, standard form controls, minimal steps
- [ ] Clear status everywhere: “sent / in progress / done / canceled”

## Phase 1 — Skeleton (click-through demo)

**Deliverable:** Open all four pages in separate tabs; each looks distinct and shows role clearly; demo data only.

- [ ] Scaffold web app (Vite + React + TypeScript + TanStack Router)
- [ ] Scaffold server app (Node + TypeScript) to serve API + WebSockets (and the built web app in production)
- [ ] Add basic layout + navigation (dev-friendly; role screens remain distinct)
- [ ] Create routes:
  - [ ] `/waiter`
  - [ ] `/kitchen`
  - [ ] `/bar`
  - [ ] `/admin`
- [ ] Add hardcoded demo data (tables, menu, orders) and render read-only views
- [ ] Add a simple “role badge” header component used across pages

## Phase 2 — Data Model & Storage (real data, persists)

**Deliverable:** Admin creates tables + menu items; waiter creates real orders; refresh persists.

### Schema + migrations

- [ ] Create SQLite database setup (file path configurable via env)
- [ ] Define schema (minimum viable):
  - [ ] `users` (name, role, pinHash or pinCode for MVP)
  - [ ] `tables` (name/number, active)
  - [ ] `stations` (kitchen, bar, grill, coffee, etc.)
  - [ ] `menu_categories` (name, sortOrder)
  - [ ] `menu_items` (name, priceCents, stationId, categoryId, soldOut)
  - [ ] `orders` (tableId, createdByUserId, status, createdAt, updatedAt)
  - [ ] `order_lines` (orderId, menuItemId, qty, note, stationId, status, createdAt, updatedAt)
- [ ] Add seed script for demo data that can be reset between events

### API (server endpoints)

- [ ] Implement CRUD for admin:
  - [ ] Create/edit/disable tables
  - [ ] Create/edit menu categories + items
  - [ ] Create/edit stations
  - [ ] Toggle sold-out on menu items
- [ ] Implement waiter order creation:
  - [ ] Create order for table with multiple lines + optional line notes
  - [ ] Validation (qty ≥ 1, menu item exists, not sold-out)
- [ ] Implement order lifecycle:
  - [ ] Cancel order (with reason)
  - [ ] Edit last order (constraints: only newest open order per table or per waiter)

### Basic read views (wired to DB)

- [ ] `/waiter`: list tables, menu, “my open orders”
- [ ] `/kitchen` + `/bar`: list open order lines filtered by station
- [ ] `/admin`: editors for tables/menu/stations + simple dashboard counters

## Phase 3 — Realtime Updates (no refresh)

**Deliverable:** Waiter creates order; kitchen/bar see instantly; status changes reflect instantly to waiter.

- [ ] Add realtime server (WebSocket endpoint) and client connection per page
- [ ] Define event types (minimum):
  - [ ] `order.created`
  - [ ] `order.updated` (status / lines changed)
  - [ ] `orderLine.updated` (station status changes)
  - [ ] `menuItem.updated` (sold-out changes)
  - [ ] `table.updated`
- [ ] Broadcast events on writes (create/edit/cancel/mark-done/sold-out)
- [ ] Client state strategy:
  - [ ] Initial load from DB
  - [ ] Apply incremental events
  - [ ] Reconnect + resync on disconnect
- [ ] Show connection status unobtrusively (e.g., “Live / Reconnecting…”)

## Phase 4 — Waiter UX (fast one-hand flow)

**Deliverable:** A waiter can take and send an order in under ~10 seconds.

- [ ] Table picker optimized for speed:
  - [ ] Big grid/list, favorites/recent tables
  - [ ] Current table always visible in header
- [ ] Menu UX:
  - [ ] Categories with large buttons
  - [ ] Search by name
  - [ ] Sold-out items hidden/disabled clearly
- [ ] Cart + send flow:
  - [ ] Review screen with editable qty + notes
  - [ ] “Send order” confirmation (prevents accidental sends)
  - [ ] Clear success state + haptic-like feedback (visual)
- [ ] “My open orders”:
  - [ ] Filter to waiter’s orders by default
  - [ ] Show per-station status (kitchen/bar progress)
  - [ ] Estimated waiting time (simple heuristic acceptable for v1)
- [ ] Error handling:
  - [ ] Offline/reconnect messaging
  - [ ] Prevent double-submits

## Phase 5 — Kitchen / Bar UX (production view)

**Deliverable:** Staff understands what to do in <30 seconds; can mark items done reliably.

- [ ] Station views:
  - [ ] `/kitchen` shows only relevant items (food stations)
  - [ ] `/bar` shows only drinks station(s)
- [ ] Order cards:
  - [ ] Sort by oldest / waiting time
  - [ ] Highlight priority (oldest, large orders, etc.)
  - [ ] Clear table number + time since sent
- [ ] Actions:
  - [ ] Mark line “in progress” (optional) and “done”
  - [ ] Undo “done”
  - [ ] Cancel line / report issue back to waiter (optional v1)
- [ ] Optional “group by product” mode (prep batching)
- [ ] Dark mode for kitchen/bar screens

## Phase 6 — Admin Panel (setup + control)

**Deliverable:** Organizer can set up menu/tables/stations in ~10 minutes; can see busyness.

- [ ] Auth gate for `/admin` (PIN login) and user management (create waiter users)
- [ ] Setup pages:
  - [ ] Stations editor (kitchen/bar/grill/coffee)
  - [ ] Tables editor (bulk create, rename, disable)
  - [ ] Menu editor (categories, items, prices, station assignment)
- [ ] Live control:
  - [ ] Sold-out toggles (instant update to waiter menu)
  - [ ] Simple dashboard: open orders per station + oldest age
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

- [ ] PIN login UX for all roles (fast switch user)
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
