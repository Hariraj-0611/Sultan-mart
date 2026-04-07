import { useState, useEffect } from 'react'
import { reportsApi } from '../api/reports'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts'
import { Download, TrendingUp, Package, AlertTriangle, IndianRupee, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, subDays } from 'date-fns'

const TABS = [
  { id:'sales',    label:'Revenue',       icon: TrendingUp   },
  { id:'products', label:'Top Products',  icon: Package      },
  { id:'pl',       label:'Profit & Loss', icon: IndianRupee  },
  { id:'lowstock', label:'Low Stock',     icon: AlertTriangle},
  { id:'expiry',   label:'Expiry',        icon: Calendar     },
]

const PIE_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4']

export default function ReportsPage() {
  const [tab, setTab]             = useState('sales')
  const [period, setPeriod]       = useState('daily')
  const [salesData, setSalesData] = useState(null)
  const [plData, setPlData]       = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [lowStock, setLowStock]   = useState([])
  const [expiry, setExpiry]       = useState(null)
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end:   format(new Date(), 'yyyy-MM-dd'),
  })

  useEffect(() => {
    const p = { start: dateRange.start, end: dateRange.end, period }
    reportsApi.getSalesReport(p).then(r => setSalesData(r.data)).catch(() => {})
    reportsApi.getProfitLoss(p).then(r => setPlData(r.data)).catch(() => {})
    reportsApi.getProductPerformance(p).then(r => setTopProducts(r.data.top_products || [])).catch(() => {})
    reportsApi.getLowStock().then(r => setLowStock(r.data.products || [])).catch(() => {})
    reportsApi.getExpiry(30).then(r => setExpiry(r.data)).catch(() => {})
  }, [dateRange, period])

  const exportExcel = async (type) => {
    try {
      const { data } = await reportsApi.exportExcel({ type, ...dateRange })
      const url = URL.createObjectURL(new Blob([data]))
      const a = document.createElement('a'); a.href = url; a.download = `${type}_report.xlsx`; a.click()
      toast.success('Export downloaded')
    } catch { toast.error('Export failed') }
  }

  const chartData = salesData?.data?.map(d => ({
    period: d.period ? format(new Date(d.period), period === 'monthly' ? 'MMM yy' : 'dd MMM') : '',
    sales:  parseFloat(d.total_sales || 0),
    orders: d.invoice_count || 0,
  })) || []

  const pieData = topProducts.slice(0, 6).map(p => ({
    name:  p.product__name?.slice(0, 15),
    value: parseFloat(p.total_revenue || 0),
  }))

  const cardStyle = (active) => ({
    padding:'9px 18px', borderRadius:9, fontSize:13, fontWeight:600,
    cursor:'pointer', display:'flex', alignItems:'center', gap:7, transition:'all .15s',
    background: active ? 'var(--brand)' : '#fff',
    color:      active ? '#fff' : 'var(--text-sub)',
    boxShadow:  active ? '0 2px 8px rgba(26,60,94,.25)' : 'none',
    border:     active ? '1.5px solid transparent' : '1.5px solid var(--border)',
  })

  return (
    <div style={{ padding:24, display:'flex', flexDirection:'column', gap:20 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:800, color:'var(--text-main)' }}>Reports & Analytics</h1>
          <p style={{ fontSize:12, color:'var(--text-sub)', marginTop:2 }}>Sales, inventory, and financial insights</p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({...p, start: e.target.value}))}
            style={{ padding:'7px 10px', border:'1.5px solid var(--border)', borderRadius:8, fontSize:12, outline:'none' }} />
          <span style={{ color:'var(--text-muted)', fontSize:12 }}>to</span>
          <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({...p, end: e.target.value}))}
            style={{ padding:'7px 10px', border:'1.5px solid var(--border)', borderRadius:8, fontSize:12, outline:'none' }} />
          <button onClick={() => exportExcel('sales')} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'1.5px solid var(--border)', background:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            <Download size={13} /> Sales
          </button>
          <button onClick={() => exportExcel('inventory')} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'1.5px solid var(--border)', background:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            <Download size={13} /> Inventory
          </button>
        </div>
      </div>

      {/* P&L Summary strip — always visible */}
      {plData && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
          {[
            { label:'Revenue',      value: plData.revenue,      color:'#2563eb', bg:'#dbeafe' },
            { label:'COGS',         value: plData.cogs,         color:'#d97706', bg:'#fef9c3' },
            { label:'Gross Profit', value: plData.gross_profit, color:'#16a34a', bg:'#dcfce7' },
            { label:'Expenses',     value: plData.expenses,     color:'#dc2626', bg:'#fee2e2' },
            { label:'Net Profit',   value: plData.net_profit,   color: plData.net_profit >= 0 ? '#16a34a' : '#dc2626', bg: plData.net_profit >= 0 ? '#dcfce7' : '#fee2e2' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{ background:'#fff', borderRadius:12, border:'1px solid var(--border)', padding:'14px 18px', boxShadow:'var(--shadow-sm)' }}>
              <p style={{ fontSize:11, color:'var(--text-sub)', fontWeight:600 }}>{label}</p>
              <p style={{ fontSize:18, fontWeight:800, color, marginTop:4 }}>₹{parseFloat(value||0).toLocaleString('en-IN')}</p>
              <div style={{ height:3, borderRadius:2, background:bg, marginTop:8 }}>
                <div style={{ height:'100%', width:'70%', borderRadius:2, background:color, opacity:.5 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:8 }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} style={cardStyle(tab === id)}>
            <Icon size={14} /> {label}
            {id === 'lowstock' && lowStock.length > 0 && (
              <span style={{ background:'#ef4444', color:'#fff', borderRadius:20, padding:'1px 7px', fontSize:10, fontWeight:700 }}>{lowStock.length}</span>
            )}
            {id === 'expiry' && expiry && (expiry.expired_count + expiry.expiring_soon_count) > 0 && (
              <span style={{ background:'#f59e0b', color:'#fff', borderRadius:20, padding:'1px 7px', fontSize:10, fontWeight:700 }}>{expiry.expired_count + expiry.expiring_soon_count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Revenue Tab ── */}
      {tab === 'sales' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'flex', gap:8 }}>
            {['daily','weekly','monthly'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                style={{ padding:'6px 14px', borderRadius:7, border:`1.5px solid ${period===p?'var(--brand)':'var(--border)'}`, background: period===p?'var(--brand)':'#fff', color: period===p?'#fff':'var(--text-sub)', fontSize:12, fontWeight:600, cursor:'pointer', textTransform:'capitalize' }}>
                {p}
              </button>
            ))}
          </div>
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid var(--border)', padding:20, boxShadow:'var(--shadow-sm)' }}>
            <p style={{ fontWeight:700, fontSize:14, color:'var(--text-main)', marginBottom:16 }}>Revenue Trend ({period})</p>
            {chartData.length === 0 ? (
              <div style={{ height:250, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)' }}>No data for selected period</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="var(--brand)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                  <XAxis dataKey="period" tick={{ fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v>=1000?(v/1000).toFixed(0)+'k':v}`} />
                  <Tooltip formatter={v => [`₹${parseFloat(v).toLocaleString('en-IN')}`, 'Sales']} />
                  <Area type="monotone" dataKey="sales" stroke="var(--brand)" strokeWidth={2.5} fill="url(#grad)" dot={{ r:3, fill:'var(--brand)' }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Summary table */}
          {salesData?.summary && (
            <div style={{ background:'#fff', borderRadius:14, border:'1px solid var(--border)', padding:20, boxShadow:'var(--shadow-sm)' }}>
              <p style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Period Summary</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
                {[
                  { label:'Total Revenue', value:`₹${parseFloat(salesData.summary.total||0).toLocaleString('en-IN')}` },
                  { label:'Total Discount', value:`₹${parseFloat(salesData.summary.discount||0).toLocaleString('en-IN')}` },
                  { label:'Total GST', value:`₹${parseFloat(salesData.summary.gst||0).toLocaleString('en-IN')}` },
                  { label:'Total Bills', value: salesData.summary.count || 0 },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background:'var(--page-bg)', borderRadius:10, padding:'12px 14px', border:'1px solid var(--border)' }}>
                    <p style={{ fontSize:11, color:'var(--text-sub)', fontWeight:600 }}>{label}</p>
                    <p style={{ fontSize:18, fontWeight:800, color:'var(--brand)', marginTop:4 }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Top Products Tab ── */}
      {tab === 'products' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:16 }}>
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid var(--border)', overflow:'hidden', boxShadow:'var(--shadow-sm)' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
              <p style={{ fontWeight:700, fontSize:14 }}>Top Selling Products</p>
            </div>
            <table className="sm-table">
              <thead><tr><th>#</th><th>Product</th><th>Qty Sold</th><th>Revenue</th><th>Orders</th></tr></thead>
              <tbody>
                {topProducts.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign:'center', padding:32, color:'var(--text-muted)' }}>No data</td></tr>
                ) : topProducts.map((p, i) => (
                  <tr key={p.product_id}>
                    <td style={{ color:'var(--text-muted)', fontWeight:700 }}>{i+1}</td>
                    <td style={{ fontWeight:600 }}>{p.product__name}</td>
                    <td>{parseFloat(p.total_qty).toFixed(2)}</td>
                    <td style={{ fontWeight:700, color:'var(--brand)' }}>₹{parseFloat(p.total_revenue).toLocaleString('en-IN')}</td>
                    <td>{p.order_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pie chart */}
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid var(--border)', padding:20, boxShadow:'var(--shadow-sm)' }}>
            <p style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Revenue Share</p>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => `₹${parseFloat(v).toLocaleString('en-IN')}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div style={{ height:280, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)' }}>No data</div>}
          </div>
        </div>
      )}

      {/* ── P&L Tab ── */}
      {tab === 'pl' && plData && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid var(--border)', padding:24, boxShadow:'var(--shadow-sm)' }}>
            <p style={{ fontWeight:700, fontSize:16, marginBottom:20 }}>Profit & Loss Statement</p>
            {[
              { label:'(+) Revenue',           value: plData.revenue,      color:'#2563eb', indent:0 },
              { label:'(-) Cost of Goods Sold', value: plData.cogs,        color:'#d97706', indent:1 },
              { label:'= Gross Profit',         value: plData.gross_profit, color:'#16a34a', indent:0, bold:true },
              { label:'(-) Operating Expenses', value: plData.expenses,    color:'#dc2626', indent:1 },
              { label:'= Net Profit',           value: plData.net_profit,  color: plData.net_profit>=0?'#16a34a':'#dc2626', indent:0, bold:true, big:true },
            ].map(({ label, value, color, indent, bold, big }) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:`${big?'14px':'10px'} ${indent?'32px':'0'}`, borderTop: bold ? '2px solid var(--border)' : '1px solid var(--border)', marginTop: bold ? 4 : 0 }}>
                <span style={{ fontSize: big?16:14, fontWeight: bold?700:400, color:'var(--text-main)' }}>{label}</span>
                <span style={{ fontSize: big?20:15, fontWeight:800, color }}>₹{parseFloat(value||0).toLocaleString('en-IN')}</span>
              </div>
            ))}
            <div style={{ marginTop:16, padding:'12px 16px', background:'var(--page-bg)', borderRadius:10, border:'1px solid var(--border)' }}>
              <p style={{ fontSize:12, color:'var(--text-sub)' }}>Gross Margin: <strong style={{ color:'var(--brand)' }}>{plData.gross_margin}%</strong></p>
            </div>
          </div>
        </div>
      )}

      {/* ── Low Stock Tab ── */}
      {tab === 'lowstock' && (
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid var(--border)', overflow:'hidden', boxShadow:'var(--shadow-sm)' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
            <AlertTriangle size={16} color="#d97706" />
            <p style={{ fontWeight:700, fontSize:14 }}>Low Stock Alert — {lowStock.length} products need reorder</p>
          </div>
          {lowStock.length === 0 ? (
            <div style={{ padding:48, textAlign:'center', color:'#16a34a', fontWeight:600 }}>✓ All products are well stocked!</div>
          ) : (
            <table className="sm-table">
              <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Current Stock</th><th>Min Threshold</th><th>Status</th></tr></thead>
              <tbody>
                {lowStock.map(p => (
                  <tr key={p.id} style={{ background:'#fffbeb' }}>
                    <td style={{ fontWeight:600 }}>{p.name}</td>
                    <td style={{ fontFamily:'monospace', fontSize:11, color:'var(--text-muted)' }}>{p.sku}</td>
                    <td style={{ color:'var(--text-sub)', fontSize:12 }}>{p.category__name || '—'}</td>
                    <td><span style={{ fontWeight:800, color:'#dc2626', fontSize:15 }}>{p.stock_quantity}</span></td>
                    <td style={{ color:'var(--text-sub)' }}>{p.low_stock_threshold}</td>
                    <td>
                      <span style={{ background: p.stock_quantity <= 0 ? '#fee2e2' : '#fef9c3', color: p.stock_quantity <= 0 ? '#dc2626' : '#d97706', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>
                        {p.stock_quantity <= 0 ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Expiry Tab ── */}
      {tab === 'expiry' && expiry && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Expired */}
          <div style={{ background:'#fff', borderRadius:14, border:'1.5px solid #fecaca', overflow:'hidden', boxShadow:'var(--shadow-sm)' }}>
            <div style={{ padding:'14px 20px', background:'#fef2f2', borderBottom:'1px solid #fecaca', display:'flex', alignItems:'center', gap:8 }}>
              <AlertTriangle size={15} color="#dc2626" />
              <p style={{ fontWeight:700, fontSize:14, color:'#dc2626' }}>Expired Products ({expiry.expired_count})</p>
            </div>
            {expiry.expired.length === 0 ? (
              <div style={{ padding:24, textAlign:'center', color:'#16a34a', fontWeight:600 }}>No expired batches</div>
            ) : (
              <table className="sm-table">
                <thead><tr><th>Product</th><th>Batch</th><th>Expiry Date</th><th>Qty</th></tr></thead>
                <tbody>
                  {expiry.expired.map(b => (
                    <tr key={b.id} style={{ background:'#fff5f5' }}>
                      <td style={{ fontWeight:600 }}>{b.product__name}</td>
                      <td style={{ fontFamily:'monospace', fontSize:11 }}>{b.batch_number}</td>
                      <td style={{ color:'#dc2626', fontWeight:700 }}>{b.expiry_date}</td>
                      <td>{b.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Expiring soon */}
          <div style={{ background:'#fff', borderRadius:14, border:'1.5px solid #fde68a', overflow:'hidden', boxShadow:'var(--shadow-sm)' }}>
            <div style={{ padding:'14px 20px', background:'#fef9c3', borderBottom:'1px solid #fde68a', display:'flex', alignItems:'center', gap:8 }}>
              <Calendar size={15} color="#d97706" />
              <p style={{ fontWeight:700, fontSize:14, color:'#d97706' }}>Expiring Within 30 Days ({expiry.expiring_soon_count})</p>
            </div>
            {expiry.expiring_soon.length === 0 ? (
              <div style={{ padding:24, textAlign:'center', color:'#16a34a', fontWeight:600 }}>No products expiring soon</div>
            ) : (
              <table className="sm-table">
                <thead><tr><th>Product</th><th>Batch</th><th>Expiry Date</th><th>Days Left</th><th>Qty</th></tr></thead>
                <tbody>
                  {expiry.expiring_soon.map(b => {
                    const days = Math.ceil((new Date(b.expiry_date) - new Date()) / 86400000)
                    return (
                      <tr key={b.id} style={{ background:'#fffbeb' }}>
                        <td style={{ fontWeight:600 }}>{b.product__name}</td>
                        <td style={{ fontFamily:'monospace', fontSize:11 }}>{b.batch_number}</td>
                        <td>{b.expiry_date}</td>
                        <td><span style={{ fontWeight:700, color: days <= 7 ? '#dc2626' : '#d97706' }}>{days} days</span></td>
                        <td>{b.quantity}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
