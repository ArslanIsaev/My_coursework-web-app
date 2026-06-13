'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { productsApi, cartApi, Product } from '@/lib/api'
import { formatPrice, resolveImageUrl } from '@/lib/utils'
import { ShoppingCart, ArrowLeft, Package } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'

export default function ProductPage() {
  const { id } = useParams() as { id: string }
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)
  const { user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    productsApi.get(id).then((r) => setProduct(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  const addToCart = async () => {
    if (!user) { router.push('/login'); return }
    setAdding(true)
    try {
      await cartApi.add(product!.id, qty)
      toast.success(`Добавлено в корзину: ${qty} шт.`)
    } catch {
      toast.error('Ошибка добавления')
    } finally {
      setAdding(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen"><Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="animate-pulse grid md:grid-cols-2 gap-8">
          <div className="bg-gray-200 rounded-xl h-80" />
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      </div>
    </div>
  )

  if (!product) return (
    <div className="min-h-screen"><Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10 text-center">
        <p className="text-gray-500">Товар не найден</p>
        <Link href="/catalog" className="btn-primary mt-4">Вернуться в каталог</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Link href="/catalog" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6">
          <ArrowLeft size={16} /> Назад в каталог
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="relative h-80 md:h-96 bg-gray-100 rounded-xl overflow-hidden">
            <Image
              src={resolveImageUrl(product.image_url)}
              alt={product.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          <div className="flex flex-col">
            {product.category_name && (
              <span className="text-sm text-sky-600 font-medium mb-2">{product.category_name}</span>
            )}
            <h1 className="text-2xl font-bold mb-3">{product.name}</h1>
            <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>

            <div className="flex items-center gap-3 mb-6">
              <Package size={16} className="text-gray-400" />
              <span className="text-sm text-gray-500">
                {product.stock > 0 ? `В наличии: ${product.stock} шт.` : 'Нет в наличии'}
              </span>
            </div>

            <div className="text-3xl font-bold mb-6">{formatPrice(product.price)}</div>

            <div className="flex items-center gap-3 mb-4">
              <label className="text-sm text-gray-600">Количество:</label>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-3 py-2 hover:bg-gray-100 transition-colors text-lg leading-none"
                >−</button>
                <span className="px-4 py-2 font-medium min-w-[40px] text-center">{qty}</span>
                <button
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                  className="px-3 py-2 hover:bg-gray-100 transition-colors text-lg leading-none"
                >+</button>
              </div>
            </div>

            <button
              onClick={addToCart}
              disabled={product.stock === 0 || adding}
              className="btn-primary py-3 text-base"
            >
              <ShoppingCart size={18} />
              {adding ? 'Добавляем...' : 'В корзину'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
