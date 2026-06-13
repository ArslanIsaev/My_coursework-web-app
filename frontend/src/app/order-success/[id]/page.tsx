'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { ordersApi, Order } from '@/lib/api'
import { formatPrice, ORDER_STATUS_LABELS, formatDate } from '@/lib/utils'
import { CheckCircle } from 'lucide-react'

export default function OrderSuccessPage() {
  const { id } = useParams() as { id: string }
  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    ordersApi.get(id).then((r) => setOrder(r.data)).catch(() => {})
  }, [id])

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <CheckCircle size={64} className="mx-auto mb-4 text-green-500" />
        <h1 className="text-2xl font-bold mb-2">Заказ успешно оформлен!</h1>
        <p className="text-gray-500 mb-6">На ваш e-mail отправлено подтверждение с деталями заказа</p>

        {order && (
          <div className="card p-5 text-left mb-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Номер заказа</span>
                <span className="font-mono font-semibold">#{order.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Статус</span>
                <span className="font-medium text-blue-600">{ORDER_STATUS_LABELS[order.status]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Сумма</span>
                <span className="font-bold">{formatPrice(order.total_price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Дата</span>
                <span>{formatDate(order.created_at)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <Link href="/account" className="btn-primary">Мои заказы</Link>
          <Link href="/catalog" className="btn-secondary">Продолжить покупки</Link>
        </div>
      </div>
    </div>
  )
}
