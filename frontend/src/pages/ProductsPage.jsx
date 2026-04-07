import { useState, useEffect } from 'react'
import { inventoryApi } from '../api/inventory'
import toast from 'react-hot-toast'
import { Plus, Search, Pencil, Trash2, AlertTriangle, X, Package, BarChart3, Calendar } from 'lucide-react'

const S = { inp: { width:'100%', padding:'9px 12px', fontSize:13, border:'1.5px solid #dce6ef', borderRadius:8, outline:'none', boxSizing:'border-box', background:'#fff' } }

function BatchModal({ product, onClose }) {
  const [batches, setBatches] = useState([])
  const [form, setForm] = useState({ batch_number:'', expiry_date:'', quantity:'', purchase_price:'' })
  const [saving, setSaving] = useState(false)

  const load = () => inventoryApi.getBatches(product.id).then(r => setBatches(r.data.results || r.data)).catch(() => {})
  useEffect(() => { load() }, [])

  const handleAdd = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await inventoryApi.createBatch({ ...form, product: product.id })
      toast.success('Batch added')
      setForm({ batch_number:'', expiry_date:'', quantity:'', purchase_price:'' })
      load()
    } catch { toast.error('Failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    await inventoryApi.deleteBatch(id)
    toast.success('Batch removed')
    load()
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(10,20,35,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16 }}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:560, maxHeight:'85vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,.2)' }}>
        <div style={{ background:'var(--brand)', padding:'16px 22px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <p style={{ color:'#fff', fontWeight:700, fontSize:15 }}>Batch / Expiry Tracking</p>
            <p style={{ color:'rgba(255,255,255,.6)', fontSize:11, marginTop:2 }}>{product.name}</p>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,.15)', border:'none', borderRadius:7, padding:'5px 10px', cursor:'pointer', color:'#fff' }}>✕</button>
        </div>

        <div style={{ padding:20, overflowY:'auto', flex:1 }}>
          {/* Add batch form */}
          <form onSubmit={handleAdd} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20, padding:16, background:'var(--page-bg)', borderRadius:10, border:'1px solid var(--border)' }}>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'var(--text-sub)', display:'block', marginBottom:4 }}>Batch Number *</label>
              <input value={form.batch_number} onChange={e => setForm(p=>({...p,batch_number:e.target.value}))} required
                style={S.inp} placeholder="e.g. B2024001" />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'var(--text-sub)', display:'block', marginBottom:4 }}>Expiry Date *</label>
              <input type="date" value={form.expiry_date} onChange={e => setForm(p=>({...p,expiry_date:e.target.value}))} required
                style={S.inp} min={today} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'var(--text-sub)', display:'block', marginBottom:4 }}>Quantity *</label>
              <input type="number" step="0.001" value={form.quantity} onChange={e => setForm(p=>({...p,quantity:e.target.value}))} required
                style={S.inp} placeholder="0" />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'var(--text-sub)', display:'block', marginBottom:4 }}>Purchase Price</label>
              <input type="number" step="0.01" value={form.purchase_price} onChange={e => setForm(p=>({...p,purchase_price:e.target.value}))}
                style={S.inp} placeholder="0.00" />
            </div>
            <div style={{ gridColumn:'1/-1', display:'flex', justifyContent:'flex-end' }}>
              <button type="submit" disabled={saving}
                style={{ padding:'8px 20px', borderRadius:8, border:'none', background:'var(--brand)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                {saving ? 'Adding...' : '+ Add Batch'}
              </button>
            </div>
          </form>

          {/* Batch list */}
          {batches.length === 0 ? (
            <p style={{ textAlign:'center', color:'var(--text-muted)', padding:20 }}>No batches added yet</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {batches.map(b => {
                const days = b.expiry_date ? Math.ceil((new Date(b.expiry_date) - new Date()) / 86400000) : null
                const expired = days !== null && days < 0
                const soon = days !== null && days >= 0 && days <= 30
                return (
                  <div key={b.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', borderRadius:9, border:`1px solid ${expired?'#fecaca':soon?'#fde68a':'var(--border)'}`, background: expired?'#fff5f5':soon?'#fffbeb':'#fff' }}>
                    <div>
                      <p style={{ fontWeight:600, fontSize:13 }}>{b.batch_number}</p>
                      <p style={{ fontSize:11, color:'var(--text-muted)' }}>Qty: {b.quantity} · ₹{b.purchase_price}</p>
                    </div>
                    <div style={{ textAlign:'right', display:'flex', alignItems:'center', gap:10 }}>
                      <div>
                        <p style={{ fontSize:12, fontWeight:700, color: expired?'#dc2626':soon?'#d97706':'#16a34a' }}>
                          {b.expiry_date}
                        </p>
                        <p style={{ fontSize:10, color:'var(--text-muted)' }}>
                          {expired ? '⚠ Expired' : days !== null ? `${days} days left` : '—'}
                        </p>
                      </div>
                      <button onClick={() => handleDelete(b.id)}
                        style={{ width:28, height:28, borderRadius:7, border:'1.5px solid #fecaca', background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                        <Trash2 size={12} color="#ef4444" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DeleteConfirm({ name, onConfirm, onClose }) {  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(10,20,35,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16 }}>
      <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:360, overflow:'hidden', boxShadow:'0 20px 50px rgba(0,0,0,.2)' }}>
        <div style={{ background:'#fef2f2', padding:'16px 20px', borderBottom:'1px solid #fecaca', display:'flex', alignItems:'center', gap:10 }}>
          <Trash2 size={18} color="#ef4444" />
          <p style={{ fontWeight:700, fontSize:15, color:'#1c2833' }}>Delete Product</p>
        </div>
        <div style={{ padding:20 }}>
          <p style={{ fontSize:13, color:'#475569', marginBottom:20 }}>Delete <strong>{name}</strong>? This cannot be undone.</p>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button onClick={onClose} style={{ padding:'8px 18px', borderRadius:8, border:'1.5px solid #dce6ef', background:'#f8fafc', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancel</button>
            <button onClick={onConfirm} style={{ padding:'8px 18px', borderRadius:8, border:'none', background:'#ef4444', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductModal({ product, categories, units, onSave, onClose }) {
  const isEdit = !!product?.id
  const [form, setForm] = useState({
    name:'', sku:'', barcode:'', category:'', unit:'',
    purchase_price:'', selling_price:'', mrp:'', gst_rate:0,
    low_stock_threshold:10, description:'', is_active:true,
    ...(product || {})
  })
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      if (isEdit) { await inventoryApi.updateProduct(product.id, form); toast.success('Product updated') }
      else        { await inventoryApi.createProduct(form);             toast.success('Product added') }
      onSave()
    } catch (err) { toast.error(err.response?.data?.name?.[0] || err.response?.data?.sku?.[0] || 'Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(10,20,35,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:16 }}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:620, maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,.2)' }}>
        <div style={{ background:'var(--brand)', padding:'16px 22px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Package size={18} color="#e67e22" />
            <p style={{ fontWeight:700, fontSize:15, color:'#fff' }}>{isEdit ? 'Edit Product' : 'Add New Product'}</p>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,.15)', border:'none', borderRadius:7, padding:'5px 10px', cursor:'pointer', color:'#fff', fontSize:16 }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding:22, overflowY:'auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={{ fontSize:11, fontWeight:600, color:'#64748b', display:'block', marginBottom:5 }}>Product Name *</label>
            <input style={S.inp} value={form.name} onChange={set('name')} placeholder="e.g. Toor Dal 1kg" required onFocus={e=>e.target.style.borderColor='#1a3c5e'} onBlur={e=>e.target.style.borderColor='#dce6ef'} />
          </div>
          {[
            { k:'sku',      label:'SKU *',        req:true,  type:'text',   ph:'e.g. DAL001' },
            { k:'barcode',  label:'Barcode',       req:false, type:'text',   ph:'Scan or enter' },
          ].map(({ k, label, req, type, ph }) => (
            <div key={k}>
              <label style={{ fontSize:11, fontWeight:600, color:'#64748b', display:'block', marginBottom:5 }}>{label}</label>
              <input style={S.inp} type={type} value={form[k]||''} onChange={set(k)} placeholder={ph} required={req} onFocus={e=>e.target.style.borderColor='#1a3c5e'} onBlur={e=>e.target.style.borderColor='#dce6ef'} />
            </div>
          ))}
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:'#64748b', display:'block', marginBottom:5 }}>Category</label>
            <select style={S.inp} value={form.category||''} onChange={set('category')}>
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:'#64748b', display:'block', marginBottom:5 }}>Unit</label>
            <select style={S.inp} value={form.unit||''} onChange={set('unit')}>
              <option value="">Select unit</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>)}
            </select>
          </div>
          {[
            { k:'purchase_price', label:'Purchase Price (₹)', type:'number' },
            { k:'selling_price',  label:'Selling Price (₹) *', type:'number', req:true },
            { k:'mrp',            label:'MRP (₹)',             type:'number' },
            { k:'low_stock_threshold', label:'Low Stock Alert', type:'number' },
          ].map(({ k, label, type, req }) => (
            <div key={k}>
              <label style={{ fontSize:11, fontWeight:600, color:'#64748b', display:'block', marginBottom:5 }}>{label}</label>
              <input style={S.inp} type={type} step="0.01" value={form[k]||''} onChange={set(k)} required={req} onFocus={e=>e.target.style.borderColor='#1a3c5e'} onBlur={e=>e.target.style.borderColor='#dce6ef'} />
            </div>
          ))}
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:'#64748b', display:'block', marginBottom:5 }}>GST Rate</label>
            <select style={S.inp} value={form.gst_rate} onChange={set('gst_rate')}>
              {[0,5,12,18,28].map(r => <option key={r} value={r}>{r}%</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:'#64748b', display:'block', marginBottom:5 }}>Status</label>
            <select style={S.inp} value={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.value === 'true' }))}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={{ fontSize:11, fontWeight:600, color:'#64748b', display:'block', marginBottom:5 }}>Description</label>
            <textarea style={{ ...S.inp, resize:'none' }} rows={2} value={form.description||''} onChange={set('description')} placeholder="Optional product description" onFocus={e=>e.target.style.borderColor='#1a3c5e'} onBlur={e=>e.target.style.borderColor='#dce6ef'} />
          </div>
          <div style={{ gridColumn:'1/-1', display:'flex', justifyContent:'flex-end', gap:10, paddingTop:4 }}>
            <button type="button" onClick={onClose} style={{ padding:'9px 20px', borderRadius:8, border:'1.5px solid #dce6ef', background:'#f8fafc', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ padding:'9px 24px', borderRadius:8, border:'none', background: saving?'#a0b4c8':'var(--brand)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
              {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  const [products,   setProducts]   = useState([])
  const [categories, setCategories] = useState([])
  const [units,      setUnits]      = useState([])
  const [search,     setSearch]     = useState('')
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(null)
  const [delModal,   setDelModal]   = useState(null)
  const [batchModal, setBatchModal] = useState(null)
  const [stockModal, setStockModal] = useState(null)  // { product, qty, note }

  const load = async () => {
    setLoading(true)
    const [p, c, u] = await Promise.all([
      inventoryApi.getProducts({ search }),
      inventoryApi.getCategories(),
      inventoryApi.getUnits(),
    ])
    setProducts(p.data.results || p.data)
    setCategories(c.data.results || c.data)
    setUnits(u.data.results || u.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [search])

  const handleDelete = async (product) => {
    try {
      await inventoryApi.deleteProduct(product.id)
      toast.success('Product deleted')
      setDelModal(null); load()
    } catch { toast.error('Cannot delete — product may have linked invoices') }
  }

  const handleStockAdd = async () => {
    if (!stockModal.qty || parseFloat(stockModal.qty) === 0) return toast.error('Enter quantity')
    try {
      await inventoryApi.adjustStock(stockModal.product.id, {
        quantity: parseFloat(stockModal.qty),
        notes: stockModal.note || 'Manual stock addition'
      })
      toast.success(`Stock updated for ${stockModal.product.name}`)
      setStockModal(null)
      load()
    } catch { toast.error('Failed to update stock') }
  }

  const lowStockCount = products.filter(p => p.is_low_stock).length

  return (
    <div style={{ padding:24 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:800, color:'var(--text-main)' }}>Products</h1>
          <p style={{ fontSize:12, color:'var(--text-sub)', marginTop:2 }}>{products.length} products · {lowStockCount > 0 && <span style={{ color:'#dc2626', fontWeight:600 }}>{lowStockCount} low stock</span>}</p>
        </div>
        <button onClick={() => setModal('add')} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:9, border:'none', background:'var(--brand)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 2px 8px rgba(26,60,94,.25)' }}>
          <Plus size={15} /> Add Product
        </button>
      </div>

      {/* Search */}
      <div style={{ display:'flex', alignItems:'center', gap:10, background:'#fff', border:'1.5px solid #dce6ef', borderRadius:10, padding:'8px 14px', marginBottom:16, boxShadow:'0 1px 3px rgba(0,0,0,.05)' }}>
        <Search size={15} color="#94a3b8" />
        <input style={{ flex:1, border:'none', outline:'none', fontSize:13, color:'var(--text-main)' }} placeholder="Search by name, SKU or barcode..." value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', display:'flex' }}><X size={14} color="#94a3b8" /></button>}
      </div>

      {/* Table */}
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #dce6ef', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
        <table className="sm-table">
          <thead>
            <tr>
              <th>SKU</th><th>Product</th><th>Category</th><th>Stock</th>
              <th>Purchase</th><th>Selling</th><th>MRP</th><th>GST</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ textAlign:'center', padding:40, color:'#94a3b8' }}>Loading products...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign:'center', padding:48, color:'#94a3b8' }}>
                <Package size={36} color="#dce6ef" style={{ display:'block', margin:'0 auto 10px' }} />
                No products found
              </td></tr>
            ) : products.map(p => (
              <tr key={p.id} style={{ background: p.is_low_stock ? '#fffbeb' : 'inherit' }}>
                <td style={{ fontFamily:'monospace', fontSize:11, color:'#64748b' }}>{p.sku}</td>
                <td style={{ fontWeight:600 }}>{p.name}</td>
                <td style={{ color:'#64748b', fontSize:12 }}>{p.category_name || '—'}</td>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontWeight:700, color: p.is_low_stock ? '#dc2626' : '#16a34a', display:'flex', alignItems:'center', gap:4 }}>
                      {p.is_low_stock && <AlertTriangle size={12} />}
                      {p.stock_quantity} {p.unit_name}
                    </span>
                    <button onClick={() => setStockModal({ product: p, qty: '', note: '' })}
                      title="Add Stock"
                      style={{ width:20, height:20, borderRadius:5, border:'1.5px solid #bbf7d0', background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
                      <Plus size={11} color="#16a34a" />
                    </button>
                  </div>
                </td>
                <td>₹{p.purchase_price}</td>
                <td style={{ fontWeight:700 }}>₹{p.selling_price}</td>
                <td style={{ color:'#64748b' }}>₹{p.mrp || '—'}</td>
                <td>{p.gst_rate}%</td>
                <td>
                  <span style={{ background: p.is_active?'#dcfce7':'#f1f5f9', color: p.is_active?'#16a34a':'#64748b', padding:'2px 9px', borderRadius:20, fontSize:11, fontWeight:600 }}>
                    {p.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => setModal(p)} title="Edit" style={{ width:30, height:30, borderRadius:7, border:'1.5px solid #bfdbfe', background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                      <Pencil size={13} color="#3b82f6" />
                    </button>
                    <button onClick={() => setBatchModal(p)} title="Batches / Expiry" style={{ width:30, height:30, borderRadius:7, border:'1.5px solid #e9d5ff', background:'#f5f3ff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                      <Calendar size={13} color="#7c3aed" />
                    </button>
                    <button onClick={() => setDelModal(p)} title="Delete" style={{ width:30, height:30, borderRadius:7, border:'1.5px solid #fecaca', background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                      <Trash2 size={13} color="#ef4444" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && products.length > 0 && (
          <div style={{ padding:'9px 16px', background:'#f8fafc', borderTop:'1px solid #eef2f6', fontSize:12, color:'#94a3b8' }}>
            {products.length} products total
          </div>
        )}
      </div>

      {modal && <ProductModal product={modal==='add'?null:modal} categories={categories} units={units} onSave={() => { setModal(null); load() }} onClose={() => setModal(null)} />}
      {delModal && <DeleteConfirm name={delModal.name} onConfirm={() => handleDelete(delModal)} onClose={() => setDelModal(null)} />}
      {batchModal && <BatchModal product={batchModal} onClose={() => setBatchModal(null)} />}

      {/* Quick Stock Add Modal */}
      {stockModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(10,20,35,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16 }}>
          <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:360, overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ background:'#f0fdf4', padding:'16px 20px', borderBottom:'1px solid #bbf7d0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <p style={{ fontWeight:700, fontSize:15, color:'#15803d' }}>Add Stock</p>
                <p style={{ fontSize:12, color:'#16a34a', marginTop:2 }}>{stockModal.product.name} — Current: {stockModal.product.stock_quantity} {stockModal.product.unit_name}</p>
              </div>
              <button onClick={() => setStockModal(null)} style={{ background:'none', border:'none', cursor:'pointer', display:'flex' }}><X size={16} color="#16a34a" /></button>
            </div>
            <div style={{ padding:20, display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'#64748b', display:'block', marginBottom:5 }}>Quantity to Add *</label>
                <input type="number" step="0.001" autoFocus
                  value={stockModal.qty}
                  onChange={e => setStockModal(p => ({...p, qty: e.target.value}))}
                  placeholder="e.g. 50"
                  style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #dce6ef', borderRadius:8, fontSize:16, fontWeight:700, outline:'none', boxSizing:'border-box' }}
                  onKeyDown={e => e.key === 'Enter' && handleStockAdd()}
                />
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'#64748b', display:'block', marginBottom:5 }}>Reason (optional)</label>
                <input type="text"
                  value={stockModal.note}
                  onChange={e => setStockModal(p => ({...p, note: e.target.value}))}
                  placeholder="e.g. New purchase, Stock count"
                  style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dce6ef', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }}
                />
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button onClick={() => setStockModal(null)}
                  style={{ padding:'9px 20px', borderRadius:8, border:'1.5px solid #dce6ef', background:'#f8fafc', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleStockAdd}
                  style={{ padding:'9px 24px', borderRadius:8, border:'none', background:'#16a34a', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                  <Plus size={14} /> Add Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
