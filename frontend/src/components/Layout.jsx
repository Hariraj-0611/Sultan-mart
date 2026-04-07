import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout, setMode } from '../store/authSlice'
import { useEffect, useState, useRef } from 'react'
import api from '../api/client'
import {
  LayoutDashboard, ShoppingCart, Package, FileText, Users,
  Truck, ShoppingBag, Receipt, BarChart2, UserCog, LogOut,
  Store, ChevronRight, Globe, Shield, Zap, X, Settings
} from 'lucide-react'

const ADMIN_PIN = '1234' // fallback only

const getAdminPin = () => localStorage.getItem('admin_pin') || ADMIN_PIN

/* ── PIN Modal ── */
function PinModal({ onSuccess, onClose }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const verify = async (enteredPin) => {
    setLoading(true)
    try {
      await api.post('/reports/pin/', { pin: enteredPin })
      onSuccess()
    } catch {
      setError('Wrong PIN')
      setTimeout(() => { setPin(''); setError('') }, 800)
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (digit) => {
    if (loading || pin.length >= 4) return
    const next = pin + digit
    setPin(next)
    if (next.length === 4) verify(next)
  }

  // Keyboard support
  useEffect(() => {
    const handler = (e) => {
      if (e.key >= '0' && e.key <= '9') handleKey(e.key)
      else if (e.key === 'Backspace') setPin(p => p.slice(0, -1))
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [pin, loading])

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(10,20,35,.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, backdropFilter:'blur(4px)' }}>
      <div style={{ background:'#fff', borderRadius:20, width:300, overflow:'hidden', boxShadow:'0 24px 64px rgba(0,0,0,.3)' }}>
        <div style={{ background:'var(--brand)', padding:'20px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Shield size={18} color="#fff" />
            <span style={{ color:'#fff', fontWeight:700, fontSize:15 }}>Admin PIN</span>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,.7)', display:'flex' }}><X size={16} /></button>
        </div>
        <div style={{ padding:'24px' }}>
          <p style={{ fontSize:12, color:'var(--text-sub)', textAlign:'center', marginBottom:16 }}>Enter 4-digit PIN to access Admin Mode</p>

          {/* PIN dots */}
          <div style={{ display:'flex', justifyContent:'center', gap:14, marginBottom:16 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ width:16, height:16, borderRadius:'50%', background: pin.length > i ? 'var(--brand)' : '#dce6ef', transition:'background .15s', boxShadow: pin.length > i ? '0 0 6px rgba(26,60,94,.4)' : 'none' }} />
            ))}
          </div>

          {error && <p style={{ color:'#e74c3c', fontSize:12, textAlign:'center', marginBottom:10 }}>{error}</p>}
          {loading && <p style={{ color:'var(--text-muted)', fontSize:12, textAlign:'center', marginBottom:10 }}>Verifying...</p>}

          {/* Numpad */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((d, i) => (
              <button key={i} onClick={() => {
                if (d === '⌫') setPin(p => p.slice(0,-1))
                else if (d !== '') handleKey(String(d))
              }}
                disabled={loading}
                style={{ padding:'15px', borderRadius:10, background: d === '' ? 'transparent' : '#f8fafc', fontSize:20, fontWeight:700, cursor: d === '' ? 'default' : 'pointer', color:'var(--text-main)', transition:'all .1s', border: d==='' ? 'none' : '1.5px solid var(--border)' }}
                onMouseEnter={e => { if(d !== '') { e.currentTarget.style.background='var(--brand)'; e.currentTarget.style.color='#fff' }}}
                onMouseLeave={e => { e.currentTarget.style.background= d==='' ? 'transparent':'#f8fafc'; e.currentTarget.style.color='var(--text-main)' }}
              >{d}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const adminNav = [
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard',     exact: true },
  { to: '/pos',           icon: ShoppingCart,    label: 'POS Billing'    },
  { to: '/products',      icon: Package,         label: 'Products'       },
  { to: '/invoices',      icon: FileText,        label: 'Invoices'       },
  { to: '/customers',     icon: Users,           label: 'Customers'      },
  { to: '/suppliers',     icon: Truck,           label: 'Suppliers'      },
  { to: '/purchases',     icon: ShoppingBag,     label: 'Purchases'      },
  { to: '/expenses',      icon: Receipt,         label: 'Expenses'       },
  { to: '/reports',       icon: BarChart2,       label: 'Reports'        },
  { to: '/online-orders', icon: Globe,           label: 'Online Orders', badge: true },
  { to: '/users',         icon: UserCog,         label: 'Users'          },
  { to: '/settings',      icon: Settings,        label: 'Settings'       },
]

const S = {
  shell:   { display:'flex', height:'100vh', background:'var(--page-bg)', overflow:'hidden' },
  sidebar: { width:220, background:'var(--sidebar-bg)', display:'flex', flexDirection:'column', flexShrink:0, boxShadow:'2px 0 8px rgba(0,0,0,.15)' },
  brand:   { padding:'20px 18px 16px', borderBottom:'1px solid rgba(255,255,255,.1)' },
  nav:     { flex:1, overflowY:'auto', padding:'10px 0' },
  footer:  { padding:'10px 10px 14px', borderTop:'1px solid rgba(255,255,255,.08)' },
  footerBtn: { display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8, width:'100%', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,.55)', fontSize:13, fontWeight:500 },
  main:    { flex:1, overflow:'auto', display:'flex', flexDirection:'column' },
  topbar:  { background:'#fff', borderBottom:'1px solid var(--border)', padding:'0 24px', height:52, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 },
  content: { flex:1, overflow:'auto' },
}

function NavItem({ to, icon: Icon, label, exact, badge, pendingCount }) {
  return (
    <NavLink to={to} end={exact}
      style={({ isActive }) => ({
        display:'flex', alignItems:'center', gap:10, padding:'9px 18px',
        fontSize:13, fontWeight: isActive ? 600 : 400,
        color: isActive ? '#fff' : 'rgba(255,255,255,.6)',
        background: isActive ? 'var(--accent)' : 'transparent',
        borderLeft: isActive ? '3px solid #fff' : '3px solid transparent',
        textDecoration:'none', transition:'all .15s', marginBottom:1,
      })}
      onMouseEnter={e => { if (!e.currentTarget.style.background.includes('accent')) e.currentTarget.style.background='rgba(255,255,255,.07)' }}
      onMouseLeave={e => { if (!e.currentTarget.style.background.includes('accent')) e.currentTarget.style.background='transparent' }}
    >
      <Icon size={15} />
      <span style={{ flex:1 }}>{label}</span>
      {badge && pendingCount > 0 && (
        <span style={{ background:'#e74c3c', color:'#fff', borderRadius:20, minWidth:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, padding:'0 5px' }}>
          {pendingCount > 99 ? '99+' : pendingCount}
        </span>
      )}
    </NavLink>
  )
}

export default function Layout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, mode } = useSelector(s => s.auth)
  const [pendingOrders, setPendingOrders] = useState(0)
  const prevPendingRef = useRef(null)
  const [showPin, setShowPin] = useState(false)
  const [newOrderAlert, setNewOrderAlert] = useState(null)

  useEffect(() => {
    const fetch = () => api.get('/ecommerce/orders/pending_count/').then(r => {
      const count = r.data.count || 0
      setPendingOrders(count)
      // Show notification if new orders came in (not on first load)
      if (prevPendingRef.current !== null && count > prevPendingRef.current) {
        const newCount = count - prevPendingRef.current
        setNewOrderAlert(newCount)
        // Play a beep sound
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)()
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain); gain.connect(ctx.destination)
          osc.frequency.value = 880
          gain.gain.setValueAtTime(0.3, ctx.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
          osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4)
        } catch {}
        setTimeout(() => setNewOrderAlert(null), 8000)
      }
      prevPendingRef.current = count
    }).catch(() => {})
    fetch()
    const t = setInterval(fetch, 10000)
    return () => clearInterval(t)
  }, [])

  const handleLogout = () => { dispatch(logout()); navigate('/login') }

  const switchToAdmin = () => setShowPin(true)
  const switchToBilling = () => { dispatch(setMode('billing')); navigate('/') }

  const onPinSuccess = () => {
    setShowPin(false)
    dispatch(setMode('admin'))
    navigate('/')
  }

  const isBilling = mode === 'billing'

  return (
    <div style={S.shell}>
      {showPin && <PinModal onSuccess={onPinSuccess} onClose={() => setShowPin(false)} />}

      {/* ── New Order Alert ── */}
      {newOrderAlert && (
        <div onClick={() => { if (!isBilling) navigate('/online-orders'); setNewOrderAlert(null) }}
          style={{ position:'fixed', top:20, right:20, zIndex:9999, background:'#1a3c5e', color:'#fff', borderRadius:14, padding:'14px 20px', boxShadow:'0 8px 32px rgba(0,0,0,.3)', cursor: isBilling ? 'default' : 'pointer', display:'flex', alignItems:'center', gap:12, minWidth:280, animation:'slideIn .3s ease' }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'#e67e22', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:22 }}>
            🛒
          </div>
          <div>
            <p style={{ fontWeight:800, fontSize:15 }}>New Online Order!</p>
            <p style={{ fontSize:12, color:'rgba(255,255,255,.7)', marginTop:2 }}>
              {newOrderAlert} new order{newOrderAlert > 1 ? 's' : ''} waiting
              {!isBilling && ' — click to view'}
            </p>
          </div>
          <button onClick={e => { e.stopPropagation(); setNewOrderAlert(null) }}
            style={{ background:'rgba(255,255,255,.15)', border:'none', borderRadius:8, padding:'4px 8px', cursor:'pointer', color:'#fff', fontSize:16, marginLeft:'auto' }}>
            ✕
          </button>
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside style={S.sidebar}>
        <div style={S.brand}>
          <div style={{ fontSize:18, fontWeight:800, color:'#fff', letterSpacing:.3 }}>Sultan Mart</div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,.45)', marginTop:3, textTransform:'uppercase', letterSpacing:1 }}>
            {isBilling ? 'Billing Mode' : 'Admin Mode'}
          </div>
          {user && (
            <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,.08)', borderRadius:8, padding:'6px 10px' }}>
              <div style={{ width:26, height:26, borderRadius:6, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff' }}>
                {(user.name || 'U')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,.8)', fontWeight:600 }}>{user.name}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,.4)' }}>Owner</div>
              </div>
            </div>
          )}
        </div>

        {/* Mode toggle button */}
        <div style={{ padding:'10px 10px 0' }}>
          {isBilling ? (
            <button onClick={switchToAdmin}
              style={{ width:'100%', padding:'9px 12px', borderRadius:9, border:'1.5px solid rgba(230,126,34,.5)', background:'rgba(230,126,34,.12)', color:'#e67e22', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
              <Shield size={13} /> Switch to Admin Mode
            </button>
          ) : (
            <button onClick={switchToBilling}
              style={{ width:'100%', padding:'9px 12px', borderRadius:9, border:'1.5px solid rgba(39,174,96,.5)', background:'rgba(39,174,96,.12)', color:'#27ae60', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
              <Zap size={13} /> Switch to Billing Mode
            </button>
          )}
        </div>

        {/* Nav */}
        <nav style={S.nav}>
          {isBilling ? (
            // Billing mode — only POS
            <NavItem to="/" icon={ShoppingCart} label="POS Billing" exact />
          ) : (
            // Admin mode — all nav
            adminNav.map(item => <NavItem key={item.to} {...item} pendingCount={item.badge ? pendingOrders : 0} />)
          )}
        </nav>

        <div style={S.footer}>
          <a href="/store" target="_blank" style={{ ...S.footerBtn, textDecoration:'none', display:'flex' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,.07)'; e.currentTarget.style.color='#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='rgba(255,255,255,.55)' }}>
            <Store size={15} /> Online Store
          </a>
          <button style={S.footerBtn} onClick={handleLogout}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(192,57,43,.25)'; e.currentTarget.style.color='#ff8a80' }}
            onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='rgba(255,255,255,.55)' }}>
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={S.main}>
        <div style={S.topbar}>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--text-sub)' }}>
            <span style={{ color:'var(--brand)', fontWeight:600 }}>Sultan Mart</span>
            <ChevronRight size={12} />
            <span style={{ fontWeight:600, color: isBilling ? '#27ae60' : 'var(--accent)' }}>
              {isBilling ? '⚡ Billing Mode' : '🛡 Admin Mode'}
            </span>
          </div>
          <div style={{ fontSize:12, color:'var(--text-muted)' }}>
            {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </div>
        </div>
        <div style={S.content}><Outlet /></div>
      </div>
    </div>
  )
}
