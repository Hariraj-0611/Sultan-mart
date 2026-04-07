import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectCartCount } from '../store/cartSlice'
import { ShoppingCart, Search, Phone, Mail, Package, ChevronRight,
         Facebook, Instagram, Twitter, MapPin, Clock, Truck } from 'lucide-react'
import { useState } from 'react'

export default function StoreLayout() {
  const cartCount = useSelector(selectCartCount)
  const [search, setSearch] = useState('')
  const navigate  = useNavigate()
  const location  = useLocation()

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) navigate(`/store/shop?search=${encodeURIComponent(search.trim())}`)
  }

  const CATS = ['Groceries','Beverages','Snacks','Dairy','Personal Care','Household','Stationery','Bakery']

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', fontFamily:"'Segoe UI',system-ui,sans-serif", display:'flex', flexDirection:'column' }}>

      {/* ── Announcement bar ── */}
      <div style={{ background:'linear-gradient(90deg,#1a3c5e,#2d6a9f,#1a3c5e)', padding:'8px 0', textAlign:'center' }}>
        <p style={{ fontSize:12, color:'#fff', fontWeight:500, letterSpacing:.3 }}>
          🚚 Free delivery on orders above ₹500 &nbsp;|&nbsp; 🎉 Fresh products daily &nbsp;|&nbsp;
          <Link to="/store/shop" style={{ color:'#fbbf24', fontWeight:700, textDecoration:'none', marginLeft:4 }}>Shop Now →</Link>
        </p>
      </div>

      {/* ── Top info bar ── */}
      <div style={{ background:'#0f2744', padding:'6px 0' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', gap:20 }}>
            <span style={{ fontSize:11, color:'rgba(255,255,255,.5)', display:'flex', alignItems:'center', gap:5 }}>
              <Phone size={10} /> +91 98765 43210
            </span>
            <span style={{ fontSize:11, color:'rgba(255,255,255,.5)', display:'flex', alignItems:'center', gap:5 }}>
              <Mail size={10} /> sultanmart@email.com
            </span>
            <span style={{ fontSize:11, color:'rgba(255,255,255,.5)', display:'flex', alignItems:'center', gap:5 }}>
              <Clock size={10} /> Open: 8AM – 10PM
            </span>
          </div>
          <div style={{ display:'flex', gap:16 }}>
            <Link to="/store/track" style={{ fontSize:11, color:'rgba(255,255,255,.6)', textDecoration:'none' }}>Track Order</Link>
            <Link to="/login" style={{ fontSize:11, color:'#fbbf24', textDecoration:'none', fontWeight:600 }}>Staff Login</Link>
          </div>
        </div>
      </div>

      {/* ── Main Header ── */}
      <header style={{ background:'#fff', boxShadow:'0 2px 20px rgba(0,0,0,.08)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px', height:72, display:'flex', alignItems:'center', gap:28 }}>

          {/* Logo */}
          <Link to="/store" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
            <div style={{ background:'linear-gradient(135deg,#1a3c5e,#2d6a9f)', borderRadius:12, padding:'10px 12px', display:'flex', boxShadow:'0 4px 12px rgba(26,60,94,.3)' }}>
              <Package size={22} color="#fbbf24" />
            </div>
            <div>
              <div style={{ fontSize:20, fontWeight:900, color:'#1a3c5e', lineHeight:1, letterSpacing:-.3 }}>Sultan Mart</div>
              <div style={{ fontSize:9, color:'#94a3b8', letterSpacing:2, textTransform:'uppercase', marginTop:1 }}>Online Store</div>
            </div>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} style={{ flex:1, display:'flex', maxWidth:580 }}>
            <div style={{ flex:1, display:'flex', background:'#f1f5f9', borderRadius:12, overflow:'hidden', border:'2px solid transparent', transition:'border .2s' }}
              onFocus={() => {}} >
              <div style={{ display:'flex', alignItems:'center', paddingLeft:14 }}>
                <Search size={16} color="#94a3b8" />
              </div>
              <input
                style={{ flex:1, padding:'11px 14px', border:'none', outline:'none', fontSize:14, color:'#1c2833', background:'transparent' }}
                placeholder="Search products, brands, categories..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button type="submit"
                style={{ background:'linear-gradient(135deg,#1a3c5e,#2d6a9f)', border:'none', padding:'0 22px', cursor:'pointer', display:'flex', alignItems:'center', gap:6, color:'#fff', fontSize:13, fontWeight:600 }}>
                Search
              </button>
            </div>
          </form>

          {/* Nav */}
          <nav style={{ display:'flex', gap:2, flexShrink:0 }}>
            {[['Home','/store'],['Shop','/store/shop'],['Track','/store/track']].map(([label, to]) => (
              <Link key={to} to={to}
                style={{ padding:'8px 14px', borderRadius:8, fontSize:13, fontWeight:600,
                  color: location.pathname === to ? '#1a3c5e' : '#64748b',
                  background: location.pathname === to ? '#e8f0f7' : 'transparent',
                  textDecoration:'none', transition:'all .15s' }}
                onMouseEnter={e => { if(location.pathname !== to) { e.currentTarget.style.background='#f1f5f9'; e.currentTarget.style.color='#1a3c5e' }}}
                onMouseLeave={e => { if(location.pathname !== to) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#64748b' }}}>
                {label}
              </Link>
            ))}
          </nav>

          {/* Cart */}
          <Link to="/store/cart"
            style={{ textDecoration:'none', position:'relative', display:'flex', alignItems:'center', gap:10,
            background:'linear-gradient(135deg,#1a3c5e,#2d6a9f)', borderRadius:12, padding:'10px 18px',
            boxShadow:'0 4px 12px rgba(26,60,94,.25)' }}>
            <div style={{ position:'relative' }}>
              <ShoppingCart size={20} color="#fff" />
              {cartCount > 0 && (
                <span style={{ position:'absolute', top:-8, right:-8, background:'#f59e0b', color:'#fff', borderRadius:20, minWidth:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, padding:'0 4px' }}>
                  {cartCount}
                </span>
              )}
            </div>
            <span style={{ fontSize:13, fontWeight:700, color:'#fff' }}>Cart</span>
          </Link>
        </div>

        {/* Category nav */}
        <div style={{ borderTop:'1px solid #f1f5f9', background:'#fff' }}>
          <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px', display:'flex', gap:0, overflowX:'auto' }}>
            <Link to="/store/shop"
              style={{ padding:'10px 16px', fontSize:12, fontWeight:700, color:'#1a3c5e', textDecoration:'none', whiteSpace:'nowrap',
                borderBottom: !searchParams ? '2px solid #1a3c5e' : '2px solid transparent' }}>
              All Products
            </Link>
            {CATS.map(cat => (
              <Link key={cat} to={`/store/shop?cat=${encodeURIComponent(cat)}`}
                style={{ padding:'10px 16px', fontSize:12, fontWeight:500, color:'#64748b', textDecoration:'none', whiteSpace:'nowrap', borderBottom:'2px solid transparent', transition:'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.color='#1a3c5e'; e.currentTarget.style.borderBottomColor='#1a3c5e' }}
                onMouseLeave={e => { e.currentTarget.style.color='#64748b'; e.currentTarget.style.borderBottomColor='transparent' }}>
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* ── Page Content ── */}
      <main style={{ flex:1 }}>
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer style={{ background:'#0f2744', color:'rgba(255,255,255,.7)', marginTop:'auto' }}>
        {/* Top footer */}
        <div style={{ background:'linear-gradient(135deg,#1a3c5e,#2d6a9f)', padding:'20px 0' }}>
          <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <Truck size={24} color="#fbbf24" />
              <div>
                <p style={{ color:'#fff', fontWeight:700, fontSize:14 }}>Free Delivery</p>
                <p style={{ color:'rgba(255,255,255,.6)', fontSize:12 }}>On orders above ₹500</p>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <Package size={24} color="#fbbf24" />
              <div>
                <p style={{ color:'#fff', fontWeight:700, fontSize:14 }}>100% Genuine</p>
                <p style={{ color:'rgba(255,255,255,.6)', fontSize:12 }}>Verified products only</p>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <Phone size={24} color="#fbbf24" />
              <div>
                <p style={{ color:'#fff', fontWeight:700, fontSize:14 }}>24/7 Support</p>
                <p style={{ color:'rgba(255,255,255,.6)', fontSize:12 }}>Always here to help</p>
              </div>
            </div>
            <Link to="/store/shop"
              style={{ background:'#fbbf24', color:'#1a3c5e', padding:'12px 28px', borderRadius:10, fontWeight:800, fontSize:14, textDecoration:'none', display:'flex', alignItems:'center', gap:8 }}>
              Shop Now <ChevronRight size={16} />
            </Link>
          </div>
        </div>

        {/* Main footer */}
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'48px 24px 32px', display:'grid', gridTemplateColumns:'2.5fr 1fr 1fr 1.2fr', gap:40 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
              <div style={{ background:'linear-gradient(135deg,#1a3c5e,#2d6a9f)', borderRadius:10, padding:'8px 10px', display:'flex' }}>
                <Package size={18} color="#fbbf24" />
              </div>
              <span style={{ fontSize:20, fontWeight:900, color:'#fff', letterSpacing:-.3 }}>Sultan Mart</span>
            </div>
            <p style={{ fontSize:13, lineHeight:1.8, color:'rgba(255,255,255,.5)', marginBottom:20, maxWidth:280 }}>
              Your trusted neighbourhood store, now online. Fresh products, great prices, delivered to your door.
            </p>
            <div style={{ display:'flex', gap:10 }}>
              {[Facebook, Instagram, Twitter].map((Icon, i) => (
                <div key={i} style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.1)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.15)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,.08)'}>
                  <Icon size={15} color="rgba(255,255,255,.7)" />
                </div>
              ))}
            </div>
          </div>

          {[
            { title:'Quick Links', links:[['Home','/store'],['Shop','/store/shop'],['Track Order','/store/track'],['Cart','/store/cart']] },
            { title:'Categories',  links:[['Groceries','/store/shop?cat=Groceries'],['Beverages','/store/shop?cat=Beverages'],['Snacks','/store/shop?cat=Snacks'],['Dairy','/store/shop?cat=Dairy']] },
          ].map(({ title, links }) => (
            <div key={title}>
              <p style={{ fontSize:12, fontWeight:800, color:'#fff', marginBottom:16, textTransform:'uppercase', letterSpacing:1 }}>{title}</p>
              {links.map(([label, to]) => (
                <Link key={label} to={to} style={{ display:'block', fontSize:13, color:'rgba(255,255,255,.5)', marginBottom:10, textDecoration:'none', transition:'color .15s' }}
                  onMouseEnter={e => e.currentTarget.style.color='#fbbf24'}
                  onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,.5)'}>
                  {label}
                </Link>
              ))}
            </div>
          ))}

          <div>
            <p style={{ fontSize:12, fontWeight:800, color:'#fff', marginBottom:16, textTransform:'uppercase', letterSpacing:1 }}>Contact Us</p>
            {[
              [Phone, '+91 98765 43210'],
              [Mail, 'sultanmart@email.com'],
              [MapPin, '123 Main Street, Chennai'],
              [Clock, 'Open: 8AM – 10PM'],
            ].map(([Icon, text]) => (
              <div key={text} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <Icon size={13} color='rgba(251,191,36,.7)' />
                <span style={{ fontSize:12, color:'rgba(255,255,255,.5)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop:'1px solid rgba(255,255,255,.06)', padding:'16px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', maxWidth:1280, margin:'0 auto' }}>
          <span style={{ fontSize:12, color:'rgba(255,255,255,.3)' }}>© {new Date().getFullYear()} Sultan Mart. All rights reserved.</span>
          <span style={{ fontSize:12, color:'rgba(255,255,255,.3)' }}>Powered by Sultan Mart POS</span>
        </div>
      </footer>
    </div>
  )
}

// dummy to avoid unused import warning
const searchParams = null
