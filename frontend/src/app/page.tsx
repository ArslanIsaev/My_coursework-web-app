import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { Zap, Shield, Truck, RotateCcw } from 'lucide-react'

const categories = [
  { name: 'Бег', slug: 'running', emoji: '🏃', desc: 'Кроссовки, одежда, аксессуары' },
  { name: 'Фитнес', slug: 'fitness', emoji: '💪', desc: 'Гантели, тренажёры, коврики' },
  { name: 'Велоспорт', slug: 'cycling', emoji: '🚴', desc: 'Шлемы, перчатки, велоформа' },
  { name: 'Плавание', slug: 'swimming', emoji: '🏊', desc: 'Очки, шапочки, купальники' },
]

const features = [
  { icon: Truck, title: 'Быстрая доставка', desc: 'Курьером за 1–3 дня' },
  { icon: Shield, title: 'Гарантия качества', desc: 'Только оригинальные товары' },
  { icon: RotateCcw, title: 'Лёгкий возврат', desc: 'В течение 14 дней' },
  { icon: Zap, title: 'Выгодные цены', desc: 'Скидки для постоянных клиентов' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-sky-600 to-sky-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <p className="text-sky-200 text-sm font-medium mb-3 uppercase tracking-wider">Интернет-магазин</p>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
              Спортивные товары<br />для любого уровня
            </h1>
            <p className="text-sky-100 text-lg mb-8 max-w-md">
              Более 300 товаров от ведущих брендов. Бег, фитнес, велоспорт, плавание — всё в одном месте.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/catalog" className="bg-white text-sky-700 font-semibold px-6 py-3 rounded-lg hover:bg-sky-50 transition-colors">
                Перейти в каталог
              </Link>
              <Link href="/register" className="border border-white/40 text-white px-6 py-3 rounded-lg hover:bg-white/10 transition-colors">
                Зарегистрироваться
              </Link>
            </div>
          </div>
          <div className="flex-1 hidden md:flex justify-center">
            <div className="grid grid-cols-2 gap-3 max-w-xs w-full">
              {categories.map((c) => (
                <Link key={c.slug} href={`/catalog?category_slug=${c.slug}`}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-4 transition-colors">
                  <div className="text-3xl mb-2">{c.emoji}</div>
                  <div className="font-semibold text-sm">{c.name}</div>
                  <div className="text-xs text-sky-200 mt-0.5">{c.desc}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories (mobile) */}
      <section className="md:hidden bg-white border-b border-gray-200 px-4 py-6">
        <h2 className="font-bold text-lg mb-4">Категории</h2>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((c) => (
            <Link key={c.slug} href={`/catalog?category_slug=${c.slug}`}
              className="card p-4 hover:shadow-md transition-shadow">
              <div className="text-2xl mb-1">{c.emoji}</div>
              <div className="font-medium text-sm">{c.name}</div>
              <div className="text-xs text-gray-500">{c.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="flex flex-col items-start gap-2">
              <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
                <f.icon size={20} className="text-sky-600" />
              </div>
              <div className="font-semibold text-sm">{f.title}</div>
              <div className="text-xs text-gray-500">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-3">Готовы начать?</h2>
        <p className="text-gray-600 mb-6">Зарегистрируйтесь и получите доступ к персональному кабинету и истории заказов</p>
        <Link href="/catalog" className="btn-primary px-8 py-3 text-base">
          Смотреть каталог
        </Link>
      </section>

      <footer className="bg-gray-900 text-gray-400 text-center py-6 text-sm">
        © {new Date().getFullYear()} SportShop. Все права защищены.
      </footer>
    </div>
  )
}
