'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, User, LogOut, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store'
import { cartApi } from '@/lib/api'

export default function Navbar() {
  const { user, logout, hydrate } = useAuthStore()
  const [cartCount, setCartCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (user) {
      cartApi.get().then((r) => {
        setCartCount(r.data.reduce((s, i) => s + i.quantity, 0))
      }).catch(() => {})
    } else {
      setCartCount(0)
    }
  }, [user])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        <Link href="/" className="font-bold text-sky-600 text-lg tracking-tight mr-2">
          SportShop
        </Link>

        <nav className="hidden md:flex items-center gap-1 flex-1">
          <Link href="/catalog" className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
            Каталог
          </Link>
        </nav>

        <div className="flex-1 md:flex-none" />

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/cart" className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-sky-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>
              {user.role === 'admin' && (
                <Link href="/admin" className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
                  <Settings size={20} />
                </Link>
              )}
              <Link href="/account" className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                <User size={16} />
                <span className="hidden sm:inline">{user.name.split(' ')[0]}</span>
              </Link>
              <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-secondary text-sm py-1.5">Войти</Link>
              <Link href="/register" className="btn-primary text-sm py-1.5">Регистрация</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
