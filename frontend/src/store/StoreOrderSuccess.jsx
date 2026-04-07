import { useLocation, Link } from 'react-router-dom'
import { useState } from 'react'
import { CheckCircle, Package, MapPin, Phone, ArrowRight, Search, Copy, Check } from 'lucide-react'

export default function StoreOrderSuccess() {
  const { state } = useLocation()
  const [copied, setCopied] = useState(false)

  if (!state?.order) return (
    <div style={{ textAlign:'center', padding:60 }}>
      <p style={{ color:'#64748b' }}>No order found.</p>
      <Link to="/store" style={{ color:'#1a3c5e', fontWeight:600 }}>Go to Store</Link>
    </div>
  )

  const { order, customer, grandTotal, payment } = state

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(order.order_number)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ maxWidth:600, margin:'40px auto', padding:'0 24px' }}>
      <div style={{ background:'#fff', borderRadius:20, border:'1px solid #dce6ef', overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,.08)' }}>

        {/* Success header */}
        <div style={{ background:'linear-gradient(135deg,#1a3c5e,#2d6a9f)', padding:'36px 32px', textAlign:'center' }}>
          <div style={{ width:72, height:72, borderRadius:'50%', background:'rgba(255,255,255,.15)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <CheckCircle size={40} color="#4ade80" />
          </div>
          <h1 style={{ fontSize:24, fontWeight:900, color:'#fff', marginBottom:6 }}>Order Placed!</h1>
          <p style={{ fontSize:14, color:'rgba(255,255,255,.7)' }}>Thank you for shopping with Sultan Mart</p>
        </div>

        <div style={{ padding:28 }}>
          {/* Order number */}
          <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:'16px 18px', marginBottom:20, textAlign:'center' }}>
            <p style={{ fontSize:12, color:'#16a34a', fontWeight:600, marginBottom:6 }}>YOUR ORDER NUMBER</p>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:8 }}>
              <p style={{ fontSize:22, fontWeight:900, color:'#15803d', letterSpacing:2, fontFamily:'monospace' }}>{order.order_number}</p>
              <button onClick={copyOrderNumber}
                style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 12px', borderRadius:8, border:'1.5px solid #bbf7d0', background: copied ? '#16a34a' : '#fff', color: copied ? '#fff' : '#16a34a', fontSize:12, fontWeight:700, cursor:'pointer', transition:'all .2s' }}>
                {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
              </button>
            </div>
            <div style={{ background:'#fff', border:'1px dashed #86efac', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#166534' }}>
              📋 <strong>Save this number!</strong> Use it to track your order at <strong>/store/track</strong>
            </div>
          </div>

          {/* Details grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
            {[
              { icon:Package,  label:'Total Amount',    value:`₹${parseFloat(grandTotal).toFixed(2)}` },
              { icon:Phone,    label:'Payment Method',  value:payment.toUpperCase() },
              { icon:Phone,    label:'Contact',         value:customer.phone },
              { icon:MapPin,   label:'Delivery to',     value:`${customer.city} - ${customer.pincode}` },
            ].map(({ icon:Icon, label, value }) => (
              <div key={label} style={{ background:'#f8fafc', borderRadius:10, padding:'12px 14px', border:'1px solid #eef2f6' }}>
                <p style={{ fontSize:10, color:'#94a3b8', fontWeight:600, textTransform:'uppercase', letterSpacing:.5, marginBottom:4 }}>{label}</p>
                <p style={{ fontSize:13, fontWeight:700, color:'#1c2833' }}>{value}</p>
              </div>
            ))}
          </div>

          {/* What's next */}
          <div style={{ background:'#fef9c3', border:'1px solid #fde68a', borderRadius:12, padding:'14px 16px', marginBottom:24 }}>
            <p style={{ fontSize:12, fontWeight:700, color:'#92400e', marginBottom:8 }}>What happens next?</p>
            {['We will confirm your order within 30 minutes','Our team will prepare your items','Delivery within 2-4 hours in your area'].map((step, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom: i<2?6:0 }}>
                <div style={{ width:20, height:20, borderRadius:'50%', background:'#f59e0b', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff', flexShrink:0 }}>{i+1}</div>
                <p style={{ fontSize:12, color:'#78350f' }}>{step}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <Link to={`/store/track?order=${order.order_number}`}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'12px', borderRadius:10, background:'#1a3c5e', color:'#fff', textDecoration:'none', fontWeight:700, fontSize:14 }}>
              <Search size={15} /> Track My Order
            </Link>
            <Link to="/store/shop"
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'12px', borderRadius:10, border:'1.5px solid #1a3c5e', color:'#1a3c5e', textDecoration:'none', fontWeight:700, fontSize:14 }}>
              Continue Shopping <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
