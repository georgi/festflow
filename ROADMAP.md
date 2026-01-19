Phase 0 – Principles
	•	Browser only. No app installs.
	•	One URL for everything.
	•	Roles define what you see: waiter, kitchen, bar, admin.
	•	Simple UI, no custom controls, only proven web patterns.
	•	Everything must work offline inside the local network.
	•	Every action must be reversible.

Next.js is ideal because:
	•	It gives routing, API, rendering, and bundling in one place.
	•	Agents are extremely strong at CRUD apps, dashboards, tables, and realtime updates.
	•	It stays boring and predictable.

⸻

Phase 1 – Skeleton

Goal: something people can open and click through.
	•	Next.js app
	•	Pages:
	•	/waiter
	•	/kitchen
	•	/bar
	•	/admin
	•	Hardcoded demo data:
	•	Fake tables
	•	Fake menu
	•	Fake orders

Deliverable:
	•	You can open all four pages in different browser tabs.
	•	They look different and show their role clearly.

⸻

Phase 2 – Data Model & Storage

Goal: real data, no fake objects.

Add:
	•	Database (SQLite first, simple, local, robust)
	•	Tables:
	•	Users
	•	Tables
	•	Menu items
	•	Orders
	•	Order lines

Agents excel here:
	•	Schema creation
	•	CRUD endpoints
	•	Validation
	•	Migrations

Deliverable:
	•	Admin can create:
	•	Tables
	•	Menu items
	•	Waiter can create real orders.
	•	Orders persist after refresh.

⸻

Phase 3 – Realtime Updates

Goal: remove refresh, everything feels live.

Add:
	•	Live updates between screens:
	•	Order appears instantly in kitchen
	•	Status change appears instantly to waiter

Agents are very strong at:
	•	WebSockets
	•	Event broadcasting
	•	UI state syncing

Deliverable:
	•	Three browsers open:
	•	One waiter
	•	One kitchen
	•	One bar
Actions appear instantly in all.

⸻

Phase 4 – Waiter UX

Goal: fast, one-hand usage.

Implement:
	•	Big buttons
	•	Categories
	•	Search
	•	Table picker
	•	“Send order” confirmation
	•	“My open orders” list
	•	Cancel / edit last order

Agents excel at:
	•	Form flows
	•	Mobile layouts
	•	Error handling

Deliverable:
	•	A waiter can take orders in under 10 seconds.

⸻

Phase 5 – Kitchen / Bar UX

Goal: zero thinking, pure production view.

Implement:
	•	Big order cards
	•	Sort by waiting time
	•	Highlight priority orders
	•	“Mark done” button
	•	Optional group by product

Deliverable:
	•	Kitchen staff understands everything in under 30 seconds.

⸻

Phase 6 – Admin Panel

Goal: full control without complexity.

Implement:
	•	Menu editor
	•	Table editor
	•	Station setup
	•	Sold-out toggle
	•	Simple dashboard:
	•	Open orders count
	•	Busy stations

Deliverable:
	•	Organizer can prepare the whole event in 10 minutes.

⸻

Phase 7 – Printing

Goal: paper only where it adds value.

Implement:
	•	Print when order is finished
	•	Print per station
	•	Print direct sales receipts

Agents excel at:
	•	Print queues
	•	Template rendering
	•	Error retries

Deliverable:
	•	Kitchen and bar get clean, readable tickets.

⸻

Phase 8 – Stock Control

Goal: avoid chaos.

Implement:
	•	Quantity limits
	•	Sold-out switch
	•	Items disappear from waiter UI

Deliverable:
	•	No one can order something that is gone.

⸻

Phase 9 – Reporting

Goal: everything measurable.

Implement:
	•	Simple export:
	•	Orders
	•	Revenue
	•	Products
	•	Waiters
	•	Download as Excel-friendly file

Agents excel at:
	•	Aggregations
	•	CSV generation
	•	Tables

⸻

Phase 10 – Polishing

Goal: trust and stability.

Add:
	•	Login with short PIN
	•	Auto-reconnect if WiFi drops
	•	Large buttons everywhere
	•	Dark mode for kitchen
	•	Kiosk mode for TVs

⸻

How coding agents shine here

This project is perfect for agents because it is:
	•	CRUD heavy
	•	UI driven
	•	State driven
	•	Predictable workflows
	•	No complex math
	•	No exotic libraries
	•	No performance tricks

Agents will be strongest at:
	•	Building admin dashboards
	•	Writing API routes
	•	Wiring realtime updates
	•	Designing mobile-friendly layouts
	•	Handling edge cases and validation
	•	Generating clean database schemas

This is exactly the type of system where:

“10 small agents building boring parts beats one human writing everything.”

FestFlow becomes:
A highly structured, boring, dependable web system
Which is exactly what event operations need.
