'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { adminApi, AdminStats, Order, User, categoriesApi, productsApi, Category, Product } from '@/lib/api'
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils'
import { useAuthStore } from '@/lib/store'
import { BarChart3, Package, ShoppingBag, Users, Tag, Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

type AdminTab = 'dashboard' | 'orders' | 'products' | 'users' | 'categories'

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('dashboard')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const { user, hydrate } = useAuthStore()
  const router = useRouter()

  useEffect(() => { hydrate() }, [hydrate])
  useEffect(() => {
    if (user === null) return
    if (user && user.role !== 'admin') { router.push('/'); return }
  }, [user, router])

  useEffect(() => {
    adminApi.stats().then((r) => setStats(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (tab === 'orders') adminApi.orders().then((r) => setOrders(r.data || [])).catch(() => {})
    if (tab === 'users') adminApi.users().then((r) => setUsers(r.data || [])).catch(() => {})
    if (tab === 'products') productsApi.list({ limit: 100 }).then((r) => setProducts(r.data.products || [])).catch(() => {})
    if (tab === 'categories') categoriesApi.list().then((r) => setCategories(r.data || [])).catch(() => {})
  }, [tab])

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await adminApi.updateOrderStatus(orderId, status)
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: status as Order['status'] } : o))
      toast.success('Статус обновлён')
    } catch { toast.error('Ошибка') }
  }

  const deleteUser = async (id: string) => {
    if (!confirm('Удалить пользователя?')) return
    try {
      await adminApi.deleteUser(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
      toast.success('Пользователь удалён')
    } catch { toast.error('Ошибка') }
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Удалить товар?')) return
    try {
      await productsApi.delete(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
      toast.success('Товар удалён')
    } catch { toast.error('Ошибка') }
  }

  const navItems: { id: AdminTab; label: string; Icon: any }[] = [
    { id: 'dashboard', label: 'Дашборд', Icon: BarChart3 },
    { id: 'orders', label: 'Заказы', Icon: ShoppingBag },
    { id: 'products', label: 'Товары', Icon: Package },
    { id: 'users', label: 'Пользователи', Icon: Users },
    { id: 'categories', label: 'Категории', Icon: Tag },
  ]

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex h-[calc(100vh-56px)]">
        {/* Sidebar */}
        <aside className="w-52 bg-gray-900 text-gray-200 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-gray-700 font-bold text-sm text-gray-300">⚙ Админ-панель</div>
          <nav className="flex-1 py-2">
            {navItems.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  tab === id ? 'bg-sky-600 text-white' : 'hover:bg-gray-800 text-gray-300'
                }`}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          {/* Dashboard */}
          {tab === 'dashboard' && stats && (
            <div>
              <h1 className="text-xl font-bold mb-6">Дашборд</h1>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Заказов сегодня', value: stats.today_orders },
                  { label: 'Выручка сегодня', value: formatPrice(stats.today_revenue) },
                  { label: 'Всего товаров', value: stats.total_products },
                  { label: 'Пользователей', value: stats.total_users },
                ].map((s) => (
                  <div key={s.label} className="card p-4">
                    <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                    <div className="text-2xl font-bold">{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="card p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Общая статистика</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Всего заказов:</span>
                    <span className="ml-2 font-medium">{stats.total_orders}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Общая выручка:</span>
                    <span className="ml-2 font-medium">{formatPrice(stats.total_revenue)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Orders */}
          {tab === 'orders' && (
            <div>
              <h1 className="text-xl font-bold mb-6">Управление заказами</h1>
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Номер', 'Покупатель', 'Сумма', 'Дата', 'Статус', 'Действия'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs">#{order.id.slice(0,8).toUpperCase()}</td>
                        <td className="px-4 py-3">
                          <div>{order.user_name}</div>
                          <div className="text-xs text-gray-400">{order.user_email}</div>
                        </td>
                        <td className="px-4 py-3 font-medium">{formatPrice(order.total_price)}</td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(order.created_at)}</td>
                        <td className="px-4 py-3">
                          <span className={`badge ${ORDER_STATUS_COLORS[order.status]}`}>
                            {ORDER_STATUS_LABELS[order.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={order.status}
                            onChange={(e) => updateStatus(order.id, e.target.value)}
                            className="text-xs border border-gray-200 rounded px-2 py-1"
                          >
                            {Object.entries(ORDER_STATUS_LABELS).map(([v, l]) => (
                              <option key={v} value={v}>{l}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Products */}
          {tab === 'products' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold">Товары</h1>
                <Link href="/admin/products/new" className="btn-primary text-sm">
                  <Plus size={16} /> Добавить товар
                </Link>
              </div>
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Название', 'Категория', 'Цена', 'Остаток', 'Действия'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium max-w-xs truncate">{p.name}</td>
                        <td className="px-4 py-3 text-gray-500">{p.category_name || '—'}</td>
                        <td className="px-4 py-3">{formatPrice(p.price)}</td>
                        <td className="px-4 py-3">
                          <span className={p.stock > 0 ? 'text-green-600' : 'text-red-500'}>{p.stock}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Link href={`/admin/products/${p.id}`} className="p-1.5 text-gray-400 hover:text-sky-600 transition-colors">
                              <Pencil size={14} />
                            </Link>
                            <button onClick={() => deleteProduct(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Users */}
          {tab === 'users' && (
            <div>
              <h1 className="text-xl font-bold mb-6">Пользователи</h1>
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Имя', 'Email', 'Телефон', 'Роль', 'Дата', 'Действия'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{u.name}</td>
                        <td className="px-4 py-3 text-gray-500">{u.email}</td>
                        <td className="px-4 py-3 text-gray-500">{u.phone || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`badge ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                            {u.role === 'admin' ? 'Администратор' : 'Покупатель'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(u.created_at)}</td>
                        <td className="px-4 py-3">
                          {u.role !== 'admin' && (
                            <button onClick={() => deleteUser(u.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Categories */}
          {tab === 'categories' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold">Категории</h1>
                <Link href="/admin/categories/new" className="btn-primary text-sm">
                  <Plus size={16} /> Добавить категорию
                </Link>
              </div>
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Название', 'Slug', 'Дата', 'Действия'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((c) => (
                      <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{c.name}</td>
                        <td className="px-4 py-3 text-gray-500 font-mono">{c.slug}</td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(c.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Link href={`/admin/categories/${c.id}`} className="p-1.5 text-gray-400 hover:text-sky-600 transition-colors">
                              <Pencil size={14} />
                            </Link>
                            <button onClick={async () => {
                              if (!confirm('Удалить?')) return
                              await categoriesApi.delete(c.id)
                              setCategories((prev) => prev.filter((x) => x.id !== c.id))
                              toast.success('Удалено')
                            }} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
