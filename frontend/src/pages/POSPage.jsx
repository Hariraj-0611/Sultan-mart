import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import {
  addToCart, removeFromCart, updateQuantity, updateDiscount,
  setCustomer, setPaymentMethod, setAmountPaid, clearCart, selectCartTotals
} from '../store/posSlice'
import { inventoryApi } from '../api/inventory'
import { billingApi } from '../api/billing'
import { accountingApi } from '../api/accounting'
import { reportsApi } from '../api/reports'
import { Search, Trash2, Plus, Minus, Printer, CheckCircle, X, BarChart2, Save, Clock, Star, Percent, RefreshCw } from 'lucide-react'
import ReceiptPrint from '../components/ReceiptPrint'
import DailySummaryPrint from '../components/DailySummaryPrint'

function QtyModal({ item, onSave, onClose }) {
  const [val, setVal] = useState(String(item.quantity))
  const valRef = useRef(val)
  valRef.current = val

  const confirm = () => {
    const n = parseFloat(valRef.current)
    if (!n || n <= 0) return toast.error('Enter valid quantity')
    onSave(n); onClose()
  }

  useEffect(() => {
    const handler = (e) => {
      if (e.key >= '0' && e.key <= '9') { e.preventDefault(); setVal(p => p + e.key) }
      else if (e.key === '.') { e.preventDefault(); if (!valRef.current.includes('.')) setVal(p => p + '.') }
      else if (e.key === 'Backspace') { e.preventDefault(); setVal(p => p.slice(0,-1)) }
      else if (e.key === 'Enter') { e.preventDefault(); confirm() }
      else if (e.key === 'Escape') { e.preventDefault(); onClose() }
      else if (e.key === 'Delete') { e.preventDefault(); setVal('') }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(10,20,35,.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300 }}>
      <div style={{ background:'#fff', borderRadius:16, width:280, overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.25)' }}>
        <div style={{ background:'var(--brand)', padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <p style={{ color:'#fff', fontWeight:700, fontSize:14 }}>Set Quantity</p>
            <p style={{ color:'rgba(255,255,255,.6)', fontSize:11 }}>{item.product.name}</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#fff' }}><X size={16} /></button>
        </div>
        <div style={{ padding:16 }}>
          <div style={{ background:'#f8fafc', border:'1.5px solid #dce6ef', borderRadius:10, padding:'12px 16px', textAlign:'right', fontSize:28, fontWeight:800, color:'var(--brand)', marginBottom:12, minHeight:54 }}>
            {val || '0'}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            {['1','2','3','4','5','6','7','8','9','C','0','X'].map(d => (
              <button key={d} onClick={() => {
                if (d === 'C') setVal('')
                else if (d === 'X') setVal(p => p.slice(0,-1))
                else if (d === '.' && valRef.current.includes('.')) return
                else setVal(p => p + d)
              }}
                style={{ padding:'14px', borderRadius:10, border:'1.5px solid #dce6ef', background: d==='C'?'#fee2e2':'#f8fafc', fontSize:18, fontWeight:700, cursor:'pointer', color: d==='C'?'#dc2626':'#1c2833' }}>
                {d === 'X' ? '⌫' : d}
              </button>
            ))}
          </div>
          <button onClick={confirm}
            style={{ width:'100%', marginTop:10, padding:'12px', borderRadius:10, border:'none', background:'var(--brand)', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer' }}>
            Set Quantity
          </button>
        </div>
      </div>
    </div>
  )
}

export default function POSPage() {
  const dispatch = useDispatch()
  const { cart, customer, paymentMethod, amountPaid } = useSelector(s => s.pos)
  const totals = useSelector(selectCartTotals)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [customers, setCustomers] = useState([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [lastInvoice, setLastInvoice] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dailySummary, setDailySummary] = useState(null)
  const [heldBills, setHeldBills] = useState([])
  const [billDiscount, setBillDiscount] = useState(0)
  const [splitMode, setSplitMode] = useState(false)
  const [splitAmounts, setSplitAmounts] = useState({ cash: '', upi: '' })
  const [qtyModal, setQtyModal] = useState(null)
  const [recentProducts, setRecentProducts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pos_recent') || '[]') } catch { return [] }
  })
  const [favourites, setFavourites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pos_favourites') || '[]') } catch { return [] }
  })
  const [shouldPrint, setShouldPrint] = useState(false)
  const [notes, setNotes] = useState('')
  const [recentInvoices, setRecentInvoices] = useState([])

  useEffect(() => {
    if (shouldPrint && lastInvoice) {
      const t = setTimeout(() => { handlePrint(); setShouldPrint(false) }, 300)
      return () => clearTimeout(t)
    }
  }, [shouldPrint, lastInvoice])

  const searchRef = useRef(null)
  const receiptRef = useRef(null)
  const summaryRef = useRef(null)

  const handlePrint = () => {
    if (!receiptRef.current) return
    const content = receiptRef.current.innerHTML
    const win = window.open('', '_blank', 'width=320,height=600')
    win.document.write(`<!DOCTYPE html><html><head><title>Receipt</title><style>
      * { margin:0; padding:0; box-sizing:border-box; }
      @page { size: 80mm auto; margin: 0; }
      html, body { width:80mm; background:#fff; }
      body { font-family:'Courier New',Courier,monospace; font-size:11px; color:#000; }
      @media print { html, body { width:80mm; margin:0; padding:0; } }
    </style></head><body>${content}</body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
  }

  const handleSummaryPrint = () => {
    if (!summaryRef.current) return
    const content = summaryRef.current.innerHTML
    const win = window.open('', '_blank', 'width=320,height=700')
    win.document.write(`<html><head><title>Daily Summary</title><style>
      * { margin:0; padding:0; box-sizing:border-box; }
      @page { size: 80mm auto; margin: 0mm; }
      body { width:80mm; font-family:'Courier New',Courier,monospace; font-size:11px; color:#000; background:#fff; }
      @media print { html, body { width:80mm; } body { margin:0; padding:0; } }
    </style></head><body>${content}</body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
  }

  const discountedTotal = Math.max(0, totals.total - parseFloat(billDiscount || 0))
  const finalChange = Math.max(0, (amountPaid || 0) - discountedTotal)

  useEffect(() => { searchRef.current?.focus() }, [])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'F2') { e.preventDefault(); searchRef.current?.focus() }
      if (e.key === 'F9' && cart.length > 0) { e.preventDefault(); handleCheckout() }
      if (e.key === 'F8') { e.preventDefault(); handlePrint() }
      if (e.key === 'Escape') { setSearchResults([]); setSearchQuery('') }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [cart, paymentMethod, amountPaid, customer, billDiscount])

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      try {
        const { data } = await inventoryApi.searchProducts(searchQuery)
        setSearchResults(data)
        if (data.length === 1 && (data[0].barcode === searchQuery || data[0].sku === searchQuery)) {
          addToCartWithCheck(data[0]); addToRecent(data[0])
          toast.success(`${data[0].name} added`, { duration: 800 })
          setSearchQuery(''); setSearchResults([])
          searchRef.current?.focus()
        }
      } catch {}
    }, 80)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (!customerSearch.trim()) return
    const timer = setTimeout(async () => {
      try {
        const { data } = await accountingApi.getCustomers({ search: customerSearch })
        setCustomers(data.results || data)
      } catch {
        toast.error('Customer search failed')
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [customerSearch])

  useEffect(() => {
    billingApi.getTodayInvoices().then(r => setRecentInvoices((r.data.results || r.data).slice(0, 5))).catch(() => {})
  }, [lastInvoice])

  const addToCartWithCheck = (product) => {
    const inCart = cart.find(i => i.product.id === product.id)
    const currentQty = inCart ? inCart.quantity : 0
    if (product.stock_quantity !== undefined && currentQty >= parseFloat(product.stock_quantity)) {
      toast.error(`Only ${product.stock_quantity} in stock`, { duration: 2000 })
      return
    }
    dispatch(addToCart(product))
  }

  const addToRecent = (product) => {
    setRecentProducts(prev => {
      const next = [product, ...prev.filter(p => p.id !== product.id)].slice(0, 8)
      localStorage.setItem('pos_recent', JSON.stringify(next))
      return next
    })
  }

  const toggleFavourite = (product) => {
    setFavourites(prev => {
      const exists = prev.find(p => p.id === product.id)
      const next = exists ? prev.filter(p => p.id !== product.id) : [...prev.slice(-7), product]
      localStorage.setItem('pos_favourites', JSON.stringify(next))
      return next
    })
  }

  const holdBill = () => {
    if (cart.length === 0) return toast.error('Cart is empty')
    setHeldBills(p => [...p, { id: Date.now(), cart: [...cart], customer, paymentMethod, note: `Bill ${heldBills.length + 1}` }])
    dispatch(clearCart())
    toast.success('Bill held')
  }

  const restoreBill = (bill) => {
    if (cart.length > 0 && !confirm('Clear current cart and restore held bill?')) return
    dispatch(clearCart())
    bill.cart.forEach(item => dispatch(addToCart(item.product)))
    if (bill.customer) dispatch(setCustomer(bill.customer))
    setHeldBills(p => p.filter(b => b.id !== bill.id))
    toast.success('Bill restored')
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('Cart is empty')

    // Credit warning
    if (customer && parseFloat(customer.outstanding_balance) > 0 && paymentMethod === 'credit') {
      const proceed = window.confirm(`⚠ ${customer.name} already has ₹${parseFloat(customer.outstanding_balance).toFixed(2)} outstanding. Add more credit?`)
      if (!proceed) return
    }
    if (splitMode) {
      const splitTotal = parseFloat(splitAmounts.cash || 0) + parseFloat(splitAmounts.upi || 0)
      if (Math.abs(splitTotal - discountedTotal) > 0.01)
        return toast.error(`Split total ₹${splitTotal.toFixed(2)} must equal ₹${discountedTotal.toFixed(2)}`)
    }

    setLoading(true)
    try {
      const payload = {
        customer: customer?.id || null,
        payment_method: splitMode ? 'mixed' : paymentMethod,
        amount_paid: splitMode
          ? discountedTotal
          : (amountPaid || discountedTotal),
        discount_amount: parseFloat(billDiscount || 0),
        notes: notes.trim(),
        items: cart.map(i => ({
          product: i.product.id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          discount_percent: i.discount_percent,
        })),
        ...(splitMode && {
          payment_splits: [
            ...(parseFloat(splitAmounts.cash) > 0 ? [{ method: 'cash', amount: parseFloat(splitAmounts.cash) }] : []),
            ...(parseFloat(splitAmounts.upi)  > 0 ? [{ method: 'upi',  amount: parseFloat(splitAmounts.upi)  }] : []),
          ]
        }),
      }
      const { data } = await billingApi.createInvoice(payload)
      setLastInvoice(data)
      cart.forEach(i => addToRecent(i.product))
      dispatch(clearCart())
      setBillDiscount(0); setSplitMode(false); setSplitAmounts({ cash: '', upi: '' }); setNotes('')
      toast.success(`Invoice ${data.invoice_number} created!`)
      setShouldPrint(true)
    } catch (err) {
      const errData = err.response?.data
      // Try to extract specific field errors
      const msg = errData?.error
        || errData?.detail
        || (typeof errData === 'object' ? Object.values(errData).flat()[0] : null)
        || 'Billing failed'
      toast.error(typeof msg === 'string' ? msg : 'Billing failed', { duration: 6000 })
    } finally { setLoading(false) }
  }

  const printDailySummary = async () => {
    try {
      const [dash, todayInv] = await Promise.all([reportsApi.getDashboard(), billingApi.getTodayInvoices()])
      setDailySummary({ dashboard: dash.data, invoices: todayInv.data })
      setTimeout(() => handleSummaryPrint(), 300)
    } catch { toast.error('Failed to load summary') }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 flex flex-col p-4 gap-3">

        {heldBills.length > 0 && (
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {heldBills.map(b => (
              <button key={b.id} onClick={() => restoreBill(b)}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:7, border:'1.5px solid #fde68a', background:'#fef9c3', fontSize:11, fontWeight:700, color:'#92400e', cursor:'pointer' }}>
                <Clock size={11} /> {b.note} ({b.cart.length})
              </button>
            ))}
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input ref={searchRef} className="input pl-10 text-lg h-12"
            placeholder="Search product / scan barcode... (F2)"
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={async e => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                try {
                  const { data } = await inventoryApi.searchProducts(searchQuery)
                  if (data.length === 1) {
                    addToCartWithCheck(data[0]); addToRecent(data[0])
                    toast.success(`${data[0].name} added`, { duration: 800 })
                    setSearchQuery(''); setSearchResults([])
                    searchRef.current?.focus()
                  } else if (data.length > 1) { setSearchResults(data) }
                  else { toast.error('Product not found') }
                } catch { toast.error('Search failed') }
              }
            }} />
          {searchResults.length > 0 && (
            <div className="absolute top-14 left-0 right-0 bg-white border rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto">
              {searchResults.map(p => (
                <button key={p.id} className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-50 text-left border-b last:border-0"
                  onClick={() => { addToCartWithCheck(p); addToRecent(p); setSearchQuery(''); setSearchResults([]); searchRef.current?.focus() }}>
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.sku} | Stock: {p.stock_quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-700">&#8377;{p.selling_price}</p>
                    {p.gst_rate > 0 && <p className="text-xs text-gray-400">GST {p.gst_rate}%</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {(favourites.length > 0 || recentProducts.length > 0) && (
          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
            {favourites.map(p => (
              <button key={`fav-${p.id}`} onClick={() => { addToCartWithCheck(p); addToRecent(p); toast.success(`${p.name} added`, { duration:600 }) }}
                style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 9px', borderRadius:7, border:'1.5px solid #fde68a', background:'#fef9c3', fontSize:11, fontWeight:600, color:'#92400e', cursor:'pointer' }}>
                <Star size={10} fill="#f59e0b" color="#f59e0b" /> {p.name.slice(0,12)} &#8377;{p.selling_price}
              </button>
            ))}
            {recentProducts.filter(p => !favourites.find(f => f.id === p.id)).slice(0,4).map(p => (
              <button key={`rec-${p.id}`} onClick={() => { addToCartWithCheck(p); addToRecent(p); toast.success(`${p.name} added`, { duration:600 }) }}
                style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 9px', borderRadius:7, border:'1.5px solid #dce6ef', background:'#f8fafc', fontSize:11, fontWeight:600, color:'#475569', cursor:'pointer' }}>
                <RefreshCw size={10} /> {p.name.slice(0,12)} &#8377;{p.selling_price}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="grid grid-cols-12 text-xs font-semibold text-gray-500 bg-gray-50 px-4 py-2 border-b">
            <span className="col-span-4">PRODUCT</span>
            <span className="col-span-3 text-center">QTY</span>
            <span className="col-span-2 text-center">DISC%</span>
            <span className="col-span-2 text-right">TOTAL</span>
            <span className="col-span-1"></span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">Search or scan products to add</div>
            ) : cart.map(item => {
              const discFactor  = 1 - item.discount_percent / 100
              const lineTotal   = item.unit_price * item.quantity * discFactor
              const cost        = parseFloat(item.product.purchase_price || 0)
              const lineProfit  = (item.unit_price * discFactor - cost) * item.quantity
              const mrp         = parseFloat(item.product.mrp || item.unit_price)
              const saved       = Math.max(0, mrp - item.unit_price) * item.quantity
              const isFav       = favourites.find(f => f.id === item.product.id)
              return (
                <div key={item.product.id} className="grid grid-cols-12 items-center px-4 py-2 border-b hover:bg-gray-50">
                  <div className="col-span-4">
                    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <button onClick={() => toggleFavourite(item.product)} style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex' }}>
                        <Star size={12} fill={isFav ? '#f59e0b' : 'none'} color={isFav ? '#f59e0b' : '#d1d5db'} />
                      </button>
                      <div>
                        <p className="text-sm font-medium">{item.product.name}</p>
                        <div style={{ display:'flex', gap:6, alignItems:'center', marginTop:1 }}>
                          <p className="text-xs text-gray-400">₹{item.unit_price}</p>
                          {saved > 0 && <span style={{ fontSize:9, background:'#dcfce7', color:'#16a34a', borderRadius:4, padding:'1px 4px', fontWeight:700 }}>Save ₹{saved.toFixed(0)}</span>}
                          {cost > 0 && <span style={{ fontSize:9, background: lineProfit >= 0 ? '#eff6ff' : '#fef2f2', color: lineProfit >= 0 ? '#2563eb' : '#dc2626', borderRadius:4, padding:'1px 4px', fontWeight:700 }}>
                            P: ₹{lineProfit.toFixed(0)}
                          </span>}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-3 flex items-center justify-center gap-1">
                    <button className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                      onClick={() => item.quantity > 1 ? dispatch(updateQuantity({ productId: item.product.id, quantity: item.quantity - 1 })) : dispatch(removeFromCart(item.product.id))}>
                      <Minus size={12} />
                    </button>
                    <button onClick={() => setQtyModal(item)}
                      style={{ minWidth:44, padding:'2px 8px', borderRadius:6, border:'1.5px solid #bfdbfe', background:'#eff6ff', fontSize:13, fontWeight:700, color:'#1d4ed8', cursor:'pointer' }}>
                      {item.quantity}
                    </button>
                    <button className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                      onClick={() => dispatch(updateQuantity({ productId: item.product.id, quantity: item.quantity + 1 }))}>
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <input className="w-14 text-center text-sm border rounded px-1 py-0.5"
                      type="number" min="0" max="100"
                      value={item.discount_percent === 0 ? '' : item.discount_percent}
                      placeholder="0%"
                      onChange={e => dispatch(updateDiscount({ productId: item.product.id, discount_percent: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div className="col-span-2 text-right text-sm font-medium">₹{lineTotal.toFixed(2)}</div>
                  <div className="col-span-1 flex justify-end">
                    <button className="text-red-400 hover:text-red-600" onClick={() => dispatch(removeFromCart(item.product.id))}><Trash2 size={14} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex gap-3 text-xs text-gray-400">
          <span><span className="shortcut-key">F2</span> Search</span>
          <span><span className="shortcut-key">F9</span> Checkout</span>
          <span><span className="shortcut-key">F8</span> Print</span>
          <span><span className="shortcut-key">ESC</span> Clear</span>
        </div>
      </div>

      <div className="w-80 bg-white shadow-xl flex flex-col p-4 gap-3 overflow-y-auto">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 className="text-lg font-bold text-gray-800">Billing</h2>
          <div style={{ display:'flex', gap:6 }}>
            {cart.length > 0 && (
              <button onClick={() => { if (window.confirm('Clear cart?')) dispatch(clearCart()) }}
                style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:7, border:'1.5px solid #fecaca', background:'#fef2f2', fontSize:11, fontWeight:700, color:'#dc2626', cursor:'pointer' }}>
                <X size={12} /> Clear
              </button>
            )}
            <button onClick={holdBill} style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:7, border:'1.5px solid #fde68a', background:'#fef9c3', fontSize:11, fontWeight:700, color:'#92400e', cursor:'pointer' }}>
              <Save size={12} /> Hold
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Customer (optional)</label>
          {customer ? (
            <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
              <div>
                <p className="text-sm font-medium">{customer.name}</p>
                <p className="text-xs text-gray-500">{customer.phone}</p>
                {customer.outstanding_balance > 0 && <p className="text-xs text-red-500 font-medium">Due: &#8377;{parseFloat(customer.outstanding_balance).toFixed(2)}</p>}
              </div>
              <button onClick={() => dispatch(setCustomer(null))}><X size={14} /></button>
            </div>
          ) : (
            <div className="relative">
              <input className="input text-sm" placeholder="Search customer..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} />
              {customerSearch && (
                <div className="absolute top-10 left-0 right-0 bg-white border rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
                  {customers.map(c => (
                    <button key={c.id} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b last:border-0"
                      onClick={() => { dispatch(setCustomer(c)); setCustomerSearch(''); setCustomers([]) }}>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.phone}{c.outstanding_balance > 0 && <span className="text-red-500 ml-2">Due: &#8377;{c.outstanding_balance}</span>}</p>
                    </button>
                  ))}
                  {/* Add as new customer */}
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-green-50 border-t"
                    onClick={async () => {
                      const phone = prompt(`Phone for "${customerSearch}" (optional):`) || ''
                      try {
                        const { data } = await accountingApi.createCustomer({ name: customerSearch.trim(), phone })
                        dispatch(setCustomer(data))
                        setCustomerSearch(''); setCustomers([])
                        toast.success(`${customerSearch} added!`)
                      } catch { toast.error('Failed') }
                    }}>
                    <p className="font-medium text-green-600">+ Add "{customerSearch}" as new customer</p>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-sm">
          <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{totals.subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-red-500"><span>Discounts</span><span>- ₹{totals.discount.toFixed(2)}</span></div>
          <div className="flex justify-between text-gray-600"><span>GST</span><span>₹{totals.gst.toFixed(2)}</span></div>
          {billDiscount > 0 && <div className="flex justify-between text-orange-500"><span>Bill Discount</span><span>- ₹{parseFloat(billDiscount).toFixed(2)}</span></div>}
          <div className="flex justify-between font-bold text-lg border-t pt-2"><span>TOTAL</span><span className="text-blue-700">₹{discountedTotal.toFixed(2)}</span></div>
        </div>

        {/* Profit & Savings summary — internal only */}
        {cart.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'10px 12px' }}>
              <p style={{ fontSize:10, color:'#16a34a', fontWeight:700, textTransform:'uppercase' }}>Your Profit</p>
              <p style={{ fontSize:16, fontWeight:800, color:'#15803d' }}>₹{totals.profit.toFixed(2)}</p>
              <p style={{ fontSize:10, color:'#16a34a' }}>{totals.profitPercent}% margin</p>
            </div>
            <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10, padding:'10px 12px' }}>
              <p style={{ fontSize:10, color:'#2563eb', fontWeight:700, textTransform:'uppercase' }}>Customer Saves</p>
              <p style={{ fontSize:16, fontWeight:800, color:'#1d4ed8' }}>₹{totals.mrpSavings.toFixed(2)}</p>
              <p style={{ fontSize:10, color:'#2563eb' }}>vs MRP price</p>
            </div>
          </div>
        )}

        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <Percent size={13} color="#64748b" />
          <input type="number" min="0" placeholder="Bill discount (Rs.)" value={billDiscount || ''}
            onChange={e => setBillDiscount(e.target.value)}
            style={{ flex:1, padding:'6px 10px', border:'1.5px solid #dce6ef', borderRadius:7, fontSize:12, outline:'none' }} />
        </div>

        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
            <label className="text-xs font-medium text-gray-500">Payment Method</label>
            <button onClick={() => setSplitMode(p => !p)} style={{ fontSize:10, fontWeight:700, color: splitMode?'#3b82f6':'#94a3b8', background:'none', border:'none', cursor:'pointer' }}>
              {splitMode ? 'Split ON' : 'Split Pay'}
            </button>
          </div>
          {!splitMode ? (
            <div className="grid grid-cols-2 gap-2">
              {['cash','upi','card','credit'].map(m => (
                <button key={m} className={`py-2 rounded-lg text-sm font-medium capitalize border transition-colors ${paymentMethod===m?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700 border-gray-200 hover:border-blue-300'}`}
                  onClick={() => dispatch(setPaymentMethod(m))}>{m}</button>
              ))}
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {['cash','upi'].map(m => (
                <div key={m} style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:36, fontSize:12, fontWeight:600, textTransform:'capitalize', color:'#475569' }}>{m}</span>
                  <input type="number" placeholder="0" value={splitAmounts[m]}
                    onChange={e => setSplitAmounts(p => ({...p,[m]:e.target.value}))}
                    style={{ flex:1, padding:'6px 10px', border:'1.5px solid #dce6ef', borderRadius:7, fontSize:12, outline:'none' }} />
                </div>
              ))}
              <p style={{ fontSize:11, fontWeight:600, color: Math.abs((parseFloat(splitAmounts.cash||0)+parseFloat(splitAmounts.upi||0))-discountedTotal)<0.01?'#16a34a':'#ef4444' }}>
                Split: &#8377;{(parseFloat(splitAmounts.cash||0)+parseFloat(splitAmounts.upi||0)).toFixed(2)} / &#8377;{discountedTotal.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {!splitMode && (
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Amount Received</label>
            <input className="input text-lg font-bold" type="number" placeholder={discountedTotal.toFixed(2)}
              value={amountPaid || ''} onChange={e => dispatch(setAmountPaid(parseFloat(e.target.value) || 0))} />
            {amountPaid > 0 && <p className="text-sm mt-1 text-green-600 font-medium">Change: &#8377;{finalChange.toFixed(2)}</p>}
          </div>
        )}

        <input
          placeholder="Notes / remarks (optional)"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          style={{ padding:'6px 10px', border:'1.5px solid #dce6ef', borderRadius:7, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box' }}
        />

        <button className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
          onClick={handleCheckout} disabled={loading || cart.length === 0}>
          <CheckCircle size={18} />
          {loading ? 'Processing...' : 'Checkout (F9)'}
        </button>

        {lastInvoice && (
          <button className="btn-secondary w-full flex items-center justify-center gap-2 py-2 text-sm" onClick={handlePrint}>
            <Printer size={14} /> Print (F8)
          </button>
        )}

        {recentInvoices.length > 0 && (
          <div>
            <p style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', marginBottom:4 }}>Reprint</p>
            {recentInvoices.map(inv => (
              <button key={inv.id}
                onClick={async () => {
                  const { data } = await billingApi.getInvoice(inv.id)
                  setLastInvoice(data)
                  setTimeout(() => handlePrint(), 300)
                }}
                style={{ display:'flex', justifyContent:'space-between', width:'100%', padding:'5px 8px', borderRadius:6, border:'1px solid #e2e8f0', background:'#f8fafc', fontSize:11, cursor:'pointer', color:'#475569', marginBottom:3 }}>
                <span style={{ fontFamily:'monospace', fontWeight:600 }}>{inv.invoice_number}</span>
                <span>&#8377;{parseFloat(inv.total_amount).toFixed(0)}</span>
              </button>
            ))}
          </div>
        )}

        <button className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50" onClick={printDailySummary}>
          <BarChart2 size={15} /> Print Daily Summary
        </button>
      </div>

      <div className="hidden">
        <ReceiptPrint ref={receiptRef} invoice={lastInvoice} />
        <DailySummaryPrint ref={summaryRef} data={dailySummary} />
      </div>

      {qtyModal && (
        <QtyModal item={qtyModal}
          onSave={qty => dispatch(updateQuantity({ productId: qtyModal.product.id, quantity: qty }))}
          onClose={() => setQtyModal(null)} />
      )}
    </div>
  )
}
