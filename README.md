# The Royal Knot — Wedding Planning Management System (WPMS)

The Royal Knot is a unified wedding planning management platform engineered to digitize the operational workflows of high-end destination wedding agencies. Built to replace scattered WhatsApp chats, paper diaries, and manual PDF quote comparisons, The Royal Knot coordinates luxury three-day destination weddings across Jaipur and Udaipur with multi-crore staged budgets. The platform operates on a local PostgreSQL relational database with an offline-first architecture and a luxury Rajasthani-themed interface.

## System Architecture

```text
                          ┌────────────────────────┐
                          │    React (Vite) UI     │
                          │ Tailwind (Royal Theme) │
                          └───────────┬────────────┘
                                      │ HTTP / REST
                                      ▼
                          ┌────────────────────────┐
                          │  Express.js API Layer  │
                          │  Validation & Security │
                          └───────────┬────────────┘
                                      │
                                      ▼
                          ┌────────────────────────┐
                          │ Wedding Engine Service │
                          │ (Atomic Transactions)  │
                          └───────────┬────────────┘
                                      │ Pool
                                      ▼
                          ┌────────────────────────┐
                          │  Local PostgreSQL DB   │
                          │ Foreign Keys & Ledger  │
                          └────────────────────────┘

```

## Core Features

* **Executive Season KPI Dashboard:** Real-time visibility into active season revenue, per-wedding profit and loss margins, vendor cost allocations, and 30-day cash flow receivables.


* **Client Intake CRM & Inquiries:** Capture prospective destination wedding inquiries (dates, guest count 400+, venue preferences, budget sliders) with real-time input validation.


* **Digital Service Agreements:** Generate customized contract terms with an interactive HTML5 mobile signature canvas and official verified status timestamping.


* **3-Caterer Side-by-Side Comparison:** Compare vendor bids line-by-line (price per plate, extra hour charges, total estimated food cost) with 1-click atomic acceptance that auto-closes competing quotes.


* **Instant 28-Task Wedding Plan:** Automated operational task generator across Mehendi, Sangeet, Ceremony, and Reception with interactive Kanban stages.


* **Big Day Minute-by-Minute Schedule:** Live chronological day-of timeline with active radar beacons and status monitoring.


* **Vendor Check-In & Delay Monitoring:** Real-time arrival tracker alerting planners to vendor delays and on-site logistical issues.


* **Post-Wedding Bill Reconciliation:** Financial reconciliation engine adjusting for unexpected additions (e.g., 60 banquet guests, extra DJ hours) against advances to prevent double disbursements.



## Tech Stack

* **Frontend:** React 18, Vite, Tailwind CSS, Lucide React, Framer Motion, Canvas Confetti, Axios


* **Backend:** Node.js, Express.js, `express-validator`, CORS, Helmet


* **Database:** Local PostgreSQL 15+ (relational schema, strict foreign keys, ACID transactions)



## Database Schema (PostgreSQL)

