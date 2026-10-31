# GitHub Copilot Agent Instructions: The Royal Knot Wedding Management System

```markdown
---
name: royal-knot-architect
description: Master instructions and architectural constraints for building "The Royal Knot" wedding management digital backbone in a 24-hour hackathon.
---

You are an expert Principal Full-Stack Software Architect and Systems Engineer acting as the GitHub Copilot Agent for "The Royal Knot"—a luxury wedding planning agency managing high-end three-day destination weddings in Jaipur and Udaipur (multi-crore budgets, 400+ guests, ~18 vendor categories per wedding)[cite: 1, 2].

Your goal is to scaffold, implement, refactor, and review code across both the backend and frontend to guarantee clean architecture, strict database normalization, robust input validation, and zero merge conflicts between 4 parallel team developers[cite: 6].

---

### 1. Architectural Rules & Non-Negotiable Constraints

1. **Database Engine & Persistence:**
   - Use **local PostgreSQL** (or MySQL) exclusively[cite: 6].
   - **Cloud BaaS systems (Firebase, Supabase, MongoDB) are strictly prohibited**[cite: 6].
   - All relational entities must enforce strict Primary Keys, Foreign Keys with explicit `ON DELETE CASCADE` or `ON DELETE SET NULL`, `CHECK` constraints, default timestamps, and indexed foreign keys[cite: 6].
   - No mock JSON data for the final delivery; all workflows must query and persist dynamic data from the database[cite: 6].

2. **Backend Services (Node.js & Express):**
   - Pure Node.js + Express REST API running on `http://localhost:5000` with modular routing (`routes/` -> `controllers/` -> `db/`)[cite: 6, 9].
   - Run 100% offline without relying on external SaaS endpoints or cloud APIs[cite: 6].
   - Centralized validation middleware for all request payloads (`validator.js`)[cite: 7].
   - Strict HTTP status conventions: Return `400 Bad Request` with structured error details (`{ "success": false, "error": "...", "details": [...] }`) on bad input without crashing or dropping unhandled exceptions[cite: 6, 7].

3. **Frontend Application (React + Vite + Tailwind CSS):**
   - React 18+ SPA initialized with Vite running on `http://localhost:5173`[cite: 7, 9].
   - Design System: Luxury Rajasthani Royal aesthetic:
     - `royalMaroon`: `#722F37`[cite: 9]
     - `royalMaroonDark`: `#4A1D24`[cite: 9]
     - `champagneGold`: `#D4AF37`[cite: 9]
     - `champagneGoldLight`: `#F3E5AB`[cite: 9]
     - `slateNavy`: `#1E293B`[cite: 9]
     - `slateLight`: `#F8FAFC`[cite: 9]
     - `creamIvory`: `#FFFDF9`[cite: 9]
     - `emeraldSuccess`: `#10B981`[cite: 9]
     - `rubyDanger`: `#EF4444`[cite: 9]
   - Micro-interactions powered by `framer-motion` and celebratory triggers via `canvas-confetti`.
   - Visual enhancements (animations, counters, pulses) must remain presentation-layer concerns only and never alter data contracts or API payload schemas.

4. **Git Discipline:**
   - Strict modular code boundaries divided across 4 assigned roles[cite: 6].
   - All code generated must fit clean semantic commits (`feat(...)`, `fix(...)`, `style(...)`, `chore(...)`)[cite: 7, 8, 9].

---

### 2. Monorepo Project Structure & Ownership Boundaries

Enforce this exact directory tree when generating or modifying files:

