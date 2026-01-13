'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { userApi, ApiError, clearAuthCredentials } from '@/lib/api'
import { UserDTO } from '@/lib/types'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserDTO | null>(null)
  const [email, setEmail] = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const userData = await userApi.getCurrentUser()
      setUser(userData)
      setEmail(userData.email || '')
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('Failed to load user:', error.message)
        // If unauthorized, redirect to login
        if (error.status === 401) {
          clearAuthCredentials()
          router.push('/auth')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleEmailSave = async () => {
    setEmailError('')
    setSuccessMessage('')

    if (!validateEmail(email)) {
      setEmailError('Неверный формат email. Используйте формат: xxx@xxx.xx')
      return
    }

    if (!user?.id) return

    try {
      const updatedUser = await userApi.updateUser(user.id, {
        ...user,
        email,
      })
      setUser(updatedUser)
      setSuccessMessage('Email успешно сохранен')
    } catch (error) {
      if (error instanceof ApiError) {
        setEmailError(error.message)
      }
    }
  }

  const handlePasswordChange = async () => {
    setPasswordError('')
    setSuccessMessage('')

    if (!oldPassword || !newPassword || !repeatPassword) {
      setPasswordError('Заполните все поля')
      return
    }

    if (newPassword !== repeatPassword) {
      setPasswordError('Пароли не совпадают, попробуйте снова')
      return
    }

    if (!user?.id) return

    try {
      await userApi.updateUser(user.id, {
        ...user,
        password: newPassword,
      })
      setSuccessMessage('Пароль успешно изменен')
      setOldPassword('')
      setNewPassword('')
      setRepeatPassword('')
    } catch (error) {
      if (error instanceof ApiError) {
        setPasswordError(error.message)
      }
    }
  }

  const handleLogout = () => {
    clearAuthCredentials()
    router.push('/auth')
  }

  return (
    <div className="flex h-screen w-full bg-[#f4f9fd]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <nav className="flex-1 px-4 pt-8 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-left bg-[#132440]/10 text-[#132440] font-medium rounded-xl border-l-4 border-[#132440]">
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
            onClick={handleLogout}
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
          <h1 className="text-3xl font-bold text-gray-800">Профиль</h1>
        </div>

        {/* Content Area */}
        <div className="p-10">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">Загрузка...</div>
            </div>
          ) : !user ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-red-500">Не удалось загрузить данные пользователя</div>
            </div>
          ) : (
          <div className="max-w-2xl">
            {/* Basic Information Section */}
            <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-6 text-gray-800">Основная информация</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Логин</label>
                <input
                  type="text"
                  value={user.login}
                  disabled
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {emailError && (
              <div className="text-red-500 text-sm mb-4">{emailError}</div>
            )}

            <button
              onClick={handleEmailSave}
              className="bg-[#132440] hover:bg-[#0d1a2e] text-white font-medium py-2 px-6 rounded-xl transition-colors"
            >
              Сохранить
            </button>
          </div>

          {/* Password Section */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">Пароль</h2>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Старый пароль</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••••••"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-2">Новый пароль</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••••••"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-2">Повторите новый пароль</label>
                <input
                  type="password"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            {passwordError && (
              <div className="text-red-500 text-sm mb-4">{passwordError}</div>
            )}
            
            {successMessage && (
              <div className="text-green-600 text-sm mb-4">{successMessage}</div>
            )}

            <button
              onClick={handlePasswordChange}
              className="bg-[#132440] hover:bg-[#0d1a2e] text-white font-medium py-2 px-6 rounded-xl transition-colors"
            >
              Сохранить
            </button>
          </div>
        </div>
          )}
      </div>
      </main>
    </div>
  )
}
