import { useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { selectCartItems, selectCartTotal, clearCart } from '../store/cartSlice'
import axios from 'axios'
import { User, Phone, MapPin, MessageSquare, CreditCard, Banknote, Smartphone, ChevronRight, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

const inp = {
  width:'100%', padding:'10px 12px', fontSize:13,
  border:'1.5px solid #dce6ef', borderRadius:8,
  outline:'none', boxSizing:'border-box', background:'#fff',
  transition:'border-color .15s',
}

export default function StoreCheckout() {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const items      = useSelector(selectCartItems)
  const total      = useSelector(selectCartTotal)
  const { state: locState } = useLocation()
  const promoDiscount = locState?.promoDiscount || 0
  const delivery   = total >= 500 ? 0 : 40
  const grandTotal = total + delivery - promoDiscount

  const [form, setForm]     = useState({ name:'', phone:'', email:'', address:'', city:'', pincode:'', notes:'' })
  const [payment, setPayment] = useState('cod')
  const [placing, setPlacing] = useState(false)
  const [step, setStep]       = useState(1)  // 1=details, 2=review

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const orderedRef = useRef(false)

  // Only redirect to cart if not yet ordered
  if (items.length === 0 && !orderedRef.current) {
    navigate('/store/cart')
    return null
  }

  const handlePlaceOrder = async () => {
    setPlacing(true)
    try {
      const { data } = await axios.post('/api/ecommerce/orders/guest_checkout/', {
        name:             form.name,
        phone:            form.phone,
        delivery_address: `${form.address}, ${form.city} - ${form.pincode}`,
        notes:            `${form.notes}${promoDiscount > 0 ? ` | Promo: ${locState?.promoCode} (-₹${promoDiscount})` : ''}`,
        total_amount:     grandTotal.toFixed(2),
        payment_method:   payment,
        items: items.map(item => ({
          product:     item.product.id,
          quantity:    item.qty,
          unit_price:  item.product.selling_price,
          total_price: (parseFloat(item.product.selling_price) * item.qty).toFixed(2),
        })),
      })

      orderedRef.current = true
      navigate('/store/order-success', { state: { order: data, customer: form, grandTotal, payment } })
      dispatch(clearCart())
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to place order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px' }}>
      {/* Breadcrumb */}
      <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#94a3b8', marginBottom:20 }}>
        <Link to="/store" style={{ color:'#1a3c5e', textDecoration:'none' }}>Home</Link>
        <ChevronRight size={12} />
        <Link to="/store/cart" style={{ color:'#1a3c5e', textDecoration:'none' }}>Cart</Link>
        <ChevronRight size={12} />
        <span>Checkout</span>
      </div>

      {/* Steps */}
      <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:28 }}>
        {[['1','Delivery Details'],['2','Review & Pay']].map(([n, label], i) => (
          <div key={n} style={{ display:'flex', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700,
                background: step >= parseInt(n) ? '#1a3c5e' : '#dce6ef',
                color:      step >= parseInt(n) ? '#fff'    : '#94a3b8' }}>
                {n}
              </div>
              <span style={{ fontSize:13, fontWeight: step === parseInt(n) ? 700 : 400, color: step >= parseInt(n) ? '#1a3c5e' : '#94a3b8' }}>{label}</span>
            </div>
            {i === 0 && <div style={{ width:60, height:2, background: step >= 2 ? '#1a3c5e' : '#dce6ef', margin:'0 12px' }} />}
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:24 }}>

        {/* Left panel */}
        <div>
          {step === 1 && (
            <div style={{ background:'#fff', borderRadius:14, border:'1px solid #dce6ef', padding:24 }}>
              <h2 style={{ fontSize:16, fontWeight:700, color:'#1c2833', marginBottom:20 }}>Delivery Details</h2>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                {[
                  { key:'name',    label:'Full Name',    icon:User,         placeholder:'Your full name',       required:true },
                  { key:'phone',   label:'Phone Number', icon:Phone,        placeholder:'+91 98765 43210',      required:true },
                  { key:'email',   label:'Email',        icon:null,         placeholder:'email@example.com',    span:false },
                  { key:'address', label:'Street Address',icon:MapPin,      placeholder:'House no, Street name', required:true, span:true },
                  { key:'city',    label:'City',         icon:null,         placeholder:'Chennai',              required:true },
                  { key:'pincode', label:'Pincode',      icon:null,         placeholder:'600001',               required:true },
                  { key:'notes',   label:'Order Notes',  icon:MessageSquare,placeholder:'Any special instructions...', span:true },
                ].map(({ key, label, icon:Icon, placeholder, required, span }) => (
                  <div key={key} style={{ gridColumn: span ? '1/-1' : 'auto' }}>
                    <label style={{ fontSize:11, fontWeight:600, color:'#64748b', display:'flex', alignItems:'center', gap:5, marginBottom:5 }}>
                      {Icon && <Icon size={11} />} {label}{required && <span style={{ color:'#e74c3c' }}>*</span>}
                    </label>
                    {key === 'notes' || key === 'address'
                      ? <textarea style={{ ...inp, resize:'none' }} rows={2} value={form[key]} onChange={set(key)} placeholder={placeholder}
                          onFocus={e => e.target.style.borderColor='#1a3c5e'} onBlur={e => e.target.style.borderColor='#dce6ef'} />
                      : <input style={inp} value={form[key]} onChange={set(key)} placeholder={placeholder} required={required}
                          onFocus={e => e.target.style.borderColor='#1a3c5e'} onBlur={e => e.target.style.borderColor='#dce6ef'} />
                    }
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  if (!form.name || !form.phone || !form.address || !form.city || !form.pincode)
                    return toast.error('Please fill all required fields')
                  setStep(2)
                }}
                style={{ marginTop:20, width:'100%', padding:'12px', borderRadius:10, border:'none', background:'#1a3c5e', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                Continue to Review →
              </button>
            </div>
          )}

          {step === 2 && (
            <div style={{ background:'#fff', borderRadius:14, border:'1px solid #dce6ef', padding:24 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <h2 style={{ fontSize:16, fontWeight:700, color:'#1c2833' }}>Review & Payment</h2>
                <button onClick={() => setStep(1)} style={{ fontSize:12, color:'#1a3c5e', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>← Edit Details</button>
              </div>

              {/* Delivery address summary */}
              <div style={{ background:'#f8fafc', borderRadius:10, padding:'12px 16px', marginBottom:20, border:'1px solid #eef2f6' }}>
                <p style={{ fontSize:11, fontWeight:700, color:'#64748b', marginBottom:6, textTransform:'uppercase', letterSpacing:.5 }}>Delivering to</p>
                <p style={{ fontSize:13, fontWeight:600, color:'#1c2833' }}>{form.name} · {form.phone}</p>
                <p style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{form.address}, {form.city} - {form.pincode}</p>
              </div>

              {/* Payment method */}
              <p style={{ fontSize:13, fontWeight:700, color:'#1c2833', marginBottom:12 }}>Payment Method</p>
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
                {[
                  { val:'cod',  icon:Banknote,    label:'Cash on Delivery',  sub:'Pay when your order arrives' },
                  { val:'upi',  icon:Smartphone,  label:'UPI Payment',       sub:'GPay, PhonePe, Paytm' },
                  { val:'card', icon:CreditCard,  label:'Card Payment',      sub:'Debit / Credit card' },
                ].map(({ val, icon:Icon, label, sub }) => (
                  <label key={val} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', borderRadius:10, border:`2px solid ${payment===val?'#1a3c5e':'#dce6ef'}`, background: payment===val?'#e8f0f7':'#fff', cursor:'pointer', transition:'all .15s' }}>
                    <input type="radio" name="payment" value={val} checked={payment===val} onChange={() => setPayment(val)} style={{ display:'none' }} />
                    <div style={{ width:36, height:36, borderRadius:10, background: payment===val?'#1a3c5e':'#f0f4f8', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Icon size={18} color={payment===val?'#fff':'#64748b'} />
                    </div>
                    <div>
                      <p style={{ fontSize:13, fontWeight:700, color: payment===val?'#1a3c5e':'#1c2833' }}>{label}</p>
                      <p style={{ fontSize:11, color:'#94a3b8' }}>{sub}</p>
                    </div>
                    {payment===val && <div style={{ marginLeft:'auto', width:18, height:18, borderRadius:'50%', background:'#1a3c5e', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:'#fff' }} />
                    </div>}
                  </label>
                ))}
              </div>

              <button onClick={handlePlaceOrder} disabled={placing}
                style={{ width:'100%', padding:'14px', borderRadius:10, border:'none', background: placing?'#a0b4c8':'#1a3c5e', color:'#fff', fontSize:15, fontWeight:700, cursor: placing?'not-allowed':'pointer', boxShadow:'0 4px 14px rgba(26,60,94,.3)', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {placing ? 'Placing Order...' : `Place Order · ₹${grandTotal.toFixed(2)}`}
              </button>

              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:12, fontSize:11, color:'#94a3b8' }}>
                <ShieldCheck size={13} color="#27ae60" /> Secure & encrypted checkout
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #dce6ef', padding:20, height:'fit-content' }}>
          <h3 style={{ fontSize:15, fontWeight:700, color:'#1c2833', marginBottom:14 }}>Order Summary</h3>
          <div style={{ maxHeight:240, overflowY:'auto', marginBottom:14 }}>
            {items.map(item => (
              <div key={item.product.id} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:'1px solid #f1f5f9' }}>
                <div style={{ width:44, height:44, borderRadius:8, background:'#f0f4f8', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {item.product.image ? <img src={item.product.image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:8 }} /> : <span style={{ fontSize:18 }}>📦</span>}
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:12, fontWeight:600, color:'#1c2833' }}>{item.product.name}</p>
                  <p style={{ fontSize:11, color:'#94a3b8' }}>Qty: {item.qty}</p>
                </div>
                <span style={{ fontSize:13, fontWeight:700, color:'#1a3c5e' }}>₹{(parseFloat(item.product.selling_price)*item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
          {[['Subtotal', `₹${total.toFixed(2)}`], ['Delivery', delivery===0?'FREE':`₹${delivery}`], ['Total', `₹${grandTotal.toFixed(2)}`]].map(([l,v],i) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderTop: i===2?'1px solid #dce6ef':'none', marginTop: i===2?6:0 }}>
              <span style={{ fontSize: i===2?14:13, fontWeight: i===2?800:400, color: i===2?'#1c2833':'#475569' }}>{l}</span>
              <span style={{ fontSize: i===2?16:13, fontWeight:700, color: i===2?'#e67e22': v==='FREE'?'#27ae60':'#1c2833' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