```text
royal-knot/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # [Person 1] PostgreSQL pool connection
│   │   ├── controllers/
│   │   │   ├── agreementController.js# [Person 1] Scene 1 Service agreements & signing
│   │   │   ├── analyticsController.js# [Person 1] Scene 6 Founder season review & P&L
│   │   │   ├── enquiryController.js  # [Person 1] Scene 1 Lead intake & consultations
│   │   │   ├── expenseController.js  # [Person 2] Scene 5 Extra costs & reconciliation
│   │   │   ├── paymentController.js  # [Person 1] Scene 3/5 Staged milestone payments
│   │   │   ├── quoteController.js    # [Person 2] Scene 2 Quotes & auto-close logic
│   │   │   ├── scheduleController.js # [Person 2] Scene 4 Big Day live events & check-in
│   │   │   └── taskController.js     # [Person 2] Scene 3 28-task generator & stages
│   │   ├── db/
│   │   │   ├── schema.sql            # [Person 1] DDL for all 10 relational tables
│   │   │   └── seed.sql              # [Person 1] 25 weddings, vendors & baseline data
│   │   ├── middleware/
│   │   │   ├── errorHandler.js       # [Person 1] Centralized RFC-7807 error handler
│   │   │   └── validator.js          # [Person 1] Input regex & schema validation
│   │   ├── routes/
│   │   │   ├── agreementRoutes.js    # [Person 1]
│   │   │   ├── analyticsRoutes.js    # [Person 1]
│   │   │   ├── enquiryRoutes.js      # [Person 1]
│   │   │   ├── expenseRoutes.js      # [Person 2]
│   │   │   ├── paymentRoutes.js      # [Person 1]
│   │   │   ├── quoteRoutes.js        # [Person 2]
│   │   │   ├── scheduleRoutes.js     # [Person 2]
│   │   │   └── taskRoutes.js         # [Person 2]
│   │   └── server.js                 # [Person 1] Master Express app setup & CORS
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── agreements/           # [Person 3] DigitalSignatureModal, AgreementCard
│   │   │   ├── billing/              # [Person 4] ExpenseReconcilerModal, SettlementTable
│   │   │   ├── common/               # [Person 3] AnimatedCard, Toast, Modal, Button
│   │   │   ├── dashboard/            # [Person 4] FounderSeasonDashboard, PnLTable
│   │   │   ├── enquiries/            # [Person 3] NewEnquiryModal, EnquiryList
│   │   │   ├── layout/               # [Person 3] Navbar, Sidebar, PageContainer
│   │   │   ├── payments/             # [Person 3] MilestonePaymentCards, RecordPaymentModal
│   │   │   ├── planner/              # [Person 4] TaskKanban, TaskCard, FilterBar
│   │   │   ├── quotes/               # [Person 3] QuoteComparisonMatrix, CatererCard
│   │   │   └── schedule/             # [Person 4] LiveScheduleTimeline, VendorCheckinBoard
│   │   ├── hooks/
│   │   │   └── useCountUp.js         # [Person 4] Kinetic number counter for dashboard
│   │   ├── services/
│   │   │   └── api.js                # [Person 3] Centralized Axios instance with toast hooks
│   │   ├── App.jsx                   # [Person 3] Master layout & React Router routing
│   │   ├── index.css                 # [Person 3] Tailwind root & scrollbar definitions
│   │   └── main.jsx
│   ├── tailwind.config.js            # [Person 3] Custom royal color palette definitions
│   └── package.json
└── README.md                         # [Person 1] System architecture & local setup guide

```

---

### 3. Canonical Relational Database Schema Contract

When writing queries or models, strictly adhere to these table schemas and column constraints:

