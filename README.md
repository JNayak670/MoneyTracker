# 💸 MoneyTracker - Full-Stack Friend Money & Debt Tracker

A modern, production-grade full-stack web application built with **React (Vite) + Tailwind CSS + Node.js/Express + Prisma ORM (PostgreSQL & SQLite) + JWT Authentication**.

---

## 🏗️ Architecture & Tech Stack

```text
                  USER
                   │
                   ▼
         ┌──────────────────┐
         │ React + Tailwind │  → Client (Port 5173)
         │  Vite Frontend   │
         └────────┬─────────┘
                  │ JWT Bearer / REST API
                  ▼
         ┌──────────────────┐
         │ Node + Express   │  → Backend (Port 5000)
         │  Server API      │
         └────────┬─────────┘
                  │ Prisma ORM
                  ▼
         ┌──────────────────┐
         │ PostgreSQL / DB  │  → Persistent Database
         │ (Render / Local) │
         └──────────────────┘
```

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, Recharts, Axios |
| **Backend** | Node.js, Express.js (Modular Controllers, Routes, Middleware) |
| **Database** | PostgreSQL / SQLite with Prisma ORM |
| **Authentication** | JWT (JSON Web Tokens) + bcryptjs password hashing |
| **Deployment** | Render / Vercel / Railway / Supabase |

---

## 📁 Project Structure

```text
website/
├── client/                               # React + Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx                # Responsive navbar, user info & logout
│   │   │   ├── SummaryCard.jsx           # Total Given, Received, Pending & Net Balance cards
│   │   │   ├── FriendCard.jsx            # Friend cards with avatar, balance pill, quick actions
│   │   │   ├── TransactionForm.jsx       # Modal for Single Entry & Group Split bills
│   │   │   ├── SettleModal.jsx           # 1-Click quick settlement modal
│   │   │   ├── WhatsAppModal.jsx         # Multi-tone WhatsApp reminder generator (wa.me)
│   │   │   └── ProtectedRoute.jsx        # JWT route guard
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx             # Overview hero metrics, quick actions & recent activity
│   │   │   ├── Friends.jsx               # Friends circle grid, balance filter & friend ledger drawer
│   │   │   ├── Transactions.jsx          # Complete history, date/type filters, CSV export
│   │   │   ├── Analytics.jsx             # Category spending breakdown & monthly trends
│   │   │   ├── Login.jsx                 # Modern auth login page (+ Quick 1-Click Demo login)
│   │   │   └── Register.jsx              # New user registration
│   │   ├── context/
│   │   │   └── AuthContext.jsx           # Global Auth state, token handling & persistence
│   │   ├── services/
│   │   │   ├── api.js                    # Axios client with JWT interceptor
│   │   │   └── exportService.js          # CSV & Printable PDF statement builder
│   │   ├── App.jsx                       # Routing & App layout
│   │   ├── main.jsx                      # Entrypoint
│   │   └── index.css                     # Tailwind CSS directives & animations
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── server/                               # Node.js + Express Backend
│   ├── controllers/
│   │   ├── authController.js             # register, login, me, updateSettings
│   │   ├── friendController.js           # CRUD friends & calculate friend ledger
│   │   ├── transactionController.js      # CRUD transactions, splits, settle-up
│   │   └── dashboardController.js        # summary metrics & category analytics
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── friendRoutes.js
│   │   ├── transactionRoutes.js
│   │   └── dashboardRoutes.js
│   ├── middleware/
│   │   └── authMiddleware.js             # JWT authentication verification middleware
│   ├── prisma/
│   │   ├── schema.prisma                 # User, Friend, Transaction schema definition
│   │   └── seed.js                       # Realistic sample data seeder
│   ├── server.js                         # Express entrypoint with CORS & routes
│   ├── package.json
│   └── .env.example
│
├── package.json                          # Monorepo runner (npm run dev runs client + server)
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### 1. Start Both Backend & Frontend in 1 Command:
```bash
npm run dev
```

This starts:
- **Backend API**: `http://localhost:5000`
- **React Frontend**: `http://localhost:5173`

Open [http://localhost:5173](http://localhost:5173) in your browser!

### 2. Instant Demo Login
On the login screen, click **"Try as Demo User (1-Click Instant)"** to immediately access the preloaded friends circle, split bills, and transactions.

---

## 🗄️ Database Setup & PostgreSQL (Render / Supabase / Neon)

### Local Zero-Setup (SQLite):
By default, `server/.env` is configured with `DATABASE_URL="file:./dev.db"`. Everything works out of the box with zero external database setup.

### Production PostgreSQL (Render):
1. Create a PostgreSQL database on **Render** (or **Supabase** / **Neon**).
2. Copy the Internal or External Database URL (e.g. `postgresql://user:pass@host:5432/money_tracker?sslmode=require`).
3. In `server/prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`.
4. Set `DATABASE_URL` in your environment variables on Render.
5. Run:
   ```bash
   npx prisma db push
   ```

---

## 🌐 Render Deployment Guide

### Deploy Backend (Web Service):
1. **Root Directory**: `server`
2. **Build Command**: `npm install && npx prisma generate && npx prisma db push`
3. **Start Command**: `node server.js`
4. **Environment Variables**:
   - `DATABASE_URL`: `postgresql://...`
   - `JWT_SECRET`: `your_random_secret_string`
   - `NODE_ENV`: `production`

### Deploy Frontend (Static Site):
1. **Root Directory**: `client`
2. **Build Command**: `npm install && npm run build`
3. **Publish Directory**: `dist`
4. **Rewrite Rules**: Add a rewrite rule for SPA routing (`/*` -> `/index.html`).

---

## 🧪 Verification & Testing

To run the automated API integration test suite:
```bash
npm run test:api
```
