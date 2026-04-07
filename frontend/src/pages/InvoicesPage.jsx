import { useState, useEffect, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { billingApi } from '../api/billing'
import toast from 'react-hot-toast'
import { Eye, Download, XCircle, Printer, Search, X, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

/* ── Printable Bill Component ── */
function BillView({ invoice }) {
  if (!invoice) return null
  const subtotal  = parseFloat(invoice.subtotal  || 0)
  const discount  = parseFloat(invoice.discount_amount || 0)
  const gst       = parseFloat(invoice.gst_amount || 0)
  const total     = parseFloat(invoice.total_amount || 0)
  const paid      = parseFloat(invoice.amount_paid || 0)
  const change    = parseFloat(invoice.change_amount || 0)

  return (
    <div style={{ fontFamily:"'Courier New', monospace", fontSize:13, color:'#111', lineHeight:1.6, padding:'0 4px' }}>
      {/* Store header */}
      <div style={{ textAlign:'center', borderBottom:'2px dashed #333', paddingBottom:10, marginBottom:10 }}>
        <div style={{ fontSize:18, fontWeight:900, letterSpacing:1 }}>சுல்தான் மார்ட்</div>
        {invoice.store_address && <div style={{ fontSize:11 }}>{invoice.store_address}</div>}
        {invoice.store_phone   && <div style={{ fontSize:11 }}>Ph: {invoice.store_phone}</div>}
        {invoice.store_gst     && <div style={{ fontSize:11 }}>GSTIN: {invoice.store_gst}</div>}
      </div>

      {/* Invoice meta */}
      <div style={{ marginBottom:8 }}>
        <div style={{ display:'flex', justifyContent:'space-between' }}>
          <span>Invoice#</span><strong>{invoice.invoice_number}</strong>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between' }}>
          <span>Date</span><span>{format(new Date(invoice.created_at), 'dd/MM/yyyy HH:mm')}</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between' }}>
          <span>Cashier</span><span>{invoice.cashier_name}</span>
        </div>
        {invoice.customer_name && (
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span>Customer</span><span>{invoice.customer_name}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div style={{ borderTop:'1px dashed #333', borderBottom:'1px dashed #333', padding:'8px 0', marginBottom:8 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto', gap:'0 8px', fontSize:11, fontWeight:700, marginBottom:4 }}>
          <span>Item</span><span style={{ textAlign:'right' }}>Qty</span><span style={{ textAlign:'right' }}>Rate</span><span style={{ textAlign:'right' }}>Amt</span>
        </div>
        {invoice.items?.map((item, i) => (
          <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto', gap:'0 8px', fontSize:12, marginBottom:2 }}>
            <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.product_name}</span>
            <span style={{ textAlign:'right' }}>{item.quantity}</span>
            <span style={{ textAlign:'right' }}>₹{parseFloat(item.unit_price).toFixed(2)}</span>
            <span style={{ textAlign:'right' }}>₹{parseFloat(item.total_price).toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div style={{ marginBottom:8 }}>
        {[
          ['Subtotal',  `₹${subtotal.toFixed(2)}`,  false],
          ['Discount',  `- ₹${discount.toFixed(2)}`, false],
          ['GST',       `₹${gst.toFixed(2)}`,        false],
          ['TOTAL',     `₹${total.toFixed(2)}`,       true ],
          ['Paid',      `₹${paid.toFixed(2)}`,        false],
          ['Change',    `₹${change.toFixed(2)}`,      false],
        ].map(([label, value, bold]) => (
          <div key={label} style={{ display:'flex', justifyContent:'space-between', fontWeight: bold ? 900 : 400, fontSize: bold ? 15 : 13, borderTop: bold ? '1px solid #333' : 'none', paddingTop: bold ? 4 : 0 }}>
            <span>{label}</span><span>{value}</span>
          </div>
        ))}
      </div>

      {/* Payment */}
      <div style={{ borderTop:'1px dashed #333', paddingTop:6, marginBottom:8, fontSize:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between' }}>
          <span>Payment</span><span style={{ textTransform:'uppercase', fontWeight:700 }}>{invoice.payment_method}</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between' }}>
          <span>Status</span><span style={{ textTransform:'uppercase', fontWeight:700 }}>{invoice.status}</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign:'center', borderTop:'2px dashed #333', paddingTop:8, fontSize:11 }}>
        <div>Thank you for shopping!</div>
        <div>Visit us again at Sultan Mart</div>
        <div style={{ marginTop:4, fontSize:10, color:'#555' }}>Powered by Sultan Mart POS</div>
      </div>
    </div>
  )
}

/* ── Bill Modal ── */
function BillModal({ invoice, onClose }) {
  const printRef = useRef()
  const handlePrint = useReactToPrint({ contentRef: printRef })

  const downloadPdf = async () => {
    try {
      const { data } = await billingApi.getReceiptPdf(invoice.id)
      const url = URL.createObjectURL(new Blob([data], { type:'application/pdf' }))
      const a = document.createElement('a')
      a.href = url; a.download = `receipt_${invoice.invoice_number}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('PDF download failed') }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(10,20,35,.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16, backdropFilter:'blur(3px)' }}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:420, boxShadow:'0 24px 64px rgba(0,0,0,.25)', overflow:'hidden' }}>

        {/* Modal header */}
        <div style={{ background:'var(--brand)', padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <p style={{ fontWeight:700, fontSize:15, color:'#fff' }}>Bill / Receipt</p>
            <p style={{ fontSize:11, color:'rgba(255,255,255,.55)', marginTop:1 }}>{invoice.invoice_number}</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={handlePrint}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'none', background:'rgba(255,255,255,.15)', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>
              <Printer size={13} /> Print
            </button>
            <button onClick={downloadPdf}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'none', background:'var(--accent)', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>
              <Download size={13} /> PDF
            </button>
            <button onClick={onClose}
              style={{ background:'rgba(255,255,255,.15)', border:'none', borderRadius:8, padding:'7px 10px', cursor:'pointer', color:'#fff', display:'flex' }}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Bill preview */}
        <div style={{ padding:'20px 24px', maxHeight:'70vh', overflowY:'auto', background:'#fafafa' }}>
          <div style={{ background:'#fff', border:'1px solid #dce6ef', borderRadius:10, padding:'16px 20px', maxWidth:320, margin:'0 auto' }}>
            <div ref={printRef} id="receipt-print">
              <BillView invoice={invoice} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Main Invoices Page ── */
export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [filter,   setFilter]   = useState({ status:'', payment_method:'' })
  const [search,   setSearch]   = useState('')
  const [viewBill, setViewBill] = useState(null)   // full invoice object
  const [loading,  setLoading]  = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await billingApi.getInvoices(filter)
      setInvoices(data.results || data)
    } catch { toast.error('Failed to load invoices') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filter])

  const openBill = async (id) => {
    try {
      const { data } = await billingApi.getInvoice(id)
      setViewBill(data)
    } catch { toast.error('Failed to load bill') }
  }

  const sendWhatsApp = async (id) => {
    const phone = prompt('Enter WhatsApp number (with country code, e.g. +919876543210):')
    if (!phone) return
    try {
      await billingApi.sendWhatsApp(id, phone)
      toast.success('WhatsApp message queued!')
    } catch { toast.error('Failed to send') }
  }

  const cancel = async (id) => {
    if (!confirm('Cancel this invoice? Stock will be restored.')) return
    try {
      await billingApi.cancelInvoice(id)
      toast.success('Invoice cancelled')
      load()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
  }

  const deleteInvoice = async (id, invoiceNumber) => {
    if (!confirm(`Delete invoice ${invoiceNumber} permanently? This cannot be undone.`)) return
    try {
      await billingApi.deleteInvoice(id)
      toast.success('Invoice deleted')
      load()
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || `Error ${err.response?.status}` || 'Failed to delete'
      toast.error(msg)
    }
  }

  const STATUS_CFG = {
    paid:      { bg:'#dcfce7', color:'#16a34a' },
    partial:   { bg:'#fef9c3', color:'#d97706' },
    cancelled: { bg:'#fee2e2', color:'#dc2626' },
    draft:     { bg:'#f1f5f9', color:'#64748b' },
  }

  const filtered = invoices.filter(inv =>
    !search || inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    (inv.customer_name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding:24 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:800, color:'var(--text-main)' }}>Invoices</h1>
          <p style={{ fontSize:12, color:'var(--text-sub)', marginTop:2 }}>View, print and manage all bills</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          {/* Search */}
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'#fff', border:'1.5px solid var(--border)', borderRadius:9, padding:'7px 12px' }}>
            <Search size={14} color="var(--text-muted)" />
            <input style={{ border:'none', outline:'none', fontSize:13, width:160, color:'var(--text-main)' }}
              placeholder="Search invoice / customer..."
              value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', display:'flex' }}><X size={13} color="var(--text-muted)" /></button>}
          </div>
          {/* Filters */}
          <select style={{ padding:'7px 12px', border:'1.5px solid var(--border)', borderRadius:9, fontSize:13, outline:'none', background:'#fff', color:'var(--text-main)' }}
            value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select style={{ padding:'7px 12px', border:'1.5px solid var(--border)', borderRadius:9, fontSize:13, outline:'none', background:'#fff', color:'var(--text-main)' }}
            value={filter.payment_method} onChange={e => setFilter({ ...filter, payment_method: e.target.value })}>
            <option value="">All Payments</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="credit">Credit</option>
          </select>
        </div>
      </div>

      {/* Summary strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
        {[
          { label:'Total Bills',   value: invoices.length,                                          color:'var(--brand)' },
          { label:'Paid',          value: invoices.filter(i=>i.status==='paid').length,              color:'#16a34a' },
          { label:'Partial',       value: invoices.filter(i=>i.status==='partial').length,           color:'#d97706' },
          { label:'Total Revenue', value:`₹${invoices.filter(i=>i.status!=='cancelled').reduce((s,i)=>s+parseFloat(i.total_amount||0),0).toLocaleString('en-IN')}`, color:'var(--accent)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background:'#fff', borderRadius:12, border:'1px solid var(--border)', padding:'14px 18px', boxShadow:'var(--shadow-sm)' }}>
            <p style={{ fontSize:11, color:'var(--text-sub)', fontWeight:600 }}>{label}</p>
            <p style={{ fontSize:20, fontWeight:800, color, marginTop:3 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid var(--border)', overflow:'hidden', boxShadow:'var(--shadow-sm)' }}>
        <table className="sm-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date & Time</th>
              <th>Customer</th>
              <th>Cashier</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>Loading invoices...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>No invoices found</td></tr>
            ) : filtered.map(inv => {
              const sc = STATUS_CFG[inv.status] || STATUS_CFG.draft
              return (
                <tr key={inv.id}>
                  <td style={{ fontFamily:'monospace', fontSize:12, fontWeight:700, color:'var(--brand)' }}>{inv.invoice_number}</td>
                  <td style={{ fontSize:12, color:'var(--text-sub)' }}>
                    {format(new Date(inv.created_at), 'dd MMM yyyy')}<br />
                    <span style={{ fontSize:11 }}>{format(new Date(inv.created_at), 'hh:mm a')}</span>
                  </td>
                  <td style={{ fontWeight:600 }}>{inv.customer_name || <span style={{ color:'var(--text-muted)' }}>Walk-in</span>}</td>
                  <td style={{ color:'var(--text-sub)', fontSize:12 }}>{inv.cashier_name}</td>
                  <td style={{ color:'var(--text-sub)' }}>{inv.items?.length || '—'}</td>
                  <td style={{ fontWeight:800, fontSize:14, color:'var(--text-main)' }}>₹{parseFloat(inv.total_amount).toLocaleString('en-IN')}</td>
                  <td style={{ textTransform:'capitalize', fontSize:12 }}>{inv.payment_method}</td>
                  <td>
                    <span style={{ background:sc.bg, color:sc.color, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, textTransform:'capitalize' }}>
                      {inv.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:6 }}>
                      {/* View Bill */}
                      <button onClick={() => openBill(inv.id)} title="View Bill"
                        style={{ width:30, height:30, borderRadius:7, border:'1.5px solid #bfdbfe', background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                        <Eye size={13} color="#3b82f6" />
                      </button>
                      {/* Print / Download */}
                      <button onClick={() => openBill(inv.id)} title="Print / Download"
                        style={{ width:30, height:30, borderRadius:7, border:'1.5px solid #d1fae5', background:'#ecfdf5', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                        <Printer size={13} color="#16a34a" />
                      </button>
                      {/* Cancel */}
                      {inv.status !== 'cancelled' && (
                        <button onClick={() => cancel(inv.id)} title="Cancel Invoice"
                          style={{ width:30, height:30, borderRadius:7, border:'1.5px solid #fecaca', background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                          <XCircle size={13} color="#ef4444" />
                        </button>
                      )}
                      {/* Delete */}
                      <button onClick={() => deleteInvoice(inv.id, inv.invoice_number)} title="Delete Invoice"
                        style={{ width:30, height:30, borderRadius:7, border:'1.5px solid #fca5a5', background:'#fee2e2', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                        <Trash2 size={13} color="#dc2626" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {!loading && filtered.length > 0 && (
          <div style={{ padding:'10px 16px', background:'var(--page-bg)', borderTop:'1px solid var(--border)', fontSize:12, color:'var(--text-muted)' }}>
            Showing {filtered.length} of {invoices.length} invoices
          </div>
        )}
      </div>

      {/* Bill Modal */}
      {viewBill && <BillModal invoice={viewBill} onClose={() => setViewBill(null)} />}
    </div>
  )
}
