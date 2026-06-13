'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import { productsApi, categoriesApi, api, Category } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { ArrowLeft, Upload, X } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY = { name: '', description: '', price: '', stock: '', category_id: '', image_url: '' }
const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || ''

export default function ProductFormPage() {
  const { id } = useParams() as { id: string }
  const isNew = id === 'new'
  const router = useRouter()
  const { user, hydrate } = useAuthStore()

  const [form, setForm] = useState(EMPTY)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { hydrate() }, [hydrate])
  useEffect(() => {
    if (user && user.role !== 'admin') router.push('/')
  }, [user, router])

  useEffect(() => {
    categoriesApi.list().then((r) => setCategories(r.data || [])).catch(() => {})
    if (!isNew) {
      productsApi.get(id).then((r) => {
        const p = r.data
        setForm({
          name: p.name, description: p.description,
          price: String(p.price), stock: String(p.stock),
          category_id: p.category_id, image_url: p.image_url,
        })
      }).catch(() => toast.error('Товар не найден')).finally(() => setLoading(false))
    }
  }, [id, isNew])

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Только изображения (jpg, png, webp, gif)')
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const r = await api.post<{ url: string }>('/admin/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setForm((f) => ({ ...f, image_url: r.data.url }))
      toast.success('Изображение загружено')
    } catch {
      toast.error('Ошибка загрузки изображения')
    } finally {
      setUploading(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm({ ...form, [k]: e.target.value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const data = {
      name: form.name, description: form.description,
      price: parseFloat(form.price), stock: parseInt(form.stock),
      category_id: form.category_id, image_url: form.image_url,
    }
    try {
      if (isNew) {
        await productsApi.create(data)
        toast.success('Товар создан')
      } else {
        await productsApi.update(id, data)
        toast.success('Товар обновлён')
      }
      router.push('/admin')
    } catch {
      toast.error('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const imageUrl = form.image_url
    ? form.image_url.startsWith('http') ? form.image_url : `${API_BASE}${form.image_url}`
    : null

  if (loading) return <div className="min-h-screen"><Navbar /></div>

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6">
          <ArrowLeft size={16} /> Назад в панель
        </Link>
        <h1 className="text-2xl font-bold mb-6">{isNew ? 'Добавить товар' : 'Редактировать товар'}</h1>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {/* Image upload */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">Изображение товара</label>

            {/* Drop zone */}
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`relative border-2 border-dashed rounded-xl transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 
                ${dragOver ? 'border-sky-500 bg-sky-50' : 'border-gray-300 hover:border-sky-400 hover:bg-gray-50'}
                ${imageUrl ? 'h-48' : 'h-36'}`}
            >
              {uploading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl z-10">
                  <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {imageUrl ? (
                <>
                  <Image src={imageUrl} alt="preview" fill className="object-contain rounded-xl p-2" unoptimized />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setForm((f) => ({ ...f, image_url: '' })) }}
                    className="absolute top-2 right-2 z-10 bg-white rounded-full p-1 shadow hover:bg-red-50 text-red-500"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <Upload size={28} className="text-gray-400" />
                  <p className="text-sm text-gray-500">Перетащите изображение или <span className="text-sky-600">нажмите</span></p>
                  <p className="text-xs text-gray-400">JPG, PNG, WebP, GIF — до 5 МБ</p>
                </>
              )}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileChange}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Название *</label>
            <input className="input" value={form.name} onChange={set('name')} required />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Описание</label>
            <textarea className="input resize-none" rows={3} value={form.description} onChange={set('description')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Цена (₽) *</label>
              <input className="input" type="number" min="0" step="0.01" value={form.price} onChange={set('price')} required />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Остаток (шт.) *</label>
              <input className="input" type="number" min="0" value={form.stock} onChange={set('stock')} required />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Категория</label>
            <select className="input" value={form.category_id} onChange={set('category_id')}>
              <option value="">— Без категории —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving || uploading} className="btn-primary">
              {saving ? 'Сохраняем...' : isNew ? 'Создать товар' : 'Сохранить изменения'}
            </button>
            <Link href="/admin" className="btn-secondary">Отмена</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
