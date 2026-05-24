# Sultan Mart — Project Deep Dive

> A complete breakdown of the architecture, what each module does, and how data flows through the system.

---

## Overview

Sultan Mart is a **complete retail shop management system** with two main parts:

1. **POS + Admin App** — internal system used by shop staff
2. **Online Store** — public-facing website where customers can browse and place orders

**Backend** → Django REST Framework (Python)
**Frontend** → React 18 + Redux Toolkit (JavaScript)
**Database** → MySQL 8
**Cache / Queue** → Redis + Celery

---

## System Architecture

```
Browser (React App)
       │
       │  HTTP / REST API (JWT Auth)
       ▼
Django REST Framework  ←→  MySQL 8 (main data)
       │
       ├──→ Redis (cache + Celery broker)
       │
       └──→ Celery Worker (background tasks)
                └──→ Celery Beat (scheduled jobs)
```

---

## Backend — 6 Django Apps

### 1. `accounts` — Users & Auth

**What it does:** Handles login, JWT token issuance, and role management.

**User Model:**
```
User
├── username, password (Django default)
├── role → admin | manager | cashier
├── phone
└── is_active
```

**Roles:**
| Role | Access |
|------|--------|
| admin | Everything |
| manager | Same as admin |
| cashier | POS only (can unlock admin mode via PIN) |

**Key Endpoints:**
```
POST /api/auth/login/          → returns JWT access + refresh token
POST /api/auth/refresh/        → refresh access token
GET  /api/auth/users/me/       → current user info
POST /api/reports/pin/         → verify admin PIN
```

**JWT Config:** Access token valid for 8 hours, Refresh token valid for 7 days.

---

### 2. `inventory` — Products & Stock

**What it does:** Manages products, tracks stock levels, handles batch/expiry tracking.

**Models:**

```
Category
├── name
└── parent (self-reference → supports sub-categories)

Unit
├── name  (e.g. Kilogram)
└── abbreviation  (e.g. kg)

Product
├── name, sku (unique), barcode
├── category → Category
├── unit → Unit
├── purchase_price  (cost price)
├── selling_price   (what customer pays)
├── mrp             (max retail price — used for "you saved" display)
├── gst_rate        (0 / 5 / 12 / 18 / 28 %)
├── stock_quantity
├── low_stock_threshold
├── track_expiry    (toggle batch tracking)
└── is_active

Batch  (for expiry tracking)
├── product → Product
├── batch_number
├── manufacturing_date, expiry_date
├── quantity
└── purchase_price

StockMovement  (full audit trail)
├── product → Product
├── movement_type → in | out | adjustment
├── quantity
├── reference  (invoice number / PO number)
└── created_by → User
```

**GST Logic:** GST is **inclusive** in the selling price — it's extracted at billing time, not added on top.

```
gst_amount = taxable - (taxable / (1 + gst_rate / 100))
```

**Key Endpoints:**
```
GET  /api/inventory/products/pos_search/?q=     → fast POS search (name/SKU/barcode)
GET  /api/inventory/products/low_stock/         → low stock list
GET  /api/inventory/products/expiring_soon/     → expiry alerts
POST /api/inventory/products/{id}/adjust_stock/ → manual stock adjustment
```

**Scheduled Tasks (Celery Beat):**
- 9:00 AM — low stock check
- 9:30 AM — expiry check

---

### 3. `billing` — POS & Invoices

**What it does:** Creates invoices, deducts stock, generates receipts.

**Models:**

```
Invoice
├── invoice_number  (auto-generated: INV202504070001)
├── customer → Customer (optional)
├── cashier → User
├── status → draft | paid | partial | cancelled
├── payment_method → cash | upi | card | credit | mixed
├── subtotal, discount_amount, gst_amount
├── total_amount, amount_paid, change_amount, credit_amount
└── created_at

InvoiceItem
├── invoice → Invoice
├── product → Product
├── product_name  (snapshot — preserves name even if product is renamed later)
├── quantity, unit_price, mrp
├── discount_percent, discount_amount
├── gst_rate, gst_amount
└── total_price

PaymentSplit  (for mixed payments)
├── invoice → Invoice
├── method → cash | upi | card
├── amount
└── reference  (UPI transaction ID, card last 4 digits)
```

**Invoice Creation Flow (`BillingService.create_invoice`):**

