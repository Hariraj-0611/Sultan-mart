import { forwardRef } from 'react'

const ReceiptPrint = forwardRef(({ invoice }, ref) => {
  if (!invoice) return <div ref={ref} />

  const subtotal = parseFloat(invoice.subtotal || 0)
  const discount = parseFloat(invoice.discount_amount || 0)
  const gst      = parseFloat(invoice.gst_amount || 0)
  const total    = parseFloat(invoice.total_amount || 0)
  const paid     = parseFloat(invoice.amount_paid || 0)
  const change   = parseFloat(invoice.change_amount || 0)
  const credit   = parseFloat(invoice.credit_amount || 0)

  const date = new Date(invoice.created_at)
  const dateStr = date.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
  const timeStr = date.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true })

  const receiptSettings = JSON.parse(localStorage.getItem('receipt_settings') || '{}')
  const footerMsg = receiptSettings.footer || 'Thank you! Visit Again.'
  const showGst   = receiptSettings.show_gst !== false

  const Line = () => <div style={{ borderTop:'1px dashed #000', margin:'5px 0' }} />
  const ThickLine = () => <div style={{ borderTop:'2px solid #000', margin:'5px 0' }} />

  const Row = ({ label, value, bold, large }) => (
    <div style={{ display:'flex', justifyContent:'space-between', fontSize: large ? '13px' : '11px', fontWeight: bold ? 'bold' : 'normal', marginBottom:'1px' }}>
      <span>{label}</span><span>{value}</span>
    </div>
  )

  return (
    <div ref={ref} style={{ width:'76mm', fontFamily:"'Courier New',Courier,monospace", fontSize:'11px', color:'#000', padding:'3mm 2mm', lineHeight:'1.5' }}>

      {/* ── HEADER ── */}
      <div style={{ textAlign:'center', marginBottom:'6px' }}>
        <div style={{ fontSize:'18px', fontWeight:'900', letterSpacing:'2px', textTransform:'uppercase' }}>
          {invoice.store_name || 'Sultan Mart'}
        </div>
        {invoice.store_address && <div style={{ fontSize:'10px', marginTop:'2px' }}>{invoice.store_address}</div>}
        {invoice.store_phone   && <div style={{ fontSize:'10px' }}>📞 {invoice.store_phone}</div>}
        {invoice.store_gst     && <div style={{ fontSize:'10px' }}>GSTIN: {invoice.store_gst}</div>}
      </div>

      <ThickLine />

      {/* ── INVOICE INFO ── */}
      <div style={{ fontSize:'10px', marginBottom:'4px' }}>
        <Row label="Invoice #" value={invoice.invoice_number} bold />
        <Row label="Date"      value={dateStr} />
        <Row label="Time"      value={timeStr} />
        <Row label="Cashier"   value={invoice.cashier_name} />
        {invoice.customer_name  && <Row label="Customer" value={invoice.customer_name} />}
        {invoice.customer_phone && <Row label="Phone"    value={invoice.customer_phone} />}
      </div>

      <Line />

      {/* ── ITEMS HEADER ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 22px 44px 44px', fontSize:'10px', fontWeight:'bold', marginBottom:'3px' }}>
        <span>ITEM</span>
        <span style={{ textAlign:'right' }}>QT</span>
        <span style={{ textAlign:'right' }}>RATE</span>
        <span style={{ textAlign:'right' }}>AMT</span>
      </div>

      <Line />

      {/* ── ITEMS ── */}
      {invoice.items?.map((item, i) => {
        const qty   = parseFloat(item.quantity)
        const rate  = parseFloat(item.unit_price)
        const amt   = parseFloat(item.total_price)
        const disc  = parseFloat(item.discount_percent || 0)
        return (
          <div key={i} style={{ marginBottom:'4px' }}>
            <div style={{ fontSize:'11px', fontWeight:'600' }}>{item.product_name}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 22px 44px 44px', fontSize:'10px' }}>
              <span style={{ color:'#555' }}>{disc > 0 ? `  disc ${disc}%` : ''}</span>
              <span style={{ textAlign:'right' }}>{qty % 1 === 0 ? qty : qty.toFixed(2)}</span>
              <span style={{ textAlign:'right' }}>₹{rate.toFixed(2)}</span>
              <span style={{ textAlign:'right', fontWeight:'600' }}>₹{amt.toFixed(2)}</span>
            </div>
          </div>
        )
      })}

      <Line />

      {/* ── TOTALS ── */}
      <div style={{ fontSize:'11px' }}>
        <Row label="Subtotal" value={`₹${subtotal.toFixed(2)}`} />
        {discount > 0 && <Row label="Discount (-)" value={`₹${discount.toFixed(2)}`} />}
      </div>

      <ThickLine />

      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'15px', fontWeight:'900', marginBottom:'4px' }}>
        <span>TOTAL</span><span>₹{total.toFixed(2)}</span>
      </div>

      <Line />

      <div style={{ fontSize:'11px' }}>
        <Row label={`Paid (${(invoice.payment_method || '').toUpperCase()})`} value={`₹${paid.toFixed(2)}`} />
        {change > 0 && <Row label="Change"     value={`₹${change.toFixed(2)}`} />}
        {credit > 0 && <Row label="Due (Credit)" value={`₹${credit.toFixed(2)}`} bold />}
      </div>

      {/* ── PAYMENT SPLITS ── */}
      {invoice.payment_splits?.length > 0 && (
        <>
          <Line />
          <div style={{ fontSize:'10px' }}>
            {invoice.payment_splits.map((s, i) => (
              <Row key={i} label={`  ${s.method.toUpperCase()}`} value={`₹${parseFloat(s.amount).toFixed(2)}`} />
            ))}
          </div>
        </>
      )}

      {/* ── NOTES ── */}
      {invoice.notes && (
        <>
          <Line />
          <div style={{ fontSize:'10px' }}>Note: {invoice.notes}</div>
        </>
      )}

      <ThickLine />

      {/* ── FOOTER ── */}
      <div style={{ textAlign:'center', fontSize:'10px', lineHeight:'1.6' }}>
        {/* Customer savings — shown on receipt */}
        {(() => {
          const totalSaved = invoice.items?.reduce((sum, item) => {
            const mrp     = parseFloat(item.mrp || item.unit_price)
            const selling = parseFloat(item.unit_price)
            return sum + Math.max(0, mrp - selling) * parseFloat(item.quantity)
          }, 0) || 0
          return totalSaved > 0 ? (
            <div style={{ border:'1px dashed #000', padding:'3px 6px', marginBottom:'5px', fontWeight:'bold', fontSize:'11px' }}>
              🎉 You saved ₹{totalSaved.toFixed(2)} on this bill!
            </div>
          ) : null
        })()}
        <div style={{ fontWeight:'bold', fontSize:'12px' }}>{footerMsg}</div>
        <div>Visit us again at Sultan Mart</div>
        <div style={{ marginTop:'2px', fontSize:'9px', letterSpacing:'1px' }}>
          --------------------------------
        </div>
        <div style={{ fontSize:'9px', color:'#444' }}>Powered by Sultan Mart POS</div>
        <div style={{ marginTop:'8mm' }} />
      </div>

    </div>
  )
})

ReceiptPrint.displayName = 'ReceiptPrint'
export default ReceiptPrint
