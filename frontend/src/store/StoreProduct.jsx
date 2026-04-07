import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import api from '../api/client'
import { addItem, selectCartItems, setQty } from '../store/cartSlice'
import { ShoppingCart, Star, Shield, Truck, RefreshCw, Plus, Minus, ChevronRight, Package } from 'lucide-react'
import toast from 'react-hot-toast'

export default function StoreProduct() {
  const { id }      = useParams()
  const dispatch    = useDispatch()
  const cartItems   = useSelector(selectCartItems)
  const [product, setProduct]   = useState(null)
  const [related,  setRelated]  = useState([])
  const [qty,      setLocalQty] = useState(1)
  const [loading,  setLoading]  = useState(true)

  const inCart = cartItems.find(i => i.product.id === parseInt(id))

  useEffect(() => {
    setLoading(true)
    api.get(`/ecommerce/catalog/${id}/`)
      .then(r => {
        setProduct(r.data)
        setLoading(false)
        // load related
        if (r.data.category) {
          api.get(`/ecommerce/catalog/?category=${r.data.category}&page_size=4`)
            .then(rr => setRelated((rr.data.results || rr.data).filter(p => p.id !== parseInt(id))))
            .catch(() => {})
        }
      })
      .catch(() => setLoading(false))
  }, [id])

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) dispatch(addItem(product))
    toast.success(`${product.name} added to cart`)
  }

  const discount = product && product.mrp && parseFloat(product.mrp) > parseFloat(product.selling_price)
    ? Math.round((1 - parseFloat(product.selling_price) / parseFloat(product.mrp)) * 100) : 0

  if (loading) return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:40, textAlign:'center', color:'#94a3b8' }}>
      Loading product...
    </div>
  )

  if (!product) return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:40, textAlign:'center' }}>
      <p style={{ fontSize:16, color:'#475569' }}>Product not found.</p>
      <Link to="/store/shop" style={{ color:'#1a3c5e', fontWeight:600 }}>← Back to Shop</Link>
    </div>
  )

  return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'24px' }}>
      {/* Breadcrumb */}
      <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#94a3b8', marginBottom:20 }}>
        <Link to="/store" style={{ color:'#1a3c5e', textDecoration:'none' }}>Home</Link>
        <ChevronRight size={12} />
        <Link to="/store/shop" style={{ color:'#1a3c5e', textDecoration:'none' }}>Shop</Link>
        <ChevronRight size={12} />
        <span>{product.name}</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:40, background:'#fff', borderRadius:16, border:'1px solid #dce6ef', padding:32 }}>
        {/* Image */}
        <div>
          <div style={{ background:'#f0f4f8', borderRadius:14, height:360, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
            {discount > 0 && (
              <div style={{ position:'absolute', top:16, left:16, background:'#e67e22', color:'#fff', fontSize:12, fontWeight:700, padding:'4px 12px', borderRadius:20 }}>
                -{discount}% OFF
              </div>
            )}
            {product.image
              ? <img src={product.image} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'contain', padding:20 }} />
              : <span style={{ fontSize:80 }}>📦</span>}
          </div>
        </div>

        {/* Details */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <p style={{ fontSize:12, color:'#94a3b8', marginBottom:4 }}>{product.category_name}</p>
            <h1 style={{ fontSize:24, fontWeight:800, color:'#1c2833', lineHeight:1.3 }}>{product.name}</h1>
          </div>

          {/* Rating */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ display:'flex', gap:2 }}>
              {[1,2,3,4,5].map(s => <Star key={s} size={14} fill="#f59e0b" color="#f59e0b" />)}
            </div>
            <span style={{ fontSize:12, color:'#64748b' }}>4.5 (48 reviews)</span>
          </div>

          {/* Price */}
          <div style={{ display:'flex', alignItems:'baseline', gap:12 }}>
            <span style={{ fontSize:32, fontWeight:900, color:'#1a3c5e' }}>₹{product.selling_price}</span>
            {discount > 0 && (
              <>
                <span style={{ fontSize:18, color:'#94a3b8', textDecoration:'line-through' }}>₹{product.mrp}</span>
                <span style={{ fontSize:14, color:'#27ae60', fontWeight:700 }}>Save ₹{(parseFloat(product.mrp) - parseFloat(product.selling_price)).toFixed(2)}</span>
              </>
            )}
          </div>

          {/* GST */}
          {product.gst_rate > 0 && (
            <p style={{ fontSize:11, color:'#94a3b8' }}>Inclusive of {product.gst_rate}% GST</p>
          )}

          {/* Stock */}
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background: parseFloat(product.stock_quantity) > 0 ? '#27ae60' : '#e74c3c' }} />
            <span style={{ fontSize:13, fontWeight:600, color: parseFloat(product.stock_quantity) > 0 ? '#27ae60' : '#e74c3c' }}>
              {parseFloat(product.stock_quantity) > 0 ? `In Stock (${product.stock_quantity} ${product.unit_name})` : 'Out of Stock'}
            </span>
          </div>

          {/* Description */}
          {product.description && (
            <p style={{ fontSize:13, color:'#475569', lineHeight:1.7, background:'#f8fafc', borderRadius:8, padding:'12px 14px', border:'1px solid #eef2f6' }}>
              {product.description}
            </p>
          )}

          {/* Qty + Add */}
          {parseFloat(product.stock_quantity) > 0 && (
            <div style={{ display:'flex', gap:12, alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', border:'1.5px solid #dce6ef', borderRadius:10, overflow:'hidden' }}>
                <button onClick={() => setLocalQty(q => Math.max(1, q-1))}
                  style={{ width:40, height:44, border:'none', background:'#f8fafc', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Minus size={14} color="#475569" />
                </button>
                <span style={{ width:44, textAlign:'center', fontSize:15, fontWeight:700, color:'#1c2833' }}>{qty}</span>
                <button onClick={() => setLocalQty(q => q+1)}
                  style={{ width:40, height:44, border:'none', background:'#f8fafc', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Plus size={14} color="#475569" />
                </button>
              </div>
              <button onClick={handleAdd}
                style={{ flex:1, padding:'12px', borderRadius:10, border:'none', background:'#1a3c5e', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 3px 10px rgba(26,60,94,.3)' }}>
                <ShoppingCart size={16} />
                {inCart ? `Add More (${inCart.qty} in cart)` : 'Add to Cart'}
              </button>
            </div>
          )}

          {inCart && (
            <Link to="/store/cart"
              style={{ textAlign:'center', padding:'10px', borderRadius:10, border:'1.5px solid #1a3c5e', color:'#1a3c5e', fontSize:13, fontWeight:700, textDecoration:'none', display:'block' }}>
              View Cart ({inCart.qty} items) →
            </Link>
          )}

          {/* Trust badges */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, paddingTop:8 }}>
            {[
              { icon: Truck,     label:'Free Delivery', sub:'Above ₹500' },
              { icon: Shield,    label:'Genuine',       sub:'100% verified' },
              { icon: RefreshCw, label:'Easy Return',   sub:'7 days' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} style={{ textAlign:'center', padding:'10px 8px', background:'#f8fafc', borderRadius:10, border:'1px solid #eef2f6' }}>
                <Icon size={16} color="#1a3c5e" style={{ margin:'0 auto 4px' }} />
                <p style={{ fontSize:11, fontWeight:700, color:'#1c2833' }}>{label}</p>
                <p style={{ fontSize:10, color:'#94a3b8' }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div style={{ marginTop:40 }}>
          <h2 style={{ fontSize:18, fontWeight:800, color:'#1c2833', marginBottom:16 }}>Related Products</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
            {related.slice(0,4).map(p => (
              <Link key={p.id} to={`/store/product/${p.id}`} style={{ textDecoration:'none', background:'#fff', borderRadius:12, border:'1px solid #dce6ef', overflow:'hidden', transition:'box-shadow .15s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 14px rgba(0,0,0,.08)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>
                <div style={{ height:120, background:'#f0f4f8', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {p.image ? <img src={p.image} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontSize:32 }}>📦</span>}
                </div>
                <div style={{ padding:'10px 12px' }}>
                  <p style={{ fontSize:12, fontWeight:600, color:'#1c2833' }}>{p.name}</p>
                  <p style={{ fontSize:13, fontWeight:800, color:'#1a3c5e', marginTop:4 }}>₹{p.selling_price}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