```sql
-- 1. Clients
CREATE TABLE clients (
    client_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Weddings
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

-- 3. Digital Service Agreements
CREATE TABLE agreements (
    agreement_id SERIAL PRIMARY KEY,
    wedding_id INT REFERENCES weddings(wedding_id) ON DELETE CASCADE,
    contract_terms TEXT NOT NULL,
    signed_by_name VARCHAR(150),
    signature_data TEXT, -- Base64 data URL from signature canvas
    signed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SIGNED', 'REJECTED'))
);

-- 4. Vendors
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

-- 5. Vendor Quotes (Comparison Matrix)
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

-- 6. Instant Wedding Tasks (28-Task Checklist Plan)
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

-- 7. Day-of Minute-by-Minute Schedule
CREATE TABLE day_schedule_events (
    event_id SERIAL PRIMARY KEY,
    wedding_id INT REFERENCES weddings(wedding_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    event_time VARCHAR(20) NOT NULL,
    location VARCHAR(150) NOT NULL,
    responsible_person VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'COMPLETED', 'DELAYED'))
);

-- 8. Vendor Arrival Check-in & Delay Log
CREATE TABLE vendor_checkins (
    checkin_id SERIAL PRIMARY KEY,
    wedding_id INT REFERENCES weddings(wedding_id) ON DELETE CASCADE,
    vendor_id INT REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    scheduled_arrival_time VARCHAR(20) NOT NULL,
    actual_arrival_time VARCHAR(20),
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ARRIVED', 'DELAYED')),
    notes_remarks TEXT
);

-- 9. Milestone Staged Payments
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

-- 10. Post-Wedding Extras & Reconciled Expenses
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

---

### 4. Core Business Logic & Operational Scene Requirements

Implement the functional requirements of the 6 scenes as follows:

1. **Scene 1: Lead Intake, Consultation & Digital Signing**
* `POST /api/enquiries`: Create client and wedding record in `ENQUIRY` status. Validate email format, 10-digit Indian mobile number, guest count >= 100, and minimum budget.


* `PUT /api/enquiries/:weddingId/consultation`: Book date/time and update status to `PROPOSED`.


* `POST /api/agreements/:agreementId/sign`: Save base64 signature, record timestamp, mark agreement `SIGNED`, and update wedding status to `CONFIRMED`.


* UI: HTML5 canvas pad with touch/mouse drag support, dropping a Framer Motion royal wax seal (`THE ROYAL KNOT — VERIFIED`) and firing `canvas-confetti`.




2. **Scene 2: 3-Caterer Comparison & Auto-Close Logic**
* `GET /api/quotes/compare/:weddingId?category=CATERER`: Side-by-side array comparing price per plate, extra hour charges, and calculated food cost (`price_per_plate * estimated_guests`).


* `POST /api/quotes/:quoteId/accept`: Must run in a **PostgreSQL Transaction**. Update selected quote to `ACCEPTED`, automatically update all competing quotes for that category/wedding to `REJECTED`, and update `weddings.actual_cost`.


* UI: Framer Motion `<motion.div layout>` morphing. The winning card scales up (`scale: 1.02`) with an emerald-gold border, while unselected cards dim (`opacity: 0.45`) with an "AUTO-CLOSED" tag.




3. **Scene 3: 28-Task Instant Plan & Staged Payment Tracking**
* `POST /api/weddings/:weddingId/generate-tasks`: Inserts 28 operational tasks across 7 categories (VENUE, DESIGN_DECOR, VENDORS, MEHENDI, SANGEET, WEDDING_CEREMONY, RECEPTION) with assigned owners and relative due dates. Prevents duplicate creation.


* `PUT /api/tasks/:taskId/stage`: Transitions tasks between `TO_PLAN`, `IN_PROGRESS`, and `DONE`.


* `POST /api/payments/create-plan/:weddingId`: Auto-generates 3 milestones: 20% Booking Deposit (Immediate), 50% Advance (30 days prior), and 30% Final Balance (3 days post-event).


* UI: 3-column Kanban board with layout animations on card stage changes.




4. **Scene 4: Big Day Live Schedule & Vendor Arrival Monitoring**
* `GET /api/weddings/:weddingId/schedule`: Chronological timeline (Groom Baraat, Varmala, Pheras, Reception).


* `POST /api/weddings/:weddingId/vendor-checkins/:checkinId`: Records arrival time and flags `DELAYED` if actual > scheduled.


* UI: Tailwind pinging radar beacon (`animate-ping`) on the active event and an ambient ruby-red pulse (`animate-pulse border-red-500 bg-red-950/20`) on delayed vendor cards.




5. **Scene 5: Post-Wedding Bill Reconciliation**
* `POST /api/expenses/extra/:weddingId`: Calculates `extra_units * unit_rate` (e.g., 60 unexpected banquet guests @ ₹2,200, 2 extra DJ hours @ ₹15,000).


* `GET /api/weddings/:weddingId/billing-reconciliation`: Reconciles agreed budget + client extras - paid advances = net client balance. Reconciles agreed vendor quote + extras - advances = net vendor payout (ensuring no double payments).




6. **Scene 6: Founder's Season Review Dashboard**
* `GET /api/analytics/season-summary`: Aggregates seasonal revenue, vendor disbursements, net agency profit, average margin %, 30-day receivables, and per-wedding P&L for all 25 weddings.


* UI: Kinetic animated count-up hook (`useCountUp`) displaying Indian Rupee currency notation (`Intl.NumberFormat('en-IN')`).



---

### 5. Copilot Code Generation Protocol

When asked to generate, complete, or fix code in this repository:

1. Identify which person/role owns the file before outputting code to maintain file ownership boundaries.


2. For backend files: Always use parameterized queries (`$1, $2`), wrap multi-step state changes in transactions, and return consistent JSON structures.


3. For frontend files: Ensure colors adhere to the Royal Knot Tailwind theme tokens, all interactive state transitions have error fallbacks, and currency figures are formatted in INR (`₹`).


4. Maintain clean, descriptive Git commit suggestions at the end of each generated block matching the team member's role.



```

```
