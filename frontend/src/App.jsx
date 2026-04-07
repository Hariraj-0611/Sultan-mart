import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import POSPage from './pages/POSPage'
import ProductsPage from './pages/ProductsPage'
import CustomersPage from './pages/CustomersPage'
import SuppliersPage from './pages/SuppliersPage'
import PurchasesPage from './pages/PurchasesPage'
import ExpensesPage from './pages/ExpensesPage'
import InvoicesPage from './pages/InvoicesPage'
import ReportsPage from './pages/ReportsPage'
import UsersPage from './pages/UsersPage'
import OnlineOrdersPage from './pages/OnlineOrdersPage'
import SettingsPage from './pages/SettingsPage'

// Online Store pages (public)
import StoreLayout from './store/StoreLayout'
import StoreHome from './store/StoreHome'
import StoreShop from './store/StoreShop'
import StoreProduct from './store/StoreProduct'
import StoreCart from './store/StoreCart'
import StoreCheckout from './store/StoreCheckout'
import StoreOrderSuccess from './store/StoreOrderSuccess'
import StoreTrackOrder from './store/StoreTrackOrder'

function PrivateRoute({ children }) {
  const { token } = useSelector(s => s.auth)
  if (!token) return <Navigate to="/login" replace />
  return children
}

// Accessible only in admin mode (PIN unlocked or admin/manager role login)
function AdminRoute({ children }) {
  const { token, mode } = useSelector(s => s.auth)
  if (!token) return <Navigate to="/login" replace />
  if (mode !== 'admin') return <Navigate to="/" replace />
  return children
}

// Index redirect: cashier/billing → POS, admin mode → Dashboard
function IndexRedirect() {
  const { mode, role } = useSelector(s => s.auth)
  if (mode === 'admin' || role === 'admin' || role === 'manager') {
    return <DashboardPage />
  }
  return <POSPage />
}

export default function App() {
  const { token } = useSelector(s => s.auth)

  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={token ? <Navigate to="/" /> : <LoginPage />} />

      {/* ── Online Store (public) ── */}
      <Route path="/store" element={<StoreLayout />}>
        <Route index element={<StoreHome />} />
        <Route path="shop" element={<StoreShop />} />
        <Route path="product/:id" element={<StoreProduct />} />
        <Route path="cart" element={<StoreCart />} />
        <Route path="checkout" element={<StoreCheckout />} />
        <Route path="order-success" element={<StoreOrderSuccess />} />
        <Route path="track" element={<StoreTrackOrder />} />
      </Route>

      {/* ── App (single layout, mode-based) ── */}
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<IndexRedirect />} />
        <Route path="pos" element={<POSPage />} />
        <Route path="products"      element={<AdminRoute><ProductsPage /></AdminRoute>} />
        <Route path="invoices"      element={<AdminRoute><InvoicesPage /></AdminRoute>} />
        <Route path="customers"     element={<AdminRoute><CustomersPage /></AdminRoute>} />
        <Route path="suppliers"     element={<AdminRoute><SuppliersPage /></AdminRoute>} />
        <Route path="purchases"     element={<AdminRoute><PurchasesPage /></AdminRoute>} />
        <Route path="expenses"      element={<AdminRoute><ExpensesPage /></AdminRoute>} />
        <Route path="reports"       element={<AdminRoute><ReportsPage /></AdminRoute>} />
        <Route path="online-orders" element={<AdminRoute><OnlineOrdersPage /></AdminRoute>} />
        <Route path="users"         element={<AdminRoute><UsersPage /></AdminRoute>} />
        <Route path="settings"      element={<AdminRoute><SettingsPage /></AdminRoute>} />
      </Route>
    </Routes>
  )
}
