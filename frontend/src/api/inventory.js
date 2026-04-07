import api from './client'

export const inventoryApi = {
  searchProducts: (q) => api.get(`/inventory/products/pos_search/?q=${q}`),
  getProducts: (params) => api.get('/inventory/products/', { params }),
  getProduct: (id) => api.get(`/inventory/products/${id}/`),
  createProduct: (data) => api.post('/inventory/products/', data),
  updateProduct: (id, data) => api.patch(`/inventory/products/${id}/`, data),
  deleteProduct: (id) => api.delete(`/inventory/products/${id}/`),
  adjustStock: (id, data) => api.post(`/inventory/products/${id}/adjust_stock/`, data),
  getLowStock: () => api.get('/inventory/products/low_stock/'),
  getExpiringBatches: (days) => api.get(`/inventory/products/expiring_soon/?days=${days}`),
  getCategories: () => api.get('/inventory/categories/'),
  createCategory: (data) => api.post('/inventory/categories/', data),
  deleteCategory: (id) => api.delete(`/inventory/categories/${id}/`),
  getUnits: () => api.get('/inventory/units/'),
  createUnit: (data) => api.post('/inventory/units/', data),
  deleteUnit: (id) => api.delete(`/inventory/units/${id}/`),
  getStockMovements: (params) => api.get('/inventory/stock-movements/', { params }),
  getBatches: (productId) => api.get(`/inventory/batches/?product=${productId}`),
  createBatch: (data) => api.post('/inventory/batches/', data),
  deleteBatch: (id) => api.delete(`/inventory/batches/${id}/`),
}
