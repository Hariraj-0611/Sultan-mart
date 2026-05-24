import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchSettings, saveSettings, selectSettings } from '../store/settingsSlice'
import { inventoryApi } from '../api/inventory'
import { reportsApi } from '../api/reports'
import api from '../api/client'
import toast from 'react-hot-toast'
import {
  Save, Store, Lock, RefreshCw, AlertTriangle, Package,
  Database, Upload, Printer, Sliders, Trash2, Search
} from 'lucide-react'

function Section({ title, icon: Icon, children }) {
  return (
    <div style={{ background:'#fff', borderRadius:14, border:'1px solid var(--border)', overflow:'hidden', boxShadow:'var(--shadow-sm)' }}>
      <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10, background:'var(--page-bg)' }}>
        <Icon size={16} color="var(--brand)" />
        <span style={{ fontWeight:700, fontSize:14, color:'var(--text-main)' }}>{title}</span>
      </div>
      <div style={{ padding:20 }}>{children}</div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type='text', autoComplete, hint }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--text-sub)', marginBottom:5 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        autoComplete={autoComplete || 'off'}
        style={{ width:'100%', padding:'9px 12px', border:'1.5px solid var(--border)', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box', transition:'border-color .15s' }}
        onFocus={e => e.target.style.borderColor='var(--brand)'}
        onBlur={e => e.target.style.borderColor='var(--border)'} />
      {hint && <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>{hint}</p>}
    </div>
  )
}

