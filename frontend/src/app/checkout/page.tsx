'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { cartApi, ordersApi, CartItem } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'

const STEPS = ['Корзина', 'Доставка', 'Подтверждение']

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [step] = useState(1) // step 0=cart, 1=delivery, 2=confirm
  const { user, hydrate } = useAuthStore()
  const router = useRouter()

  const [form, setForm] = useState({ address: '', contact_phone: '', comment: '' })

  useEffect(() => { hydrate() }, [hydrate])
  useEffect(() => {
    if (!user) { router.push('/login'); return }
    cartApi.get().then((r) => {
      const items = r.data || []
      if (items.length === 0) { router.push('/cart'); return }
      setCartItems(items)
    }).catch(() => router.push('/cart')).finally(() => setLoading(false))
  }, [user, router])

  const total = cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.address || !form.contact_phone) {
      toast.error('Заполните адрес и телефон')
      return
    }
    setSubmitting(true)
    try {
      const r = await ordersApi.create(form)
      router.push(`/order-success/${r.data.id}`)
    } catch {
      toast.error('Ошибка оформления заказа')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="min-h-screen"><Navbar /></div>

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Оформление заказа</h1>

        {/* Progress bar */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className={`flex items-center gap-2 ${i <= step ? 'text-sky-600' : 'text-gray-400'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  i < step ? 'bg-sky-600 border-sky-600 text-white' :
                  i === step ? 'border-sky-600 text-sky-600' :
                  'border-gray-300 text-gray-400'
                }`}>{i + 1}</div>
                <span className="text-sm font-medium hidden sm:inline">{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 ${i < step ? 'bg-sky-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <div className="card p-5">
              <h2 className="font-semibold mb-4">Данные получателя</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Имя получателя</label>
                  <input className="input" value={user?.name || ''} disabled />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Телефон *</label>
                  <input
                    className="input"
                    placeholder="+7 (999) 000-00-00"
                    value={form.contact_phone}
                    onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h2 className="font-semibold mb-4">Адрес доставки</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Полный адрес *</label>
                  <input
                    className="input"
                    placeholder="Город, улица, дом, кв."
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h2 className="font-semibold mb-3">Способ доставки</h2>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="w-4 h-4 rounded-full border-2 border-sky-600 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-sky-600" />
                  </div>
                  <span className="text-sm">Курьерская доставка — 350 ₽ (1–3 дня)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                  <span className="text-sm text-gray-500">Самовывоз из пункта — бесплатно</span>
                </label>
              </div>
            </div>

            <div className="card p-5">
              <label className="block text-sm text-gray-600 mb-1">Комментарий к заказу</label>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="Оставьте у двери, код домофона..."
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
              />
            </div>
          </div>

          <div className="lg:w-72 flex-shrink-0">
            <div className="card p-5 sticky top-20">
              <h2 className="font-semibold mb-4">Ваш заказ</h2>
              <div className="space-y-2 mb-4 text-sm">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-gray-600">
                    <span className="truncate max-w-[140px]">{item.product.name} ×{item.quantity}</span>
                    <span>{formatPrice(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-3 space-y-1 mb-4">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Доставка</span><span>350 ₽</span>
                </div>
                <div className="flex justify-between font-bold text-base">
                  <span>Итого</span><span>{formatPrice(total + 350)}</span>
                </div>
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full py-3 justify-center">
                {submitting ? 'Оформляем...' : 'Подтвердить заказ'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
