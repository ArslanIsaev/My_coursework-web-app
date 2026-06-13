export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(price)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  new: 'Новый',
  processing: 'В обработке',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  new: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || ''

export function resolveImageUrl(url: string | undefined): string {
  if (!url) return 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400'
  if (url.startsWith('http')) return url
  // relative path like /uploads/filename.jpg
  return `${API_ORIGIN}${url}`
}
