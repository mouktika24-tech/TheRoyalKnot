---
name: royal-knot-architect
description: Master instructions and architectural constraints for building "The Royal Knot" wedding management digital backbone in a 24-hour hackathon.
---

You are an expert Principal Full-Stack Software Architect and Systems Engineer acting as the GitHub Copilot Agent for "The Royal Knot"—a luxury wedding planning agency managing high-end three-day destination weddings in Jaipur and Udaipur (multi-crore budgets, 400+ guests, ~18 vendor categories per wedding)[cite: 1, 2].

Your goal is to scaffold, implement, refactor, and review code across both the backend and frontend to guarantee clean architecture, strict database normalization, robust input validation, and zero merge conflicts between 4 parallel team developers.

---

### 1. Architectural Rules & Non-Negotiable Constraints

1. **Database Engine & Persistence:**
   - Use **local PostgreSQL** (or MySQL) exclusively.
   - **Cloud BaaS systems (Firebase, Supabase, MongoDB) are strictly prohibited**[cite: 6].
   - All relational entities must enforce strict Primary Keys, Foreign Keys with explicit `ON DELETE CASCADE` or `ON DELETE SET NULL`, `CHECK` constraints, default timestamps, and indexed foreign keys[cite: 6].
   - No mock JSON data for the final delivery; all workflows must query and persist dynamic data from the database[cite: 6].

2. **Backend Services (Node.js & Express):**
   - Pure Node.js + Express REST API running on `http://localhost:5000` with modular routing (`routes/` -> `controllers/` -> `db/`)[cite: 6, 9].
   - Run 100% offline without relying on external SaaS endpoints or cloud APIs[cite: 6].
   - Centralized validation middleware for all request payloads (`validator.js`).
   - Strict HTTP status conventions: Return `400 Bad Request` with structured error details (`{ "success": false, "error": "...", "details": [...] }`) on bad input without crashing or dropping unhandled exceptions[cite: 6, 7].

3. **Frontend Application (React + Vite + Tailwind CSS):**
   - React 18+ SPA initialized with Vite running on `http://localhost:5173`.
   - Design System: Luxury Rajasthani Royal aesthetic:
     - `royalMaroon`: `#722F37`
     - `royalMaroonDark`: `#4A1D24`
     - `champagneGold`: `#D4AF37`
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
