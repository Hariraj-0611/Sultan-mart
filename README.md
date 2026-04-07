# Sultan Mart — Retail Management & Billing System

A production-ready retail POS and management system built with Django REST Framework + React.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 4.2, Django REST Framework |
| Auth | JWT (SimpleJWT) |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Background Tasks | Celery + Celery Beat |
| Frontend | React 18, Redux Toolkit, Tailwind CSS |
| PDF Receipts | ReportLab (80mm thermal) |
| WhatsApp | Twilio API |
| Containerization | Docker + Docker Compose |

---

## Features

- **POS Billing** — Fast checkout, barcode scan, keyboard shortcuts (F2/F9/F8)
- **Inventory** — Products, categories, stock tracking, batch/expiry, low-stock alerts
- **Accounting** — Customers (udhar/credit), suppliers, purchase orders, expenses
- **Reports** — Dashboard, sales trends, P&L, top products, Excel export
- **Thermal Receipt** — 80mm PDF auto-print on checkout
- **WhatsApp** — Send receipt to customer via Twilio
- **E-commerce** — Online store with cart and order management
- **Role-based Access** — Admin, Manager, Cashier
- **Auto Backup** — Daily DB backup via Celery Beat

---

## Quick Start (Local)

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL 15
- Redis

### Windows
```bat
setup.bat
```

### Linux / Mac
```bash
chmod +x setup.sh && ./setup.sh
```

### Manual Steps

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Edit DB credentials
python manage.py migrate
python manage.py seed_data      # Creates admin + demo data
python manage.py runserver
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Docker (Production)

```bash
cp backend/.env.example backend/.env   # Edit settings
docker-compose up --build
```

Services started:
- `http://localhost:3000` — React frontend
- `http://localhost:8000` — Django API
- `http://localhost:8000/admin` — Django admin
- `http://localhost:8000/api/docs/` — Swagger API docs

---

## Default Credentials

| User | Password | Role |
|------|----------|------|
| admin | admin123 | Admin |
| cashier | cashier123 | Cashier |

**Change these immediately in production.**

---

## Environment Variables (backend/.env)

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
TWILIO_ACCOUNT_SID=        # For WhatsApp
TWILIO_AUTH_TOKEN=
```

---

## POS Keyboard Shortcuts

| Key | Action |
|-----|--------|
| F2 | Focus product search |
| F9 | Checkout |
| F8 | Print last receipt |
| ESC | Clear search |

---

## API Endpoints

| Module | Base URL |
|--------|----------|
| Auth | `/api/auth/` |
| Inventory | `/api/inventory/` |
| Billing | `/api/billing/` |
| Accounting | `/api/accounting/` |
| Reports | `/api/reports/` |
| E-commerce | `/api/ecommerce/` |

Full interactive docs at `/api/docs/`

---

## Project Structure

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
│       └── api/          # Axios API clients
└── docker-compose.yml
```
"# Sultan-mart" 
