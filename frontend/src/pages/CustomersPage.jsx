import { useState, useEffect } from 'react'
import { accountingApi } from '../api/accounting'
import { reportsApi } from '../api/reports'
import toast from 'react-hot-toast'
import {
  Plus, Search, Pencil, Trash2, CreditCard, X,
  User, Phone, Mail, MapPin, BadgeIndianRupee, ShieldCheck,
  ChevronRight, Wallet, AlertCircle, History, FileText, MessageCircle, Star
} from 'lucide-react'

/* ─── tiny reusable field ─── */
function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600, color:'#64748b', marginBottom:4 }}>
        {Icon && <Icon size={13} />} {label}
      </label>
      {children}
    </div>
  )
}

const inp = {
  width:'100%', padding:'9px 12px', fontSize:13,
  border:'1.5px solid #e2e8f0', borderRadius:8,
  background:'#f8fafc', outline:'none', boxSizing:'border-box',
  transition:'border .15s',
}

/* ─── Add / Edit Modal ─── */
function CustomerModal({ customer, onSave, onClose }) {
  const isEdit = !!customer?.id
  const [form, setForm] = useState({
    name: '', phone: '', email: '', address: '', gst_number: '', credit_limit: 0,
    ...(customer || {})
  })
  const [saving, setSaving] = useState(false)

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (isEdit) {
        await accountingApi.updateCustomer(customer.id, form)
        toast.success('Customer updated')
      } else {
        await accountingApi.createCustomer(form)
        toast.success('Customer added')
      }
      onSave()
    } catch (err) {
      toast.error(err.response?.data?.name?.[0] || 'Failed to save')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:16 }}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:480, boxShadow:'0 20px 60px rgba(0,0,0,.15)', overflow:'hidden' }}>

        {/* header */}
        <div style={{ background:'linear-gradient(135deg,#e0f2fe,#f0fdf4)', padding:'18px 22px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #e2e8f0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ background:'#0ea5e9', borderRadius:10, padding:8, display:'flex' }}>
              <User size={18} color="#fff" />
            </div>
            <div>
              <p style={{ fontWeight:700, fontSize:15, color:'#0f172a' }}>{isEdit ? 'Edit Customer' : 'Add New Customer'}</p>
              <p style={{ fontSize:11, color:'#64748b' }}>{isEdit ? `Editing: ${customer.name}` : 'Fill in customer details'}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'#f1f5f9', border:'none', borderRadius:8, padding:6, cursor:'pointer', display:'flex' }}>
            <X size={16} color="#64748b" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding:22, display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={{ gridColumn:'1/-1' }}>
              <Field label="Full Name" icon={User}>
                <input style={inp} value={form.name} onChange={set('name')} placeholder="e.g. Ravi Kumar" required />
              </Field>
            </div>
            <Field label="Phone Number" icon={Phone}>
              <input style={inp} value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
            </Field>
            <Field label="Email Address" icon={Mail}>
              <input style={inp} type="email" value={form.email} onChange={set('email')} placeholder="ravi@email.com" />
            </Field>
            <div style={{ gridColumn:'1/-1' }}>
              <Field label="Address" icon={MapPin}>
                <textarea style={{ ...inp, resize:'none' }} rows={2} value={form.address} onChange={set('address')} placeholder="Street, City, State" />
              </Field>
            </div>
            <Field label="GST Number" icon={ShieldCheck}>
              <input style={inp} value={form.gst_number} onChange={set('gst_number')} placeholder="33AAAAA0000A1Z5" />
            </Field>
            <Field label="Credit Limit (₹)" icon={BadgeIndianRupee}>
              <input style={inp} type="number" min="0" value={form.credit_limit} onChange={set('credit_limit')} placeholder="0" />
            </Field>
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:4 }}>
            <button type="button" onClick={onClose}
              style={{ padding:'9px 20px', borderRadius:8, border:'1.5px solid #e2e8f0', background:'#f8fafc', fontSize:13, fontWeight:600, cursor:'pointer', color:'#475569' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              style={{ padding:'9px 24px', borderRadius:8, border:'none', background: saving ? '#93c5fd' : 'linear-gradient(135deg,#0ea5e9,#6366f1)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
              {saving ? 'Saving...' : isEdit ? 'Update Customer' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Receive Payment Modal ─── */
function PaymentModal({ customer, onSave, onClose }) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('cash')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await accountingApi.receivePayment(customer.id, { amount, payment_method: method })
      toast.success('Payment recorded')
      onSave()
    } catch { toast.error('Failed to record payment') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:16 }}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:380, boxShadow:'0 20px 60px rgba(0,0,0,.15)', overflow:'hidden' }}>
        <div style={{ background:'linear-gradient(135deg,#fef9c3,#fef3c7)', padding:'18px 22px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #fde68a' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ background:'#f59e0b', borderRadius:10, padding:8, display:'flex' }}>
              <Wallet size={18} color="#fff" />
            </div>
            <div>
              <p style={{ fontWeight:700, fontSize:15, color:'#0f172a' }}>Receive Payment</p>
              <p style={{ fontSize:11, color:'#92400e' }}>{customer.name}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'#fef3c7', border:'none', borderRadius:8, padding:6, cursor:'pointer', display:'flex' }}>
            <X size={16} color="#92400e" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding:22, display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
            <AlertCircle size={15} color="#ef4444" />
            <span style={{ fontSize:13, color:'#dc2626', fontWeight:600 }}>Outstanding: ₹{customer.outstanding_balance}</span>
          </div>

          <Field label="Amount (₹)" icon={BadgeIndianRupee}>
            <input style={inp} type="number" min="1" max={customer.outstanding_balance} value={amount}
              onChange={e => setAmount(e.target.value)} placeholder="Enter amount" required autoFocus />
          </Field>

          <Field label="Payment Method" icon={CreditCard}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              {['cash','upi','card'].map(m => (
                <button key={m} type="button" onClick={() => setMethod(m)}
                  style={{ padding:'8px 0', borderRadius:8, border: method===m ? '2px solid #f59e0b' : '1.5px solid #e2e8f0',
                    background: method===m ? '#fef3c7' : '#f8fafc', fontWeight:600, fontSize:12,
                    color: method===m ? '#92400e' : '#64748b', cursor:'pointer', textTransform:'capitalize' }}>
                  {m}
                </button>
              ))}
            </div>
          </Field>

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:4 }}>
            <button type="button" onClick={onClose}
              style={{ padding:'9px 20px', borderRadius:8, border:'1.5px solid #e2e8f0', background:'#f8fafc', fontSize:13, fontWeight:600, cursor:'pointer', color:'#475569' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              style={{ padding:'9px 24px', borderRadius:8, border:'none', background: saving ? '#fcd34d' : 'linear-gradient(135deg,#f59e0b,#ef4444)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
              {saving ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Customer History Modal ─── */
function HistoryModal({ customer, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    reportsApi.getCustomerHistory(customer.id)
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:16 }}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:560, maxHeight:'85vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,.15)' }}>
        <div style={{ background:'linear-gradient(135deg,#e0f2fe,#f0fdf4)', padding:'18px 22px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #e2e8f0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ background:'#6366f1', borderRadius:10, padding:8, display:'flex' }}><History size={18} color="#fff" /></div>
            <div>
              <p style={{ fontWeight:700, fontSize:15, color:'#0f172a' }}>Purchase History</p>
              <p style={{ fontSize:11, color:'#64748b' }}>{customer.name}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'#f1f5f9', border:'none', borderRadius:8, padding:6, cursor:'pointer', display:'flex' }}><X size={16} color="#64748b" /></button>
        </div>

        <div style={{ padding:20, overflowY:'auto', flex:1 }}>
          {loading ? <p style={{ textAlign:'center', color:'#94a3b8' }}>Loading...</p> : !data ? null : (
            <>
              {/* Summary */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
                {[
                  { label:'Total Spent', value:`₹${data.total_spent.toLocaleString('en-IN')}`, color:'#0ea5e9' },
                  { label:'Total Visits', value: data.visit_count, color:'#6366f1' },
                  { label:'Outstanding', value:`₹${data.customer.outstanding_balance.toLocaleString('en-IN')}`, color: data.customer.outstanding_balance > 0 ? '#ef4444' : '#16a34a' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background:'#f8fafc', borderRadius:10, padding:'12px 14px', border:'1px solid #e2e8f0' }}>
                    <p style={{ fontSize:11, color:'#64748b', fontWeight:600 }}>{label}</p>
                    <p style={{ fontSize:18, fontWeight:800, color }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Invoices */}
              <p style={{ fontSize:12, fontWeight:700, color:'#64748b', textTransform:'uppercase', marginBottom:8 }}>Recent Invoices</p>
              {data.invoices.length === 0 ? <p style={{ color:'#94a3b8', fontSize:13 }}>No invoices yet</p> : (
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {data.invoices.map(inv => (
                    <div key={inv.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', borderRadius:9, border:'1px solid #e2e8f0', background:'#fff' }}>
                      <div>
                        <p style={{ fontWeight:600, fontSize:13, fontFamily:'monospace', color:'var(--brand)' }}>{inv.invoice_number}</p>
                        <p style={{ fontSize:11, color:'#94a3b8' }}>{new Date(inv.created_at).toLocaleDateString('en-IN')}</p>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <p style={{ fontWeight:700, fontSize:14 }}>₹{parseFloat(inv.total_amount).toLocaleString('en-IN')}</p>
                        <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10,
                          background: inv.status==='paid' ? '#dcfce7' : '#fee2e2',
                          color: inv.status==='paid' ? '#16a34a' : '#dc2626' }}>
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Delete Confirm Modal ─── */
function DeleteModal({ customer, onConfirm, onClose }) {
  const [deleting, setDeleting] = useState(false)
  const handleDelete = async () => {
    setDeleting(true)
    try {
      await accountingApi.deleteCustomer(customer.id)
      toast.success('Customer deleted')
      onConfirm()
    } catch { toast.error('Cannot delete — customer has linked records') }
    finally { setDeleting(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:16 }}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:360, boxShadow:'0 20px 60px rgba(0,0,0,.15)', overflow:'hidden' }}>
        <div style={{ background:'linear-gradient(135deg,#fef2f2,#fff1f2)', padding:'18px 22px', borderBottom:'1px solid #fecaca' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ background:'#ef4444', borderRadius:10, padding:8, display:'flex' }}>
              <Trash2 size={18} color="#fff" />
            </div>
            <div>
              <p style={{ fontWeight:700, fontSize:15, color:'#0f172a' }}>Delete Customer</p>
              <p style={{ fontSize:11, color:'#ef4444' }}>This action cannot be undone</p>
            </div>
          </div>
        </div>
        <div style={{ padding:22 }}>
          <p style={{ fontSize:14, color:'#475569', marginBottom:20 }}>
            Are you sure you want to delete <strong>{customer.name}</strong>? All associated data will be removed.
          </p>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button onClick={onClose}
              style={{ padding:'9px 20px', borderRadius:8, border:'1.5px solid #e2e8f0', background:'#f8fafc', fontSize:13, fontWeight:600, cursor:'pointer', color:'#475569' }}>
              Cancel
            </button>
            <button onClick={handleDelete} disabled={deleting}
              style={{ padding:'9px 24px', borderRadius:8, border:'none', background: deleting ? '#fca5a5' : '#ef4444', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
              {deleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Page ─── */
export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null)   // null | 'add' | customer obj
  const [payModal, setPayModal] = useState(null)
  const [delModal, setDelModal] = useState(null)
  const [histModal, setHistModal] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await accountingApi.getCustomers({ search })
      setCustomers(data.results || data)
    } catch { toast.error('Failed to load customers') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [search])

  const totalOutstanding = customers.reduce((s, c) => s + parseFloat(c.outstanding_balance || 0), 0)
  const totalCustomers   = customers.length
  const creditCustomers  = customers.filter(c => parseFloat(c.outstanding_balance) > 0).length

  return (
    <div style={{ minHeight:'100vh', background:'#f0f9ff', padding:24, fontFamily:'system-ui,sans-serif' }}>

      {/* ── Page Header ── */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#0f172a', margin:0 }}>Customers</h1>
          <p style={{ fontSize:13, color:'#64748b', marginTop:3 }}>Manage your customer database and credit accounts</p>
        </div>
        <button onClick={() => setModal('add')}
          style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:10, border:'none',
            background:'linear-gradient(135deg,#0ea5e9,#6366f1)', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer',
            boxShadow:'0 4px 14px rgba(14,165,233,.35)' }}>
          <Plus size={16} /> Add Customer
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
        {[
          { label:'Total Customers', value: totalCustomers, color:'#0ea5e9', bg:'#e0f2fe', icon: User },
          { label:'On Credit (Udhar)', value: creditCustomers, color:'#f59e0b', bg:'#fef9c3', icon: AlertCircle },
          { label:'Total Outstanding', value: `₹${totalOutstanding.toLocaleString('en-IN')}`, color:'#ef4444', bg:'#fef2f2', icon: Wallet },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} style={{ background:'#fff', borderRadius:14, padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,.06)', display:'flex', alignItems:'center', gap:14, border:`1px solid ${bg}` }}>
            <div style={{ background:bg, borderRadius:12, padding:12, display:'flex' }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <p style={{ fontSize:11, color:'#64748b', fontWeight:600, margin:0 }}>{label}</p>
              <p style={{ fontSize:22, fontWeight:800, color:'#0f172a', margin:0 }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search Bar ── */}
      <div style={{ background:'#fff', borderRadius:12, padding:'12px 16px', marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,.06)', display:'flex', alignItems:'center', gap:10, border:'1px solid #e2e8f0' }}>
        <Search size={16} color="#94a3b8" />
        <input
          style={{ flex:1, border:'none', outline:'none', fontSize:14, color:'#0f172a', background:'transparent' }}
          placeholder="Search by name, phone or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', display:'flex' }}>
            <X size={14} color="#94a3b8" />
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 1px 4px rgba(0,0,0,.06)', overflow:'hidden', border:'1px solid #e2e8f0' }}>
        {/* table header */}
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1.2fr 1.8fr 1.2fr 1.2fr 1fr', padding:'12px 20px', background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
          {['Customer', 'Phone', 'Email', 'Outstanding', 'Credit Limit', 'Actions'].map(h => (
            <span key={h} style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:.5 }}>{h}</span>
          ))}
        </div>

        {/* rows */}
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'#94a3b8', fontSize:14 }}>Loading customers...</div>
        ) : customers.length === 0 ? (
          <div style={{ padding:48, textAlign:'center' }}>
            <User size={40} color="#cbd5e1" style={{ margin:'0 auto 12px' }} />
            <p style={{ color:'#94a3b8', fontSize:14, margin:0 }}>No customers found</p>
            <p style={{ color:'#cbd5e1', fontSize:12, marginTop:4 }}>Add your first customer to get started</p>
          </div>
        ) : (
          customers.map((c, i) => {
            const hasDebt = parseFloat(c.outstanding_balance) > 0
            return (
              <div key={c.id}
                style={{ display:'grid', gridTemplateColumns:'2fr 1.2fr 1.8fr 1.2fr 1.2fr 0.8fr 1fr',
                  padding:'14px 20px', borderBottom: i < customers.length-1 ? '1px solid #f1f5f9' : 'none',
                  alignItems:'center', transition:'background .12s',
                  background: hasDebt ? '#fffbeb' : '#fff' }}
                onMouseEnter={e => e.currentTarget.style.background = hasDebt ? '#fef9c3' : '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = hasDebt ? '#fffbeb' : '#fff'}
              >
                {/* name + avatar */}
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background: hasDebt ? '#fde68a' : '#e0f2fe',
                    display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14,
                    color: hasDebt ? '#92400e' : '#0369a1', flexShrink:0 }}>
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight:600, fontSize:13, color:'#0f172a', margin:0 }}>{c.name}</p>
                    {c.gst_number && <p style={{ fontSize:10, color:'#94a3b8', margin:0 }}>GST: {c.gst_number}</p>}
                  </div>
                </div>

                {/* phone */}
                <span style={{ fontSize:13, color:'#475569' }}>{c.phone || <span style={{ color:'#cbd5e1' }}>—</span>}</span>

                {/* email */}
                <span style={{ fontSize:12, color:'#64748b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {c.email || <span style={{ color:'#cbd5e1' }}>—</span>}
                </span>

                {/* outstanding */}
                <div>
                  <span style={{ fontSize:13, fontWeight:700, color: hasDebt ? '#dc2626' : '#16a34a',
                    background: hasDebt ? '#fef2f2' : '#f0fdf4', padding:'3px 8px', borderRadius:6, display:'inline-block' }}>
                    ₹{parseFloat(c.outstanding_balance).toLocaleString('en-IN')}
                  </span>
                </div>

                {/* credit limit */}
                <span style={{ fontSize:13, color:'#475569' }}>₹{parseFloat(c.credit_limit).toLocaleString('en-IN')}</span>

                {/* loyalty points */}
                <span style={{ fontSize:12, color:'#6366f1', fontWeight:700, display:'flex', alignItems:'center', gap:3 }}>
                  <Star size={11} fill="#6366f1" color="#6366f1" /> {c.loyalty_points || 0} pts
                </span>

                {/* actions */}
                <div style={{ display:'flex', gap:6 }}>
                  {/* Edit */}
                  <button onClick={() => setModal(c)} title="Edit"
                    style={{ width:30, height:30, borderRadius:8, border:'1.5px solid #bfdbfe', background:'#eff6ff',
                      display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                    <Pencil size={13} color="#3b82f6" />
                  </button>

                  {/* History */}
                  <button onClick={() => setHistModal(c)} title="Purchase History"
                    style={{ width:30, height:30, borderRadius:8, border:'1.5px solid #e9d5ff', background:'#f5f3ff',
                      display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                    <History size={13} color="#7c3aed" />
                  </button>

                  {/* Receive Payment */}
                  {hasDebt && (
                    <button onClick={() => setPayModal(c)} title="Receive Payment"
                      style={{ width:30, height:30, borderRadius:8, border:'1.5px solid #fde68a', background:'#fefce8',
                        display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                      <CreditCard size={13} color="#d97706" />
                    </button>
                  )}

                  {/* WhatsApp reminder */}
                  {hasDebt && c.phone && (
                    <button onClick={async () => {
                      try {
                        const { data } = await reportsApi.sendWhatsAppReminder({ customer_id: c.id })
                        if (data.template) {
                          toast.success('Message: ' + data.template.slice(0, 60) + '...')
                        } else {
                          toast.success(data.message)
                        }
                      } catch { toast.error('Failed to send reminder') }
                    }} title="Send WhatsApp Reminder"
                      style={{ width:30, height:30, borderRadius:8, border:'1.5px solid #bbf7d0', background:'#f0fdf4',
                        display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                      <MessageCircle size={13} color="#16a34a" />
                    </button>
                  )}

                  {/* Delete */}
                  <button onClick={() => setDelModal(c)} title="Delete"
                    style={{ width:30, height:30, borderRadius:8, border:'1.5px solid #fecaca', background:'#fef2f2',
                      display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                    <Trash2 size={13} color="#ef4444" />
                  </button>
                </div>
              </div>
            )
          })
        )}

        {/* footer count */}
        {!loading && customers.length > 0 && (
          <div style={{ padding:'10px 20px', background:'#f8fafc', borderTop:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:12, color:'#94a3b8' }}>{customers.length} customer{customers.length !== 1 ? 's' : ''} found</span>
            {creditCustomers > 0 && (
              <span style={{ fontSize:12, color:'#d97706', fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
                <AlertCircle size={12} /> {creditCustomers} with pending dues
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {modal && (
        <CustomerModal
          customer={modal === 'add' ? null : modal}
          onSave={() => { setModal(null); load() }}
          onClose={() => setModal(null)}
        />
      )}
      {payModal && (
        <PaymentModal
          customer={payModal}
          onSave={() => { setPayModal(null); load() }}
          onClose={() => setPayModal(null)}
        />
      )}
      {histModal && <HistoryModal customer={histModal} onClose={() => setHistModal(null)} />}
      {delModal && (
        <DeleteModal
          customer={delModal}
          onConfirm={() => { setDelModal(null); load() }}
          onClose={() => setDelModal(null)}
        />
      )}
    </div>
  )
}
