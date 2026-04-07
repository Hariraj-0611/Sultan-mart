import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import posReducer from './posSlice'
import cartReducer from './cartSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    pos:  posReducer,
    cart: cartReducer,
  },
})
