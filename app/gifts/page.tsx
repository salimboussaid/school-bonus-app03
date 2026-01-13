'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'  
import { presentApi, ApiError, clearAuthCredentials, API_BASE_URL } from '@/lib/api'
import { MobilePresentResponse } from '@/lib/types'

// Local Gift type for UI
interface Gift {
  id: number
  name: string
  price: number
  stock: number
  photoIds: number[]
}

export default function GiftsPage() {
  const router = useRouter()
  const [gifts, setGifts] = useState<Gift[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [showAll, setShowAll] = useState(false)
  const PAGE_SIZE = 10

  // Form states
  const [giftName, setGiftName] = useState('')
  const [giftPrice, setGiftPrice] = useState('')
  const [giftStock, setGiftStock] = useState('')
  const [giftImages, setGiftImages] = useState<File[]>([])
  const [giftImagePreviews, setGiftImagePreviews] = useState<string[]>([])
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<number>>(new Set())
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false)
  const [imageBlobUrls, setImageBlobUrls] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    loadGifts()
  }, [currentPage, showAll])

  const loadGifts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let data: MobilePresentResponse[]
      if (showAll) {
        data = await presentApi.getAllPresents()
        setTotalPages(1)
      } else {
        const response = await presentApi.getPresents(currentPage, PAGE_SIZE)
        data = response.content
        setTotalPages(response.totalPages)
      }
      
      const convertedGifts: Gift[] = data.map(p => ({
        id: p.id,
        name: p.name,
        price: p.priceCoins,
        stock: p.stock,
        photoIds: p.photoIds || []
      }))
      setGifts(convertedGifts)
      
      // Get unique categories
      const uniqueCategories = Array.from(new Set(convertedGifts.map(g => g.name)))
      
      // Set initial category or keep current if it still exists
      if (convertedGifts.length > 0) {
        if (!selectedCategory || !uniqueCategories.includes(selectedCategory)) {
          setSelectedCategory(uniqueCategories[0])
        }
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          clearAuthCredentials()
          router.push('/auth')
          return
        }
        setError(err.message)
      } else {
        setError('Ошибка загрузки данных')
      }
    } finally {
      setLoading(false)
    }
  }

  // Get unique categories (gift names)
  const categories = Array.from(new Set(gifts.map((g) => g.name)))

  // Filter gifts by category
  const filteredGifts = selectedCategory
    ? gifts.filter((g) => g.name === selectedCategory)
    : gifts

  // Fetch image with authentication
  const fetchImageUrl = async (giftId: number, photoId: number): Promise<string | null> => {
    const key = `${giftId}-${photoId}`
    
    // Return cached blob URL if exists
    if (imageBlobUrls.has(key)) {
      return imageBlobUrls.get(key)!
    }

    try {
      const credentials = localStorage.getItem('auth_credentials')
      if (!credentials) return null

      const { login, password } = JSON.parse(credentials)
      const authHeader = 'Basic ' + btoa(`${login}:${password}`)

      const response = await fetch(`${API_BASE_URL}/presents/${giftId}/photos/${photoId}`, {
        headers: {
          'Authorization': authHeader,
        },
      })

      if (!response.ok) return null

      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      
      // Cache the blob URL
      setImageBlobUrls(prev => new Map(prev).set(key, blobUrl))
      
      return blobUrl
    } catch (error) {
      console.error('Failed to load image:', error)
      return null
    }
  }

  // Load images for visible gifts
  useEffect(() => {
    filteredGifts.forEach(gift => {
      if (gift.photoIds.length > 0) {
        fetchImageUrl(gift.id, gift.photoIds[0])
      }
    })
  }, [filteredGifts])

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      imageBlobUrls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const validExtensions = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp']
    const newImages: File[] = []
    const newPreviews: string[] = []

    Array.from(files).forEach((file) => {
      if (!validExtensions.includes(file.type)) {
        setErrors({ ...errors, images: 'Разрешены только JPEG, PNG, HEIC, HEIF, WebP' })
        return
      }

      if (giftImages.length + newImages.length >= 8) {
        setErrors({ ...errors, images: 'Максимум 8 изображений' })
        return
      }

      newImages.push(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        newPreviews.push(reader.result as string)
        if (newPreviews.length === newImages.length) {
          setGiftImages([...giftImages, ...newImages])
          setGiftImagePreviews([...giftImagePreviews, ...newPreviews])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setGiftImages(giftImages.filter((_, i) => i !== index))
    setGiftImagePreviews(giftImagePreviews.filter((_, i) => i !== index))
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!giftName.trim()) {
      newErrors.name = 'Название обязательно'
    }

    const price = parseInt(giftPrice)
    if (!giftPrice || isNaN(price) || price < 1 || price > 9999) {
      newErrors.price = 'Цена должна быть от 1 до 9999'
    }

    const stock = parseInt(giftStock)
    if (!giftStock || isNaN(stock) || stock < 1 || stock > 999) {
      newErrors.stock = 'Количество должно быть от 1 до 999'
    }

    if (giftImages.length === 0 && !selectedGift) {
      newErrors.images = 'Загрузите хотя бы одно изображение'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreateGift = async () => {
    if (!validateForm()) return

    try {
      await presentApi.createPresent(
        giftName,
        parseInt(giftPrice),
        parseInt(giftStock),
        giftImages
      )
      await loadGifts()
      setShowCreateModal(false)
      resetForm()
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors({ api: err.message })
      }
    }
  }

  const handleEditGift = async () => {
    if (!selectedGift) return
    if (!validateForm()) return

    try {
      await presentApi.updatePresent(selectedGift.id, {
        name: giftName,
        priceCoins: parseInt(giftPrice),
        stock: parseInt(giftStock)
      })
      
      // Add new photos if any
      if (giftImages.length > 0) {
        await presentApi.addPhotos(selectedGift.id, giftImages)
      }
      
      await loadGifts()
      setShowEditModal(false)
      resetForm()
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors({ api: err.message })
      }
    }
  }

  const handleDeleteGift = async () => {
    if (!selectedGift) return

    try {
      await presentApi.deletePresent(selectedGift.id)
      await loadGifts()
      setShowDeleteModal(false)
      setSelectedGift(null)
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors({ api: err.message })
      }
    }
  }

  const resetForm = () => {
    setGiftName('')
    setGiftPrice('')
    setGiftStock('')
    setGiftImages([])
    setGiftImagePreviews([])
    setErrors({})
  }

  const openCreateModal = () => {
    resetForm()
    setShowCreateModal(true)
  }

  const openEditModal = (gift: Gift) => {
    setSelectedGift(gift)
    setGiftName(gift.name)
    setGiftPrice(gift.price.toString())
    setGiftStock(gift.stock.toString())
    setGiftImages([])
    setGiftImagePreviews([])
    setErrors({})
    setShowEditModal(true)
  }

  const openDeleteModal = (gift: Gift) => {
    setSelectedGift(gift)
    setShowDeleteModal(true)
  }

  const getPhotoUrl = (giftId: number, photoId: number) => {
    return presentApi.getPhotoUrl(giftId, photoId)
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full bg-[#f4f9fd] items-center justify-center">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full bg-[#f4f9fd]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <nav className="flex-1 px-4 pt-8 space-y-2">
          <button
            onClick={() => router.push('/profile')}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Профиль</span>
          </button>

          <button
            onClick={() => router.push('/users')}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Пользователи</span>
          </button>

          <button
            onClick={() => router.push('/groups')}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
            </svg>
            <span>Группы</span>
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3 text-left bg-[#132440]/10 text-[#132440] font-medium rounded-xl border-l-4 border-[#132440]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
            <span>Подарки</span>
          </button>

          <button
            onClick={() => router.push('/orders')}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 2v2m6-2v2M4 6h16M5 10h14v10H5V10z" />
            </svg>
            <span>Заказы</span>
          </button>

          <button
            onClick={() => router.push('/history')}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span>История</span>
          </button>
        </nav>

        <div className="p-6 mt-auto border-t">
          <button
            onClick={() => {
              clearAuthCredentials()
              router.push('/auth')
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Header */}
        <div className="bg-white border-b px-10 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-800">Подарки</h1>
            <button
              onClick={openCreateModal}
              className="bg-[#132440] text-white px-6 py-3 rounded-xl hover:bg-[#0d1a2e] transition-colors flex items-center gap-2 shadow-sm"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span className="font-medium">Добавить подарок</span>
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-10 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
            {error}
          </div>
        )}

        {/* Content Area */}
        <div className="p-10">
          {/* Category Tabs */}
          <div className="mb-8 flex items-center gap-3 flex-wrap">
            {categories.length === 0 ? (
              <p className="text-gray-400">Нет категорий</p>
            ) : (
              categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${
                    selectedCategory === category
                      ? 'bg-[#132440] text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {category}
                </button>
              ))
            )}
          </div>

          {/* Gifts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {filteredGifts.map((gift) => (
              <div
                key={gift.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
              >
                <div className="relative h-56 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                  {gift.photoIds.length > 0 && imageBlobUrls.has(`${gift.id}-${gift.photoIds[0]}`) ? (
                    <img
                      src={imageBlobUrls.get(`${gift.id}-${gift.photoIds[0]}`)}
                      alt={gift.name}
                      className="max-w-full max-h-full object-contain"
                      onError={() => {
                        setImageLoadErrors(prev => new Set(prev).add(gift.id))
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center text-gray-300">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="M21 15l-5-5L5 21"/>
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={() => openEditModal(gift)}
                      className="p-2 bg-white rounded-lg hover:bg-gray-50 shadow-md transition-colors"
                      title="Редактировать"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => openDeleteModal(gift)}
                      className="p-2 bg-white rounded-lg hover:bg-red-50 shadow-md transition-colors"
                      title="Удалить"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 mb-3 text-lg">{gift.name}</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-[#5B4CF5] font-bold text-lg">Цена: {gift.price} алгокоинов</span>
                  </div>
                  <div className="mt-2 text-gray-500 text-sm">
                    Кол-во в наличии: {gift.stock}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredGifts.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              Нет подарков в этой категории
            </div>
          )}

          {/* Pagination Controls */}
          {!showAll && totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setShowAll(false)
                  setCurrentPage(0)
                }}
                disabled={currentPage === 0}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 0
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Первая
              </button>
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 0
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ← Назад
              </button>
              <div className="px-4 py-2 text-sm text-gray-700">
                Страница {currentPage + 1} из {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage >= totalPages - 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Вперед →
              </button>
            </div>
          )}
          
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setShowAll(!showAll)
                setCurrentPage(0)
              }}
              className="px-5 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              {showAll ? 'Постранично' : 'Показать все'}
            </button>
          </div>
        </div>
      </main>

      {/* Create Gift Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Добавить подарок</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {errors.api && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {errors.api}
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm mb-2">Название*</label>
                <input
                  type="text"
                  value={giftName}
                  onChange={(e) => {
                    setGiftName(e.target.value)
                    setShowCategorySuggestions(e.target.value.length > 0)
                  }}
                  onFocus={() => setShowCategorySuggestions(giftName.length > 0)}
                  onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 200)}
                  placeholder="Название подарка"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                />
                {showCategorySuggestions && categories.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    <div className="p-2 text-xs text-gray-500 font-medium border-b">Существующие категории:</div>
                    {categories
                      .filter(cat => cat.toLowerCase().includes(giftName.toLowerCase()))
                      .map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => {
                            setGiftName(category)
                            setShowCategorySuggestions(false)
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 text-gray-700 text-sm transition-colors flex items-center gap-2"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500">
                            <path d="M9 12l2 2 4-4"/>
                            <circle cx="12" cy="12" r="10"/>
                          </svg>
                          {category}
                        </button>
                      ))}
                    {categories.filter(cat => cat.toLowerCase().includes(giftName.toLowerCase())).length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-400 italic">Новая категория будет создана</div>
                    )}
                  </div>
                )}
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm mb-2">Цена (алгокоины)*</label>
                <input
                  type="number"
                  value={giftPrice}
                  onChange={(e) => setGiftPrice(e.target.value)}
                  placeholder="100"
                  min="1"
                  max="9999"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    errors.price ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                />
                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
              </div>

              <div>
                <label className="block text-sm mb-2">Количество*</label>
                <input
                  type="number"
                  value={giftStock}
                  onChange={(e) => setGiftStock(e.target.value)}
                  placeholder="10"
                  min="1"
                  max="999"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    errors.stock ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                />
                {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
              </div>

              <div>
                <label className="block text-sm mb-2">Изображения*</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/heic,image/heif,image/webp"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                    <span className="text-gray-500 mt-2">Нажмите для загрузки</span>
                    <span className="text-gray-400 text-xs">JPEG, PNG, HEIC, WebP (макс. 8)</span>
                  </label>
                </div>
                {errors.images && <p className="text-red-500 text-xs mt-1">{errors.images}</p>}
                
                {giftImagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {giftImagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleCreateGift}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg mt-4"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Gift Modal */}
      {showEditModal && selectedGift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Редактировать подарок</h2>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {errors.api && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {errors.api}
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm mb-2">Название*</label>
                <input
                  type="text"
                  value={giftName}
                  onChange={(e) => {
                    setGiftName(e.target.value)
                    setShowCategorySuggestions(e.target.value.length > 0)
                  }}
                  onFocus={() => setShowCategorySuggestions(giftName.length > 0)}
                  onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 200)}
                  placeholder="Название подарка"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                />
                {showCategorySuggestions && categories.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    <div className="p-2 text-xs text-gray-500 font-medium border-b">Существующие категории:</div>
                    {categories
                      .filter(cat => cat.toLowerCase().includes(giftName.toLowerCase()))
                      .map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => {
                            setGiftName(category)
                            setShowCategorySuggestions(false)
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 text-gray-700 text-sm transition-colors flex items-center gap-2"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500">
                            <path d="M9 12l2 2 4-4"/>
                            <circle cx="12" cy="12" r="10"/>
                          </svg>
                          {category}
                        </button>
                      ))}
                    {categories.filter(cat => cat.toLowerCase().includes(giftName.toLowerCase())).length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-400 italic">Новая категория будет создана</div>
                    )}
                  </div>
                )}
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm mb-2">Цена (алгокоины)*</label>
                <input
                  type="number"
                  value={giftPrice}
                  onChange={(e) => setGiftPrice(e.target.value)}
                  placeholder="100"
                  min="1"
                  max="9999"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    errors.price ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                />
                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
              </div>

              <div>
                <label className="block text-sm mb-2">Количество*</label>
                <input
                  type="number"
                  value={giftStock}
                  onChange={(e) => setGiftStock(e.target.value)}
                  placeholder="10"
                  min="1"
                  max="999"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    errors.stock ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                />
                {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
              </div>

              <div>
                <label className="block text-sm mb-2">Добавить изображения</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/heic,image/heif,image/webp"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload-edit"
                  />
                  <label
                    htmlFor="image-upload-edit"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                    <span className="text-gray-500 mt-2">Нажмите для загрузки</span>
                  </label>
                </div>
                
                {giftImagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {giftImagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleEditGift}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg mt-4"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Gift Modal */}
      {showDeleteModal && selectedGift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Удалить подарок</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {errors.api && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {errors.api}
              </div>
            )}

            <p className="text-gray-600 mb-6">
              Подарок &quot;{selectedGift.name}&quot; будет удален навсегда. Вы точно хотите его удалить?
            </p>

            <button
              onClick={handleDeleteGift}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg"
            >
              Удалить
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
