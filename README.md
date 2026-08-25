# FinVest - Financial Buddy 💰📊

<p align="center">
  <img src="https://img.shields.io/badge/Django_REST-5.0+-092E20?style=for-the-badge&logo=django" alt="Django REST">
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Vite-5.2-646CFF?style=for-the-badge&logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python" alt="Python">
  <img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript" alt="JavaScript">
  <img src="https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens" alt="JWT">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</p>

> **FinVest (Financial Buddy)** is a full-stack, enterprise-grade personal financial management and asset trading web application. Built with **Django REST Framework** and **React (Vite)**, it features real-time portfolio telemetry, liquid buying power cash tracking, share selling with realized P&L calculations, responsive multi-device design, multi-event expense trip planning, and high-contrast dual-theme aesthetics (Midnight Dark & Crisp Pearl White).

---

## ✨ Key Features & Technical Highlights

### 💵 1. Account Cash Balance & Buying Power Engine
- **Liquid Cash Tracking**: Real-time liquid cash balance calculated dynamically from user cashflows (`Total Income - Total Expenses`).
- **Deposit Cash Modal**: 1-click fund top-up with reference logging (`type="income"`, `category="Deposit / Cash In"`).
- **Withdraw Cash Modal**: Secure fund withdrawals with automatic liquidity validation (`type="expense"`, `category="Withdrawal / Cash Out"`).
- **Order Validation**: Enforces `Total Cost <= Available Buying Power` before executing buy orders.

### 🔴 2. Share Selling & Realized Profit / Loss
- **Interactive Sell Modal**: Sell positions (stocks, crypto, gold) with integer or decimal share amounts.
- **Real-Time Proceeds & P&L**: Computes order proceeds (`Quantity * Sell Price`), **Realized Profit / Loss** (`(Sell Price - Avg Cost) * Quantity`), and credits proceeds back into liquid cash balance.
- **Automatic Position Liquidation**: Full position cleanup upon liquidating 100% of holdings, or seamless position quantity reduction.

### 🟢 3. Position Merging & "Buy More" Shares Action
- **1-Click "Buy More"**: Buy additional shares of existing holdings directly from **My Holdings**.
- **Weighted Average Cost Recalculation**: Merges positions and recalculates weighted average purchase price (`(old_total_cost + new_total_cost) / total_quantity`).

### 📈 4. Real-Time Market Price Refresh & Live Ticker
- **1-Click Price Fetching**: Fetches live stock quotes from **Yahoo Finance API** (`query1.finance.yahoo.com`) and crypto prices from **Coinbase / Binance APIs**.
- **Perpetual Market Ticker**: Live market catalog polling every **2.5 seconds** on the frontend for popular assets (`AAPL`, `NVDA`, `TSLA`, `MSFT`, `AMZN`, `GOOGL`, `VOO`, `AMD`, `BTC`, `ETH`, `SOL`, `ADA`, `DOGE`).
- **Historical Snapshot Logging**: Stores price history records in `PortfolioHistory` for analytics.

### 🔐 5. 5-Minute Email OTP Verification & Authentication Flow
- **Email OTP Verification**: User registration secured with 6-digit OTP codes expiring in 5 minutes via `EmailOTP`.
- **Gmail SMTP & Dev Fallback**: Real email delivery via Google App Passwords (`backend/.env`), fallback to terminal console output in development mode.
- **Strict Password Enforcement**: Enforces `^(?=[A-Z])(?=.*[0-9])(?=.*[@#$%^&*!._-]).{8,50}$` (First letter uppercase, min 8 characters, at least 1 number and 1 special character).
- **Username Enforcement**: Enforces `^[a-zA-Z0-9_]{3,20}$` (3-20 characters, letters, numbers, underscores).

### 👑 6. Enterprise Admin Suite & Date-Wise User Directory
- **Date-Wise Ordering**: User directory sorted chronologically (`date_joined`, `id`).
- **Cascading User Cleanup**: Account deletion cascades to erase all user transactions, assets, budgets, and events (`on_delete=models.CASCADE`).
- **User Management**: Administrator controls to toggle staff status, inspect user financial summaries, reset passwords, and audit system telemetry logs.