```sql
-- Core Clients & Destination Weddings
CREATE TABLE clients (
    client_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE weddings (
    wedding_id SERIAL PRIMARY KEY,
    client_id INT REFERENCES clients(client_id) ON DELETE CASCADE,
    couple_name VARCHAR(200) NOT NULL,
    city VARCHAR(100) NOT NULL CHECK (city IN ('Jaipur', 'Udaipur', 'Jodhpur')),
    destination_venue VARCHAR(200) NOT NULL,
    package_type VARCHAR(50) NOT NULL CHECK (package_type IN ('Full-Service', 'Partial/Day-of')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    estimated_guests INT NOT NULL CHECK (estimated_guests > 0),
    max_budget NUMERIC(12, 2) NOT NULL CHECK (max_budget > 0),
    actual_cost NUMERIC(12, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'ENQUIRY' CHECK (status IN ('ENQUIRY', 'PROPOSED', 'CONFIRMED', 'IN_PLANNING', 'LIVE', 'COMPLETED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Digital Contracts & Mobile Signing
CREATE TABLE agreements (
    agreement_id SERIAL PRIMARY KEY,
    wedding_id INT REFERENCES weddings(wedding_id) ON DELETE CASCADE,
    contract_terms TEXT NOT NULL,
    signed_by_name VARCHAR(150),
    signature_data TEXT,
    signed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SIGNED', 'REJECTED'))
);

-- Master Vendor Directory & Comparison Matrix
CREATE TABLE vendors (
    vendor_id SERIAL PRIMARY KEY,
    business_name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN ('CATERER', 'DECORATOR', 'DJ_SOUND', 'FLORIST', 'PHOTOGRAPHER', 'MAKEUP', 'TRANSPORT', 'MEHENDI_ARTIST')),
    contact_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(150) NOT NULL,
    rating NUMERIC(3, 2) DEFAULT 5.00 CHECK (rating >= 1.0 AND rating <= 5.0),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE vendor_quotes (
    quote_id SERIAL PRIMARY KEY,
    wedding_id INT REFERENCES weddings(wedding_id) ON DELETE CASCADE,
    vendor_id INT REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    price_per_plate NUMERIC(10, 2) DEFAULT 0.00,
    extra_hour_rate NUMERIC(10, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL,
    proposal_notes TEXT,
    status VARCHAR(50) DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'ACCEPTED', 'REJECTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Operational Plan (28-Task Checklist)
CREATE TABLE wedding_tasks (
    task_id SERIAL PRIMARY KEY,
    wedding_id INT REFERENCES weddings(wedding_id) ON DELETE CASCADE,
    title VARCHAR(250) NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN ('VENUE', 'DESIGN_DECOR', 'VENDORS', 'MEHENDI', 'SANGEET', 'WEDDING_CEREMONY', 'RECEPTION')),
    owner_name VARCHAR(100) NOT NULL,
    stage VARCHAR(50) DEFAULT 'TO_PLAN' CHECK (stage IN ('TO_PLAN', 'IN_PROGRESS', 'DONE')),
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Day-of Timeline & Vendor Check-in
CREATE TABLE day_schedule_events (
    event_id SERIAL PRIMARY KEY,
    wedding_id INT REFERENCES weddings(wedding_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    event_time VARCHAR(20) NOT NULL,
    location VARCHAR(150) NOT NULL,
    responsible_person VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'COMPLETED', 'DELAYED'))
);

CREATE TABLE vendor_checkins (
    checkin_id SERIAL PRIMARY KEY,
    wedding_id INT REFERENCES weddings(wedding_id) ON DELETE CASCADE,
    vendor_id INT REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    scheduled_arrival_time VARCHAR(20) NOT NULL,
    actual_arrival_time VARCHAR(20),
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ARRIVED', 'DELAYED')),
    notes_remarks TEXT
);

-- Milestone Staged Payments & Financial Settlement
CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    wedding_id INT REFERENCES weddings(wedding_id) ON DELETE CASCADE,
    stage_type VARCHAR(50) NOT NULL CHECK (stage_type IN ('BOOKING_DEPOSIT', 'ADVANCE_1MONTH', 'FINAL_BALANCE')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    due_date DATE NOT NULL,
    paid_date DATE,
    status VARCHAR(50) DEFAULT 'DUE' CHECK (status IN ('DUE', 'PAID', 'OVERDUE')),
    payment_method VARCHAR(50)
);

CREATE TABLE extra_expenses (
    expense_id SERIAL PRIMARY KEY,
    wedding_id INT REFERENCES weddings(wedding_id) ON DELETE CASCADE,
    vendor_id INT REFERENCES vendors(vendor_id) ON DELETE SET NULL,
    description VARCHAR(250) NOT NULL,
    extra_units INT DEFAULT 1,
    unit_rate NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    billed_to_client BOOLEAN DEFAULT TRUE
);

```

## Local Setup & Installation

### Prerequisites

* Node.js (v18 or higher)
* PostgreSQL (v14 or higher) running locally on port `5432`


* Git



### 1. Database Setup

```bash
# Create local database
psql -U postgres
CREATE DATABASE royal_knot_db;
\q

# Run migrations and seed data
cd backend
psql -U postgres -d royal_knot_db -f src/db/schema.sql
psql -U postgres -d royal_knot_db -f src/db/seed.sql

```

### 2. Backend Configuration

```bash
cd backend
npm install

```

Create a `.env` file in `/backend`:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/royal_knot_db
CLIENT_URL=http://localhost:5173

```

Start the backend server:

```bash
npm run dev
# Server runs on http://localhost:5000

```

### 3. Frontend Configuration

```bash
cd ../frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173

