# 💸 MoneyTracker

> **Simple, smart, and collaborative money tracker for friends and roommates.**  
> Track who owes what, split group bills easily, and settle balances with 2-way live sync!

---

## ✨ Features at a Glance

* 👥 **Group Split Bills**: Split dining, rent, or travel bills across multiple friends (equal, custom, or exact shares). Supports both *"You Paid"* and *"A Friend Paid"*!
* ⚡ **2-Way Live Sync**: Link accounts with friends using their username. Transactions and balances update automatically on both users' apps.
* 💬 **WhatsApp Reminders**: Generate polite, friendly, or direct payment reminder messages and send them directly through WhatsApp in 1 click.
* 🤝 **1-Click Settle Up**: Clear full or partial debts instantly with automatic balance adjustments.
* 📊 **Smart Analytics**: Beautiful visual charts (Recharts) showing spending trends and category breakdowns (Food, Rent, Shopping, Bills).
* 📄 **Export Statements**: Download transaction records as CSV spreadsheets or clean, printable PDF reports.
* 🔒 **Secure & Fast**: Powered by JWT authentication, password hashing (`bcryptjs`), and optional PIN lock protection.
* 🚀 **Instant 1-Click Demo**: Test the app immediately without signing up by clicking *"Try as Demo User"* on the login page!

---

## 🛠️ Tech Stack

* **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Recharts, Axios
* **Backend:** Node.js, Express.js (REST API, JWT Authentication)
* **Database:** MongoDB & Mongoose
* **Sound Effects:** Audio notification chime for transactions and alerts

---

## 🚀 Quick Start (Run Locally in 2 Minutes)

### Prerequisites
Make sure you have installed on your machine:
* [Node.js](https://nodejs.org/) (version 18 or newer)
* [MongoDB](https://www.mongodb.com/) (running locally, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cloud database URL)

---

### Step 1: Install All Dependencies
Run this single command from the project root to install dependencies for root, client, and server:

```bash
npm run install:all
```

---

### Step 2: Configure Environment Variables
Create a `.env` file inside the `server/` directory:

```bash
# In server/.env
PORT=5000
DATABASE_URL="mongodb://127.0.0.1:27017/moneytracker"
JWT_SECRET="your_secret_key_here_any_random_text"
```
*(You can also use a free cloud MongoDB Atlas connection string!)*

---

### Step 3: Start the App
Start both backend and frontend servers together with one command:

```bash
npm run dev
```

* 🌐 **Frontend:** [http://localhost:5173](http://localhost:5173)
* ⚙️ **Backend API:** [http://localhost:5000](http://localhost:5000)

Open [http://localhost:5173](http://localhost:5173) in your browser, click **"Try as Demo User (1-Click)"**, and explore! 🎉

---

## 📁 Project Structure

```text
MoneyTracker/
├── client/                     # 💻 React + Vite Frontend
│   ├── src/
│   │   ├── components/         # Modals, Navbar, Cards, Form
│   │   ├── pages/              # Dashboard, Friends, Transactions, Analytics
│   │   ├── context/            # AuthContext (login state & persistence)
│   │   ├── services/           # Axios API client & export utilities
│   │   └── App.jsx             # Main routing and navigation
│   └── package.json
│
├── server/                     # ⚙️ Node.js + Express Backend
│   ├── controllers/            # Business logic (transactions, splits, friends, auth)
│   ├── models/                 # Mongoose database schemas (User, Friend, Transaction)
│   ├── routes/                 # Express API endpoints (/api/transactions, /api/friends)
│   ├── middleware/             # JWT auth verification
│   ├── db.js                   # MongoDB database connection
│   └── server.js               # Backend entry point
│
├── package.json                # Monorepo runner scripts
└── README.md                   # Project documentation
```

---

## ⚙️ Environment Variables Guide

### Server (`server/.env`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Backend port | `5000` |
| `DATABASE_URL` | MongoDB connection URI | `mongodb://127.0.0.1:27017/moneytracker` |
| `JWT_SECRET` | Secret key used for signing JWT tokens | `super_secret_jwt_string_123` |
| `NODE_ENV` | Environment mode | `development` or `production` |

### Client (`client/.env`) *(Optional)*
| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Custom backend URL (only needed if backend is hosted on a separate domain) | `https://your-api.onrender.com/api` |

---

## 🌐 Deployment

### Deploy on Render (Recommended)

1. **Deploy Backend (Web Service):**
   * **Root Directory:** `server`
   * **Build Command:** `npm install`
   * **Start Command:** `node server.js`
   * **Environment Variables:** Add `DATABASE_URL` (MongoDB Atlas), `JWT_SECRET`, `NODE_ENV=production`.

2. **Deploy Frontend (Static Site):**
   * **Root Directory:** `client`
   * **Build Command:** `npm install && npm run build`
   * **Publish Directory:** `dist`
   * **Environment Variables:** Set `VITE_API_URL` to your Render backend URL (e.g. `https://moneytracker-api.onrender.com/api`).
   * **Rewrite Rule:** Add rewrite rule for SPA routing (`/*` → `/index.html`).

---

## 📜 Useful Scripts

| Command | What it does |
| :--- | :--- |
| `npm run dev` | Runs both backend and frontend concurrently in development mode |
| `npm run install:all` | Installs dependencies for root, client, and server in one go |
| `npm run build` | Builds the client for production (`client/dist/`) |
| `npm start` | Starts the production backend server |

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
