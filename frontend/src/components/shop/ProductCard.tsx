'use client'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { Product } from '@/lib/api'
import { formatPrice, resolveImageUrl } from '@/lib/utils'
import { cartApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Props {
  product: Product
}

export default function ProductCard({ product }: Props) {
  const { user } = useAuthStore()
  const router = useRouter()

  const addToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!user) {
      router.push('/login')
      return
    }
    try {
      await cartApi.add(product.id)
      toast.success('Добавлено в корзину')
    } catch {
      toast.error('Ошибка добавления в корзину')
    }
  }

  return (
    <Link href={`/catalog/${product.id}`} className="card group flex flex-col hover:shadow-md transition-shadow">
      <div className="relative h-48 bg-gray-100 rounded-t-xl overflow-hidden">
        <Image
          src={resolveImageUrl(product.image_url)}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          unoptimized
        />
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-medium text-sm">Нет в наличии</span>
          </div>
        )}
        {product.category_name && (
          <span className="absolute top-2 left-2 badge bg-white/90 text-gray-700">
            {product.category_name}
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-medium text-gray-900 text-sm leading-tight mb-1 line-clamp-2 flex-1">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between mt-auto">
          <span className="font-bold text-gray-900">{formatPrice(product.price)}</span>
          <button
            onClick={addToCart}
            disabled={product.stock === 0}
            className="p-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </Link>
  )
}