```
1. Validate all items
2. For each item:
   - Extract GST (inclusive)
   - Calculate discount
   - Deduct stock (select_for_update — prevents race conditions)
   - Record StockMovement
3. Apply bill-level discount
4. Calculate credit amount
5. Save Invoice + Items + PaymentSplits
6. Update customer outstanding_balance (if credit purchase)
```

**Key Endpoints:**
```
POST /api/billing/invoices/                    → create invoice
GET  /api/billing/invoices/today/              → today's bills
GET  /api/billing/invoices/{id}/receipt_pdf/   → 80mm thermal PDF
POST /api/billing/invoices/{id}/send_whatsapp/ → send receipt via WhatsApp
POST /api/billing/invoices/{id}/cancel/        → cancel + restore stock
```

**Scheduled Task:** 2:00 AM — auto DB backup.

---

### 4. `accounting` — Customers, Suppliers, Purchases, Expenses

**What it does:** Tracks credit (udhar), manages suppliers, handles purchase orders and expenses.

**Models:**

```
Customer
├── name, phone, email, address, gst_number
├── outstanding_balance  (how much they owe)
├── credit_limit
└── discount_percent  (special discount for this customer on every bill)

Supplier
├── name, phone, email, address, gst_number
└── outstanding_balance  (how much we owe them)

PurchaseOrder
├── po_number
├── supplier → Supplier
├── status → pending | received | partial
├── total_amount, amount_paid
└── items → PurchaseItem[]

PurchaseItem
├── purchase_order → PurchaseOrder
├── product → Product
├── quantity, unit_price, total_price

Expense
├── title, category (rent/salary/utilities/maintenance/marketing/other)
├── amount, date
└── created_by → User

CustomerPayment  (credit payment received from customer)
├── customer → Customer
├── amount, payment_method
└── created_by → User
```

**Credit Flow:**
- Customer buys on credit → `outstanding_balance` increases
- Customer makes a payment → `outstanding_balance` decreases
- Ledger = full history of invoices + payments

**Key Endpoints:**
```
GET  /api/accounting/customers/                      → list customers
POST /api/accounting/customers/{id}/receive_payment/ → record payment
GET  /api/accounting/customers/{id}/ledger/          → full transaction history
POST /api/accounting/purchases/{id}/mark_received/   → receive PO + update stock
```

---

### 5. `reports` — Analytics & Exports

**What it does:** Dashboard stats, sales reports, P&L, Excel exports, backup/restore.

**Key Endpoints:**
```
GET  /api/reports/dashboard/          → today's sales, month sales, expenses, low stock count, 7-day chart
GET  /api/reports/sales/              → daily/weekly/monthly aggregation
GET  /api/reports/products/           → top products by revenue
GET  /api/reports/profit-loss/        → revenue - COGS - expenses
GET  /api/reports/export/?type=sales  → Excel download
GET  /api/reports/low-stock/          → low stock items
GET  /api/reports/expiry/             → expiring products
GET  /api/reports/backup/             → download DB backup (JSON)
POST /api/reports/restore/            → restore from backup
POST /api/reports/pin/                → verify admin PIN
GET  /api/reports/settings/           → store settings
PUT  /api/reports/settings/           → update store settings
```

---

### 6. `ecommerce` — Online Store

**What it does:** Public-facing shop where customers can browse products and place orders.

**Models:**

```
Cart
└── customer → Customer (one-to-one)

CartItem
├── cart → Cart
├── product → Product
└── quantity

OnlineOrder
├── order_number
├── customer → Customer
├── status → pending | confirmed | ready | delivered | cancelled
├── total_amount, delivery_address
└── items → OnlineOrderItem[]

OnlineOrderItem
├── order → OnlineOrder
├── product → Product
├── quantity, unit_price, total_price
```

**Key Endpoints:**
```
GET  /api/ecommerce/catalog/                   → public product list (no auth required)
POST /api/ecommerce/cart/{id}/add_item/        → add to cart
POST /api/ecommerce/cart/{id}/checkout/        → place order
POST /api/ecommerce/orders/guest_checkout/     → one-shot guest checkout
GET  /api/ecommerce/orders/track_order/?q=     → public order tracking (no auth)
POST /api/ecommerce/orders/{id}/update_status/ → admin status update
GET  /api/ecommerce/orders/pending_count/      → pending orders count (for sidebar badge)
```

---

## Frontend — React 18 + Redux

### Redux Store

