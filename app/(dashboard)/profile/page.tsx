'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { userApi, ApiError, clearAuthCredentials } from '@/lib/api'
import { UserDTO } from '@/lib/types'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useLanguage } from '@/lib/language-context'

export default function ProfilePage() {
  const router = useRouter()
  const { t } = useLanguage()
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
      setEmailError(t.profileEmailInvalid || 'Invalid email format. Use format: xxx@xxx.xx')
      return
    }

    if (!user?.id) return

    try {
      const updatedUser = await userApi.updateUser(user.id, {
        ...user,
        email,
      })
      setUser(updatedUser)
      setSuccessMessage(t.profileEmailSuccess || 'Email successfully saved')
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
      setPasswordError(t.profilePasswordAllFields || 'Fill in all fields')
      return
    }

    if (newPassword !== repeatPassword) {
      setPasswordError(t.profilePasswordMismatch || 'Passwords do not match, try again')
      return
    }

    if (!user?.id) return

    try {
      await userApi.updateUser(user.id, {
        ...user,
        password: newPassword,
      })
      setSuccessMessage(t.profilePasswordSuccess || 'Password successfully changed')
      setOldPassword('')
      setNewPassword('')
      setRepeatPassword('')
    } catch (error) {
      if (error instanceof ApiError) {
        setPasswordError(error.message)
      }
    }
  }

  return (
    <div className="flex-1 min-h-screen bg-[#FFFFFF] dark:bg-[#000000]">
      {/* Top Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 px-6 md:px-10 py-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-3xl font-bold text-[#000000] dark:text-[#FFFFFF]">{t.profileTitle}</h1>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 md:px-10">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#000000] dark:border-[#FFFFFF]"></div>
          </div>
        ) : !user ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-red-500 dark:text-red-400">{t.profileErrorLoad}</div>
          </div>
        ) : (
          <div className="max-w-2xl">
            {/* Basic Information Section */}
            <div className="bg-gray-50 dark:bg-gray-950 rounded-2xl p-6 md:p-8 mb-6 border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-semibold mb-6 text-[#000000] dark:text-[#FFFFFF]">{t.profileBasicInfo}</h2>
            
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">{t.profileLogin}</label>
                  <input
                    type="text"
                    value={user.login}
                    disabled
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
              
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">{t.profileEmail}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-[#FFFFFF] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#000000] dark:focus:ring-[#FFFFFF] border border-gray-300 dark:border-gray-700"
                  />
                </div>
              </div>

              {emailError && (
                <div className="text-red-500 dark:text-red-400 text-sm mb-4">{emailError}</div>
              )}

              <button
                onClick={handleEmailSave}
                className="bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] hover:bg-[#1a1a1a] dark:hover:bg-[#e5e5e5] font-medium py-3 px-8 rounded-full transition-colors border border-[#000000] dark:border-[#FFFFFF]"
              >
                {t.profileSave}
              </button>
            </div>

            {/* Password Section */}
            <div className="bg-gray-50 dark:bg-gray-950 rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-semibold mb-6 text-[#000000] dark:text-[#FFFFFF]">{t.profilePassword}</h2>
            
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">{t.profileOldPassword}</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-[#FFFFFF] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#000000] dark:focus:ring-[#FFFFFF] border border-gray-300 dark:border-gray-700"
                    placeholder="••••••••••••"
                  />
                </div>
              
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">{t.profileNewPassword}</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-[#FFFFFF] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#000000] dark:focus:ring-[#FFFFFF] border border-gray-300 dark:border-gray-700"
                    placeholder="••••••••••••"
                  />
                </div>
              
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">{t.profileRepeatPassword}</label>
                  <input
                    type="password"
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-[#FFFFFF] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#000000] dark:focus:ring-[#FFFFFF] border border-gray-300 dark:border-gray-700"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              {passwordError && (
                <div className="text-red-500 dark:text-red-400 text-sm mb-4">{passwordError}</div>
              )}
            
              {successMessage && (
                <div className="text-green-600 dark:text-green-400 text-sm mb-4">{successMessage}</div>
              )}

              <button
                onClick={handlePasswordChange}
                className="bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] hover:bg-[#1a1a1a] dark:hover:bg-[#e5e5e5] font-medium py-3 px-8 rounded-full transition-colors border border-[#000000] dark:border-[#FFFFFF]"
              >
                {t.profileSave}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
