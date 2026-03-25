# CinnaTend — Frontend

> AI-Powered Cinnamon Oil Tendering System  
> React + Vite · Tailwind CSS · Django REST API  
> IIT / University of Westminster — Final Year Project 2025/2026  
> Student: K.A. Harindi Navodya | W1953281 / 20220541  

---

## Overview

CinnaTend is a web-based sealed-bid tendering platform for the cinnamon oil trade in Sri Lanka. The frontend is a single-page React application with three role-based dashboards:

- **Manufacturer** — upload GC-MS lab reports, receive AI quality grades (A/B/C), create tenders, review sealed bids after deadline, accept winning bids
- **Buyer** — browse active tenders, submit sealed bids, view results after deadline, chat with manufacturer after bid acceptance
- **Admin** — manage all users, oversee all tenders and bids, view grading and system reports

---

## Tech Stack

| | |
|--|--|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS |
| Routing | React Router DOM v6 |
| HTTP | Axios (`src/services/api.jsx`) |
| Auth | JWT (stored in localStorage via `AuthContext`) |
| Backend | Django REST Framework (separate repo) |

---

## Getting Started

### Prerequisites

- Node.js v18+
- The CinnaTend Django backend running on `http://localhost:8000`

### Install & Run

```bash
git clone https://github.com/your-username/cinna_frontend.git
cd cinna_frontend
npm install
# create .env file (see Environment Variables below)
npm run dev
```

App runs at `http://localhost:5174`

---

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:8000/api
```

This value is consumed by `src/services/api.jsx` as the Axios base URL.

---

## Project Structure

```
cinna_frontend/
├── public/
├── src/
│   ├── assets/
│   │   └── react.svg
│   ├── components/
│   │   ├── AdminLayout.jsx         # Sidebar layout for admin pages
│   │   ├── BuyerLayout.jsx         # Sidebar layout for buyer pages
│   │   ├── ChatPanel.jsx           # Reusable post-tender chat UI
│   │   ├── CreateTenderModal.jsx   # Modal form for creating a tender
│   │   ├── Home.jsx                # Landing page component
│   │   ├── LoginModal.jsx          # Login modal
│   │   ├── ManufacturerLayout.jsx  # Sidebar layout for manufacturer pages
│   │   ├── Navbar.jsx              # Top navigation bar
│   │   ├── ProtectedRoute.jsx      # Redirects to login if no token
│   │   ├── RegisterModal.jsx       # Register modal
│   │   └── UserAvatar.jsx          # Avatar display component
│   ├── context/
│   │   └── AuthContext.jsx         # Global user + token state
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── AdminActivityLogs.jsx
│   │   │   ├── AdminBids.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminGradingReports.jsx
│   │   │   ├── AdminReports.jsx
│   │   │   ├── AdminTenders.jsx
│   │   │   └── AdminUsers.jsx
│   │   ├── buyer/
│   │   │   ├── BuyerDashboardPage.jsx
│   │   │   └── BuyerMyBidsPage.jsx
│   │   ├── manufacturer/
│   │   │   ├── AnalyticsPage.jsx
│   │   │   ├── CreateTenderPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── MyTendersPage.jsx
│   │   │   └── QualityGradingPage.jsx
│   │   └── ProfilePage.jsx         # Shared profile page (all roles)
│   ├── services/
│   │   └── api.jsx                 # Axios instance + all API call functions
│   ├── App.css
│   ├── App.jsx                     # Root component — routes + role helpers
│   ├── index.css
│   └── main.jsx
├── .env
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── README.md
└── vite.config.js
```

---

## Authentication & Role Routing

Login is handled via `LoginModal.jsx`. On success, the backend returns a JWT token and a user object with a `role` field. Both are stored in `localStorage` and shared globally through `AuthContext.jsx`.

Role helpers in `App.jsx`:

```js
export function isAdmin(user) {
  return user?.role === 'admin' || user?.is_staff === true || user?.is_superuser === true;
}

