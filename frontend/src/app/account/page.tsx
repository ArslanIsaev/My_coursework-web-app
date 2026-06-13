'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { ordersApi, authApi, Order } from '@/lib/api'
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils'
import { useAuthStore } from '@/lib/store'
import { Package, User, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'

type Tab = 'orders' | 'profile'

export default function AccountPage() {
  const [tab, setTab] = useState<Tab>('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { user, setAuth, logout, hydrate } = useAuthStore()
  const router = useRouter()
  const [profile, setProfile] = useState({ name: '', phone: '' })

  useEffect(() => { hydrate() }, [hydrate])
  useEffect(() => {
    if (!user) { router.push('/login'); return }
    setProfile({ name: user.name, phone: user.phone })
    ordersApi.list().then((r) => setOrders(r.data || [])).catch(() => {}).finally(() => setLoading(false))
  }, [user, router])

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const r = await authApi.updateProfile(profile)
      setAuth(r.data, localStorage.getItem('token')!)
      toast.success('Профиль обновлён')
    } catch { toast.error('Ошибка сохранения') }
  }

  const handleLogout = () => { logout(); router.push('/') }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Личный кабинет</h1>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="md:w-56 flex-shrink-0">
            <div className="card p-4 mb-3 text-center">
              <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <User size={28} className="text-sky-600" />
              </div>
              <div className="font-semibold text-sm">{user?.name}</div>
              <div className="text-xs text-gray-400">{user?.email}</div>
            </div>
            <nav className="card overflow-hidden">
              {([
                { id: 'orders', label: '📦 Заказы' },
                { id: 'profile', label: '👤 Профиль' },
              ] as { id: Tab; label: string }[]).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors border-b border-gray-100 last:border-0 ${
                    tab === item.id ? 'bg-sky-50 text-sky-700 font-medium' : 'hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <button onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2">
                <LogOut size={14} /> Выйти
              </button>
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1">
            {tab === 'orders' && (
              <div>
                <h2 className="font-semibold text-lg mb-4">Мои заказы</h2>
                {loading ? (
                  <div className="space-y-3">
                    {[1,2,3].map((i) => <div key={i} className="card h-20 animate-pulse bg-gray-100" />)}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Package size={40} className="mx-auto mb-3 opacity-40" />
                    <p>Заказов пока нет</p>
                    <Link href="/catalog" className="btn-primary mt-4 inline-flex">Перейти в каталог</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((order) => (
                      <div key={order.id} className="card p-4">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <div className="font-mono font-semibold text-sm">#{order.id.slice(0,8).toUpperCase()}</div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {formatDate(order.created_at)} · {order.items?.length ?? 0} товара
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`badge ${ORDER_STATUS_COLORS[order.status]}`}>
                              {ORDER_STATUS_LABELS[order.status]}
                            </span>
                            <span className="font-bold text-sm">{formatPrice(order.total_price)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'profile' && (
              <div>
                <h2 className="font-semibold text-lg mb-4">Редактировать профиль</h2>
                <div className="card p-5 max-w-md">
                  <form onSubmit={saveProfile} className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Имя</label>
                      <input className="input" value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Email</label>
                      <input className="input" value={user?.email || ''} disabled />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Телефон</label>
                      <input className="input" value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                    </div>
                    <button type="submit" className="btn-primary">Сохранить</button>
                  </form>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
