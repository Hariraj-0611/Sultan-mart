import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { Search, Package, MapPin, Phone, CheckCircle, Clock, Truck, XCircle } from 'lucide-react'

const STATUS_STEPS = ['pending','confirmed','ready','delivered']
const STATUS_LABELS = { pending:'Order Placed', confirmed:'Confirmed', ready:'Out for Delivery', delivered:'Delivered', cancelled:'Cancelled' }
const STATUS_ICONS  = { pending:Clock, confirmed:CheckCircle, ready:Truck, delivered:Package, cancelled:XCircle }
const STATUS_COLORS = { pending:'#f59e0b', confirmed:'#3b82f6', ready:'#8b5cf6', delivered:'#27ae60', cancelled:'#e74c3c' }

export default function StoreTrackOrder() {
  const [searchParams] = useSearchParams()
  const [query,   setQuery]   = useState(searchParams.get('order') || '')
  const [order,   setOrder]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const doSearch = async (q) => {
    if (!q.trim()) return
    setLoading(true); setError(''); setOrder(null)
    try {
      const { data } = await axios.get(`/api/ecommerce/orders/track_order/?q=${encodeURIComponent(q.trim())}`)
      const results = data.results || data
      if (results.length === 0) { setError('No order found with that number or phone.'); return }
      setOrder(results[0])
    } catch { setError('Failed to search. Please try again.') }
    finally { setLoading(false) }
  }

  // Auto-search if order number passed via URL
  useEffect(() => {
    const orderParam = searchParams.get('order')
    if (orderParam) doSearch(orderParam)
  }, [])

  const handleSearch = (e) => { e.preventDefault(); doSearch(query) }

  const currentStep = order ? STATUS_STEPS.indexOf(order.status) : -1

  return (
    <div style={{ maxWidth:680, margin:'40px auto', padding:'0 24px' }}>
      <div style={{ textAlign:'center', marginBottom:32 }}>
        <h1 style={{ fontSize:26, fontWeight:900, color:'#1a3c5e', marginBottom:8 }}>Track Your Order</h1>
        <p style={{ fontSize:14, color:'#64748b' }}>Enter your order number or phone number to track your delivery</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ display:'flex', gap:10, marginBottom:28 }}>
        <div style={{ flex:1, display:'flex', alignItems:'center', gap:10, background:'#fff', border:'2px solid #1a3c5e', borderRadius:12, padding:'10px 16px' }}>
          <Search size={18} color="#94a3b8" />
          <input
            style={{ flex:1, border:'none', outline:'none', fontSize:14, color:'#1c2833' }}
            placeholder="Order number (e.g. ORD1234567890) or phone number"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading}
          style={{ padding:'10px 24px', borderRadius:12, border:'none', background:'#1a3c5e', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
          {loading ? 'Searching...' : 'Track'}
        </button>
      </form>

      {error && (
        <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:12, padding:'14px 18px', marginBottom:20, textAlign:'center', color:'#dc2626', fontSize:13, fontWeight:600 }}>
          {error}
        </div>
      )}

      {order && (
        <div style={{ background:'#fff', borderRadius:16, border:'1px solid #dce6ef', overflow:'hidden', boxShadow:'0 4px 16px rgba(0,0,0,.07)' }}>
          {/* Header */}
          <div style={{ background:'#1a3c5e', padding:'20px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <p style={{ fontSize:12, color:'rgba(255,255,255,.55)', marginBottom:3 }}>ORDER NUMBER</p>
              <p style={{ fontSize:18, fontWeight:800, color:'#fff' }}>{order.order_number}</p>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:`${STATUS_COLORS[order.status]}25`, border:`1px solid ${STATUS_COLORS[order.status]}50`, borderRadius:20, padding:'5px 14px' }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:STATUS_COLORS[order.status] }} />
                <span style={{ fontSize:12, fontWeight:700, color:STATUS_COLORS[order.status] }}>{STATUS_LABELS[order.status]}</span>
              </div>
              <p style={{ fontSize:12, color:'rgba(255,255,255,.55)', marginTop:4 }}>
                {new Date(order.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
              </p>
            </div>
          </div>

          <div style={{ padding:24 }}>
            {/* Progress tracker */}
            {order.status !== 'cancelled' && (
              <div style={{ marginBottom:28 }}>
                <p style={{ fontSize:12, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:.5, marginBottom:16 }}>Delivery Progress</p>
                <div style={{ display:'flex', alignItems:'center' }}>
                  {STATUS_STEPS.map((s, i) => {
                    const done    = i <= currentStep
                    const active  = i === currentStep
                    const Icon    = STATUS_ICONS[s]
                    return (
                      <div key={s} style={{ display:'flex', alignItems:'center', flex: i < STATUS_STEPS.length-1 ? 1 : 'none' }}>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                          <div style={{ width:40, height:40, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                            background: done ? '#1a3c5e' : '#f0f4f8',
                            border: active ? '3px solid #e67e22' : 'none',
                            boxShadow: active ? '0 0 0 4px rgba(230,126,34,.2)' : 'none' }}>
                            <Icon size={18} color={done ? '#fff' : '#94a3b8'} />
                          </div>
                          <span style={{ fontSize:10, fontWeight:600, color: done?'#1a3c5e':'#94a3b8', textAlign:'center', whiteSpace:'nowrap' }}>
                            {STATUS_LABELS[s]}
                          </span>
                        </div>
                        {i < STATUS_STEPS.length-1 && (
                          <div style={{ flex:1, height:3, background: i < currentStep ? '#1a3c5e' : '#eef2f6', margin:'0 4px', marginBottom:22, borderRadius:2 }} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Order details */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
              <div style={{ background:'#f8fafc', borderRadius:10, padding:'12px 14px', border:'1px solid #eef2f6' }}>
                <p style={{ fontSize:10, color:'#94a3b8', fontWeight:600, textTransform:'uppercase', letterSpacing:.5, marginBottom:4 }}>Customer</p>
                <p style={{ fontSize:13, fontWeight:700, color:'#1c2833' }}>{order.customer_name}</p>
              </div>
              <div style={{ background:'#f8fafc', borderRadius:10, padding:'12px 14px', border:'1px solid #eef2f6' }}>
                <p style={{ fontSize:10, color:'#94a3b8', fontWeight:600, textTransform:'uppercase', letterSpacing:.5, marginBottom:4 }}>Total Amount</p>
                <p style={{ fontSize:15, fontWeight:800, color:'#e67e22' }}>₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</p>
              </div>
              {order.delivery_address && (
                <div style={{ gridColumn:'1/-1', background:'#f8fafc', borderRadius:10, padding:'12px 14px', border:'1px solid #eef2f6', display:'flex', gap:8 }}>
                  <MapPin size={14} color="#64748b" style={{ flexShrink:0, marginTop:1 }} />
                  <div>
                    <p style={{ fontSize:10, color:'#94a3b8', fontWeight:600, textTransform:'uppercase', letterSpacing:.5, marginBottom:2 }}>Delivery Address</p>
                    <p style={{ fontSize:13, color:'#1c2833' }}>{order.delivery_address}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Items */}
            {order.items && order.items.length > 0 && (
              <div>
                <p style={{ fontSize:12, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:.5, marginBottom:10 }}>Items Ordered</p>
                {order.items.map(item => (
                  <div key={item.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #f1f5f9', fontSize:13 }}>
                    <span style={{ color:'#1c2833', fontWeight:500 }}>{item.product_name} <span style={{ color:'#94a3b8' }}>× {item.quantity}</span></span>
                    <span style={{ fontWeight:700, color:'#1a3c5e' }}>₹{parseFloat(item.total_price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            {order.notes && (
              <div style={{ marginTop:14, background:'#fef9c3', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#78350f' }}>
                <strong>Notes:</strong> {order.notes}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Help */}
      <div style={{ marginTop:28, background:'#fff', borderRadius:12, border:'1px solid #dce6ef', padding:'16px 20px', display:'flex', alignItems:'center', gap:14 }}>
        <Phone size={20} color="#1a3c5e" />
        <div>
          <p style={{ fontSize:13, fontWeight:700, color:'#1c2833' }}>Need help with your order?</p>
          <p style={{ fontSize:12, color:'#64748b' }}>Call us at <strong>+91 98765 43210</strong> or visit the store</p>
        </div>
      </div>
    </div>
  )
}
