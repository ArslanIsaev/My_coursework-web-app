'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password.length < 6) { toast.error('Пароль минимум 6 символов'); return }
    setLoading(true)
    try {
      const r = await authApi.register(form)
      setAuth(r.data.user, r.data.token)
      toast.success('Аккаунт создан!')
      router.push('/')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value })

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-2xl font-bold text-sky-600 block text-center mb-8">SportShop</Link>
        <div className="card p-6">
          <h1 className="text-xl font-bold mb-6">Создать аккаунт</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Имя</label>
              <input className="input" value={form.name} onChange={set('name')} required />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input type="email" className="input" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Телефон</label>
              <input className="input" placeholder="+7 (999) 000-00-00" value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Пароль</label>
              <input type="password" className="input" value={form.password} onChange={set('password')} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 justify-center">
              {loading ? 'Создаём...' : 'Зарегистрироваться'}
            </button>
          </form>
          <p className="text-sm text-center text-gray-500 mt-4">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-sky-600 hover:underline">Войти</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