### ✈️ 7. Event & Trip Budget Planner
- **Multi-Event Management**: Create dedicated budget plans for trips or special projects (`Event` & `EventTransaction`).
- **Main Budget Sync**: Optional toggle (`sync_to_main`) to mirror event expenses into main transaction ledgers automatically.

### 📄 8. Data Export & Analytics Reports
- **CSV Transaction Export**: 1-click export of transactions to CSV (`/api/transactions/export_csv/`).
- **Visual Analytics**: Interactive expense and income pie charts, asset distribution bar charts, and monthly budget progress meters built with **Chart.js**.

---

## 🛠 Tech Stack

### Backend (Python / Django)
- **Framework**: Django 5.0+ & Django REST Framework (DRF 3.14+)
- **Authentication**: SimpleJWT 5.3+ (JSON Web Tokens) & Email OTP Verification
- **CORS Management**: django-cors-headers 4.3+
- **Database**: SQLite 3 (Development) / PostgreSQL (Production ready)
- **WSGI / Production**: Gunicorn 21.2+ & WhiteNoise 6.6+

### Frontend (React / Vite)
- **Framework**: React 18.2 & Vite 5.2 (`port: 5175`)
- **Routing**: React Router DOM 6.22+
- **HTTP Client**: Axios 1.6+ with JWT bearer token interceptors
- **Data Visualization**: Chart.js 4.4+ & react-chartjs-2 5.2+
- **Icons**: Lucide React Icons 0.368+
- **Design System**: Dual-Theme CSS Glassmorphism (Midnight Dark & Crisp Pearl White)

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python** 3.10+
- **Node.js** 18+ and `npm`

---

### Method A: One-Click Launch Script (Recommended for Windows)

Run the included batch script from the repository root:
```cmd
run_app.bat
```
This automatically stops any stale server processes and launches the backend Django server (`http://127.0.0.1:8000/api/`) and frontend Vite server (`http://localhost:5175/`).

---

### Method B: Manual Setup

#### Step 1: Set Up Backend (Django REST API)

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Seed initial catalog and demo data
python seed_data.py

# Start Django development server
python manage.py runserver 8000
```
The Django REST API will start at **http://127.0.0.1:8000/api/**.

---

#### Step 2: Configure Gmail OTP Delivery (Optional)

To send real OTP verification emails to users:
1. Enable **2-Step Verification** on your Google Account: [https://myaccount.google.com/security](https://myaccount.google.com/security).
2. Generate a **16-Character App Password**: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
3. Update `backend/.env`:
   ```env
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=your-16-character-app-password
   ```

*(If unconfigured, OTP verification codes print directly in the backend terminal console).*

---

#### Step 3: Set Up Frontend (React + Vite)

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
The React Web App will launch at **http://localhost:5175/**.

---

## 🔑 Default Credentials

| Portal | Username | Password | Access Level | Description |
| :--- | :--- | :--- | :--- | :--- |
| **User Portal** | `nisu05` | `Punisher@2005` | Standard User | Pre-loaded with rich transactions, stock/crypto portfolio, and event data |
| **User Portal** | `dhairya` | `Dhairya@2026` | Standard User | Starter user account |
| **Admin Portal** | `Admin` | `Admin@2005` | Administrator | Superuser & Staff access with access to Enterprise Admin Suite |

> **Password Rule**: Passwords must start with an **uppercase letter**, be at least **8 characters**, and contain at least **1 number** and **1 special character** (e.g. `Punisher@2005`).

---

## 🌐 API Endpoints Summary

| Section | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/send_otp/` | Send 6-digit verification OTP to email |
| **Auth** | `POST` | `/api/auth/verify_otp/` | Verify OTP and complete user registration |
| **Auth** | `POST` | `/api/auth/login/` | Obtain JWT access and refresh tokens |
| **Auth** | `POST` | `/api/auth/refresh/` | Refresh JWT access token |
| **Auth** | `GET, PUT` | `/api/auth/me/` | Fetch or update current user profile |
| **Auth** | `POST` | `/api/auth/change_password/` | Change password with regex validation |
| **Portfolio** | `GET, POST` | `/api/portfolio/` | List portfolio assets or execute buy order |
| **Portfolio** | `POST` | `/api/portfolio/{id}/sell/` | Execute sell order & calculate realized P&L |
| **Portfolio** | `GET` | `/api/portfolio/market_catalog/` | Fetch live market ticker catalog |
| **Portfolio** | `GET` | `/api/portfolio/fetch_price/?symbol={sym}` | Fetch live price from Yahoo Finance / Coinbase |
| **Transactions**| `GET, POST` | `/api/transactions/` | List or create financial transactions |
| **Transactions**| `GET` | `/api/transactions/export_csv/` | Export transactions as a CSV file |
| **Budgets** | `GET, POST` | `/api/budgets/` | View or update overall monthly budget |
| **Budgets** | `GET, POST` | `/api/category-budgets/` | View or update category-specific budgets |
| **Events** | `GET, POST` | `/api/events/` | List or create event trip plans |
| **Events** | `GET, POST` | `/api/event-transactions/` | List or log transactions inside an event |
| **Analytics** | `GET` | `/api/dashboard/stats/` | Dashboard financial summary statistics |
| **Analytics** | `GET` | `/api/reports/stats/` | Reports financial breakdown statistics |
| **Admin** | `GET` | `/api/admin/stats/` | System-wide AUM & telemetry stats |
| **Admin** | `GET` | `/api/admin/users/` | Date-wise user directory list |
| **Admin** | `POST` | `/api/admin/users/{id}/toggle_admin/` | Toggle admin staff privileges for a user |
| **Admin** | `GET` | `/api/admin/users/{id}/user_summary/` | Get user financial summary |
| **Admin** | `POST` | `/api/admin/users/{id}/reset_password/`| Admin password reset for user |
| **Admin** | `DELETE` | `/api/admin/users/{id}/` | Delete user account with cascading cleanup |

