import { createSlice } from '@reduxjs/toolkit'

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],   // { product, qty }
  },
  reducers: {
    addItem(state, { payload: product }) {
      const existing = state.items.find(i => i.product.id === product.id)
      if (existing) existing.qty += 1
      else state.items.push({ product, qty: 1 })
    },
    removeItem(state, { payload: id }) {
      state.items = state.items.filter(i => i.product.id !== id)
    },
    setQty(state, { payload: { id, qty } }) {
      const item = state.items.find(i => i.product.id === id)
      if (item) { if (qty < 1) state.items = state.items.filter(i => i.product.id !== id); else item.qty = qty }
    },
    clearCart(state) { state.items = [] },
  },
})

export const { addItem, removeItem, setQty, clearCart } = cartSlice.actions

export const selectCartItems  = s => s.cart.items
export const selectCartCount  = s => s.cart.items.reduce((n, i) => n + i.qty, 0)
export const selectCartTotal  = s => s.cart.items.reduce((t, i) => t + parseFloat(i.product.selling_price) * i.qty, 0)

export default cartSlice.reducer
