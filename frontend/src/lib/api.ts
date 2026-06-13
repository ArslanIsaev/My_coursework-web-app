import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

export const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    return Promise.reject(error)
  }
)

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  name: string
  phone: string
  role: 'customer' | 'admin'
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  parent_id?: string
  created_at: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  category_id: string
  image_url: string
  created_at: string
  updated_at: string
  category_name?: string
}

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  quantity: number
  created_at: string
  product: Product
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
  product: Product
}

export interface Order {
  id: string
  user_id: string
  status: 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total_price: number
  address: string
  contact_phone: string
  comment: string
  items: OrderItem[]
  created_at: string
  updated_at: string
  user_name?: string
  user_email?: string
}

export interface AdminStats {
  total_orders: number
  today_orders: number
  total_revenue: number
  today_revenue: number
  total_products: number
  total_users: number
}

export interface ProductListResponse {
  products: Product[]
  total: number
  page: number
  limit: number
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: { email: string; password: string; name: string; phone: string }) =>
    api.post<{ token: string; user: User }>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<{ token: string; user: User }>('/auth/login', data),
  me: () => api.get<User>('/auth/me'),
  updateProfile: (data: { name: string; phone: string }) => api.put<User>('/auth/me', data),
}

// ─── Categories ───────────────────────────────────────────────────────────────

export const categoriesApi = {
  list: () => api.get<Category[]>('/categories'),
  create: (data: { name: string; slug: string; parent_id?: string }) =>
    api.post<Category>('/categories', data),
  update: (id: string, data: { name: string; slug: string; parent_id?: string }) =>
    api.put<Category>(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
}

// ─── Products ─────────────────────────────────────────────────────────────────

export const productsApi = {
  list: (params?: { category_id?: string; search?: string; page?: number; limit?: number }) =>
    api.get<ProductListResponse>('/products', { params }),
  get: (id: string) => api.get<Product>(`/products/${id}`),
  create: (data: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category_name'>) =>
    api.post<Product>('/products', data),
  update: (id: string, data: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category_name'>) =>
    api.put<Product>(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export const cartApi = {
  get: () => api.get<CartItem[]>('/cart'),
  add: (product_id: string, quantity = 1) => api.post<CartItem[]>('/cart', { product_id, quantity }),
  update: (itemId: string, quantity: number) => api.put<CartItem[]>(`/cart/${itemId}`, { quantity }),
  remove: (itemId: string) => api.delete<CartItem[]>(`/cart/${itemId}`),
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export const ordersApi = {
  list: () => api.get<Order[]>('/orders'),
  get: (id: string) => api.get<Order>(`/orders/${id}`),
  create: (data: { address: string; contact_phone: string; comment: string }) =>
    api.post<Order>('/orders', data),
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminApi = {
  stats: () => api.get<AdminStats>('/admin/stats'),
  orders: () => api.get<Order[]>('/admin/orders'),
  updateOrderStatus: (id: string, status: string) =>
    api.patch<Order>(`/admin/orders/${id}/status`, { status }),
  users: () => api.get<User[]>('/admin/users'),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
}
