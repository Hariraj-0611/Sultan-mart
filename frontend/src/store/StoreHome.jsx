import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import api from '../api/client'
import { addItem } from '../store/cartSlice'
import { ShoppingCart, ArrowRight, Star, Truck, Shield, RefreshCw, Headphones, Tag, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

const C = {
  wrap:  { maxWidth:1200, margin:'0 auto', padding:'0 24px' },
  btn:   { display:'inline-flex', alignItems:'center', gap:8, padding:'12px 28px', borderRadius:10, border:'none', fontWeight:700, fontSize:14, cursor:'pointer', textDecoration:'none' },
}

function ProductCard({ product }) {
  const dispatch = useDispatch()
  return (
    <div style={{ background:'#fff', borderRadius:14, border:'1px solid #dce6ef', overflow:'hidden', transition:'all .2s', cursor:'pointer' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,.1)'; e.currentTarget.style.transform='translateY(-3px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='none' }}>
      <Link to={`/store/product/${product.id}`} style={{ textDecoration:'none' }}>
        <div style={{ height:160, background:'#f0f4f8', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
          {product.image
            ? <img src={product.image} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <span style={{ fontSize:48 }}>📦</span>}
        </div>
        <div style={{ padding:'12px 14px 8px' }}>
          <p style={{ fontSize:11, color:'#94a3b8', marginBottom:3 }}>{product.category_name}</p>
          <p style={{ fontSize:13, fontWeight:600, color:'#1c2833', marginBottom:6, lineHeight:1.4 }}>{product.name}</p>
          <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:8 }}>
            {[1,2,3,4,5].map(s => <Star key={s} size={11} fill="#f59e0b" color="#f59e0b" />)}
            <span style={{ fontSize:10, color:'#94a3b8' }}>(24)</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <span style={{ fontSize:16, fontWeight:800, color:'#1a3c5e' }}>₹{product.selling_price}</span>
              {product.mrp && parseFloat(product.mrp) > parseFloat(product.selling_price) && (
                <span style={{ fontSize:11, color:'#94a3b8', textDecoration:'line-through', marginLeft:6 }}>₹{product.mrp}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
      <div style={{ padding:'0 14px 14px' }}>
        <button onClick={() => { dispatch(addItem(product)); toast.success(`${product.name} added to cart`) }}
          style={{ width:'100%', padding:'8px', borderRadius:8, border:'none', background:'#1a3c5e', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
          <ShoppingCart size={13} /> Add to Cart
        </button>
      </div>
    </div>
  )
}

export default function StoreHome() {
  const [featured, setFeatured]   = useState([])
  const [categories, setCategories] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/ecommerce/catalog/?page_size=8').then(r => setFeatured(r.data.results || r.data)).catch(() => {})
    api.get('/inventory/categories/flat/').then(r => setCategories(r.data.slice(0, 8))).catch(() => {})
  }, [])

  const catIcons = { Groceries:'🌾', Beverages:'🥤', Snacks:'🍿', Dairy:'🥛', 'Personal Care':'🧴', Household:'🏠', Stationery:'📝', Electronics:'📱' }

  return (
    <div>
      {/* ── Hero Banner ── */}
      <div style={{ background:'linear-gradient(135deg, #1a3c5e 0%, #2d6a9f 60%, #1a3c5e 100%)', padding:'60px 0', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-60, right:-60, width:300, height:300, borderRadius:'50%', background:'rgba(230,126,34,.12)' }} />
        <div style={{ position:'absolute', bottom:-40, left:100, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,.05)' }} />
        <div style={{ ...C.wrap, display:'grid', gridTemplateColumns:'1fr 1fr', gap:40, alignItems:'center', position:'relative' }}>
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(230,126,34,.2)', border:'1px solid rgba(230,126,34,.4)', borderRadius:20, padding:'4px 14px', marginBottom:16 }}>
              <Zap size={12} color="#e67e22" />
              <span style={{ fontSize:12, color:'#e67e22', fontWeight:600 }}>Fresh Arrivals Every Day</span>
            </div>
            <h1 style={{ fontSize:42, fontWeight:900, color:'#fff', lineHeight:1.2, marginBottom:16 }}>
              Shop Fresh,<br />
              <span style={{ color:'#e67e22' }}>Save More</span>
            </h1>
            <p style={{ fontSize:15, color:'rgba(255,255,255,.7)', lineHeight:1.7, marginBottom:28, maxWidth:420 }}>
              Get groceries, snacks, beverages and daily essentials delivered to your doorstep. Quality products at the best prices.
            </p>
            <div style={{ display:'flex', gap:12 }}>
              <Link to="/store/shop" style={{ ...C.btn, background:'#e67e22', color:'#fff', boxShadow:'0 4px 16px rgba(230,126,34,.4)' }}>
                Shop Now <ArrowRight size={16} />
              </Link>
              <Link to="/store/track" style={{ ...C.btn, background:'rgba(255,255,255,.1)', color:'#fff', border:'1px solid rgba(255,255,255,.2)' }}>
                Track Order
              </Link>
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'center' }}>
            <div style={{ width:280, height:280, borderRadius:'50%', background:'rgba(255,255,255,.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:120 }}>
              🛒
            </div>
          </div>
        </div>
      </div>

      {/* ── Features strip ── */}
      <div style={{ background:'#fff', borderBottom:'1px solid #dce6ef' }}>
        <div style={{ ...C.wrap, display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:0 }}>
          {[
            { icon: Truck,       color:'#1a3c5e', label:'Free Delivery',    sub:'On orders above ₹500' },
            { icon: Shield,      color:'#27ae60', label:'100% Genuine',     sub:'Verified products only' },
            { icon: RefreshCw,   color:'#e67e22', label:'Easy Returns',     sub:'7-day return policy' },
            { icon: Headphones,  color:'#8b5cf6', label:'24/7 Support',     sub:'Always here to help' },
          ].map(({ icon: Icon, color, label, sub }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:14, padding:'18px 20px', borderRight:'1px solid #eef2f6' }}>
              <div style={{ width:44, height:44, borderRadius:12, background:`${color}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon size={20} color={color} />
              </div>
              <div>
                <p style={{ fontSize:13, fontWeight:700, color:'#1c2833' }}>{label}</p>
                <p style={{ fontSize:11, color:'#94a3b8' }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Categories ── */}
      <div style={{ padding:'40px 0', background:'#f4f7fa' }}>
        <div style={C.wrap}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div>
              <h2 style={{ fontSize:22, fontWeight:800, color:'#1c2833' }}>Shop by Category</h2>
              <p style={{ fontSize:13, color:'#64748b', marginTop:3 }}>Find what you need quickly</p>
            </div>
            <Link to="/store/shop" style={{ fontSize:13, color:'#1a3c5e', fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(8,1fr)', gap:12 }}>
            {categories.map(cat => (
              <Link key={cat.id} to={`/store/shop?cat=${encodeURIComponent(cat.name)}`}
                style={{ textDecoration:'none', background:'#fff', borderRadius:14, padding:'18px 10px', textAlign:'center', border:'1px solid #dce6ef', transition:'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.background='#1a3c5e'; e.currentTarget.style.borderColor='#1a3c5e' }}
                onMouseLeave={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.borderColor='#dce6ef' }}>
                <div style={{ fontSize:28, marginBottom:8 }}>{catIcons[cat.name] || '📦'}</div>
                <p style={{ fontSize:11, fontWeight:600, color:'inherit' }}>{cat.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Featured Products ── */}
      <div style={{ padding:'40px 0', background:'#fff' }}>
        <div style={C.wrap}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div>
              <h2 style={{ fontSize:22, fontWeight:800, color:'#1c2833' }}>Featured Products</h2>
              <p style={{ fontSize:13, color:'#64748b', marginTop:3 }}>Handpicked for you today</p>
            </div>
            <Link to="/store/shop" style={{ fontSize:13, color:'#1a3c5e', fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
            {featured.slice(0, 8).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </div>

      {/* ── Promo Banner ── */}
      <div style={{ padding:'40px 0', background:'#f4f7fa' }}>
        <div style={C.wrap}>
          <div style={{ background:'linear-gradient(135deg,#e67e22,#cf6d17)', borderRadius:20, padding:'36px 40px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <Tag size={16} color="#fff" />
                <span style={{ fontSize:13, color:'rgba(255,255,255,.8)', fontWeight:600 }}>LIMITED TIME OFFER</span>
              </div>
              <h3 style={{ fontSize:28, fontWeight:900, color:'#fff', marginBottom:8 }}>Get 10% off on orders above ₹500</h3>
              <p style={{ fontSize:14, color:'rgba(255,255,255,.8)' }}>Use code <strong>SULTAN10</strong> at checkout</p>
            </div>
            <Link to="/store/shop" style={{ ...C.btn, background:'#fff', color:'#e67e22', flexShrink:0 }}>
              Shop Now <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
