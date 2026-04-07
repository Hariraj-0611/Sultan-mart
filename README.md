# 🛒 Sultan Mart
### Retail Management & Billing System

> Production-ready POS + Admin system — Django REST Framework & React

---

## ⚡ Quick Start

### One-command setup

```bash
# Windows
setup.bat

# Linux / Mac
chmod +x setup.sh && ./setup.sh
```

### Manual

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # edit DB credentials
python manage.py migrate
python manage.py seed_data  # creates admin + demo data
python manage.py runserver

# Frontend (new terminal)
cd frontend
npm install && npm run dev
```

### Docker (Production)

```bash
cp backend/.env.example backend/.env
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000 |
| Django Admin | http://localhost:8000/admin |
| Swagger Docs | http://localhost:8000/api/docs/ |

---

## 🔐 Default Credentials

| User | Password | Role |
|------|----------|------|
| admin | admin123 | Admin |
| cashier | cashier123 | Cashier |

> ⚠️ Change these immediately in production.

---

## 🧭 Access Control

| Scenario | Behaviour |
|----------|-----------|
| Cashier login | Lands on POS only — all other URLs redirect to `/` |
| Cashier → Admin mode | Click "Switch to Admin Mode" → enter PIN |
| Admin / Manager login | Lands directly on Dashboard with full access |

---

## 🖥️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 4.2, Django REST Framework |
| Auth | JWT (SimpleJWT) |
| Database | PostgreSQL 15 |
| Cache / Queue | Redis 7 + Celery + Celery Beat |
| Frontend | React 18, Redux Toolkit, Vite |
| Styling | Tailwind CSS |
| PDF Receipts | ReportLab (80mm thermal) |
| WhatsApp | Twilio API |
| Containers | Docker + Docker Compose |

---

## ✨ Features

- **POS Billing** — Fast checkout, barcode scan, keyboard shortcuts
- **Inventory** — Products, categories, stock, batch/expiry, low-stock alerts
- **Accounting** — Customers (udhar/credit), suppliers, purchases, expenses
- **Reports** — Dashboard, sales trends, P&L, top products, Excel export
- **Thermal Receipt** — 80mm PDF auto-print on checkout
- **WhatsApp** — Send receipt via Twilio
- **E-commerce** — Online store with cart & order management
- **Role-based Access** — Admin, Manager, Cashier
- **Auto Backup** — Daily DB backup via Celery Beat

---

## ⌨️ POS Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `F2` | Focus product search |
| `F9` | Checkout |
| `F8` | Print last receipt |
| `ESC` | Clear search |

---

## 🌐 API Endpoints

| Module | Base URL |
|--------|----------|
| Auth | `/api/auth/` |
| Inventory | `/api/inventory/` |
| Billing | `/api/billing/` |
| Accounting | `/api/accounting/` |
| Reports | `/api/reports/` |
| E-commerce | `/api/ecommerce/` |

Full interactive docs → `/api/docs/`

---

## ⚙️ Environment Variables

```env
SECRET_KEY=your-secret-key
DEBUG=True
DB_NAME=sultanmart
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
REDIS_URL=redis://localhost:6379/0
STORE_NAME=Sultan Mart
STORE_ADDRESS=Your Store Address
STORE_PHONE=+91 XXXXXXXXXX
STORE_GST=YOUR_GSTIN
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
```

---

## 📁 Project Structure

```
sultan-mart/
├── backend/
│   ├── apps/
│   │   ├── accounts/     # Users, JWT auth, roles
│   │   ├── inventory/    # Products, stock, batches
│   │   ├── billing/      # POS, invoices, receipts
│   │   ├── accounting/   # Customers, suppliers, expenses
│   │   ├── reports/      # Analytics, P&L, exports
│   │   └── ecommerce/    # Online store
│   └── config/           # Settings, URLs, Celery
├── frontend/
│   └── src/
│       ├── pages/        # POS, Dashboard, Reports...
│       ├── components/   # Layout, ReceiptPrint
│       ├── store/        # Redux (auth, pos cart)
│       └── api/          # Axios clients
└── docker-compose.yml
```

---

<p align="center">Sultan Mart © 2025 — Built with ❤️</p>
