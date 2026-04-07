import api from './client'

export const reportsApi = {
  getDashboard:        ()       => api.get('/reports/dashboard/'),
  getSalesReport:      (params) => api.get('/reports/sales/', { params }),
  getProductPerformance:(params)=> api.get('/reports/products/', { params }),
  getProfitLoss:       (params) => api.get('/reports/profit-loss/', { params }),
  exportExcel:         (params) => api.get('/reports/export/', { params, responseType: 'blob' }),
  getSettings:         ()       => api.get('/reports/settings/'),
  saveSettings:        (data)   => api.post('/reports/settings/', data),
  getLowStock:         ()       => api.get('/reports/low-stock/'),
  getCustomerHistory:  (id)     => api.get(`/reports/customer-history/${id}/`),
  getExpiry:           (days)   => api.get('/reports/expiry/', { params: { days } }),
  getQuickStats:       ()       => api.get('/reports/quick-stats/'),
  sendWhatsAppReminder:(data)   => api.post('/reports/whatsapp-reminder/', data),
}
