# CanteenIQ AI — Smart Food. Smarter Campus.

CanteenIQ AI is an end-to-end smart campus food ordering and cafeteria operations management platform built for university dining halls. It solves meal rush bottlenecks through real-time kitchen crowd telemetry, item-specific recipe customizations, concurrency-safe inventory reservations, 10-minute unpaid payment timers, and cryptographic QR pickup counter handoffs.

---

## 1. System Architecture & Request Flow

```
[Student / Canteen Owner / Campus Admin]
                     │
         Vite React + TypeScript SPA
         (Tailwind CSS v4 + Motion)
                     │  HTTP / REST (x-user-id Header / JWT Bearer)
                     ▼
         Express Full-Stack Server (server.ts / :3000)
                     │
       ┌─────────────┴─────────────┐
       ▼                           ▼
REST API Router           10-Minute Background Worker
(/api/orders, /api/menu,  (Monitors unpaid order hold deadlines,
 /api/canteens, etc.)      atomically restores released stock)
       │
       ▼
Transactional DB Layer & Mutex Locks (src/server/db.ts)
  - Concurrency-safe atomic inventory deductions
  - Scoped unique token generation (e.g. A101, B202)
  - Dynamic crowd index workload formula
  - Anti-replay cryptographic QR pickup credentials
  - In-app notification center & post-collection feedback
```

### Dynamic Crowd Index Formula
```
Workload = Σ(remaining estimated prep minutes of active orders)
Crowd Index = clamp(round(100 * Workload / Canteen Kitchen Capacity), 0, 100)

Crowd Levels:
  0–24%  : Low (Emerald)
  25–49% : Moderate (Amber)
  50–74% : High (Orange)
  75–100%: Very High (Red)
```

---

## 2. Project Directory Structure

```
├── .env.example                     # Environment configuration reference
├── index.html                       # HTML entry point with Plus Jakarta Sans & JetBrains Mono
├── metadata.json                    # AI Studio project manifest & server permissions
├── package.json                     # Scripts, dependencies, and type declarations
├── README.md                        # Complete project manual & testing documentation
├── server.ts                        # Full-stack server entry point (Vite middleware + background worker)
├── tests/
│   └── run_tests.ts                 # Automated test suite (concurrency, payments, QR anti-replay)
└── src/
    ├── App.tsx                      # Root React container, tabs routing & real-time telemetry
    ├── index.css                    # Tailwind CSS v4 directives & tabular numerals
    ├── main.tsx                     # React 19 entry point
    ├── assets/images/               # Generated high-resolution food and campus photography
    │   ├── canteen_hero_banner_*.jpg
    │   ├── masala_dosa_platter_*.jpg
    │   ├── filter_coffee_dabarah_*.jpg
    │   ├── campus_burger_fries_*.jpg
    │   └── hyderabadi_biryani_meal_*.jpg
    ├── context/
    │   ├── AuthContext.tsx          # User session, persona switching, and credentials
    │   └── CartContext.tsx          # Multi-canteen conflict prevention and calculated totals
    ├── types/
    │   └── index.ts                 # Domain TypeScript interfaces
    ├── services/
    │   └── api.ts                   # Client REST API communication helper
    ├── server/
    │   ├── db.ts                    # In-memory transactional database with mutex locking
    │   └── api.ts                   # REST API routes (Auth, Canteens, Menu, Orders, Payments, QR)
    └── components/
        ├── Navbar.tsx               # 3-Zone Top Bar Contract adhering header
        ├── CanteenComparisonView.tsx# Live Canteen A vs Canteen B crowd telemetry cards
        ├── MenuBrowser.tsx          # Filterable, searchable menu with availability badges
        ├── FoodCustomizationModal.tsx# Individual Food Customization Engine
        ├── CartDrawer.tsx           # Cart summary, payment toggle, server-validated bill
        ├── StudentOrdersView.tsx    # Order timeline, 10-minute hold countdown, QR display
        ├── BreakTimePlanner.tsx     # Smart class break recommender based on kitchen queue
        ├── OwnerDashboard.tsx       # Live kitchen tickets, QR scanner, inventory editor, reports
        ├── FeedbackModal.tsx        # Post-collection verified 5-star review modal
        ├── NotificationsModal.tsx   # Persistent in-app notifications drawer
        └── DemoSwitchBar.tsx        # 1-Click Persona Switcher for hackathon evaluations
```

---

## 3. Pre-Configured Demo Accounts

Use the floating **Persona Switcher** in the bottom-right corner to instantly test different roles:

| Role | Name | Email / Identifiers | Associated Counter |
| :--- | :--- | :--- | :--- |
| **Student** | Priya Seenivasan | `priya@college.edu` (ID: 2024-CS-042) | Any Campus Canteen |
| **Canteen A Owner** | Chef Ramanathan | `raman@harvestgrill.campus` | Harvest Campus Grill (Block A) |
| **Canteen B Owner** | Chef Anita | `anita@banyancourt.campus` | Banyan Court (Student Hub) |
| **Campus Admin** | Dining Directorate | `admin@campus.edu` | Campus-Wide All Facilities |

---

## 4. Quick Start & Execution Commands

### Prerequisites
- Node.js $\ge 20$
- npm $\ge 10$

### 1. Installation
```bash
npm install
```

### 2. Run the Full-Stack Application
```bash
npm run dev
```
The server starts on `http://localhost:3000` with Express backend API routes mounted alongside the Vite development server.

### 3. Run Automated Tests
```bash
npm test
```
Executes the comprehensive TypeScript test suite in `tests/run_tests.ts`.

---

## 5. Key Implemented Features

1. **Live Canteen A & B Workload Comparison**: Real-time crowd percentage calculated from active kitchen tickets, showing automated guidance such as *"Canteen B currently has a lower estimated workload."*
2. **Individual Food Customization Engine**: Item-specific groups for Coffee/Tea (Strength, Sugar, Milk), Masala Dosa (Spice level, Chutney selections, Add-ons), Burgers (Patties, Cheeses, Sauces), and Biryani (Portions, Sides).
3. **Concurrency-Safe Stock Safety**: Mutex locks prevent simultaneous orders from overselling limited inventory.
4. **10-Minute Unpaid-Order Grace Period**: Live second-by-second countdown on student and owner dashboards. A background task expires unpaid orders and restores inventory automatically if payment is unconfirmed.
5. **Cryptographic QR Pickup Verification**: Unguessable QR credentials and short tokens (e.g. `A101`). Verification enforces payment check and **anti-replay protection** (cannot be collected twice).
6. **Smart Break-Time Food Planner**: Recommends dishes that fit within a student's remaining break minutes (e.g. 15m), accounting for current kitchen queue delay and preparation time.
7. **Verified Post-Collection Feedback**: 1–5 star ratings and reviews are strictly restricted to collected orders, updating real-time dish ratings on the owner dashboard.
8. **Owner Management Console**: Kitchen ticket progression (`Accept`, `Decline with reason`, `Cooking`, `Ready`), inventory editing with stock adjustment audit buttons, and confirmed revenue analytics.
