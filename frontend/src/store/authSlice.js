import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../api/client'

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login/', credentials)
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Login failed')
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState: (() => {
    const role = localStorage.getItem('role') || null
    const storedMode = localStorage.getItem('app_mode') || 'billing'
    // Cashier can never be in admin mode — correct stale state
    const mode = role === 'cashier' ? 'billing' : storedMode
    return {
      user: null,
      role,
      token: localStorage.getItem('access_token') || null,
      loading: false,
      error: null,
      mode,
    }
  })(),
  reducers: {
    logout(state) {
      state.user = null
      state.role = null
      state.token = null
      state.mode = 'billing'
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('role')
      localStorage.removeItem('app_mode')
    },
    setUser(state, action) {
      state.user = action.payload
    },
    setMode(state, action) {
      state.mode = action.payload
      localStorage.setItem('app_mode', action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.loading = true; state.error = null })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.token = action.payload.access
        state.role = action.payload.role
        state.user = { id: action.payload.user_id, name: action.payload.name, role: action.payload.role }
        localStorage.setItem('role', action.payload.role)
        // Admin/manager → always admin mode; cashier → always billing mode (ignore any stale localStorage)
        const mode = action.payload.role === 'cashier' ? 'billing' : 'admin'
        state.mode = mode
        localStorage.setItem('app_mode', mode)
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { logout, setUser, setMode } = authSlice.actions
export default authSlice.reducer
