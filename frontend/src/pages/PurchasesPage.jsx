import { useState, useEffect } from 'react'
import { accountingApi } from '../api/accounting'
import { inventoryApi } from '../api/inventory'
import toast from 'react-hot-toast'
import { Plus, Trash2, CheckCircle, Pencil, X, Search } from 'lucide-react'
import { format } from 'date-fns'

const inp = { width:'100%', padding:'9px 12px', fontSize:13, border:'1.5px solid #dce6ef', borderRadius:8, outline:'none', boxSizing:'border-box', background:'#fff' }

function PurchaseModal({ purchase, suppliers, products, onSave, onClose }) {
  const isEdit = !!purchase
  const [supplier, setSupplier] = useState(purchase?.supplier || '')
  const [notes, setNotes]       = useState(purchase?.notes || '')
  const [items, setItems]       = useState(
    purchase?.items?.map(i => ({ product: i.product, quantity: i.quantity, unit_price: i.unit_price, total_price: i.total_price }))
    || [{ product: '', quantity: '', unit_price: '', total_price: 0 }]
  )
  const [saving, setSaving] = useState(false)

  const addItem    = () => setItems(p => [...p, { product: '', quantity: '', unit_price: '', total_price: 0 }])
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i))

  const updateItem = (i, field, value) => {
    const updated = [...items]
    updated[i] = { ...updated[i], [field]: value }
    if (field === 'product') {
      const prod = products.find(p => p.id === parseInt(value))
      if (prod?.purchase_price) updated[i].unit_price = prod.purchase_price
    }
    const qty   = parseFloat(field === 'quantity'  ? value : updated[i].quantity)  || 0
    const price = parseFloat(field === 'unit_price' ? value : updated[i].unit_price) || 0
    updated[i].total_price = parseFloat((qty * price).toFixed(2))
    setItems(updated)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!supplier) return toast.error('Select a supplier')
    const validItems = items.filter(i => i.product && parseFloat(i.quantity) > 0 && parseFloat(i.unit_price) > 0)
    if (validItems.length === 0) return toast.error('Add at least one item with product, qty and price')
    setSaving(true)
    try {
      const payload = {
        supplier: parseInt(supplier),
        notes,
        items: validItems.map(i => ({
          product:     parseInt(i.product),
          quantity:    parseFloat(i.quantity),
          unit_price:  parseFloat(i.unit_price),
          total_price: parseFloat(i.total_price),
        })),
      }
      if (isEdit) {
        await accountingApi.updatePurchase(purchase.id, payload)
        toast.success('Purchase updated')
      } else {
        await accountingApi.createPurchase(payload)
        toast.success('Purchase created & stock will update on receive')
      }
      onSave()
    } catch (err) {
      const msg = err.response?.data
      toast.error(typeof msg === 'object' ? JSON.stringify(msg) : 'Failed to save')
    } finally { setSaving(false) }
  }

  const total = items.reduce((s, i) => s + (i.total_price || 0), 0)

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(10,20,35,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:16 }}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:720, maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,.2)' }}>
        <div style={{ background:'var(--brand)', padding:'16px 22px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <p style={{ fontWeight:700, fontSize:15, color:'#fff' }}>{isEdit ? 'Edit Purchase Order' : 'New Purchase Order'}</p>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,.15)', border:'none', borderRadius:7, padding:'5px 10px', cursor:'pointer', color:'#fff', fontSize:16 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding:20, overflowY:'auto', display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'#64748b', display:'block', marginBottom:5 }}>Supplier *</label>
              <select style={inp} value={supplier} onChange={e => setSupplier(e.target.value)} required>
                <option value="">Select supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'#64748b', display:'block', marginBottom:5 }}>Notes</label>
              <input style={inp} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" />
            </div>
          </div>

          {/* Items */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <label style={{ fontSize:12, fontWeight:600, color:'#64748b' }}>Items *</label>
              <button type="button" onClick={addItem}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:7, border:'1.5px solid var(--brand)', background:'#eff6ff', color:'var(--brand)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                <Plus size={12} /> Add Item
              </button>
            </div>

            {/* Header */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 90px 110px 90px 32px', gap:8, marginBottom:6 }}>
              {['Product','Qty','Purchase Price','Total',''].map(h => (
                <span key={h} style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase' }}>{h}</span>
              ))}
            </div>

            {items.map((item, i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 90px 110px 90px 32px', gap:8, marginBottom:8, alignItems:'center' }}>
                <select style={inp} value={item.product} onChange={e => updateItem(i, 'product', e.target.value)} required>
                  <option value="">Select product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input style={inp} type="number" step="0.001" placeholder="Qty" value={item.quantity}
                  onChange={e => updateItem(i, 'quantity', e.target.value)} />
                <input style={inp} type="number" step="0.01" placeholder="₹ Price" value={item.unit_price}
                  onChange={e => updateItem(i, 'unit_price', e.target.value)} />
                <span style={{ fontSize:13, fontWeight:700, color:'var(--brand)', textAlign:'right' }}>
                  ₹{(item.total_price || 0).toFixed(2)}
                </span>
                <button type="button" onClick={() => removeItem(i)}
                  style={{ width:32, height:32, borderRadius:7, border:'1.5px solid #fecaca', background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                  <X size={13} color="#dc2626" />
                </button>
              </div>
            ))}

            <div style={{ textAlign:'right', fontWeight:800, fontSize:15, color:'var(--accent)', marginTop:6 }}>
              Total: ₹{total.toFixed(2)}
            </div>
          </div>

          <div style={{ display:'flex', justifyContent:'flex-end', gap:10, paddingTop:4 }}>
            <button type="button" onClick={onClose}
              style={{ padding:'9px 20px', borderRadius:8, border:'1.5px solid #dce6ef', background:'#f8fafc', fontSize:13, fontWeight:600, cursor:'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              style={{ padding:'9px 24px', borderRadius:8, border:'none', background: saving?'#a0b4c8':'var(--brand)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
              {saving ? 'Saving...' : isEdit ? 'Update Purchase' : 'Create Purchase Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [products,  setProducts]  = useState([])
  const [modal,     setModal]     = useState(null)  // null | 'new' | purchase obj
  const [search,    setSearch]    = useState('')

  const load = async () => {
    const [p, s, pr] = await Promise.all([
      accountingApi.getPurchases(),
      accountingApi.getSuppliers(),
      inventoryApi.getProducts(),
    ])
    setPurchases(p.data.results || p.data)
    setSuppliers(s.data.results || s.data)
    setProducts(pr.data.results || pr.data)
  }

  useEffect(() => { load() }, [])

  const markReceived = async (po) => {
    if (!confirm(`Mark PO ${po.po_number} as received? Stock will be updated automatically.`)) return
    try {
      const { data } = await accountingApi.markPurchaseReceived(po.id)
      toast.success(data.message || 'Stock updated!')
      load()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
  }

  const deletePurchase = async (po) => {
    if (!confirm(`Delete PO ${po.po_number}? This cannot be undone.`)) return
    try {
      await accountingApi.deletePurchase(po.id)
      toast.success('Purchase deleted')
      load()
    } catch { toast.error('Cannot delete — may have linked records') }
  }

  const filtered = purchases.filter(p =>
    !search || p.po_number?.toLowerCase().includes(search.toLowerCase()) ||
    p.supplier_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding:24 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:800, color:'var(--text-main)' }}>Purchase Orders</h1>
          <p style={{ fontSize:12, color:'var(--text-sub)', marginTop:2 }}>{purchases.length} orders total</p>
        </div>
        <button onClick={() => setModal('new')}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:9, border:'none', background:'var(--brand)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 2px 8px rgba(26,60,94,.25)' }}>
          <Plus size={15} /> New Purchase
        </button>
      </div>

      {/* Search */}
      <div style={{ display:'flex', alignItems:'center', gap:10, background:'#fff', border:'1.5px solid #dce6ef', borderRadius:10, padding:'8px 14px', marginBottom:16 }}>
        <Search size={15} color="#94a3b8" />
        <input style={{ flex:1, border:'none', outline:'none', fontSize:13 }} placeholder="Search by PO number or supplier..."
          value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', display:'flex' }}><X size={14} color="#94a3b8" /></button>}
      </div>

      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #dce6ef', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
        <table className="sm-table">
          <thead>
            <tr>
              {['PO Number','Date','Supplier','Total','Status','Actions'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign:'center', padding:48, color:'#94a3b8' }}>
                No purchase orders yet. Click "New Purchase" to add one.
              </td></tr>
            ) : filtered.map(p => (
              <tr key={p.id}>
                <td style={{ fontFamily:'monospace', fontSize:12, fontWeight:700, color:'var(--brand)' }}>{p.po_number}</td>
                <td style={{ color:'#64748b', fontSize:12 }}>{format(new Date(p.created_at), 'dd MMM yyyy')}</td>
                <td style={{ fontWeight:600 }}>{p.supplier_name}</td>
                <td style={{ fontWeight:800, color:'var(--text-main)' }}>₹{parseFloat(p.total_amount).toLocaleString('en-IN')}</td>
                <td>
                  <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, textTransform:'capitalize',
                    background: p.status==='received' ? '#dcfce7' : '#fef9c3',
                    color:      p.status==='received' ? '#16a34a' : '#d97706' }}>
                    {p.status}
                  </span>
                </td>
                <td>
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    {p.status !== 'received' && (
                      <>
                        <button onClick={() => setModal(p)} title="Edit"
                          style={{ width:30, height:30, borderRadius:7, border:'1.5px solid #bfdbfe', background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                          <Pencil size={13} color="#3b82f6" />
                        </button>
                        <button onClick={() => markReceived(p)} title="Mark Received"
                          style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:7, border:'none', background:'#dcfce7', color:'#16a34a', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                          <CheckCircle size={12} /> Received
                        </button>
                      </>
                    )}
                    {p.status === 'received' && (
                      <span style={{ fontSize:11, color:'#16a34a', fontWeight:600 }}>✓ Done</span>
                    )}
                    <button onClick={() => deletePurchase(p)} title="Delete"
                      style={{ width:30, height:30, borderRadius:7, border:'1.5px solid #fecaca', background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                      <Trash2 size={13} color="#ef4444" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <div style={{ padding:'9px 16px', background:'#f8fafc', borderTop:'1px solid #eef2f6', fontSize:12, color:'#94a3b8' }}>
            {filtered.length} purchase order{filtered.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {modal && (
        <PurchaseModal
          purchase={modal === 'new' ? null : modal}
          suppliers={suppliers}
          products={products}
          onSave={() => { setModal(null); load() }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