export function getDashboardPath(user) {
  if (isAdmin(user)) return '/admin/dashboard';
  if (user?.role === 'manufacturer') return '/manufacturer/dashboard';
  return '/buyer-dashboard';
}
```

All dashboard routes are wrapped in `<ProtectedRoute>` — unauthenticated users are redirected to `/login`.

---

## Routes

| Path | Component | Role |
|------|-----------|------|
| `/` | `Home.jsx` | Public |
| `/admin/dashboard` | `AdminDashboard.jsx` | Admin |
| `/admin/users` | `AdminUsers.jsx` | Admin |
| `/admin/tenders` | `AdminTenders.jsx` | Admin |
| `/admin/bids` | `AdminBids.jsx` | Admin |
| `/admin/grading-reports` | `AdminGradingReports.jsx` | Admin |
| `/admin/activity-logs` | `AdminActivityLogs.jsx` | Admin |
| `/admin/reports` | `AdminReports.jsx` | Admin |
| `/buyer-dashboard` | `BuyerDashboardPage.jsx` | Buyer |
| `/buyer/my-bids` | `BuyerMyBidsPage.jsx` | Buyer |
| `/manufacturer/dashboard` | `DashboardPage.jsx` | Manufacturer |
| `/manufacturer/quality-grading` | `QualityGradingPage.jsx` | Manufacturer |
| `/manufacturer/create-tender` | `CreateTenderPage.jsx` | Manufacturer |
| `/manufacturer/my-tenders` | `MyTendersPage.jsx` | Manufacturer |
| `/manufacturer/analytics` | `AnalyticsPage.jsx` | Manufacturer |
| `/profile` | `ProfilePage.jsx` | All roles |

---

## Dashboards

### Manufacturer

Layout: `ManufacturerLayout.jsx`

| Page | File | Description |
|------|------|-------------|
| Dashboard | `DashboardPage.jsx` | Stats overview: total tenders, active tenders, awarded tenders, total bids received |
| Quality Grading | `QualityGradingPage.jsx` | Upload a GC-MS lab report (PDF/image) → OCR → ML model returns Grade (A/B/C) + confidence score |
| Create Tender | `CreateTenderPage.jsx` | Form to post a new tender. Grade auto-fills from the most recent graded report. Uses `CreateTenderModal.jsx` |
| My Tenders | `MyTendersPage.jsx` | Lists all own tenders with multi-status badges (`active` / `closed` / `awarded` / `no bids`). View and accept bids after deadline |
| Analytics | `AnalyticsPage.jsx` | Charts and stats on own tender and bidding activity |
| Profile | `ProfilePage.jsx` | View and edit account details, upload avatar |
| Chat | `ChatPanel.jsx` | Post-tender chat with the winning buyer — unlocked after bid acceptance |

---

### Buyer

Layout: `BuyerLayout.jsx`

| Page | File | Description |
|------|------|-------------|
| Dashboard | `BuyerDashboardPage.jsx` | Stats: total bids, active bids, accepted bids, rejected bids. Lists available active tenders |
| My Bids | `BuyerMyBidsPage.jsx` | All submitted bids with status (`pending` / `accepted` / `rejected`). Accepted bids show a Chat link |
| Profile | `ProfilePage.jsx` | View and edit account details, upload avatar |
| Chat | `ChatPanel.jsx` | Post-tender chat with the manufacturer — only accessible after bid is accepted |

---

### Admin

Layout: `AdminLayout.jsx`

| Page | File | Description |
|------|------|-------------|
| Dashboard | `AdminDashboard.jsx` | System-wide stats: total users, active tenders, total tenders, total bids |
| User Management | `AdminUsers.jsx` | All registered users, role labels, activate/deactivate accounts |
| Tender Overview | `AdminTenders.jsx` | All tenders from all manufacturers with status badges |
| Bid Management | `AdminBids.jsx` | All bids across all tenders |
| Grading Reports | `AdminGradingReports.jsx` | ML grading history — grade breakdown by A/B/C, confidence scores |
| Activity Logs | `AdminActivityLogs.jsx` | System event log: logins, tender creations, bid submissions |
| System Reports | `AdminReports.jsx` | Tender activity summary and statistics. CSV export |

---

## Key Components

### `ChatPanel.jsx`
Reusable post-tender chat component shared by both manufacturer and buyer views. Renders the message thread, input field, and send button. Chat is only accessible after a bid has been accepted.

### `CreateTenderModal.jsx`
Modal form for creating a tender. Accepts grade data passed from `QualityGradingPage.jsx` so the quality grade and score are pre-filled.

### `ProtectedRoute.jsx`
Wraps any route requiring authentication. Reads token from `localStorage` — redirects to `/login` if missing or expired.

### `UserAvatar.jsx`
Displays a user's profile avatar. Falls back to an initial-letter circle if no image is uploaded.

### `StatusBadge.jsx` (inside `AdminTenders` / `MyTendersPage`)
A tender can carry multiple status labels simultaneously. `display_status` is a computed array from the backend — not a stored database column.

```jsx
{tender.display_status.map((status, i) => (
  <StatusBadge key={i} status={status} />
))}
```

| Status | Colour |
|--------|--------|
| `active` | Green |
| `closed` | Red |
| `awarded` | Blue |
| `no bids` | Grey |

---

## API Service

All HTTP calls are centralised in `src/services/api.jsx`. It exports an Axios instance with the base URL from `.env` and a request interceptor that attaches the JWT token automatically:

```js
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

Key endpoints used:

| Method | Endpoint | Used in |
|--------|----------|---------|
| `POST` | `/auth/login/` | `LoginModal.jsx` |
| `POST` | `/auth/register/` | `RegisterModal.jsx` |
| `POST` | `/grade/` | `QualityGradingPage.jsx` |
| `GET` | `/tenders/` | `BuyerDashboardPage.jsx` |
| `GET` | `/tenders/my/` | `MyTendersPage.jsx` |
| `POST` | `/tenders/` | `CreateTenderPage.jsx` |
| `GET` | `/tenders/:id/bids/` | `MyTendersPage.jsx` (after deadline) |
| `POST` | `/tenders/:id/bids/` | `BuyerDashboardPage.jsx` |
| `POST` | `/tenders/:id/bids/:bidId/accept/` | `MyTendersPage.jsx` |
| `GET` | `/bids/my/` | `BuyerMyBidsPage.jsx` |
| `GET/POST` | `/chats/:chatId/messages/` | `ChatPanel.jsx` |
| `GET` | `/admin/stats/` | `AdminDashboard.jsx` |
| `GET` | `/admin/users/` | `AdminUsers.jsx` |
| `GET` | `/admin/reports/summary/` | `AdminReports.jsx` |

---

## Scripts

```bash
npm run dev       # Dev server → localhost:5174
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
```

---


*K.A. Harindi Navodya · W1953281 / 20220541 ·*
