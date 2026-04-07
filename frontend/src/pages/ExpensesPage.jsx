import { useState, useEffect } from 'react'
import { accountingApi } from '../api/accounting'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, X, Receipt, Search } from 'lucide-react'
import { format } from 'date-fns'

const CATEGORIES = ['rent','salary','utilities','maintenance','marketing','other']
const CAT_COLORS = { rent:'#3b82f6', salary:'#8b5cf6', utilities:'#f59e0b', maintenance:'#ef4444', marketing:'#10b981', other:'#64748b' }
const inp = { width:'100%', padding:'9px 12px', fontSize:13, border:'1.5px solid #dce6ef', borderRadius:8, outline:'none', boxSizing:'border-box', background:'#fff' }

function ExpenseModal({ expense, onSave, onClose }) {
  const isEdit = !!expense?.id
  const [form, setForm] = useState({ title:'', category:'other', amount:'', date:format(new Date(),'yyyy-MM-dd'), notes:'', ...(expense||{}) })
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      if (isEdit) { await accountingApi.updateExpense(expense.id, form); toast.success('Expense updated') }
      else        { await accountingApi.createExpense(form);              toast.success('Expense added') }
      onSave()
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(10,20,35,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:16 }}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:460, overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.2)' }}>
        <div style={{ background:'var(--brand)', padding:'16px 22px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Receipt size={17} color="#e67e22" />
            <p style={{ fontWeight:700, fontSize:15, color:'#fff' }}>{isEdit ? 'Edit Expense' : 'Add Expense'}</p>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,.15)', border:'none', borderRadius:7, padding:'5px 10px', cursor:'pointer', color:'#fff', fontSize:16 }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding:22, display:'flex', flexDirection:'column', gap:13 }}>
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:'#64748b', display:'block', marginBottom:5 }}>Title *</label>
            <input style={inp} value={form.title} onChange={set('title')} placeholder="e.g. Monthly Rent" required onFocus={e=>e.target.style.borderColor='#1a3c5e'} onBlur={e=>e.target.style.borderColor='#dce6ef'} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'#64748b', display:'block', marginBottom:5 }}>Category</label>
              <select style={inp} value={form.category} onChange={set('category')}>
                {CATEGORIES.map(c => <option key={c} value={c} style={{ textTransform:'capitalize' }}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'#64748b', display:'block', marginBottom:5 }}>Amount (₹) *</label>
              <input style={inp} type="number" step="0.01" value={form.amount} onChange={set('amount')} placeholder="0.00" required onFocus={e=>e.target.style.borderColor='#1a3c5e'} onBlur={e=>e.target.style.borderColor='#dce6ef'} />
            </div>
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:'#64748b', display:'block', marginBottom:5 }}>Date</label>
            <input style={inp} type="date" value={form.date} onChange={set('date')} onFocus={e=>e.target.style.borderColor='#1a3c5e'} onBlur={e=>e.target.style.borderColor='#dce6ef'} />
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:'#64748b', display:'block', marginBottom:5 }}>Notes</label>
            <textarea style={{ ...inp, resize:'none' }} rows={2} value={form.notes||''} onChange={set('notes')} placeholder="Optional notes" onFocus={e=>e.target.style.borderColor='#1a3c5e'} onBlur={e=>e.target.style.borderColor='#dce6ef'} />
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:4 }}>
            <button type="button" onClick={onClose} style={{ padding:'9px 20px', borderRadius:8, border:'1.5px solid #dce6ef', background:'#f8fafc', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ padding:'9px 24px', borderRadius:8, border:'none', background: saving?'#a0b4c8':'var(--brand)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
              {saving ? 'Saving...' : isEdit ? 'Update' : 'Add Expense'}
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
          <p style={{ fontWeight:700, fontSize:15 }}>Delete Expense</p>
        </div>
        <div style={{ padding:20 }}>
          <p style={{ fontSize:13, color:'#475569', marginBottom:20 }}>Delete <strong>{name}</strong>?</p>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button onClick={onClose} style={{ padding:'8px 18px', borderRadius:8, border:'1.5px solid #dce6ef', background:'#f8fafc', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancel</button>
            <button onClick={onConfirm} style={{ padding:'8px 18px', borderRadius:8, border:'none', background:'#ef4444', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ExpensesPage() {
  const [expenses,  setExpenses]  = useState([])
  const [search,    setSearch]    = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(null)
  const [delModal,  setDelModal]  = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await accountingApi.getExpenses()
      setExpenses(data.results || data)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (exp) => {
    try {
      await accountingApi.deleteExpense(exp.id)
      toast.success('Expense deleted')
      setDelModal(null); load()
    } catch { toast.error('Failed to delete') }
  }

  const filtered = expenses.filter(e =>
    (!search || e.title.toLowerCase().includes(search.toLowerCase())) &&
    (!catFilter || e.category === catFilter)
  )
  const total = filtered.reduce((s, e) => s + parseFloat(e.amount||0), 0)

  // Category totals
  const catTotals = CATEGORIES.reduce((acc, c) => {
    acc[c] = expenses.filter(e => e.category === c).reduce((s, e) => s + parseFloat(e.amount||0), 0)
    return acc
  }, {})

  return (
    <div style={{ padding:24 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:800, color:'var(--text-main)' }}>Expenses</h1>
          <p style={{ fontSize:12, color:'var(--text-sub)', marginTop:2 }}>
            Total: <strong style={{ color:'#dc2626' }}>₹{total.toLocaleString('en-IN')}</strong>
          </p>
        </div>
        <button onClick={() => setModal('add')} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:9, border:'none', background:'var(--brand)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 2px 8px rgba(26,60,94,.25)' }}>
          <Plus size={15} /> Add Expense
        </button>
      </div>

      {/* Category summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:16 }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCatFilter(catFilter===c?'':c)}
            style={{ background: catFilter===c ? CAT_COLORS[c] : '#fff', border:`2px solid ${catFilter===c?CAT_COLORS[c]:'#dce6ef'}`, borderRadius:10, padding:'10px 8px', cursor:'pointer', textAlign:'center', transition:'all .15s' }}>
            <p style={{ fontSize:16, fontWeight:800, color: catFilter===c?'#fff':CAT_COLORS[c] }}>₹{catTotals[c]>0?Math.round(catTotals[c]).toLocaleString('en-IN'):0}</p>
            <p style={{ fontSize:10, fontWeight:600, color: catFilter===c?'rgba(255,255,255,.8)':'#64748b', textTransform:'capitalize', marginTop:2 }}>{c}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ display:'flex', alignItems:'center', gap:10, background:'#fff', border:'1.5px solid #dce6ef', borderRadius:10, padding:'8px 14px', marginBottom:16 }}>
        <Search size={15} color="#94a3b8" />
        <input style={{ flex:1, border:'none', outline:'none', fontSize:13 }} placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)} />
        {(search||catFilter) && <button onClick={() => { setSearch(''); setCatFilter('') }} style={{ background:'none', border:'none', cursor:'pointer', display:'flex' }}><X size={14} color="#94a3b8" /></button>}
      </div>

      {/* Table */}
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #dce6ef', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
        <table className="sm-table">
          <thead><tr><th>Date</th><th>Title</th><th>Category</th><th>Amount</th><th>Notes</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign:'center', padding:40, color:'#94a3b8' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign:'center', padding:48, color:'#94a3b8' }}>No expenses found</td></tr>
            ) : filtered.map(e => (
              <tr key={e.id}>
                <td style={{ color:'#64748b', fontSize:12 }}>{format(new Date(e.date), 'dd MMM yyyy')}</td>
                <td style={{ fontWeight:600 }}>{e.title}</td>
                <td>
                  <span style={{ background:`${CAT_COLORS[e.category]}18`, color:CAT_COLORS[e.category], padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700, textTransform:'capitalize' }}>
                    {e.category}
                  </span>
                </td>
                <td style={{ fontWeight:800, color:'#dc2626', fontSize:14 }}>₹{parseFloat(e.amount).toLocaleString('en-IN')}</td>
                <td style={{ color:'#64748b', fontSize:12 }}>{e.notes || '—'}</td>
                <td>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => setModal(e)} style={{ width:30, height:30, borderRadius:7, border:'1.5px solid #bfdbfe', background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                      <Pencil size={13} color="#3b82f6" />
                    </button>
                    <button onClick={() => setDelModal(e)} style={{ width:30, height:30, borderRadius:7, border:'1.5px solid #fecaca', background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                      <Trash2 size={13} color="#ef4444" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length > 0 && (
          <div style={{ padding:'9px 16px', background:'#f8fafc', borderTop:'1px solid #eef2f6', display:'flex', justifyContent:'space-between', fontSize:12, color:'#94a3b8' }}>
            <span>{filtered.length} expenses</span>
            <span style={{ fontWeight:700, color:'#dc2626' }}>Total: ₹{total.toLocaleString('en-IN')}</span>
          </div>
        )}
      </div>

      {modal && <ExpenseModal expense={modal==='add'?null:modal} onSave={() => { setModal(null); load() }} onClose={() => setModal(null)} />}
      {delModal && <DeleteConfirm name={delModal.title} onConfirm={() => handleDelete(delModal)} onClose={() => setDelModal(null)} />}
    </div>
  )
}