export default function SettingsPage() {
  const dispatch = useDispatch()
  const storeSettings = useSelector(selectSettings)

  const [form, setForm] = useState({ store_name:'', store_address:'', store_phone:'', store_gst:'' })
  const [receipt, setReceipt] = useState({ footer:'Thank you! Visit Again.', show_gst:true })
  const [pin, setPin]         = useState({ current:'', newPin:'', confirm:'' })
  const [lowStock, setLowStock]   = useState([])
  const [products, setProducts]   = useState([])
  const [adjSearch, setAdjSearch] = useState('')
  const [adjProduct, setAdjProduct] = useState(null)
  const [adjQty, setAdjQty]     = useState('')
  const [adjNote, setAdjNote]   = useState('')
  const [adjSaving, setAdjSaving] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [loading, setLoading]   = useState(true)
  const [stats, setStats]       = useState(null)

  const f = (field) => (val) => setForm(p => ({ ...p, [field]: val }))

  useEffect(() => {
    // Sync form from Redux store settings
    if (storeSettings.loaded) {
      setForm({
        store_name:    storeSettings.store_name,
        store_address: storeSettings.store_address,
        store_phone:   storeSettings.store_phone,
        store_gst:     storeSettings.store_gst,
      })
      setReceipt({
        footer:   storeSettings.receipt_footer,
        show_gst: storeSettings.show_gst_on_receipt,
      })
      setLoading(false)
    }
  }, [storeSettings.loaded, storeSettings.store_name, storeSettings.store_address,
      storeSettings.store_phone, storeSettings.store_gst,
      storeSettings.receipt_footer, storeSettings.show_gst_on_receipt])

  useEffect(() => {
    // Load quick stats separately
    reportsApi.getQuickStats().then(q => setStats(q.data)).catch(() => {})
    reportsApi.getLowStock().then(l => setLowStock(l.data.products || [])).catch(() => {})
  }, [])

  // Product search for stock adjustment
  useEffect(() => {
    if (!adjSearch.trim()) { setProducts([]); return }
    const t = setTimeout(async () => {
      const { data } = await inventoryApi.searchProducts(adjSearch)
      setProducts(data)
    }, 300)
    return () => clearTimeout(t)
  }, [adjSearch])

  const saveStore = async () => {
    setSaving(true)
    try {
      await dispatch(saveSettings({
        ...form,
        receipt_footer:      receipt.footer,
        show_gst_on_receipt: receipt.show_gst,
      })).unwrap()
      toast.success('Store settings saved — changes reflect everywhere instantly!')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const saveReceipt = async () => {
    setSaving(true)
    try {
      await dispatch(saveSettings({
        store_name:          form.store_name,
        store_address:       form.store_address,
        store_phone:         form.store_phone,
        store_gst:           form.store_gst,
        receipt_footer:      receipt.footer,
        show_gst_on_receipt: receipt.show_gst,
      })).unwrap()
      toast.success('Receipt settings saved!')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const savePin = async () => {
    if (!/^\d{4}$/.test(pin.newPin)) return toast.error('New PIN must be 4 digits')
    if (pin.newPin !== pin.confirm) return toast.error('PINs do not match')
    try {
      // Verify current PIN first
      await api.post('/reports/pin/', { pin: pin.current })
    } catch {
      return toast.error('Current PIN is wrong')
    }
    try {
      await api.put('/reports/pin/', { pin: pin.newPin })
      toast.success('PIN updated!')
      setPin({ current:'', newPin:'', confirm:'' })
    } catch { toast.error('Failed to update PIN') }
  }

  const adjustStock = async () => {
    if (!adjProduct) return toast.error('Select a product')
    if (!adjQty || adjQty === '0') return toast.error('Enter quantity')
    setAdjSaving(true)
    try {
      await inventoryApi.adjustStock(adjProduct.id, { quantity: parseFloat(adjQty), notes: adjNote })
      toast.success(`Stock updated for ${adjProduct.name}`)
      setAdjProduct(null); setAdjQty(''); setAdjNote(''); setAdjSearch(''); setProducts([])
    } catch { toast.error('Failed to adjust stock') }
    finally { setAdjSaving(false) }
  }

  const clearPOSData = () => {
    if (!confirm('Clear POS recent products and favourites?')) return
    localStorage.removeItem('pos_recent')
    localStorage.removeItem('pos_favourites')
    toast.success('POS data cleared')
  }

  if (loading) return (
    <div style={{ padding:32, color:'var(--text-sub)', display:'flex', alignItems:'center', gap:10 }}>
      <RefreshCw size={16} className="spin" /> Loading...
    </div>
  )

  return (
    <div style={{ padding:24, display:'flex', flexDirection:'column', gap:20, maxWidth:820 }}>
      <div>
        <h1 style={{ fontSize:20, fontWeight:800, color:'var(--text-main)' }}>Settings</h1>
        <p style={{ fontSize:12, color:'var(--text-sub)', marginTop:2 }}>Store info, receipt, PIN, stock and system settings</p>
      </div>

      {/* ── System Stats ── */}
      {stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          {[
            { label:'Total Products',  value: stats.total_products,  color:'#0891b2' },
            { label:'Total Customers', value: stats.total_customers, color:'#7c3aed' },
            { label:'All-Time Revenue',value:`₹${parseFloat(stats.total_revenue).toLocaleString('en-IN')}`, color:'#16a34a' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background:'#fff', borderRadius:12, border:'1px solid var(--border)', padding:'14px 18px', boxShadow:'var(--shadow-sm)' }}>
              <p style={{ fontSize:11, color:'var(--text-sub)', fontWeight:600 }}>{label}</p>
              <p style={{ fontSize:20, fontWeight:800, color, marginTop:4 }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Store Info ── */}
      <Section title="Store Information" icon={Store}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 20px' }}>
          <Field label="Store Name"    value={form.store_name}    onChange={f('store_name')}    placeholder="Sultan Mart" />
          <Field label="Phone Number"  value={form.store_phone}   onChange={f('store_phone')}   placeholder="+91 9876543210" />
        </div>
        <Field label="Address" value={form.store_address} onChange={f('store_address')} placeholder="Periya Nagar, Erode - 638001" />
        <Field label="GSTIN"   value={form.store_gst}     onChange={f('store_gst')}     placeholder="33AAAAA0000A1Z5" />
        <button onClick={saveStore} disabled={saving}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 20px', borderRadius:8, border:'none', background: saving?'#a0b4c8':'var(--brand)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
          <Save size={14} /> {saving ? 'Saving...' : 'Save Store Info'}
        </button>
        <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:8 }}>⚠ Restart backend server after saving for changes to reflect in bills.</p>
      </Section>

      {/* ── Receipt Settings ── */}
      <Section title="Receipt / Bill Settings" icon={Printer}>
        <Field label="Footer Message (printed at bottom of every bill)"
          value={receipt.footer}
          onChange={v => setReceipt(p => ({...p, footer:v}))}
          placeholder="Thank you! Visit Again."
          hint="This message appears at the bottom of every printed receipt." />
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
          <input type="checkbox" id="show_gst" checked={receipt.show_gst}
            onChange={e => setReceipt(p => ({...p, show_gst: e.target.checked}))}
            style={{ width:16, height:16, cursor:'pointer' }} />
          <label htmlFor="show_gst" style={{ fontSize:13, color:'var(--text-main)', cursor:'pointer' }}>
            Show GST breakdown on receipt
          </label>
        </div>
        <button onClick={saveReceipt}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 20px', borderRadius:8, border:'none', background:'var(--brand)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
          <Save size={14} /> Save Receipt Settings
        </button>
      </Section>

      {/* ── Stock Adjustment ── */}
      <Section title="Stock Adjustment" icon={Sliders}>
        <p style={{ fontSize:12, color:'var(--text-sub)', marginBottom:14 }}>Add or remove stock manually. Use positive number to add, negative to deduct.</p>
        <div style={{ display:'flex', alignItems:'center', gap:8, border:'1.5px solid var(--border)', borderRadius:8, padding:'8px 12px', marginBottom:10 }}>
          <Search size={14} color="var(--text-muted)" />
          <input style={{ flex:1, border:'none', outline:'none', fontSize:13 }}
            placeholder="Search product to adjust..."
            value={adjSearch} onChange={e => { setAdjSearch(e.target.value); setAdjProduct(null) }} />
        </div>
        {products.length > 0 && !adjProduct && (
          <div style={{ border:'1px solid var(--border)', borderRadius:8, marginBottom:10, overflow:'hidden' }}>
            {products.map(p => (
              <button key={p.id} onClick={() => { setAdjProduct(p); setAdjSearch(p.name); setProducts([]) }}
                style={{ display:'flex', justifyContent:'space-between', width:'100%', padding:'9px 14px', border:'none', borderBottom:'1px solid var(--border)', background:'#fff', cursor:'pointer', fontSize:13, textAlign:'left' }}>
                <span style={{ fontWeight:600 }}>{p.name}</span>
                <span style={{ color:'var(--text-sub)' }}>Stock: <strong>{p.stock_quantity}</strong></span>
              </button>
            ))}
          </div>
        )}
        {adjProduct && (
          <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:'10px 14px', marginBottom:10, fontSize:13 }}>
            Selected: <strong>{adjProduct.name}</strong> — Current stock: <strong style={{ color:'#16a34a' }}>{adjProduct.stock_quantity}</strong>
          </div>
        )}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:10 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'var(--text-sub)', display:'block', marginBottom:5 }}>Quantity (+/-)</label>
            <input type="number" value={adjQty} onChange={e => setAdjQty(e.target.value)}
              placeholder="e.g. 10 or -5"
              style={{ width:'100%', padding:'9px 12px', border:'1.5px solid var(--border)', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'var(--text-sub)', display:'block', marginBottom:5 }}>Reason / Note</label>
            <input type="text" value={adjNote} onChange={e => setAdjNote(e.target.value)}
              placeholder="e.g. Damaged goods, New stock"
              style={{ width:'100%', padding:'9px 12px', border:'1.5px solid var(--border)', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }} />
          </div>
        </div>
        <button onClick={adjustStock} disabled={adjSaving || !adjProduct}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 20px', borderRadius:8, border:'none', background: (!adjProduct||adjSaving)?'#a0b4c8':'var(--brand)', color:'#fff', fontSize:13, fontWeight:700, cursor: (!adjProduct||adjSaving)?'not-allowed':'pointer' }}>
          <Sliders size={14} /> {adjSaving ? 'Adjusting...' : 'Apply Adjustment'}
        </button>
      </Section>

      {/* ── Change PIN ── */}
      <Section title="Change Admin PIN" icon={Lock}>
        <form onSubmit={e => { e.preventDefault(); savePin() }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0 20px' }}>
            <Field label="Current PIN"      value={pin.current} onChange={v => setPin(p=>({...p,current:v}))}  placeholder="****" type="password" autoComplete="current-password" />
            <Field label="New PIN (4 digits)" value={pin.newPin} onChange={v => setPin(p=>({...p,newPin:v}))}  placeholder="****" type="password" autoComplete="new-password" />
            <Field label="Confirm New PIN"  value={pin.confirm} onChange={v => setPin(p=>({...p,confirm:v}))}  placeholder="****" type="password" autoComplete="new-password" />
          </div>
          <button type="submit"
            style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 20px', borderRadius:8, border:'none', background:'var(--brand)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
            <Lock size={14} /> Update PIN
          </button>
        </form>
      </Section>

      {/* ── Low Stock ── */}
      <Section title={`Low Stock Alert — ${lowStock.length} item${lowStock.length !== 1 ? 's' : ''} need reorder`} icon={AlertTriangle}>
        {lowStock.length === 0 ? (
          <div style={{ textAlign:'center', padding:'20px 0', color:'var(--success)' }}>
            <Package size={32} style={{ display:'block', margin:'0 auto 8px' }} />
            <p style={{ fontWeight:600 }}>All products are well stocked!</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {lowStock.map(p => (
              <div key={p.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderRadius:9, border:'1px solid #fecaca', background:'#fff5f5' }}>
                <div>
                  <p style={{ fontWeight:600, fontSize:13 }}>{p.name}</p>
                  <p style={{ fontSize:11, color:'var(--text-muted)' }}>{p.category__name} · SKU: {p.sku}</p>
                </div>
                <div style={{ textAlign:'right' }}>
                  <p style={{ fontWeight:800, fontSize:16, color:'#dc2626' }}>{p.stock_quantity}</p>
                  <p style={{ fontSize:10, color:'var(--text-muted)' }}>min: {p.low_stock_threshold}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Backup & Restore ── */}
      <Section title="Backup & Restore" icon={Database}>
        <p style={{ fontSize:13, color:'var(--text-sub)', marginBottom:16 }}>Download a full backup of your data or restore from a previous backup.</p>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          <a href="/api/reports/backup/" download="sultanmart_backup.json"
            style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 20px', borderRadius:8, border:'none', background:'var(--brand)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', textDecoration:'none' }}>
            <Database size={14} /> Download Backup
          </a>
          <label style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 20px', borderRadius:8, border:'1.5px solid var(--border)', background:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', color:'var(--text-main)' }}>
            <Upload size={14} /> Restore Backup
            <input type="file" accept=".json" style={{ display:'none' }} onChange={async (e) => {
              const file = e.target.files[0]
              if (!file) return
              if (!confirm('Restore will overwrite current data. Continue?')) return
              const formData = new FormData()
              formData.append('file', file)
              try {
                await api.post('/reports/restore/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
                toast.success('Restore successful! Restart server.')
              } catch { toast.error('Restore failed') }
            }} />
          </label>
        </div>
        <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:8 }}>⚠ Backup downloads all data as JSON. Restore replaces existing data.</p>
      </Section>

      {/* ── POS / App Data ── */}
      <Section title="POS & App Data" icon={Trash2}>
        <p style={{ fontSize:13, color:'var(--text-sub)', marginBottom:16 }}>Clear locally stored POS data like recent products and favourites.</p>
        <button onClick={clearPOSData}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 20px', borderRadius:8, border:'1.5px solid #fecaca', background:'#fef2f2', color:'#dc2626', fontSize:13, fontWeight:700, cursor:'pointer' }}>
          <Trash2 size={14} /> Clear POS Recent & Favourites
        </button>
      </Section>

    </div>
  )
}