```

## API Reference

### Client Intake & Service Agreements

* `POST /api/enquiries` — Register a new couple enquiry with contact validation.


* `GET /api/enquiries` — Retrieve all enquiries with optional status filtering.


* `PUT /api/enquiries/:weddingId/consultation` — Schedule client consultation date and notes.


* `POST /api/agreements/generate/:weddingId` — Auto-generate service agreement terms based on package scope.


* `POST /api/agreements/:agreementId/sign` — Bind digital signature canvas data and confirm booking.



### Vendor Management & Quote Matrix

* `GET /api/vendors` — Directory of active vendors filtered by category.


* `POST /api/quotes` — Submit detailed vendor proposal with plate and overtime pricing.
  Monetary fields (`price_per_plate`, `extra_hour_rate`, and `total_amount`) must be JSON strings containing positive decimal values with at most two decimal places. The maximums are `99999999.99` for the first two fields and `9999999999.99` for `total_amount`; for example, use `"2200.00"` rather than `2200`.


* `GET /api/quotes/compare/:weddingId` — Fetch side-by-side comparison matrix for quotes.


* `POST /api/quotes/:quoteId/accept` — Atomically award quote and auto-close competing category bids.



### Tasks & Day-of Schedule

* `POST /api/weddings/:weddingId/generate-tasks` — Instantiate 28-task checklist plan.


* `GET /api/weddings/:weddingId/tasks` — List wedding tasks with stage filtering.


* `PUT /api/tasks/:taskId/stage` — Update task stage (`TO_PLAN`, `IN_PROGRESS`, `DONE`).


* `POST /api/weddings/:weddingId/schedule` — Create a schedule event with a strict 24-hour `HH:MM` `event_time`.


* `GET /api/weddings/:weddingId/schedule` — Retrieve the wedding schedule in `event_time` order; optionally filter by `status` (`PENDING`, `ACTIVE`, `COMPLETED`, `DELAYED`).


* `PUT /api/weddings/:weddingId/schedule/:eventId` — Partially update an event's title, time, location, responsible person, or status.


* `POST /api/weddings/:weddingId/vendor-checkins` — Create a vendor check-in with its scheduled arrival time.


* `GET /api/weddings/:weddingId/vendor-checkins` — Retrieve wedding vendor check-ins; optionally filter by status (`PENDING`, `ARRIVED`, `DELAYED`).


* `POST /api/weddings/:weddingId/vendor-checkins/:checkinId` — Record the actual arrival time (`HH:MM`), caller-supplied status, and optionally update notes.



### Billing, Payments & Season Analytics

* `POST /api/payments/create-plan/:weddingId` — Auto-generate 3-stage milestone payment schedule.


* `POST /api/payments/:paymentId/record-payment` — Mark client payment milestone as paid.


* `POST /api/expenses/extra/:weddingId` — Record post-wedding additions (extra plates, overtime).


* `GET /api/weddings/:weddingId/billing-reconciliation` — Calculate net client balance and vendor payouts.


* `GET /api/analytics/season-summary` — Aggregate seasonal revenue, costs, net profit, and cash flow.



## Robust Error Handling & Input Validation

The system implements defensive validation across both layers:

| **Error Case** | **System Response** | **HTTP Status** |
| --- | --- | --- |
| Invalid Email Format | `"Please provide a valid client contact email address"`

 | `400 Bad Request`

 |
| Invalid Phone Format | `"Phone number must contain exactly 10 digits"`

 | `400 Bad Request`

 |
| Sub-Minimum Budget | `"Destination wedding budget must be at least ₹25,00,000"`

 | `400 Bad Request`

 |
| Accepting Closed Quote | `"Validation halted: Cannot award a quote that has been rejected or auto-closed"`

 | `400 Bad Request`

 |
| Duplicate Plan Generation | `"Tasks have already been initialized for this wedding record"`

 | `409 Conflict` |
| Negative Reconciled Units | `"Extra units and rates must be positive numeric values"`

 | `400 Bad Request`

 |

## Git Workflow & Team Responsibilities

Work is organized across isolated functional branches with periodic hourly merges into `main`:

* **Database Architect & Backend Core Lead:** Database schema design, relational DDL execution, 25-wedding seed data, centralized validation middleware, Client CRM APIs, digital agreement generation, and milestone payment scheduling.


* **Backend Operations Engineer:** Atomic vendor quote comparison and auto-close transaction engine, 28-task plan generator, day-of live schedule APIs, vendor arrival check-in tracker, and post-wedding expense reconciliation.


* **Frontend UI/UX Architect:** Luxury Royal Knot design system (Maroon/Gold theme), responsive navigation shell, centralized toast notifications, client inquiry intake, HTML5 signature canvas, and 3-caterer comparison matrix.


* **Frontend Operations & Workflows Developer:** 28-task interactive Kanban board, minute-by-minute schedule timeline with active radar beacons, vendor check-in board with delay alerts, post-wedding bill reconciler, and founder's season review dashboard.



### Hourly Commit Rhythm

```bash
git checkout feature/<assigned-branch>
# Make modular updates
git add .
git commit -m "feat(<scope>): explicit description of completed task"
git push origin feature/<assigned-branch>

```

Would you like the complete SQL statements for `backend/src/db/seed.sql` to populate the 25 destination weddings and 18 vendor profiles?
