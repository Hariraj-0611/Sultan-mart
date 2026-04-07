import { useEffect, useState, useRef } from 'react'
import { reportsApi } from '../api/reports'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { TrendingUp, ShoppingCart, AlertTriangle, IndianRupee, RefreshCw, Package, ArrowUpRight, Bell, Users, Globe } from 'lucide-react'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:8, padding:'8px 12px', boxShadow:'var(--shadow-md)', fontSize:12 }}>
      <p style={{ color:'var(--text-sub)', marginBottom:3 }}>{label}</p>
      <p style={{ fontWeight:700, color:'var(--brand)' }}>₹{parseFloat(payload[0].value).toLocaleString('en-IN')}</p>
    </div>
  )
}

function StatCard({ title, value, sub, icon: Icon, iconBg, iconColor, trend }) {
  return (
    <div className="stat-card fade-in">
      <div className="stat-icon" style={{ background: iconBg }}>
        <Icon size={20} color={iconColor} />
      </div>
      <div style={{ flex: 1 }}>
        <div className="stat-label">{title}</div>
        <div className="stat-value">{value}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
      {trend !== undefined && (
        <div style={{ display:'flex', alignItems:'center', gap:3, fontSize:11, fontWeight:600,
          color: trend >= 0 ? 'var(--success)' : 'var(--danger)',
          background: trend >= 0 ? 'var(--success-bg)' : 'var(--danger-bg)',
          padding:'3px 7px', borderRadius:20 }}>
          <ArrowUpRight size={11} style={{ transform: trend < 0 ? 'rotate(90deg)' : 'none' }} />
          {Math.abs(trend)}%
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData]         = useState(null)
  const [lowStock, setLowStock] = useState([])
  const [quickStats, setQuickStats] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [liveSales, setLiveSales] = useState(0)
  const intervalRef = useRef(null)

  const fetchDashboard = () => {
    setLoading(true); setError(null)
    Promise.all([reportsApi.getDashboard(), reportsApi.getLowStock()])
      .then(([d, l]) => {
        setData(d.data)
        setLowStock(l.data.products || [])
        setLiveSales(parseFloat(d.data.today_sales?.total || 0))
      })
      .catch(err => setError(err.response?.data?.detail || err.message || 'Failed to load'))
      .finally(() => setLoading(false))
    // Quick stats separately — don't block main dashboard if it fails
    reportsApi.getQuickStats()
      .then(q => setQuickStats(q.data))
      .catch(() => {})
  }

  // Live counter — refresh today's sales every 60s
  useEffect(() => {
    fetchDashboard()
    intervalRef.current = setInterval(() => {
      reportsApi.getDashboard().then(d => setLiveSales(parseFloat(d.data.today_sales?.total || 0))).catch(() => {})
    }, 60000)
    return () => clearInterval(intervalRef.current)
  }, [])

  if (loading) return (
    <div style={{ padding:32, display:'flex', alignItems:'center', gap:10, color:'var(--text-sub)' }}>
      <RefreshCw size={16} className="spin" /> Loading dashboard...
    </div>
  )

  if (error) return (
    <div style={{ padding:24 }}>
      <div style={{ background:'var(--danger-bg)', border:'1px solid #f5b7b1', borderRadius:10, padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <p style={{ fontWeight:600, color:'var(--danger)' }}>Failed to load dashboard</p>
          <p style={{ fontSize:12, color:'#c0392b', marginTop:3 }}>{error}</p>
        </div>
        <button className="btn-primary" onClick={fetchDashboard} style={{ display:'flex', alignItems:'center', gap:6 }}>
          <RefreshCw size={13} /> Retry
        </button>
      </div>
    </div>
  )

  const todaySales   = parseFloat(data.today_sales?.total || 0)
  const todayCount   = data.today_sales?.count || 0
  const monthSales   = parseFloat(data.month_sales?.total || 0)
  const monthCount   = data.month_sales?.count || 0
  const todayExp     = parseFloat(data.today_expenses?.total || 0)
  const lowStockCount = data.low_stock_count || 0
  const todayNet     = todaySales - todayExp
  const avgOrder     = todayCount > 0 ? Math.round(todaySales / todayCount) : 0
  const monthAvgDay  = Math.round(monthSales / new Date().getDate())

  const chartData = (data.daily_trend || []).map(d => ({
    date:   d.date ? format(new Date(d.date), 'dd MMM') : '',
    sales:  parseFloat(d.total || 0),
    orders: d.count || 0,
  }))

  return (
    <div style={{ padding:24, display:'flex', flexDirection:'column', gap:20 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:800, color:'var(--text-main)' }}>Dashboard</h1>
          <p style={{ fontSize:12, color:'var(--text-sub)', marginTop:2 }}>
            {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </p>
        </div>
        <button onClick={fetchDashboard}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8,
            border:'1.5px solid var(--border)', background:'#fff', fontSize:12, fontWeight:600,
            color:'var(--text-sub)', cursor:'pointer' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
        <StatCard title="Today's Sales (Live)" value={`₹${liveSales.toLocaleString('en-IN')}`} sub={`${todayCount} bill${todayCount!==1?'s':''} today`} icon={IndianRupee} iconBg="#e8f0f7" iconColor="var(--brand)" />
        <StatCard title="Month Sales"     value={`₹${monthSales.toLocaleString('en-IN')}`}  sub={`${monthCount} bills this month`}  icon={TrendingUp}  iconBg="#eafaf1" iconColor="var(--success)" />
        <StatCard title="Today's Expenses" value={`₹${todayExp.toLocaleString('en-IN')}`}   sub="Recorded today"                    icon={ShoppingCart} iconBg="#fdf0e0" iconColor="var(--accent)" />
        <StatCard title="Low Stock Items" value={lowStockCount} sub={lowStockCount>0?'Need reorder':'All stocked up'} icon={AlertTriangle} iconBg={lowStockCount>0?'var(--danger-bg)':'var(--success-bg)'} iconColor={lowStockCount>0?'var(--danger)':'var(--success)'} />
      </div>

      {/* Quick stats — total customers, products, revenue */}
      {quickStats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          {[
            { label:'Total Customers', value: quickStats.total_customers, icon: Users,    color:'#6366f1', bg:'#ede9fe' },
            { label:'Total Products',  value: quickStats.total_products,  icon: Package,  color:'#0891b2', bg:'#cffafe' },
            { label:'All-Time Revenue',value:`₹${parseFloat(quickStats.total_revenue).toLocaleString('en-IN')}`, icon: IndianRupee, color:'#16a34a', bg:'#dcfce7' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} style={{ background:'#fff', borderRadius:12, border:'1px solid var(--border)', padding:'14px 18px', display:'flex', alignItems:'center', gap:14, boxShadow:'var(--shadow-sm)' }}>
              <div style={{ width:42, height:42, borderRadius:11, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon size={20} color={color} />
              </div>
              <div>
                <p style={{ fontSize:11, color:'var(--text-sub)', fontWeight:600 }}>{label}</p>
                <p style={{ fontSize:20, fontWeight:800, color, marginTop:2 }}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div style={{ background:'#fef9c3', border:'1.5px solid #fde68a', borderRadius:12, padding:'12px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Bell size={16} color="#d97706" />
            <span style={{ fontSize:13, fontWeight:700, color:'#92400e' }}>
              {lowStock.length} product{lowStock.length > 1 ? 's' : ''} running low on stock:&nbsp;
              <span style={{ fontWeight:400 }}>{lowStock.slice(0,3).map(p => p.name).join(', ')}{lowStock.length > 3 ? ` +${lowStock.length-3} more` : ''}</span>
            </span>
          </div>
          <Link to="/settings" style={{ fontSize:12, fontWeight:700, color:'#d97706', textDecoration:'none', whiteSpace:'nowrap' }}>View All →</Link>
        </div>
      )}

      {/* Chart + quick stats */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16 }}>

        {/* Area chart */}
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <p style={{ fontWeight:700, fontSize:14, color:'var(--text-main)' }}>Sales — Last 7 Days</p>
              <p style={{ fontSize:11, color:'var(--text-sub)', marginTop:2 }}>Daily revenue trend</p>
            </div>
            <span className="badge badge-blue">This Week</span>
          </div>
          {chartData.length === 0 ? (
            <div style={{ height:200, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', gap:8 }}>
              <Package size={32} color="var(--border)" />
              <p style={{ fontSize:13 }}>No sales yet — start billing from POS</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={chartData} margin={{ top:4, right:4, left:0, bottom:0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--brand)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--brand)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                <XAxis dataKey="date" tick={{ fontSize:11, fill:'var(--text-sub)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:'var(--text-sub)' }} axisLine={false} tickLine={false} width={55}
                  tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="sales" stroke="var(--brand)" strokeWidth={2.5}
                  fill="url(#salesGrad)" dot={{ fill:'var(--brand)', r:3 }} activeDot={{ r:5 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quick stats panel */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[
            { label:"Today's Net Profit", value:`₹${todayNet.toLocaleString('en-IN')}`, sub:'Sales minus expenses', color: todayNet>=0?'var(--success)':'var(--danger)', bg: todayNet>=0?'var(--success-bg)':'var(--danger-bg)' },
            { label:'Avg Order Value',    value:`₹${avgOrder.toLocaleString('en-IN')}`, sub:'Per bill today',       color:'var(--brand)',   bg:'var(--brand-light)' },
            { label:'Month Avg / Day',    value:`₹${monthAvgDay.toLocaleString('en-IN')}`, sub:'Daily average',    color:'var(--accent)',  bg:'var(--accent-light)' },
          ].map(({ label, value, sub, color, bg }) => (
            <div key={label} style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:12,
              padding:'16px 18px', boxShadow:'var(--shadow-sm)' }}>
              <p style={{ fontSize:11, color:'var(--text-sub)', fontWeight:600, marginBottom:6 }}>{label}</p>
              <p style={{ fontSize:22, fontWeight:800, color, lineHeight:1 }}>{value}</p>
              <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>{sub}</p>
              <div style={{ height:3, borderRadius:2, background:bg, marginTop:10 }}>
                <div style={{ height:'100%', width:'60%', borderRadius:2, background:color, opacity:.6 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bar chart — orders per day */}
      {chartData.length > 0 && (
        <div className="card">
          <p style={{ fontWeight:700, fontSize:14, color:'var(--text-main)', marginBottom:14 }}>Orders Per Day</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={chartData} margin={{ top:0, right:4, left:0, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize:11, fill:'var(--text-sub)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:'var(--text-sub)' }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
              <Tooltip formatter={(v) => [v, 'Orders']} />
              <Bar dataKey="orders" fill="var(--accent)" radius={[4,4,0,0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent activity */}
      {quickStats && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          {/* Recent invoices */}
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid var(--border)', overflow:'hidden', boxShadow:'var(--shadow-sm)' }}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <p style={{ fontWeight:700, fontSize:14 }}>Recent Bills</p>
              <Link to="/invoices" style={{ fontSize:12, color:'var(--brand)', fontWeight:600, textDecoration:'none' }}>View All →</Link>
            </div>
            {quickStats.recent_invoices.map((inv, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 18px', borderBottom: i < quickStats.recent_invoices.length-1 ? '1px solid var(--border)' : 'none' }}>
                <div>
                  <p style={{ fontSize:12, fontWeight:700, fontFamily:'monospace', color:'var(--brand)' }}>{inv.invoice_number}</p>
                  <p style={{ fontSize:11, color:'var(--text-muted)' }}>{inv.customer_name} · {inv.payment_method}</p>
                </div>
                <p style={{ fontWeight:800, fontSize:14, color:'var(--text-main)' }}>₹{inv.total_amount.toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>

          {/* Recent online orders */}
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid var(--border)', overflow:'hidden', boxShadow:'var(--shadow-sm)' }}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <p style={{ fontWeight:700, fontSize:14 }}>Recent Online Orders</p>
              <Link to="/online-orders" style={{ fontSize:12, color:'var(--brand)', fontWeight:600, textDecoration:'none' }}>View All →</Link>
            </div>
            {quickStats.recent_orders.length === 0 ? (
              <p style={{ padding:'20px 18px', color:'var(--text-muted)', fontSize:13 }}>No online orders yet</p>
            ) : quickStats.recent_orders.map((o, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 18px', borderBottom: i < quickStats.recent_orders.length-1 ? '1px solid var(--border)' : 'none' }}>
                <div>
                  <p style={{ fontSize:12, fontWeight:700, fontFamily:'monospace', color:'var(--brand)' }}>{o.order_number}</p>
                  <p style={{ fontSize:11, color:'var(--text-muted)' }}>{o.customer_name}</p>
                </div>
                <div style={{ textAlign:'right' }}>
                  <p style={{ fontWeight:800, fontSize:14 }}>₹{o.total_amount.toLocaleString('en-IN')}</p>
                  <span style={{ fontSize:10, fontWeight:700, padding:'1px 7px', borderRadius:10, background: o.status==='delivered'?'#dcfce7':o.status==='pending'?'#fef9c3':'#dbeafe', color: o.status==='delivered'?'#16a34a':o.status==='pending'?'#d97706':'#2563eb' }}>{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
