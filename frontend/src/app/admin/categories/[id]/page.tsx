'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { categoriesApi, Category } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CategoryFormPage() {
  const { id } = useParams() as { id: string }
  const isNew = id === 'new'
  const router = useRouter()
  const { user, hydrate } = useAuthStore()

  const [form, setForm] = useState({ name: '', slug: '', parent_id: '' })
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)

  useEffect(() => { hydrate() }, [hydrate])
  useEffect(() => {
    if (user && user.role !== 'admin') router.push('/')
  }, [user, router])

  useEffect(() => {
    categoriesApi.list().then((r) => setCategories((r.data || []).filter((c) => c.id !== id))).catch(() => {})
    if (!isNew) {
      categoriesApi.list().then((r) => {
        const cat = (r.data || []).find((c) => c.id === id)
        if (cat) setForm({ name: cat.name, slug: cat.slug, parent_id: cat.parent_id || '' })
      }).catch(() => toast.error('Категория не найдена')).finally(() => setLoading(false))
    }
  }, [id, isNew])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value })

  // auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    const slug = isNew
      ? name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
      : form.slug
    setForm({ ...form, name, slug })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (isNew) {
        await categoriesApi.create(form)
        toast.success('Категория создана')
      } else {
        await categoriesApi.update(id, form)
        toast.success('Категория обновлена')
      }
      router.push('/admin')
    } catch {
      toast.error('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="min-h-screen"><Navbar /></div>

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-6">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6">
          <ArrowLeft size={16} /> Назад в панель
        </Link>
        <h1 className="text-2xl font-bold mb-6">{isNew ? 'Добавить категорию' : 'Редактировать категорию'}</h1>
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Название *</label>
            <input className="input" value={form.name} onChange={handleNameChange} required />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Slug (URL-идентификатор) *</label>
            <input className="input font-mono" value={form.slug}
              onChange={set('slug')} required placeholder="beg, fitness, cycling..." />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Родительская категория</label>
            <select className="input" value={form.parent_id} onChange={set('parent_id')}>
              <option value="">— Нет (корневая) —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Сохраняем...' : isNew ? 'Создать' : 'Сохранить'}
            </button>
            <Link href="/admin" className="btn-secondary">Отмена</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