```
store/
├── authSlice    → user, role, token, mode (billing | admin)
├── posSlice     → POS cart, customer, payment method, totals
└── cartSlice    → ecommerce cart
```

**Auth Flow:**
```
Login → JWT token → role check
  cashier       → mode = 'billing' → POS only
  admin/manager → mode = 'admin'   → Dashboard + all pages

Cashier admin mode unlock:
  "Switch to Admin Mode" → PIN modal → verify → mode = 'admin'
```

**POS Cart Totals (`selectCartTotals` selector):**
```
subtotal    = unit_price × qty (all items)
discount    = subtotal × discount_percent / 100
total       = subtotal - discount  (GST already inside — not added on top)
gst         = extracted from total (inclusive calculation)
profit      = (selling_price_ex_gst - purchase_price) × qty
mrpSavings  = (mrp - selling_price) × qty  ("you saved" amount shown on receipt)
```

### Pages

| Page | Route | Access |
|------|-------|--------|
| LoginPage | `/login` | Public |
| POSPage | `/` or `/pos` | All logged-in users |
| DashboardPage | `/` | Admin mode only |
| ProductsPage | `/products` | Admin mode only |
| InvoicesPage | `/invoices` | Admin mode only |
| CustomersPage | `/customers` | Admin mode only |
| SuppliersPage | `/suppliers` | Admin mode only |
| PurchasesPage | `/purchases` | Admin mode only |
| ExpensesPage | `/expenses` | Admin mode only |
| ReportsPage | `/reports` | Admin mode only |
| OnlineOrdersPage | `/online-orders` | Admin mode only |
| UsersPage | `/users` | Admin mode only |
| SettingsPage | `/settings` | Admin mode only |
| Online Store | `/store/*` | Public |

### Route Guards

```jsx
PrivateRoute  → no token → redirect to /login
AdminRoute    → mode !== 'admin' → redirect to /
IndexRedirect → mode = admin → Dashboard, else → POS
```

### Key Components

```
Layout.jsx
├── Sidebar (mode-based navigation)
├── PinModal (admin mode unlock)
├── Mode toggle button
├── New online order alert (polls every 10s)
└── Topbar

ReceiptPrint.jsx   → 80mm thermal receipt layout
```

---

## Data Flow — Full POS Checkout

```
Cashier scans barcode
        │
        ▼
GET /api/inventory/products/pos_search/?q=<barcode>
        │
        ▼
Product added to Redux posSlice cart
        │
        ▼
Cashier clicks Checkout (or presses F9)
        │
        ▼
POST /api/billing/invoices/
  {
    items: [{ product, qty, unit_price, discount_percent }],
    payment_method: "cash",
    amount_paid: 500,
    customer: 12  (optional)
  }
        │
        ▼
BillingService.create_invoice()
  ├── Stock deducted (atomic transaction)
  ├── StockMovement recorded
  ├── GST extracted
  ├── Invoice + Items saved
  └── Customer credit updated (if applicable)
        │
        ▼
Invoice response returned
        │
        ├──→ Receipt PDF auto-printed
        └──→ WhatsApp receipt sent (optional)
```

---

## Scheduled Jobs (Celery Beat)

| Time | Task |
|------|------|
| 2:00 AM | Auto database backup |
| 9:00 AM | Low stock alert check |
| 9:30 AM | Expiring batch check |

---

## Docker Services

```
docker-compose up --build

Services:
  db          → MySQL 8.0        (port 3306)
  redis       → Redis 7          (port 6379)
  backend     → Django/Gunicorn  (port 8000)
  celery      → Celery worker
  celery-beat → Scheduled tasks
  frontend    → React/Nginx      (port 3000)
```

---

## Environment Variables (`.env`)

```env
SECRET_KEY=          # Django secret key
DEBUG=               # True / False
DB_NAME=sultanmart
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=3306
REDIS_URL=redis://localhost:6379/0

STORE_NAME=Sultan Mart
STORE_ADDRESS=
STORE_PHONE=
STORE_GST=           # GSTIN number

ADMIN_PIN=1234       # PIN for admin mode unlock

TWILIO_ACCOUNT_SID=  # WhatsApp via Twilio
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

CORS_ORIGINS=http://localhost:3000
```

---

## API Documentation

Full interactive Swagger UI → `http://localhost:8000/api/docs/`

---

<p align="center">Sultan Mart — Built with Django + React</p>
