import api from './client'

export const accountingApi = {
  getCustomers: (params) => api.get('/accounting/customers/', { params }),
  createCustomer: (data) => api.post('/accounting/customers/', data),
  updateCustomer: (id, data) => api.patch(`/accounting/customers/${id}/`, data),
  deleteCustomer: (id) => api.delete(`/accounting/customers/${id}/`),
  getCustomerLedger: (id) => api.get(`/accounting/customers/${id}/ledger/`),
  receivePayment: (id, data) => api.post(`/accounting/customers/${id}/receive_payment/`, data),
  getSuppliers: () => api.get('/accounting/suppliers/'),
  createSupplier: (data) => api.post('/accounting/suppliers/', data),
  updateSupplier: (id, data) => api.patch(`/accounting/suppliers/${id}/`, data),
  deleteSupplier: (id) => api.delete(`/accounting/suppliers/${id}/`),
  getPurchases: (params) => api.get('/accounting/purchases/', { params }),
  createPurchase: (data) => api.post('/accounting/purchases/', data),
  updatePurchase: (id, data) => api.patch(`/accounting/purchases/${id}/`, data),
  deletePurchase: (id) => api.delete(`/accounting/purchases/${id}/`),
  markPurchaseReceived: (id) => api.post(`/accounting/purchases/${id}/mark_received/`),
  getExpenses: (params) => api.get('/accounting/expenses/', { params }),
  createExpense: (data) => api.post('/accounting/expenses/', data),
  updateExpense: (id, data) => api.patch(`/accounting/expenses/${id}/`, data),
  deleteExpense: (id) => api.delete(`/accounting/expenses/${id}/`),
}
