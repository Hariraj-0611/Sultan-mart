import { useState, useEffect, useCallback, useRef } from 'react'
import { useSelector } from 'react-redux'
import api from '../api/client'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import {
  Eye, RefreshCw, Package, Clock, CheckCircle,
  Truck, XCircle, MapPin, ChevronRight, Bell,
  Plus, Edit2, Trash2, X
} from 'lucide-react'

const STATUS_CONFIG = {
  pending:   { label:'Pending',   color:'#d97706', bg:'#fef9c3', icon:Clock       },
  confirmed: { label:'Confirmed', color:'#2563eb', bg:'#dbeafe', icon:CheckCircle },
  ready:     { label:'Ready',     color:'#7c3aed', bg:'#ede9fe', icon:Package     },
  delivered: { label:'Delivered', color:'#16a34a', bg:'#dcfce7', icon:Truck       },
  cancelled: { label:'Cancelled', color:'#dc2626', bg:'#fee2e2', icon:XCircle     },
}

const NEXT_STATUS = { pending:'confirmed', confirmed:'ready', ready:'delivered' }

/* ── Create / Edit Order Modal ── */
function OrderFormModal({ order, onSave, onClose }) {
  const isEdit = !!order
  const [customers, setCustomers] = useState([])
  const [products,  setProducts]  = useState([])
  const [form, setForm] = useState({
    customer: order?.customer || '',
    delivery_address: order?.delivery_address || '',
    notes: order?.notes || '',
    status: order?.status || 'pending',
  })
  const [items, setItems] = useState(
    order?.items?.map(i => ({ product: i.product, product_name: i.product_name, quantity: i.quantity, unit_price: i.unit_price })) || []
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/accounting/customers/').then(r => setCustomers(r.data.results || r.data)).catch(() => {})
    api.get('/ecommerce/catalog/?page_size=100').then(r => setProducts(r.data.results || r.data)).catch(() => {})
  }, [])

  const addItem = () => setItems(p => [...p, { product: '', product_name: '', quantity: 1, unit_price: 0 }])
  const removeItem = (i) => setItems(p => p.filter((_, idx) => idx !== i))
  const updateItem = (i, field, val) => setItems(p => p.map((item, idx) => {
    if (idx !== i) return item
    if (field === 'product') {
      const prod = products.find(p => p.id === parseInt(val))
      return { ...item, product: val, product_name: prod?.name || '', unit_price: prod?.selling_price || 0 }
    }
    return { ...item, [field]: val }
  }))

  const total = items.reduce((s, i) => s + (parseFloat(i.unit_price) * parseInt(i.quantity || 1)), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.customer) return toast.error('Select a customer')
    if (items.length === 0) return toast.error('Add at least one item')
    setSaving(true)
    try {
      if (isEdit) {
        await api.patch(`/ecommerce/orders/${order.id}/`, { ...form, total_amount: total })
        // update items — delete all and re-add
        for (const item of items) {
          await api.post(`/ecommerce/orders/${order.id}/add_item/`, {
            product: item.product, quantity: item.quantity,
            unit_price: item.unit_price, total_price: item.unit_price * item.quantity,
          })
        }
        toast.success('Order updated')
      } else {
        // Create order via checkout-style
        const { data } = await api.post('/ecommerce/orders/', {
          ...form,
          total_amount: total,
          order_number: `ORD${Date.now()}`,
        })
        for (const item of items) {
          await api.post(`/ecommerce/orders/${data.id}/add_item/`, {
            product: item.product, quantity: item.quantity,
            unit_price: item.unit_price, total_price: parseFloat(item.unit_price) * parseInt(item.quantity),
          })
        }
        toast.success('Order created')
      }
      onSave()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setSaving(false) }
  }

  const S = { label: { fontSize:12, fontWeight:600, color:'var(--text-sub)', marginBottom:4, display:'block' } }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(10,20,35,.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16, backdropFilter:'blur(3px)' }}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:560, maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 24px 64px rgba(0,0,0,.25)' }}>
        <div style={{ background:'var(--brand)', padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ color:'#fff', fontWeight:700, fontSize:15 }}>{isEdit ? 'Edit Order' : 'New Online Order'}</span>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#fff', display:'flex' }}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding:20, overflowY:'auto', display:'flex', flexDirection:'column', gap:14 }}>
          {/* Customer */}
          <div>
            <label style={S.label}>Customer *</label>
            <select value={form.customer} onChange={e => setForm({...form, customer: e.target.value})}
              style={{ width:'100%', padding:'9px 12px', border:'1.5px solid var(--border)', borderRadius:8, fontSize:13, outline:'none' }} required>
              <option value="">Select customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
            </select>
          </div>

          {/* Address & Notes */}
          <div>
            <label style={S.label}>Delivery Address</label>
            <input value={form.delivery_address} onChange={e => setForm({...form, delivery_address: e.target.value})}
              placeholder="Enter delivery address"
              style={{ width:'100%', padding:'9px 12px', border:'1.5px solid var(--border)', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={S.label}>Notes</label>
            <input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
              placeholder="Special instructions..."
              style={{ width:'100%', padding:'9px 12px', border:'1.5px solid var(--border)', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
          </div>

          {isEdit && (
            <div>
              <label style={S.label}>Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                style={{ width:'100%', padding:'9px 12px', border:'1.5px solid var(--border)', borderRadius:8, fontSize:13, outline:'none' }}>
                {Object.entries(STATUS_CONFIG).map(([v, {label}]) => <option key={v} value={v}>{label}</option>)}
              </select>
            </div>
          )}

          {/* Items */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <label style={S.label}>Items *</label>
              <button type="button" onClick={addItem}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:7, border:'1.5px solid var(--brand)', background:'#eff6ff', color:'var(--brand)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                <Plus size={12} /> Add Item
              </button>
            </div>
            {items.map((item, i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 70px 80px 30px', gap:8, marginBottom:8, alignItems:'center' }}>
                <select value={item.product} onChange={e => updateItem(i, 'product', e.target.value)}
                  style={{ padding:'8px', border:'1.5px solid var(--border)', borderRadius:7, fontSize:12, outline:'none' }} required>
                  <option value="">Select product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} — ₹{p.selling_price}</option>)}
                </select>
                <input type="number" min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)}
                  placeholder="Qty"
                  style={{ padding:'8px', border:'1.5px solid var(--border)', borderRadius:7, fontSize:12, outline:'none', textAlign:'center' }} />
                <input type="number" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', e.target.value)}
                  placeholder="Price"
                  style={{ padding:'8px', border:'1.5px solid var(--border)', borderRadius:7, fontSize:12, outline:'none', textAlign:'right' }} />
                <button type="button" onClick={() => removeItem(i)}
                  style={{ background:'#fee2e2', border:'none', borderRadius:7, padding:'8px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Trash2 size={12} color="#dc2626" />
                </button>
              </div>
            ))}
            {items.length > 0 && (
              <div style={{ textAlign:'right', fontWeight:800, fontSize:15, color:'var(--accent)', marginTop:4 }}>
                Total: ₹{total.toFixed(2)}
              </div>
            )}
          </div>

          <div style={{ display:'flex', justifyContent:'flex-end', gap:10, paddingTop:4 }}>
            <button type="button" onClick={onClose}
              style={{ padding:'9px 20px', borderRadius:8, border:'1.5px solid var(--border)', background:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              style={{ padding:'9px 20px', borderRadius:8, border:'none', background: saving ? '#a0b4c8' : 'var(--brand)', color:'#fff', fontSize:13, fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving...' : isEdit ? 'Update Order' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Order Detail Modal ── */
function OrderDetailModal({ order, onClose, onStatusChange }) {
  const [status, setStatus] = useState(order.status)
  const [saving, setSaving] = useState(false)
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending

  const handleUpdate = async () => {
    if (status === order.status) return
    setSaving(true)
    try {
      await api.post(`/ecommerce/orders/${order.id}/update_status/`, { status })
      toast.success(`Marked as ${STATUS_CONFIG[status]?.label}`)
      onStatusChange(); onClose()
    } catch { toast.error('Failed') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(10,20,35,.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16, backdropFilter:'blur(3px)' }}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:540, maxHeight:'85vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 24px 64px rgba(0,0,0,.25)' }}>
        <div style={{ background:'#1a3c5e', padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <p style={{ color:'#fff', fontWeight:700, fontSize:15 }}>Order #{order.order_number}</p>
            <p style={{ fontSize:11, color:'rgba(255,255,255,.55)', marginTop:2 }}>{format(new Date(order.created_at), 'dd MMM yyyy, hh:mm a')}</p>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,.15)', border:'none', borderRadius:8, padding:'5px 10px', cursor:'pointer', color:'#fff' }}>✕</button>
        </div>

        <div style={{ padding:20, overflowY:'auto', display:'flex', flexDirection:'column', gap:14 }}>
          <span style={{ background:cfg.bg, color:cfg.color, padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:700, display:'inline-flex', alignItems:'center', gap:6, width:'fit-content' }}>
            <cfg.icon size={12} /> {cfg.label}
          </span>

          <div style={{ background:'var(--page-bg)', borderRadius:10, padding:'12px 16px', border:'1px solid var(--border)' }}>
            <p style={{ fontSize:11, fontWeight:700, color:'var(--text-sub)', textTransform:'uppercase', marginBottom:6 }}>Customer</p>
            <p style={{ fontWeight:700, fontSize:14 }}>{order.customer_name}</p>
            {order.delivery_address && <p style={{ fontSize:12, color:'var(--text-sub)', marginTop:4, display:'flex', gap:5 }}><MapPin size={12} />{order.delivery_address}</p>}
            {order.notes && <p style={{ fontSize:12, color:'#92400e', background:'#fef9c3', borderRadius:6, padding:'6px 10px', marginTop:8 }}>📝 {order.notes}</p>}
          </div>

          <div style={{ border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
            {order.items?.map((item, i) => (
              <div key={item.id} style={{ display:'flex', justifyContent:'space-between', padding:'10px 14px', borderBottom: i < order.items.length-1 ? '1px solid var(--border)' : 'none', fontSize:13 }}>
                <span><strong>{item.product_name}</strong> × {item.quantity}</span>
                <span style={{ fontWeight:700, color:'var(--brand)' }}>₹{parseFloat(item.total_price).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 14px', background:'var(--page-bg)', fontWeight:800, fontSize:15 }}>
              <span>Total</span>
              <span style={{ color:'var(--accent)' }}>₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:'var(--text-sub)', textTransform:'uppercase', marginBottom:8 }}>Update Status</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
                {Object.entries(STATUS_CONFIG).map(([val, { label, color, bg }]) => (
                  <button key={val} onClick={() => setStatus(val)}
                    style={{ padding:'8px 4px', borderRadius:8, border:`2px solid ${status===val ? color : 'var(--border)'}`, background: status===val ? bg : '#fff', color: status===val ? color : 'var(--text-sub)', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding:'12px 20px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:10 }}>
          <button onClick={onClose} style={{ padding:'8px 18px', borderRadius:8, border:'1.5px solid var(--border)', background:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>Close</button>
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <button onClick={handleUpdate} disabled={saving || status === order.status}
              style={{ padding:'8px 18px', borderRadius:8, border:'none', background: saving ? '#a0b4c8' : 'var(--brand)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
              {saving ? 'Updating...' : `Mark as ${STATUS_CONFIG[status]?.label}`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Main Page ── */
export default function OnlineOrdersPage() {
  const { user }  = useSelector(s => s.auth)
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('')
  const [detail,  setDetail]  = useState(null)
  const [editOrder, setEditOrder] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [lastCount, setLastCount] = useState(0)
  const lastCountRef = useRef(0)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const params = {}
      if (filter) params.status = filter
      const { data } = await api.get('/ecommerce/orders/', { params })
      const list = data.results || data
      setOrders(list)
      const pending = list.filter(o => o.status === 'pending').length
      if (pending > lastCountRef.current && lastCountRef.current > 0) toast(`🛒 ${pending - lastCountRef.current} new order!`, { icon:'🔔', duration:5000 })
      lastCountRef.current = pending
      setLastCount(pending)
    } catch { if (!silent) toast.error('Failed to load orders') }
    finally { if (!silent) setLoading(false) }
  }, [filter])

  useEffect(() => { load(); const t = setInterval(() => load(true), 30000); return () => clearInterval(t) }, [filter, load])

  const quickUpdate = async (order, newStatus) => {
    try {
      await api.post(`/ecommerce/orders/${order.id}/update_status/`, { status: newStatus })
      toast.success(`Marked as ${STATUS_CONFIG[newStatus]?.label}`)
      load(true)
    } catch { toast.error('Update failed') }
  }

  const deleteOrder = async (order) => {
    if (!confirm(`Delete order ${order.order_number}? This cannot be undone.`)) return
    try {
      await api.delete(`/ecommerce/orders/${order.id}/`)
      toast.success('Order deleted')
      load(true)
    } catch { toast.error('Delete failed') }
  }

  const counts = Object.keys(STATUS_CONFIG).reduce((acc, s) => { acc[s] = orders.filter(o => o.status === s).length; return acc }, {})

  return (
    <div style={{ padding:24 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:800, color:'var(--text-main)', display:'flex', alignItems:'center', gap:10 }}>
            Online Orders
            {counts.pending > 0 && (
              <span style={{ background:'#e74c3c', color:'#fff', borderRadius:20, padding:'2px 10px', fontSize:12, fontWeight:700, display:'inline-flex', alignItems:'center', gap:5 }}>
                <Bell size={11} /> {counts.pending} pending
              </span>
            )}
          </h1>
          <p style={{ fontSize:12, color:'var(--text-sub)', marginTop:2 }}>All staff can view and update order status · <span style={{ color:'var(--accent)', fontWeight:600 }}>Auto-refreshes every 30s</span></p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => load()} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:'1.5px solid var(--border)', background:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={() => setShowCreate(true)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, border:'none', background:'var(--brand)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
            <Plus size={14} /> New Order
          </button>
        </div>
      </div>

      {/* Status filter cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:20 }}>
        {Object.entries(STATUS_CONFIG).map(([s, { label, color, bg, icon:Icon }]) => (
          <button key={s} onClick={() => setFilter(filter === s ? '' : s)}
            style={{ background: filter===s ? bg : '#fff', border:`2px solid ${filter===s ? color : 'var(--border)'}`, borderRadius:12, padding:'14px 16px', cursor:'pointer', textAlign:'left', transition:'all .15s' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
              <Icon size={16} color={color} />
              <span style={{ fontSize:22, fontWeight:800, color }}>{counts[s] || 0}</span>
            </div>
            <p style={{ fontSize:12, fontWeight:600, color: filter===s ? color : 'var(--text-sub)' }}>{label}</p>
          </button>
        ))}
      </div>

      {/* Role banner */}
      <div style={{ background:'#e8f0f7', border:'1px solid #bfdbfe', borderRadius:10, padding:'10px 16px', marginBottom:16, fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
        <CheckCircle size={14} color='var(--brand)' />
        <span style={{ color:'var(--brand)' }}>Logged in as <strong>{user?.name}</strong> ({user?.role}) — you can view and update all online orders.</span>
      </div>

      {/* Table */}
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid var(--border)', overflow:'hidden', boxShadow:'var(--shadow-sm)' }}>
        <table className="sm-table">
          <thead>
            <tr>
              <th>Order #</th><th>Time</th><th>Customer</th><th>Items</th>
              <th>Total</th><th>Status</th><th>Quick Action</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>Loading orders...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign:'center', padding:48, color:'var(--text-muted)' }}>
                <Package size={36} color="var(--border)" style={{ display:'block', margin:'0 auto 10px' }} />
                No orders found
              </td></tr>
            ) : orders.map(order => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
              const nextSt = NEXT_STATUS[order.status]
              const nextCfg = nextSt ? STATUS_CONFIG[nextSt] : null
              return (
                <tr key={order.id} style={{ background: order.status === 'pending' ? '#fffbeb' : 'inherit' }}>
                  <td style={{ fontFamily:'monospace', fontSize:12, fontWeight:700, color:'var(--brand)' }}>
                    {order.order_number}
                    {order.status === 'pending' && <span style={{ marginLeft:6, background:'#fef9c3', color:'#d97706', fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:10 }}>New</span>}
                  </td>
                  <td style={{ color:'var(--text-sub)', fontSize:12 }}>
                    {format(new Date(order.created_at), 'dd MMM')}<br />
                    <span style={{ fontSize:11 }}>{format(new Date(order.created_at), 'hh:mm a')}</span>
                  </td>
                  <td>
                    <p style={{ fontWeight:600, fontSize:13 }}>{order.customer_name || '—'}</p>
                    {order.delivery_address && <p style={{ fontSize:11, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:3, marginTop:2 }}><MapPin size={10} />{order.delivery_address.split(',')[0]}</p>}
                  </td>
                  <td style={{ color:'var(--text-sub)' }}>{order.items?.length || 0} items</td>
                  <td style={{ fontWeight:700, color:'var(--accent)', fontSize:14 }}>₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</td>
                  <td>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:cfg.bg, color:cfg.color, padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>
                      <cfg.icon size={11} /> {cfg.label}
                    </span>
                  </td>
                  <td>
                    {nextCfg ? (
                      <button onClick={() => quickUpdate(order, nextSt)}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:7, border:'none', background:nextCfg.bg, color:nextCfg.color, fontSize:11, fontWeight:700, cursor:'pointer' }}>
                        <ChevronRight size={12} /> {nextCfg.label}
                      </button>
                    ) : order.status === 'delivered' ? (
                      <span style={{ fontSize:11, color:'#16a34a', fontWeight:600 }}>✓ Done</span>
                    ) : (
                      <span style={{ fontSize:11, color:'#dc2626', fontWeight:600 }}>Cancelled</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={() => setDetail(order)} title="View"
                        style={{ width:30, height:30, borderRadius:7, border:'1.5px solid #bfdbfe', background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                        <Eye size={13} color="#3b82f6" />
                      </button>
                      <button onClick={() => setEditOrder(order)} title="Edit"
                        style={{ width:30, height:30, borderRadius:7, border:'1.5px solid #d1fae5', background:'#ecfdf5', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                        <Edit2 size={13} color="#16a34a" />
                      </button>
                      <button onClick={() => deleteOrder(order)} title="Delete"
                        style={{ width:30, height:30, borderRadius:7, border:'1.5px solid #fecaca', background:'#fee2e2', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                        <Trash2 size={13} color="#dc2626" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!loading && orders.length > 0 && (
          <div style={{ padding:'10px 16px', background:'var(--page-bg)', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-muted)' }}>
            <span>{orders.length} orders shown</span>
            <span>Auto-refreshes every 30 seconds</span>
          </div>
        )}
      </div>

      {detail     && <OrderDetailModal order={detail} onClose={() => setDetail(null)} onStatusChange={() => { load(true); setDetail(null) }} />}
      {editOrder  && <OrderFormModal order={editOrder} onSave={() => { setEditOrder(null); load(true) }} onClose={() => setEditOrder(null)} />}
      {showCreate && <OrderFormModal onSave={() => { setShowCreate(false); load(true) }} onClose={() => setShowCreate(false)} />}
    </div>
  )
}
