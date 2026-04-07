import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { selectCartItems, selectCartTotal, setQty, removeItem, clearCart } from '../store/cartSlice'
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Tag, ChevronRight, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'

// Define promo codes here
const PROMO_CODES = {
  'SULTAN10': { type:'percent', value:10, minOrder:500, label:'10% off on orders above ₹500' },
  'FLAT50':   { type:'flat',    value:50, minOrder:200, label:'₹50 off on orders above ₹200' },
  'WELCOME':  { type:'percent', value:5,  minOrder:0,   label:'5% off — Welcome offer' },
}

export default function StoreCart() {
  const dispatch = useDispatch()
  const items    = useSelector(selectCartItems)
  const total    = useSelector(selectCartTotal)
  const [promoInput, setPromoInput] = useState('')
  const [appliedPromo, setAppliedPromo] = useState(null)

  const gst      = items.reduce((s, i) => s + parseFloat(i.product.selling_price) * i.qty * (i.product.gst_rate / 100), 0)
  const subtotal = total - gst
  const delivery = total >= 500 ? 0 : 40

  // Promo discount
  const promoDiscount = appliedPromo
    ? appliedPromo.type === 'percent'
      ? parseFloat((total * appliedPromo.value / 100).toFixed(2))
      : appliedPromo.value
    : 0
  const grandTotal = total + delivery - promoDiscount

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase()
    if (!code) return toast.error('Enter a promo code')
    const promo = PROMO_CODES[code]
    if (!promo) return toast.error('Invalid promo code')
    if (total < promo.minOrder) return toast.error(`Minimum order ₹${promo.minOrder} required`)
    setAppliedPromo({ ...promo, code })
    toast.success(`Promo applied — ${promo.label}`)
    setPromoInput('')
  }

  const removePromo = () => { setAppliedPromo(null); toast.success('Promo removed') }

  if (items.length === 0) return (
    <div style={{ maxWidth:600, margin:'60px auto', textAlign:'center', padding:24 }}>
      <div style={{ fontSize:80, marginBottom:16 }}>🛒</div>
      <h2 style={{ fontSize:22, fontWeight:800, color:'#1c2833', marginBottom:8 }}>Your cart is empty</h2>
      <p style={{ fontSize:14, color:'#64748b', marginBottom:24 }}>Looks like you haven't added anything yet.</p>
      <Link to="/store/shop"
        style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 28px', borderRadius:10, background:'#1a3c5e', color:'#fff', textDecoration:'none', fontWeight:700, fontSize:14 }}>
        Start Shopping <ArrowRight size={16} />
      </Link>
    </div>
  )

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px' }}>
      {/* Breadcrumb */}
      <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#94a3b8', marginBottom:20 }}>
        <Link to="/store" style={{ color:'#1a3c5e', textDecoration:'none' }}>Home</Link>
        <ChevronRight size={12} /><span>Cart</span>
      </div>

      <h1 style={{ fontSize:22, fontWeight:800, color:'#1c2833', marginBottom:20 }}>
        Shopping Cart <span style={{ fontSize:14, color:'#94a3b8', fontWeight:400 }}>({items.length} item{items.length!==1?'s':''})</span>
      </h1>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:24 }}>
        {/* Items */}
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #dce6ef', overflow:'hidden' }}>
          <div style={{ padding:'12px 20px', background:'#f8fafc', borderBottom:'1px solid #eef2f6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:13, fontWeight:600, color:'#475569' }}>Product</span>
            <button onClick={() => { dispatch(clearCart()); toast.success('Cart cleared') }}
              style={{ fontSize:12, color:'#e74c3c', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>
              Clear All
            </button>
          </div>

          {items.map((item, i) => (
            <div key={item.product.id} style={{ display:'grid', gridTemplateColumns:'80px 1fr auto auto', gap:16, padding:'16px 20px', borderBottom: i < items.length-1 ? '1px solid #f1f5f9' : 'none', alignItems:'center' }}>
              {/* Image */}
              <div style={{ width:80, height:80, borderRadius:10, background:'#f0f4f8', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                {item.product.image
                  ? <img src={item.product.image} alt={item.product.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <span style={{ fontSize:28 }}>📦</span>}
              </div>

              {/* Info */}
              <div>
                <Link to={`/store/product/${item.product.id}`} style={{ fontSize:14, fontWeight:600, color:'#1c2833', textDecoration:'none' }}>
                  {item.product.name}
                </Link>
                <p style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{item.product.category_name}</p>
                <p style={{ fontSize:13, fontWeight:700, color:'#1a3c5e', marginTop:4 }}>₹{item.product.selling_price} each</p>
              </div>

              {/* Qty */}
              <div style={{ display:'flex', alignItems:'center', border:'1.5px solid #dce6ef', borderRadius:8, overflow:'hidden' }}>
                <button onClick={() => dispatch(setQty({ id: item.product.id, qty: item.qty - 1 }))}
                  style={{ width:32, height:34, border:'none', background:'#f8fafc', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Minus size={12} color="#475569" />
                </button>
                <span style={{ width:36, textAlign:'center', fontSize:14, fontWeight:700, color:'#1c2833' }}>{item.qty}</span>
                <button onClick={() => dispatch(setQty({ id: item.product.id, qty: item.qty + 1 }))}
                  style={{ width:32, height:34, border:'none', background:'#f8fafc', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Plus size={12} color="#475569" />
                </button>
              </div>

              {/* Total + Remove */}
              <div style={{ textAlign:'right' }}>
                <p style={{ fontSize:15, fontWeight:800, color:'#1a3c5e' }}>₹{(parseFloat(item.product.selling_price) * item.qty).toFixed(2)}</p>
                <button onClick={() => { dispatch(removeItem(item.product.id)); toast.success('Removed') }}
                  style={{ background:'none', border:'none', cursor:'pointer', marginTop:4, display:'flex', alignItems:'center', gap:3, fontSize:11, color:'#e74c3c', fontWeight:600, marginLeft:'auto' }}>
                  <Trash2 size={11} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid #dce6ef', padding:20 }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:'#1c2833', marginBottom:16 }}>Order Summary</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                ['Subtotal', `₹${subtotal.toFixed(2)}`],
                ['GST', `₹${gst.toFixed(2)}`],
                ['Delivery', delivery === 0 ? <span style={{ color:'#27ae60', fontWeight:700 }}>FREE</span> : `₹${delivery}`],
              ].map(([label, val]) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#475569' }}>
                  <span>{label}</span><span style={{ fontWeight:600, color:'#1c2833' }}>{val}</span>
                </div>
              ))}
              {promoDiscount > 0 && (
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#16a34a', fontWeight:600 }}>
                  <span>Promo ({appliedPromo.code})</span>
                  <span>- ₹{promoDiscount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ borderTop:'1px dashed #dce6ef', paddingTop:10, display:'flex', justifyContent:'space-between', fontSize:16, fontWeight:800 }}>
                <span style={{ color:'#1c2833' }}>Total</span>
                <span style={{ color:'#e67e22' }}>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {delivery > 0 && (
              <div style={{ marginTop:12, background:'#fef9c3', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#92400e' }}>
                Add ₹{(500 - total).toFixed(2)} more for free delivery
              </div>
            )}

            <Link to="/store/checkout" state={{ promoDiscount, promoCode: appliedPromo?.code }}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:16, padding:'13px', borderRadius:10, background:'#1a3c5e', color:'#fff', textDecoration:'none', fontWeight:700, fontSize:14, boxShadow:'0 3px 10px rgba(26,60,94,.3)' }}>
              Proceed to Checkout <ArrowRight size={16} />
            </Link>
            <Link to="/store/shop"
              style={{ display:'block', textAlign:'center', marginTop:10, fontSize:13, color:'#64748b', textDecoration:'none' }}>
              ← Continue Shopping
            </Link>
          </div>

          {/* Promo */}
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid #dce6ef', padding:16 }}>
            <p style={{ fontSize:12, fontWeight:700, color:'#475569', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
              <Tag size={13} /> Apply Promo Code
            </p>
            {appliedPromo ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#f0fdf4', border:'1.5px solid #bbf7d0', borderRadius:8, padding:'10px 14px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <Check size={15} color="#16a34a" />
                  <div>
                    <p style={{ fontSize:13, fontWeight:700, color:'#15803d' }}>{appliedPromo.code}</p>
                    <p style={{ fontSize:11, color:'#16a34a' }}>{appliedPromo.label}</p>
                  </div>
                </div>
                <button onClick={removePromo} style={{ background:'none', border:'none', cursor:'pointer', display:'flex' }}>
                  <X size={15} color="#dc2626" />
                </button>
              </div>
            ) : (
              <div style={{ display:'flex', gap:8 }}>
                <input
                  style={{ flex:1, padding:'8px 12px', border:'1.5px solid #dce6ef', borderRadius:8, fontSize:12, outline:'none', textTransform:'uppercase' }}
                  placeholder="Enter code (e.g. SULTAN10)"
                  value={promoInput}
                  onChange={e => setPromoInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applyPromo()}
                />
                <button onClick={applyPromo} style={{ padding:'8px 14px', borderRadius:8, border:'none', background:'#1a3c5e', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
