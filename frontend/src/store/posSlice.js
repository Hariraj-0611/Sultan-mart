import { createSlice, createSelector } from '@reduxjs/toolkit'

const posSlice = createSlice({
  name: 'pos',
  initialState: {
    cart: [],           // { product, quantity, unit_price, discount_percent }
    customer: null,
    paymentMethod: 'cash',
    amountPaid: 0,
    discount: 0,
  },
  reducers: {
    addToCart(state, action) {
      const product = action.payload
      const existing = state.cart.find(i => i.product.id === product.id)
      if (existing) {
        existing.quantity += 1
      } else {
        state.cart.push({ product, quantity: 1, unit_price: product.selling_price, discount_percent: 0 })
      }
    },
    removeFromCart(state, action) {
      state.cart = state.cart.filter(i => i.product.id !== action.payload)
    },
    updateQuantity(state, action) {
      const { productId, quantity } = action.payload
      const item = state.cart.find(i => i.product.id === productId)
      if (item) item.quantity = quantity
    },
    updateDiscount(state, action) {
      const { productId, discount_percent } = action.payload
      const item = state.cart.find(i => i.product.id === productId)
      if (item) item.discount_percent = discount_percent
    },
    setCustomer(state, action) { state.customer = action.payload },
    setPaymentMethod(state, action) { state.paymentMethod = action.payload },
    setAmountPaid(state, action) { state.amountPaid = action.payload },
    clearCart(state) {
      state.cart = []
      state.customer = null
      state.paymentMethod = 'cash'
      state.amountPaid = 0
    },
  },
})

export const { addToCart, removeFromCart, updateQuantity, updateDiscount,
               setCustomer, setPaymentMethod, setAmountPaid, clearCart } = posSlice.actions

export const selectCartTotals = createSelector(
  (state) => state.pos.cart,
  (items) => {
    const subtotal = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)
    const discount = items.reduce((sum, i) => sum + (i.unit_price * i.quantity * i.discount_percent / 100), 0)
    const taxable  = subtotal - discount

    // GST is INCLUSIVE in selling price — extract it, don't add on top
    const gst = items.reduce((sum, i) => {
      const lineAfterDisc = i.unit_price * i.quantity * (1 - i.discount_percent / 100)
      const rate = i.product.gst_rate / 100
      const gstAmt = rate > 0 ? lineAfterDisc - (lineAfterDisc / (1 + rate)) : 0
      return sum + gstAmt
    }, 0)

    const total = taxable  // total = selling price, GST already inside

    // Profit = (selling_base_ex_gst - purchase_price) * qty  [internal only]
    const profit = items.reduce((sum, i) => {
      const cost       = parseFloat(i.product.purchase_price || 0)
      const selling    = parseFloat(i.unit_price)
      const rate       = i.product.gst_rate / 100
      const sellingBase = rate > 0 ? selling / (1 + rate) : selling
      const discFactor = 1 - (i.discount_percent / 100)
      const lineProfit = (sellingBase * discFactor - cost) * i.quantity
      return sum + lineProfit
    }, 0)

    // Customer savings = (MRP - selling_price) * qty
    const mrpSavings = items.reduce((sum, i) => {
      const mrp     = parseFloat(i.product.mrp || i.unit_price)
      const selling = parseFloat(i.unit_price)
      return sum + Math.max(0, mrp - selling) * i.quantity
    }, 0)

    const profitPercent = subtotal > 0 ? ((profit / subtotal) * 100).toFixed(1) : 0

    return { subtotal, discount, gst, total, profit, mrpSavings, profitPercent }
  }
)

export default posSlice.reducer