---

## 📂 Project Structure

```
FinVest-Financial-Buddy-main/
├── backend/
│   ├── api/
│   │   ├── admin.py           # Django admin registration
│   │   ├── apps.py            # API App configuration
│   │   ├── models.py          # Transaction, PortfolioAsset, PortfolioHistory, Budget, CategoryBudget, Event, EventTransaction, EmailOTP
│   │   ├── serializers.py     # DRF serializers & regex validation rules
│   │   ├── urls.py            # API REST endpoints & router mappings
│   │   └── views.py           # Trading engine, P&L calculations, OTP & Admin views
│   ├── finvest_backend/       # Django settings, WSGI, and URL routing
│   │   ├── settings.py        # Project settings (JWT, CORS, Email config)
│   │   ├── urls.py            # Top-level URL routing
│   │   └── wsgi.py            # WSGI application entrypoint
│   ├── .env                   # Environment configuration file
│   ├── db.sqlite3             # SQLite database file
│   ├── manage.py              # Django CLI utility
│   ├── requirements.txt       # Backend Python dependencies
│   ├── run_app.bat            # Backend launch script
│   └── seed_data.py           # Initial database seeder script
├── frontend/
│   ├── src/
│   │   ├── api/               # Axios client instance with JWT token interceptors
│   │   ├── components/        # Navbar, Sidebar, BottomNav, StatCard, Modal, Calculator
│   │   ├── context/           # AuthContext, ThemeContext, ToastContext
│   │   ├── pages/             # RoleSelect, Login, AdminLogin, Register, Dashboard,
│   │   │                      # Portfolio, Tracker, Budget, Events, Reports, Profile, Admin
│   │   ├── App.jsx            # Main app router & protected routes configuration
│   │   ├── index.css          # Universal Dual-Theme CSS design system & tokens
│   │   └── main.jsx           # React app entry point
│   ├── package.json           # Frontend Node dependencies & scripts
│   ├── run_app.bat            # Frontend launch script
│   └── vite.config.js         # Vite dev server configuration (port 5175, API proxy)
├── LICENSE                    # MIT License
├── README.md                  # Project Documentation
├── requirements.txt           # Root Backend Python dependencies
└── run_app.bat                # One-click dual-server launch script
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) - Copyright (c) 2026 Dhairya Dave & Nisarg.
