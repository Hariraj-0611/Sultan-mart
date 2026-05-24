import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../api/client'

export const fetchSettings = createAsyncThunk('settings/fetch', async () => {
  const { data } = await api.get('/reports/settings/')
  return data
})

export const saveSettings = createAsyncThunk('settings/save', async (payload) => {
  const { data } = await api.post('/reports/settings/', payload)
  return data
})

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    store_name:          'Sultan Mart',
    store_address:       '',
    store_phone:         '',
    store_gst:           '',
    receipt_footer:      'Thank you! Visit Again.',
    show_gst_on_receipt: true,
    loaded: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.fulfilled, (state, action) => {
        Object.assign(state, action.payload)
        state.loaded = true
      })
      .addCase(saveSettings.fulfilled, (state, action) => {
        Object.assign(state, action.payload)
        state.loaded = true
      })
  },
})

export const selectSettings = (state) => state.settings
export default settingsSlice.reducer
