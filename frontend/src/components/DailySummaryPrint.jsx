import { forwardRef } from 'react'

const DailySummaryPrint = forwardRef(({ data }, ref) => {
  if (!data) return null

  const { dashboard, invoices } = data
  const today = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'2-digit', year:'numeric' })
  const totalSales  = parseFloat(dashboard.today_sales?.total || 0)
  const totalCount  = dashboard.today_sales?.count || 0
  const totalExp    = parseFloat(dashboard.today_expenses?.total || 0)
  const netProfit   = totalSales - totalExp

  const S = {
    page:  { width:'80mm', fontFamily:'monospace', fontSize:'11px', padding:'4mm', color:'#111' },
    center:{ textAlign:'center' },
    row:   { display:'flex', justifyContent:'space-between', marginBottom:'2px' },
    bold:  { fontWeight:'bold' },
    hr:    { borderTop:'1px dashed #333', margin:'6px 0' },
    hr2:   { borderTop:'2px solid #333', margin:'6px 0' },
  }

  return (
    <div ref={ref} style={S.page}>
      {/* Header */}
      <div style={{ ...S.center, marginBottom:'6px' }}>
        <div style={{ fontSize:'15px', fontWeight:'900' }}>சுல்தான் மார்ட்</div>
        <div style={{ fontSize:'10px' }}>Daily Sales Summary</div>
        <div style={{ fontSize:'10px' }}>Date: {today}</div>
      </div>
      <div style={S.hr2} />

      {/* Summary totals */}
      <div style={{ marginBottom:'6px' }}>
        <div style={S.row}><span>Total Bills</span><span style={S.bold}>{totalCount}</span></div>
        <div style={S.row}><span>Total Sales</span><span style={S.bold}>₹{totalSales.toFixed(2)}</span></div>
        <div style={S.row}><span>Total Expenses</span><span>₹{totalExp.toFixed(2)}</span></div>
        <div style={{ ...S.hr }} />
        <div style={{ ...S.row, ...S.bold, fontSize:'13px' }}>
          <span>Net Profit</span><span>₹{netProfit.toFixed(2)}</span>
        </div>
      </div>
      <div style={S.hr2} />

      {/* Invoice list */}
      <div style={{ fontSize:'10px', fontWeight:'bold', marginBottom:'4px' }}>BILL DETAILS</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:'0 6px', fontSize:'9px', fontWeight:'bold', marginBottom:'3px' }}>
        <span>Invoice</span><span style={{ textAlign:'right' }}>Amt</span><span style={{ textAlign:'right' }}>Pay</span>
      </div>
      <div style={S.hr} />
      {(invoices || []).map((inv, i) => (
        <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:'0 6px', fontSize:'9px', marginBottom:'2px' }}>
          <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{inv.invoice_number}</span>
          <span style={{ textAlign:'right' }}>₹{parseFloat(inv.total_amount).toFixed(0)}</span>
          <span style={{ textAlign:'right', textTransform:'uppercase' }}>{inv.payment_method?.slice(0,4)}</span>
        </div>
      ))}
      <div style={S.hr2} />

      {/* Payment method breakdown */}
      <div style={{ fontSize:'10px', fontWeight:'bold', marginBottom:'4px' }}>PAYMENT BREAKDOWN</div>
      {['cash','upi','card','credit'].map(method => {
        const methodInvs = (invoices || []).filter(i => i.payment_method === method && i.status !== 'cancelled')
        if (!methodInvs.length) return null
        const total = methodInvs.reduce((s, i) => s + parseFloat(i.total_amount), 0)
        return (
          <div key={method} style={{ ...S.row, fontSize:'10px' }}>
            <span style={{ textTransform:'uppercase' }}>{method}</span>
            <span style={S.bold}>₹{total.toFixed(2)} ({methodInvs.length})</span>
          </div>
        )
      })}

      <div style={{ ...S.hr2, marginTop:'8px' }} />
      <div style={{ ...S.center, fontSize:'10px', marginTop:'4px' }}>
        <div>End of Day Report</div>
        <div style={{ fontSize:'9px', color:'#555' }}>Printed: {new Date().toLocaleTimeString('en-IN')}</div>
      </div>
    </div>
  )
})

DailySummaryPrint.displayName = 'DailySummaryPrint'
export default DailySummaryPrint
