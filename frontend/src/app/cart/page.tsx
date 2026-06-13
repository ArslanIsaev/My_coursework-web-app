'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { cartApi, CartItem } from '@/lib/api'
import { formatPrice, resolveImageUrl } from '@/lib/utils'
import { Trash2, ShoppingBag } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const { user, hydrate } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    cartApi.get().then((r) => setItems(r.data || [])).catch(() => {}).finally(() => setLoading(false))
  }, [user, router])

  const updateQty = async (itemId: string, qty: number) => {
    try {
      const r = await cartApi.update(itemId, qty)
      setItems(r.data || [])
    } catch { toast.error('Ошибка') }
  }

  const remove = async (itemId: string) => {
    try {
      const r = await cartApi.remove(itemId)
      setItems(r.data || [])
      toast.success('Товар удалён')
    } catch { toast.error('Ошибка') }
  }

  const total = items.reduce((s, i) => s + i.product.price * i.quantity, 0)

  if (loading) return <div className="min-h-screen"><Navbar /></div>

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Корзина</h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag size={48} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-lg font-medium text-gray-600 mb-2">Корзина пуста</h2>
            <p className="text-sm text-gray-400 mb-6">Добавьте товары из каталога</p>
            <Link href="/catalog" className="btn-primary">Перейти в каталог</Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="card p-4 flex gap-4">
                  <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={resolveImageUrl(item.product.image_url)}
                      alt={item.product.name}
                      fill className="object-cover" unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/catalog/${item.product.id}`} className="font-medium text-sm hover:text-sky-600 line-clamp-2">
                      {item.product.name}
                    </Link>
                    <div className="text-sky-600 font-semibold mt-1">{formatPrice(item.product.price)}</div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button onClick={() => item.quantity > 1 ? updateQty(item.id, item.quantity - 1) : remove(item.id)}
                          className="px-2.5 py-1 hover:bg-gray-100 text-sm">−</button>
                        <span className="px-3 py-1 text-sm font-medium">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, item.quantity + 1)}
                          className="px-2.5 py-1 hover:bg-gray-100 text-sm">+</button>
                      </div>
                      <button onClick={() => remove(item.id)} className="text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="text-right font-bold text-sm">
                    {formatPrice(item.product.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:w-72 flex-shrink-0">
              <div className="card p-5 sticky top-20">
                <h2 className="font-semibold mb-4">Сводка заказа</h2>
                <div className="space-y-2 mb-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm text-gray-600">
                      <span className="truncate max-w-[140px]">{item.product.name} ×{item.quantity}</span>
                      <span className="flex-shrink-0 ml-2">{formatPrice(item.product.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Итого</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
                <Link href="/checkout" className="btn-primary w-full py-3 text-base justify-center">
                  Оформить заказ →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
