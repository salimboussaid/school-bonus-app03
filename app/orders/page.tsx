'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { orderApi, presentApi, ApiError, clearAuthCredentials, API_BASE_URL } from '@/lib/api'
import { OrderDTO, OrderStatus } from '@/lib/types'

// Local Order type for UI with Russian status
interface Order {
  id: number
  giftName: string
  giftId: number
  customerName: string
  orderDate: string
  status: 'Заказан' | 'Подтвержден' | 'Выдан' | 'Отменен'
  apiStatus: OrderStatus
  photoId: number | null
}

// Map API status to Russian
function mapStatusToRussian(status: OrderStatus): 'Заказан' | 'Подтвержден' | 'Выдан' | 'Отменен' {
  switch (status) {
    case 'ORDERED': return 'Заказан'
    case 'CONFIRMED': return 'Подтвержден'
    case 'ISSUED': return 'Выдан'
    case 'CANCELLED': return 'Отменен'
    default: return 'Заказан'
  }
}

// Map Russian status to API
function mapStatusToApi(status: string): OrderStatus {
  switch (status) {
    case 'Заказан': return 'ORDERED'
    case 'Подтвержден': return 'CONFIRMED'
    case 'Выдан': return 'ISSUED'
    case 'Отменен': return 'CANCELLED'
    default: return 'ORDERED'
  }
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
  const [showOrderMenu, setShowOrderMenu] = useState<number | null>(null)
  const [presentsMap, setPresentsMap] = useState<Map<number, string>>(new Map())
  const [presentsPhotoMap, setPresentsPhotoMap] = useState<Map<number, number>>(new Map())
  const [imageBlobUrls, setImageBlobUrls] = useState<Map<string, string>>(new Map())
  const [imageLoadingStates, setImageLoadingStates] = useState<Set<string>>(new Set())
  const menuRef = useRef<HTMLDivElement>(null)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [showAll, setShowAll] = useState(false)
  const PAGE_SIZE = 10

  useEffect(() => {
    loadData()
  }, [currentPage, showAll])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowOrderMenu(null)
      }
    }

    if (showOrderMenu !== null) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showOrderMenu])

  // Fetch image with authentication
  const fetchImageUrl = async (giftId: number, photoId: number): Promise<string | null> => {
    const key = `${giftId}-${photoId}`
    
    // Return cached blob URL if exists
    if (imageBlobUrls.has(key)) {
      return imageBlobUrls.get(key)!
    }

    // Check if already loading
    if (imageLoadingStates.has(key)) {
      return null
    }

    // Mark as loading
    setImageLoadingStates(prev => new Set(prev).add(key))

    try {
      const credentials = localStorage.getItem('auth_credentials')
      if (!credentials) {
        setImageLoadingStates(prev => {
          const newSet = new Set(prev)
          newSet.delete(key)
          return newSet
        })
        return null
      }

      const { login, password } = JSON.parse(credentials)
      const authHeader = 'Basic ' + btoa(`${login}:${password}`)

      const response = await fetch(`${API_BASE_URL}/presents/${giftId}/photos/${photoId}`, {
        headers: {
          'Authorization': authHeader,
        },
      })

      if (!response.ok) {
        setImageLoadingStates(prev => {
          const newSet = new Set(prev)
          newSet.delete(key)
          return newSet
        })
        return null
      }

      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      
      // Cache the blob URL
      setImageBlobUrls(prev => new Map(prev).set(key, blobUrl))
      
      // Remove from loading states
      setImageLoadingStates(prev => {
        const newSet = new Set(prev)
        newSet.delete(key)
        return newSet
      })
      
      return blobUrl
    } catch (error) {
      console.error('Failed to load image:', error)
      setImageLoadingStates(prev => {
        const newSet = new Set(prev)
        newSet.delete(key)
        return newSet
      })
      return null
    }
  }

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      imageBlobUrls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load presents first to get names
      const presents = await presentApi.getAllPresents()
      console.log('Loaded presents:', presents);
      const presentNames = new Map<number, string>()
      const presentPhotos = new Map<number, number>()
      presents.forEach(p => {
        presentNames.set(p.id, p.name)
        if (p.photoIds && p.photoIds.length > 0) {
          presentPhotos.set(p.id, p.photoIds[0])
        }
      })
      setPresentsMap(presentNames)
      setPresentsPhotoMap(presentPhotos)
      
      // Load orders with pagination
      let ordersData: OrderDTO[]
      if (showAll) {
        ordersData = await orderApi.getAllOrders()
        console.log('Loaded all orders:', ordersData);
        setTotalPages(1)
        setTotalElements(ordersData.length)
      } else {
        const response = await orderApi.getOrders(currentPage, PAGE_SIZE)
        console.log('Loaded paginated orders:', response);
        ordersData = response.content
        setTotalPages(response.totalPages)
        setTotalElements(response.totalElements)
      }
      
      const convertedOrders: Order[] = ordersData.map(o => ({
        id: o.id,
        giftName: presentNames.get(o.present_id) || `Подарок #${o.present_id}`,
        giftId: o.present_id,
        customerName: o.customer.full_name || `${o.customer.last_name} ${o.customer.first_name}`,
        orderDate: new Date(o.date).toLocaleDateString('ru-RU'),
        status: mapStatusToRussian(o.status),
        apiStatus: o.status,
        photoId: presentPhotos.get(o.present_id) || null
      }))
      setOrders(convertedOrders)
      
      // Load images for orders with photos
      convertedOrders.forEach(order => {
        if (order.photoId) {
          fetchImageUrl(order.giftId, order.photoId)
        }
      })
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

  // Filter orders by status
  const activeOrders = orders.filter(
    (o) => o.status === 'Заказан' || o.status === 'Подтвержден'
  )
  const completedOrders = orders.filter(
    (o) => o.status === 'Выдан' || o.status === 'Отменен'
  )

  // Sort orders by date (newest first)
  const sortOrdersByDate = (ordersList: Order[]) => {
    return [...ordersList].sort((a, b) => {
      const dateA = a.orderDate.split('.').reverse().join('')
      const dateB = b.orderDate.split('.').reverse().join('')
      return dateB.localeCompare(dateA)
    })
  }

  // Get filtered orders based on active tab
  const displayedOrders = sortOrdersByDate(
    activeTab === 'active' ? activeOrders : completedOrders
  ).filter(
    (o) =>
      o.giftName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleConfirmOrder = async (orderId: number) => {
    try {
      await orderApi.updateOrderStatus(orderId, 'CONFIRMED')
      await loadData()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      }
    }
    setShowOrderMenu(null)
  }

  const handleIssueOrder = async (orderId: number) => {
    try {
      await orderApi.updateOrderStatus(orderId, 'ISSUED')
      await loadData()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      }
    }
    setShowOrderMenu(null)
  }

  const handleCancelOrder = async (orderId: number) => {
    try {
      await orderApi.cancelOrder(orderId)
      await loadData()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      }
    }
    setShowOrderMenu(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Заказан':
        return 'bg-blue-100 text-blue-700'
      case 'Подтвержден':
        return 'bg-green-100 text-green-700'
      case 'Выдан':
        return 'bg-gray-100 text-gray-700'
      case 'Отменен':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
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

          <button
            onClick={() => router.push('/gifts')}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
            <span>Подарки</span>
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3 text-left bg-[#132440]/10 text-[#132440] font-medium rounded-xl border-l-4 border-[#132440]">
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
          <h1 className="text-3xl font-bold text-gray-800">Заказы</h1>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-10 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
            {error}
          </div>
        )}

        {/* Content Area */}
        <div className="p-10">
          {/* Search and Tabs */}
          <div className="flex items-center justify-between mb-8">
            <div className="relative flex-1 max-w-md">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#132440]/50 focus:border-[#132440]"
              />
            </div>

            <div className="flex gap-2 ml-6">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                  activeTab === 'active'
                    ? 'bg-[#132440] text-white shadow-sm'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                Актуальные
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                  activeTab === 'completed'
                    ? 'bg-[#132440] text-white shadow-sm'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                Завершенные
              </button>
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-4 mb-8">
            {displayedOrders.length === 0 ? (
              <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-200">
                Нет заказов
              </div>
            ) : (
              displayedOrders.map((order) => (
                <div
                  key={order.id}
                  className={`group relative bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200 ${
                    showOrderMenu === order.id ? 'z-50' : 'z-0'
                  }`}
                >
                  <div className="flex items-center gap-6">
                    {/* Gift Image */}
                    <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {order.photoId && imageBlobUrls.has(`${order.giftId}-${order.photoId}`) ? (
                        <img
                          src={imageBlobUrls.get(`${order.giftId}-${order.photoId}`)}
                          alt={order.giftName}
                          className="w-full h-full object-contain"
                        />
                      ) : imageLoadingStates.has(`${order.giftId}-${order.photoId}`) ? (
                        <div className="w-8 h-8 border-3 border-gray-300 border-t-[#5B4CF5] rounded-full animate-spin"></div>
                      ) : (
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-300">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <path d="M21 15l-5-5L5 21"/>
                        </svg>
                      )}
                    </div>

                    {/* Order Info */}
                    <div className="flex-1 grid grid-cols-3 gap-6">
                      <div className="flex flex-col">
                        <div className="text-xs text-gray-500 mb-1">Название подарка</div>
                        <div className="h-px bg-gradient-to-r from-gray-200 to-transparent mb-2"></div>
                        <div className="font-semibold text-gray-900">{order.giftName}</div>
                      </div>
                      
                      <div className="flex flex-col">
                        <div className="text-xs text-gray-500 mb-1">ФИО заказчика</div>
                        <div className="h-px bg-gradient-to-r from-gray-200 to-transparent mb-2"></div>
                        <div className="text-gray-700">{order.customerName}</div>
                      </div>
                      
                      <div className="flex flex-col">
                        <div className="text-xs text-gray-500 mb-1">Дата заказа</div>
                        <div className="h-px bg-gradient-to-r from-gray-200 to-transparent mb-2"></div>
                        <div className="text-gray-700">{order.orderDate}</div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex flex-col items-center">
                      <div className="text-xs text-gray-500 mb-3">Статус</div>
                      <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>

                    {/* Actions Menu */}
                    {(order.status === 'Заказан' || order.status === 'Подтвержден') && (
                      <div className="relative" ref={showOrderMenu === order.id ? menuRef : null}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowOrderMenu(showOrderMenu === order.id ? null : order.id)
                          }}
                          className="p-2.5 rounded-full bg-gray-100/80 hover:bg-[#132440]/10 text-gray-600 hover:text-[#132440] transition-all duration-200"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="1" fill="currentColor" />
                            <circle cx="12" cy="5" r="1" fill="currentColor" />
                            <circle cx="12" cy="19" r="1" fill="currentColor" />
                          </svg>
                        </button>

                        {showOrderMenu === order.id && (
                          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-[60] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {order.status === 'Заказан' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleConfirmOrder(order.id)
                                }}
                                className="w-full text-left px-5 py-3.5 hover:bg-green-50 text-gray-700 hover:text-green-600 text-[15px] transition-colors flex items-center gap-3.5"
                              >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
                                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                  <path d="M22 4 12 14.01l-3-3"/>
                                </svg>
                                <span>Подтвердить</span>
                              </button>
                            )}
                            {order.status === 'Подтвержден' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleIssueOrder(order.id)
                                }}
                                className="w-full text-left px-5 py-3.5 hover:bg-blue-50 text-gray-700 hover:text-blue-600 text-[15px] transition-colors flex items-center gap-3.5"
                              >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                </svg>
                                <span>Выдать</span>
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCancelOrder(order.id)
                              }}
                              className="w-full text-left px-5 py-3.5 hover:bg-red-50 text-gray-700 hover:text-red-600 text-[15px] transition-colors flex items-center gap-3.5"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="m15 9-6 6M9 9l6 6"/>
                              </svg>
                              <span>Отменить</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

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
    </div>
  )
}
