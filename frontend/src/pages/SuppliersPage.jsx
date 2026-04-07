import { useState, useEffect } from 'react'
import { accountingApi } from '../api/accounting'
import toast from 'react-hot-toast'
import { Plus, Search, Pencil, Trash2, X, Truck } from 'lucide-react'

const inp = { width:'100%', padding:'9px 12px', fontSize:13, border:'1.5px solid #dce6ef', borderRadius:8, outline:'none', boxSizing:'border-box', background:'#fff' }

function SupplierModal({ supplier, onSave, onClose }) {
  const isEdit = !!supplier?.id
  const [form, setForm] = useState({ name:'', phone:'', email:'', address:'', gst_number:'', ...(supplier||{}) })
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      if (isEdit) { await accountingApi.updateSupplier(supplier.id, form); toast.success('Supplier updated') }
      else        { await accountingApi.createSupplier(form);              toast.success('Supplier added') }
      onSave()
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(10,20,35,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:16 }}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:460, overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.2)' }}>
        <div style={{ background:'var(--brand)', padding:'16px 22px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Truck size={17} color="#e67e22" />
            <p style={{ fontWeight:700, fontSize:15, color:'#fff' }}>{isEdit ? 'Edit Supplier' : 'Add Supplier'}</p>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,.15)', border:'none', borderRadius:7, padding:'5px 10px', cursor:'pointer', color:'#fff', fontSize:16 }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding:22, display:'flex', flexDirection:'column', gap:13 }}>
          {[
            { k:'name',       label:'Supplier Name *', req:true,  type:'text',  ph:'Company or person name' },
            { k:'phone',      label:'Phone',           req:false, type:'text',  ph:'+91 98765 43210' },
            { k:'email',      label:'Email',           req:false, type:'email', ph:'supplier@email.com' },
            { k:'gst_number', label:'GST Number',      req:false, type:'text',  ph:'33AAAAA0000A1Z5' },
          ].map(({ k, label, req, type, ph }) => (
            <div key={k}>
              <label style={{ fontSize:11, fontWeight:600, color:'#64748b', display:'block', marginBottom:5 }}>{label}</label>
              <input style={inp} type={type} value={form[k]||''} onChange={set(k)} placeholder={ph} required={req} onFocus={e=>e.target.style.borderColor='#1a3c5e'} onBlur={e=>e.target.style.borderColor='#dce6ef'} />
            </div>
          ))}
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:'#64748b', display:'block', marginBottom:5 }}>Address</label>
            <textarea style={{ ...inp, resize:'none' }} rows={2} value={form.address||''} onChange={set('address')} placeholder="Street, City, State" onFocus={e=>e.target.style.borderColor='#1a3c5e'} onBlur={e=>e.target.style.borderColor='#dce6ef'} />
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:4 }}>
            <button type="button" onClick={onClose} style={{ padding:'9px 20px', borderRadius:8, border:'1.5px solid #dce6ef', background:'#f8fafc', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ padding:'9px 24px', borderRadius:8, border:'none', background: saving?'#a0b4c8':'var(--brand)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
              {saving ? 'Saving...' : isEdit ? 'Update' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteConfirm({ name, onConfirm, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(10,20,35,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16 }}>
      <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:360, overflow:'hidden', boxShadow:'0 20px 50px rgba(0,0,0,.2)' }}>
        <div style={{ background:'#fef2f2', padding:'16px 20px', borderBottom:'1px solid #fecaca' }}>
          <p style={{ fontWeight:700, fontSize:15, color:'#1c2833' }}>Delete Supplier</p>
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

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([])
  const [search,    setSearch]    = useState('')
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(null)
  const [delModal,  setDelModal]  = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await accountingApi.getSuppliers()
      setSuppliers(data.results || data)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (s) => {
    try {
      await accountingApi.deleteSupplier(s.id)
      toast.success('Supplier deleted')
      setDelModal(null); load()
    } catch { toast.error('Cannot delete — supplier has linked purchase orders') }
  }

  const filtered = suppliers.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.phone||'').includes(search)
  )

  return (
    <div style={{ padding:24 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:800, color:'var(--text-main)' }}>Suppliers</h1>
          <p style={{ fontSize:12, color:'var(--text-sub)', marginTop:2 }}>{suppliers.length} suppliers registered</p>
        </div>
        <button onClick={() => setModal('add')} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:9, border:'none', background:'var(--brand)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 2px 8px rgba(26,60,94,.25)' }}>
          <Plus size={15} /> Add Supplier
        </button>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:10, background:'#fff', border:'1.5px solid #dce6ef', borderRadius:10, padding:'8px 14px', marginBottom:16 }}>
        <Search size={15} color="#94a3b8" />
        <input style={{ flex:1, border:'none', outline:'none', fontSize:13 }} placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', display:'flex' }}><X size={14} color="#94a3b8" /></button>}
      </div>

      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #dce6ef', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
        <table className="sm-table">
          <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>GST Number</th><th>Outstanding</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign:'center', padding:40, color:'#94a3b8' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign:'center', padding:48, color:'#94a3b8' }}>No suppliers found</td></tr>
            ) : filtered.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight:600 }}>{s.name}</td>
                <td>{s.phone || '—'}</td>
                <td style={{ color:'#64748b', fontSize:12 }}>{s.email || '—'}</td>
                <td style={{ fontFamily:'monospace', fontSize:11 }}>{s.gst_number || '—'}</td>
                <td>
                  <span style={{ fontWeight:700, color: parseFloat(s.outstanding_balance)>0?'#dc2626':'#16a34a' }}>
                    ₹{parseFloat(s.outstanding_balance).toLocaleString('en-IN')}
                  </span>
                </td>
                <td>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => setModal(s)} style={{ width:30, height:30, borderRadius:7, border:'1.5px solid #bfdbfe', background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                      <Pencil size={13} color="#3b82f6" />
                    </button>
                    <button onClick={() => setDelModal(s)} style={{ width:30, height:30, borderRadius:7, border:'1.5px solid #fecaca', background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                      <Trash2 size={13} color="#ef4444" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && <SupplierModal supplier={modal==='add'?null:modal} onSave={() => { setModal(null); load() }} onClose={() => setModal(null)} />}
      {delModal && <DeleteConfirm name={delModal.name} onConfirm={() => handleDelete(delModal)} onClose={() => setDelModal(null)} />}
    </div>
  )
}
