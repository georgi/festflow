FestFlow PRD – Minimal, Clear, Closed System

FestFlow is a local web system that runs an event.
One box. One WiFi. One website.

No internet.
No app.
No accounts outside the event.
No complexity.

Everyone connects and sees exactly one thing: what they need to do.

⸻

Core principle

FestFlow only does three things:
	1.	Take orders
	2.	Prepare orders
	3.	Close orders

Everything else is a consequence.

⸻

Roles

There are only four roles:

Waiter    → creates orders
Kitchen   → prepares food
Bar       → prepares drinks
Cashier   → takes money
Organizer → sets everything up

A user can have more than one role, but the roles stay conceptually separate.

⸻

Two event modes

The organizer chooses one mode at setup.

Mode A: KASSIEREN → BESTELLUNG
Mode B: BESTELLUNG → KASSIEREN

Nothing else.

⸻

Mode A
Kassieren → Bestellung
(Food stands, Vereinsfeste, self-service)

Flow:
	1.	Cashier enters the order
	2.	Cashier takes payment
	3.	Only after payment the order is created
	4.	Order goes to kitchen/bar

Rules:
	•	No unpaid orders exist
	•	No tables
	•	No open bills
	•	Kitchen only sees paid orders

State:

paid → preparing → done


⸻

Mode B
Bestellung → Kassieren
(Restaurant model)

Flow:
	1.	Waiter creates order at table
	2.	Kitchen/Bar prepares
	3.	Cashier closes the table and takes payment

State:

open → preparing → done → paid → closed

That is all.

No hidden states.

⸻

Waiter

Can:
	•	Select table
	•	Add food and drinks
	•	Add notes
	•	Send order
	•	See order status
	•	See waiting time

Cannot:
	•	See prices
	•	See money
	•	Take payment (unless also cashier)

⸻

Kitchen

Can:
	•	See food orders
	•	Sort by waiting time
	•	Group by product
	•	Mark done

Cannot:
	•	See prices
	•	See tables
	•	See payments

⸻

Bar

Same as kitchen, only drinks.

⸻

Cashier

Can:
	•	See open tables or open orders
	•	See prices
	•	Take payment
	•	Close order or table

That’s it.
No accounting UI.
No finance dashboards.

⸻

Waiter can also cashier

Simple rule:

If a user has both roles:

[waiter, cashier]

then the UI shows a button:

Switch to cashier

The person does both jobs, but the system still knows:
	•	When they acted as waiter
	•	When they acted as cashier

No mixing.
Just switching.

⸻

Organizer

Can:
	•	Choose event mode
	•	Create roles
	•	Set menu and prices
	•	Set tables (only in restaurant mode)
	•	Download Excel after the event

Excel contains:
	•	Total revenue
	•	Revenue per product
	•	Revenue per waiter
	•	Best sellers
	•	Busy hours

Nothing more.

⸻

Live rules
	•	Orders appear instantly
	•	Status updates propagate instantly
	•	Sold-out items disappear instantly
	•	Cancelled items disappear instantly

⸻

What FestFlow is not
	•	Not a POS replacement
	•	Not a restaurant ERP
	•	Not a finance system
	•	Not an accounting tool

It is a coordination system.

⸻

Mental model

Turn it on.
Open WiFi.
People connect.
Orders flow.
Food flows.
Money flows.

FestFlow just keeps everything aligned.
