// 'use client'
// export const dynamic = 'force-dynamic'
// import { useEffect, useState } from 'react'
// import { useSearchParams } from 'next/navigation'
// import Navbar from '@/components/layout/Navbar'
// import ProductCard from '@/components/shop/ProductCard'
// import { productsApi, categoriesApi, Product, Category } from '@/lib/api'
// import { Search, Filter } from 'lucide-react'

// export default function CatalogPage() {
//   const searchParams = useSearchParams()
//   const [products, setProducts] = useState<Product[]>([])
//   const [categories, setCategories] = useState<Category[]>([])
//   const [total, setTotal] = useState(0)
//   const [page, setPage] = useState(1)
//   const [loading, setLoading] = useState(true)
//   const [search, setSearch] = useState('')
//   const [searchInput, setSearchInput] = useState('')
//   const [selectedCategory, setSelectedCategory] = useState('')

//   const limit = 12

//   useEffect(() => {
//     categoriesApi.list().then((r) => setCategories(r.data)).catch(() => {})
//   }, [])

//   useEffect(() => {
//     setLoading(true)
//     productsApi.list({ category_id: selectedCategory, search, page, limit })
//       .then((r) => {
//         setProducts(r.data.products || [])
//         setTotal(r.data.total)
//       })
//       .catch(() => {})
//       .finally(() => setLoading(false))
//   }, [selectedCategory, search, page])

//   const totalPages = Math.ceil(total / limit)

//   const handleSearch = (e: React.FormEvent) => {
//     e.preventDefault()
//     setSearch(searchInput)
//     setPage(1)
//   }

//   return (
//     <div className="min-h-screen">
//       <Navbar />
//       <div className="max-w-7xl mx-auto px-4 py-6">
//         <h1 className="text-2xl font-bold mb-6">Каталог товаров</h1>

//         {/* Search bar */}
//         <form onSubmit={handleSearch} className="flex gap-2 mb-6">
//           <div className="relative flex-1 max-w-lg">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
//             <input
//               type="text"
//               value={searchInput}
//               onChange={(e) => setSearchInput(e.target.value)}
//               placeholder="Поиск товаров..."
//               className="input pl-9"
//             />
//           </div>
//           <button type="submit" className="btn-primary">Найти</button>
//         </form>

//         {/* Category filters */}
//         <div className="flex gap-2 flex-wrap mb-6">
//           <button
//             onClick={() => { setSelectedCategory(''); setPage(1) }}
//             className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
//               selectedCategory === ''
//                 ? 'bg-sky-600 text-white'
//                 : 'bg-white border border-gray-300 text-gray-600 hover:border-sky-400'
//             }`}
//           >
//             Все
//           </button>
//           {categories.map((cat) => (
//             <button
//               key={cat.id}
//               onClick={() => { setSelectedCategory(cat.id); setPage(1) }}
//               className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
//                 selectedCategory === cat.id
//                   ? 'bg-sky-600 text-white'
//                   : 'bg-white border border-gray-300 text-gray-600 hover:border-sky-400'
//               }`}
//             >
//               {cat.name}
//             </button>
//           ))}
//         </div>

//         {/* Results count */}
//         <p className="text-sm text-gray-500 mb-4">{total} товаров найдено</p>

//         {/* Products grid */}
//         {loading ? (
//           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
//             {Array.from({ length: 8 }).map((_, i) => (
//               <div key={i} className="card h-64 animate-pulse bg-gray-200" />
//             ))}
//           </div>
//         ) : products.length === 0 ? (
//           <div className="text-center py-16 text-gray-400">
//             <Filter size={40} className="mx-auto mb-3 opacity-40" />
//             <p className="font-medium">Товары не найдены</p>
//             <p className="text-sm mt-1">Попробуйте изменить фильтры</p>
//           </div>
//         ) : (
//           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
//             {products.map((p) => (
//               <ProductCard key={p.id} product={p} />
//             ))}
//           </div>
//         )}

//         {/* Pagination */}
//         {totalPages > 1 && (
//           <div className="flex justify-center gap-2 mt-8">
//             {Array.from({ length: totalPages }).map((_, i) => (
//               <button
//                 key={i}
//                 onClick={() => setPage(i + 1)}
//                 className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
//                   page === i + 1
//                     ? 'bg-sky-600 text-white'
//                     : 'bg-white border border-gray-300 hover:border-sky-400'
//                 }`}
//               >
//                 {i + 1}
//               </button>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }




'use client'
import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import ProductCard from '@/components/shop/ProductCard'
import { productsApi, categoriesApi, Product, Category } from '@/lib/api'
import { Search, Filter } from 'lucide-react'

// Компонент, который использует useSearchParams()
function CatalogContent() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const limit = 12

  useEffect(() => {
    categoriesApi.list().then((r) => setCategories(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    productsApi.list({ category_id: selectedCategory, search, page, limit })
      .then((r) => {
        setProducts(r.data.products || [])
        setTotal(r.data.total)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedCategory, search, page])

  const totalPages = Math.ceil(total / limit)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Каталог товаров</h1>

        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Поиск товаров..."
              className="input pl-9"
            />
          </div>
          <button type="submit" className="btn-primary">Найти</button>
        </form>

        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => { setSelectedCategory(''); setPage(1) }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === ''
                ? 'bg-sky-600 text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:border-sky-400'
            }`}
          >
            Все
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); setPage(1) }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-sky-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-600 hover:border-sky-400'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <p className="text-sm text-gray-500 mb-4">{total} товаров найдено</p>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card h-64 animate-pulse bg-gray-200" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Filter size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">Товары не найдены</p>
            <p className="text-sm mt-1">Попробуйте изменить фильтры</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                  page === i + 1
                    ? 'bg-sky-600 text-white'
                    : 'bg-white border border-gray-300 hover:border-sky-400'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Основной компонент страницы с Suspense
export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Загрузка каталога...</div>}>
      <CatalogContent />
    </Suspense>
  )
}
