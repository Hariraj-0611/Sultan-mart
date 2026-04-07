import api from './client'

export const billingApi = {
  createInvoice: (data) => api.post('/billing/invoices/', data),
  getInvoices: (params) => api.get('/billing/invoices/', { params }),
  getInvoice: (id) => api.get(`/billing/invoices/${id}/`),
  getReceiptPdf: (id) => api.get(`/billing/invoices/${id}/receipt_pdf/`, { responseType: 'blob' }),
  sendWhatsApp: (id, phone) => api.post(`/billing/invoices/${id}/send_whatsapp/`, { phone }),
  cancelInvoice: (id) => api.post(`/billing/invoices/${id}/cancel/`),
  deleteInvoice: (id) => api.delete(`/billing/invoices/${id}/`),
  getTodayInvoices: () => api.get('/billing/invoices/today/'),
}
