'use client'

import { useState, useEffect, useRef } from 'react'
import { userApi, ApiError } from '@/lib/api'
import { CreateUserRequest, UserDTO, UserRole as ApiUserRole } from '@/lib/types'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useLanguage } from '@/lib/language-context'

export default function UsersPage() {
  const { t } = useLanguage()
  const [users, setUsers] = useState<UserDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'STUDENT' | 'TEACHER'>('STUDENT')
  const [selectedUser, setSelectedUser] = useState<UserDTO | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState<number | null>(null)

  // Form states for Create User
  const [newUser, setNewUser] = useState<CreateUserRequest>({
    login: '',
    password: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    role: 'STUDENT',
    email: '',
    date_of_birth: '',
  })

  // Form states for Edit User
  const [editUserData, setEditUserData] = useState<UserDTO>({
    login: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    role: 'STUDENT',
    email: '',
    date_of_birth: '',
  })

  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const menuRef = useRef<HTMLDivElement>(null)

  const parseNumericValue = (value: unknown): number => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }

    if (typeof value === 'string') {
      const parsed = parseInt(value, 10)
      return Number.isFinite(parsed) ? parsed : 0
    }

    return 0
  }

  const getStudentExp = (student: Record<string, unknown>): number => {
    return parseNumericValue(student.exp ?? student.experience ?? student.expCount ?? student.coins)
  }

  useEffect(() => {
    loadUsers()
  }, [activeTab])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(null)
      }
    }

    if (showUserMenu !== null) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  const loadUsers = async () => {
    try {
      setLoading(true)
      if (activeTab === 'STUDENT') {
        const res = await userApi.getStudents(0, 100, 'secondName', 'asc')
        const mapped: UserDTO[] = res.content.map(s => ({
          id: s.id,
          login: s.login,
          role: 'STUDENT',
          first_name: '',
          last_name: '',
          middle_name: '',
          full_name: s.fullName,
          email: '',
          date_of_birth: s.birthDate || '',
          coins: parseNumericValue(s.coins),
          exp: getStudentExp(s as unknown as Record<string, unknown>),
        }))
        setUsers(mapped)
      } else {
        const res = await userApi.getTeachers(0, 100, 'secondName', 'asc')
        const mapped: UserDTO[] = res.content.map(t => ({
          id: t.id,
          login: t.login,
          role: 'TEACHER',
          first_name: '',
          last_name: '',
          middle_name: '',
          full_name: t.fullName,
          email: '',
          date_of_birth: '',
          coins: 0,
          exp: 0,
        }))
        setUsers(mapped)
      }
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('Failed to load users:', error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  // Validations
  const validateLogin = (login: string, userId?: number): string | null => {
    if (!login) return t.usersLoginRequired
    if (!/^[a-zA-Z0-9]+$/.test(login)) {
      return t.usersLoginInvalid
    }
    const loginExists = users.some(u => u.login === login && u.id !== userId)
    if (loginExists) return t.usersLoginExists
    return null
  }

  const validateName = (name: string, fieldName: string): string | null => {
    if (!name) return `${fieldName} ${t.usersRequired}`
    if (!/^[а-яА-ЯёЁa-zA-Z\s]+$/.test(name)) {
      return `${fieldName} ${t.usersLettersOnly}`
    }
    return null
  }

  const validateEmail = (email: string, userId?: number): string | null => {
    if (!email) return t.usersEmailRequired
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return t.usersEmailInvalid
    }
    const emailExists = users.some(u => u.email === email && u.id !== userId)
    if (emailExists) return t.usersEmailExists
    return null
  }

  const validateBirthDate = (date: string): string | null => {
    if (!date) return t.usersBirthDateRequired
    // Accept format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return t.usersBirthDateFormat
    }
    return null
  }

  const handleCreateUser = async () => {
    if (creatingUser) return
    const newErrors: { [key: string]: string } = {}

    const loginError = validateLogin(newUser.login)
    if (loginError) newErrors.login = loginError

    if (!newUser.password.trim()) {
      newErrors.password = t.usersPasswordRequired
    } else if (newUser.password.length < 8) {
      newErrors.password = t.usersPasswordTooShort
    } else if (!/[()*!@#]/.test(newUser.password)) {
      newErrors.password = t.usersPasswordSpecialChar
    }

    const firstNameError = validateName(newUser.first_name, 'Имя')
    if (firstNameError) newErrors.first_name = firstNameError

    const lastNameError = validateName(newUser.last_name, 'Фамилия')
    if (lastNameError) newErrors.last_name = lastNameError

    if (newUser.middle_name) {
      const middleNameError = validateName(newUser.middle_name, 'Отчество')
      if (middleNameError) newErrors.middle_name = middleNameError
    }

    const emailError = validateEmail(newUser.email)
    if (emailError) newErrors.email = emailError

    const birthDateError = validateBirthDate(newUser.date_of_birth)
    if (birthDateError) newErrors.date_of_birth = birthDateError

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setCreatingUser(true)
    setErrors({})
    try {
      await userApi.createUser(newUser)
      await loadUsers() // Reload users to get properly formatted data
      setShowCreateModal(false)
      setNewUser({
        login: '',
        password: '',
        first_name: '',
        last_name: '',
        middle_name: '',
        role: 'STUDENT',
        email: '',
        date_of_birth: '',
      })
      setErrors({})
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({ api: error.message })
      }
    } finally {
      setCreatingUser(false)
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser?.id) return

    const newErrors: { [key: string]: string } = {}

    const loginError = validateLogin(editUserData.login, selectedUser.id)
    if (loginError) newErrors.login = loginError

    const firstNameError = validateName(editUserData.first_name, 'Имя')
    if (firstNameError) newErrors.first_name = firstNameError

    const lastNameError = validateName(editUserData.last_name, 'Фамилия')
    if (lastNameError) newErrors.last_name = lastNameError

    if (editUserData.middle_name) {
      const middleNameError = validateName(editUserData.middle_name, 'Отчество')
      if (middleNameError) newErrors.middle_name = middleNameError
    }

    const emailError = validateEmail(editUserData.email, selectedUser.id)
    if (emailError) newErrors.email = emailError

    const birthDateError = validateBirthDate(editUserData.date_of_birth)
    if (birthDateError) newErrors.date_of_birth = birthDateError

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      await userApi.updateUser(selectedUser.id, editUserData)
      await loadUsers() // Reload users to get properly formatted data
      setShowEditModal(false)
      setSelectedUser(null)
      setErrors({})
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({ api: error.message })
      }
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser?.id) return
    
    try {
      await userApi.deleteUser(selectedUser.id)
      setUsers(users.filter(u => u.id !== selectedUser.id))
      setShowDeleteModal(false)
      setSelectedUser(null)
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('Delete failed:', error.message)
      }
    }
  }

  const openEditModal = async (user: UserDTO) => {
    try {
      const full = await userApi.getUserById(user.id!)
      setSelectedUser(full)
      setEditUserData({
        login: full.login,
        first_name: full.first_name,
        last_name: full.last_name,
        middle_name: full.middle_name || '',
        role: full.role,
        email: full.email,
        date_of_birth: full.date_of_birth,
      })
      setErrors({})
      setShowEditModal(true)
      setShowUserMenu(null)
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({ api: error.message })
      }
    }
  }

  const openDeleteModal = (user: UserDTO) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
    setShowUserMenu(null)
  }

  // Filter users
  const filteredUsers = users
    .filter(u => u.role === activeTab)
    .filter(u =>
      (u.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      u.login.toLowerCase().includes(searchQuery.toLowerCase())
    )

  return (
    <div className="flex-1 min-h-screen bg-[#FFFFFF] dark:bg-[#000000]">
      {/* Top Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 px-6 md:px-10 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-3xl font-bold text-[#000000] dark:text-[#FFFFFF]">{t.usersTitle}</h1>
          </div>
          <button
            onClick={() => {
              setNewUser({
                login: '',
                password: '',
                first_name: '',
                last_name: '',
                middle_name: '',
                role: 'STUDENT',
                email: '',
                date_of_birth: '',
              })
              setErrors({})
              setShowCreateModal(true)
            }}
            className="bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] hover:bg-[#1a1a1a] dark:hover:bg-[#e5e5e5] px-6 py-3 rounded-full transition-colors flex items-center gap-2 border border-[#000000] dark:border-[#FFFFFF]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="font-medium">{t.usersCreateUser}</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 md:p-10">
        {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">{t.usersLoading || 'Loading...'}</div>
            </div>
          ) : (
            <div className="max-w-7xl">
              {/* Search and Tabs */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="relative w-80">
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
                    placeholder={t.usersSearch}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FFFFFF] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-[#000000] dark:focus:ring-[#FFFFFF]"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('STUDENT')}
                    className={`px-6 py-2.5 rounded-full font-medium transition-all ${
                      activeTab === 'STUDENT'
                        ? 'bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] border border-[#000000] dark:border-[#FFFFFF]'
                        : 'bg-transparent text-[#000000] dark:text-[#FFFFFF] border border-[#000000] dark:border-[#FFFFFF] hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a]'
                    }`}
                  >
                    {t.usersStudents}
                  </button>
                  <button
                    onClick={() => setActiveTab('TEACHER')}
                    className={`px-6 py-2.5 rounded-full font-medium transition-all ${
                      activeTab === 'TEACHER'
                        ? 'bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] border border-[#000000] dark:border-[#FFFFFF]'
                        : 'bg-transparent text-[#000000] dark:text-[#FFFFFF] border border-[#000000] dark:border-[#FFFFFF] hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a]'
                    }`}
                  >
                    {t.usersTeachers}
                  </button>
                </div>
              </div>

              {/* Users List */}
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`group relative bg-gradient-to-br from-white to-gray-50/50 rounded-2xl p-6 border border-gray-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ease-out ${
                      showUserMenu === user.id ? 'z-50' : 'z-0'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-6">
                      {/* Grid Layout for User Data */}
                      <div className="flex-1 grid grid-cols-4 gap-6">
                        <div className="flex flex-col">
                          <div className="text-xs font-medium text-gray-500 mb-1.5">{t.usersFullName || 'Full Name'}</div>
                          <div className="h-px bg-gradient-to-r from-gray-200 to-transparent mb-2"></div>
                          <div className="text-sm font-bold text-gray-800">{user.full_name || `${user.last_name} ${user.first_name} ${user.middle_name || ''}`}</div>
                        </div>
                        
                        <div className="flex flex-col">
                          <div className="text-xs font-medium text-gray-500 mb-1.5">{t.usersLogin}</div>
                          <div className="h-px bg-gradient-to-r from-gray-200 to-transparent mb-2"></div>
                          <div className="text-sm font-semibold text-gray-700">{user.login}</div>
                        </div>
                        
                        <div className="flex flex-col">
                          <div className="text-xs font-medium text-gray-500 mb-1.5">{t.usersBirthDate}</div>
                          <div className="h-px bg-gradient-to-r from-gray-200 to-transparent mb-2"></div>
                          <div className="text-sm font-semibold text-gray-700">{user.date_of_birth || '-'}</div>
                        </div>
                        
                        <div className="flex flex-col">
                          <div className="text-xs font-medium text-gray-500 mb-1.5">{t.usersExp || 'EXP'}</div>
                          <div className="h-px bg-gradient-to-r from-gray-200 to-transparent mb-2"></div>
                          <div className="text-sm font-bold text-[#132440]">{user.exp || 0}</div>
                        </div>
                      </div>

                      {/* Actions Menu */}
                      <div className="relative" ref={showUserMenu === user.id ? menuRef : null}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowUserMenu(showUserMenu === user.id ? null : user.id!)
                          }}
                          className="p-2.5 rounded-full bg-gray-100/80 hover:bg-[#132440]/10 text-gray-600 hover:text-[#132440] transition-all duration-200 group-hover:shadow-sm"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="1" fill="currentColor" />
                            <circle cx="12" cy="5" r="1" fill="currentColor" />
                            <circle cx="12" cy="19" r="1" fill="currentColor" />
                          </svg>
                        </button>

                        {showUserMenu === user.id && (
                          <div 
                            className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-[60] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                // View details functionality can be added here
                                setShowUserMenu(null)
                              }}
                              className="w-full text-left px-5 py-3.5 hover:bg-gray-50 text-gray-700 text-[15px] transition-colors flex items-center gap-3.5"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 16v-4M12 8h.01" />
                              </svg>
                              <span>{t.usersDetails || 'Details'}</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                openEditModal(user)
                              }}
                              className="w-full text-left px-5 py-3.5 hover:bg-gray-50 text-gray-700 text-[15px] transition-colors flex items-center gap-3.5"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              <span>{t.usersEdit}</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                openDeleteModal(user)
                              }}
                              className="w-full text-left px-5 py-3.5 hover:bg-red-50 text-gray-700 hover:text-red-600 text-[15px] transition-colors flex items-center gap-3.5"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500 group-hover:text-red-600">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                              <span>{t.usersDelete}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-[#000000]/50 dark:bg-[#000000]/70 flex items-center justify-center z-50" onClick={() => {
          setShowCreateModal(false)
          setNewUser(current => ({ ...current, password: '' }))
          setErrors({})
        }}>
          <div role="dialog" aria-modal="true" aria-labelledby="create-user-title" className="bg-[#FFFFFF] dark:bg-[#000000] rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90dvh] overflow-y-auto border border-gray-200 dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 id="create-user-title" className="text-xl font-semibold text-[#000000] dark:text-[#FFFFFF]">{t.usersCreateUser}</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewUser(current => ({ ...current, password: '' }))
                  setErrors({})
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form className="space-y-4" noValidate onSubmit={(event) => {
              event.preventDefault()
              void handleCreateUser()
            }}>
              {errors.api && <div className="text-red-500 text-sm">{errors.api}</div>}
              
              <div>
                <div>
                  <label htmlFor="create-user-login" className="block text-sm mb-2 text-[#000000] dark:text-[#FFFFFF]">{t.usersLogin}*</label>
                  <input
                    id="create-user-login"
                    type="text"
                    autoComplete="username"
                    value={newUser.login}
                    onChange={(e) => setNewUser({ ...newUser, login: e.target.value })}
                    placeholder={t.usersLogin}
                    className={`w-full px-4 py-2 rounded-lg bg-[#FFFFFF] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] border ${
                      errors.login ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                    } focus:outline-none focus:ring-2 focus:ring-[#000000] dark:focus:ring-[#FFFFFF]`}
                  />
                  {errors.login && <p className="text-red-500 text-xs mt-1">{errors.login}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="create-user-password" className="block text-sm mb-2 text-[#000000] dark:text-[#FFFFFF]">{t.usersPassword}*</label>
                <input
                  id="create-user-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'create-user-password-hint create-user-password-error' : 'create-user-password-hint'}
                  className={`w-full px-4 py-2 rounded-lg bg-[#FFFFFF] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] border ${
                    errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                  } focus:outline-none focus:ring-2 focus:ring-[#000000] dark:focus:ring-[#FFFFFF]`}
                />
                <p id="create-user-password-hint" className="text-gray-500 dark:text-gray-400 text-xs mt-1">{t.usersPasswordHint}</p>
                {errors.password && <p id="create-user-password-error" role="alert" className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2 text-[#000000] dark:text-[#FFFFFF]">{t.usersLastName}*</label>
                  <input
                    type="text"
                    value={newUser.last_name}
                    onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                    placeholder={t.usersLastName.replace('*', '')}
                    className={`w-full px-4 py-2 rounded-lg bg-[#FFFFFF] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] border ${
                      errors.last_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                    } focus:outline-none focus:ring-2 focus:ring-[#000000] dark:focus:ring-[#FFFFFF]`}
                  />
                  {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
                </div>

                <div>
                  <label className="block text-sm mb-2 text-[#000000] dark:text-[#FFFFFF]">{t.usersRole}*</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as ApiUserRole })}
                    className="w-full px-4 py-2 rounded-lg bg-[#FFFFFF] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#000000] dark:focus:ring-[#FFFFFF]"
                  >
                    <option value="STUDENT">{t.usersStudents.replace(/s$/, '')}</option>
                    <option value="TEACHER">{t.usersTeachers.replace(/s$/, '')}</option>
                    <option value="ADMIN">{t.usersAdmin || 'Admin'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2 text-[#000000] dark:text-[#FFFFFF]">{t.usersFirstName}*</label>
                  <input
                    type="text"
                    value={newUser.first_name}
                    onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                    placeholder={t.usersFirstName.replace('*', '')}
                    className={`w-full px-4 py-2 rounded-lg bg-[#FFFFFF] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] border ${
                      errors.first_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                    } focus:outline-none focus:ring-2 focus:ring-[#000000] dark:focus:ring-[#FFFFFF]`}
                  />
                  {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
                </div>

                <div>
                  <label className="block text-sm mb-2 text-[#000000] dark:text-[#FFFFFF]">{t.usersMiddleName || 'Middle Name'}</label>
                  <input
                    type="text"
                    value={newUser.middle_name}
                    onChange={(e) => setNewUser({ ...newUser, middle_name: e.target.value })}
                    placeholder={t.usersMiddleName || 'Middle Name'}
                    className={`w-full px-4 py-2 rounded-lg bg-[#FFFFFF] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] border ${
                      errors.middle_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                    } focus:outline-none focus:ring-2 focus:ring-[#000000] dark:focus:ring-[#FFFFFF]`}
                  />
                  {errors.middle_name && <p className="text-red-500 text-xs mt-1">{errors.middle_name}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2 text-[#000000] dark:text-[#FFFFFF]">{t.usersEmail}*</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder={t.usersEmail}
                    className={`w-full px-4 py-2 rounded-lg bg-[#FFFFFF] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] border ${
                      errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                    } focus:outline-none focus:ring-2 focus:ring-[#000000] dark:focus:ring-[#FFFFFF]`}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm mb-2 text-[#000000] dark:text-[#FFFFFF]">{t.usersBirthDate}*</label>
                  <input
                    type="date"
                    value={newUser.date_of_birth}
                    onChange={(e) => setNewUser({ ...newUser, date_of_birth: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg bg-[#FFFFFF] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] border ${
                      errors.date_of_birth ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                    } focus:outline-none focus:ring-2 focus:ring-[#000000] dark:focus:ring-[#FFFFFF]`}
                  />
                  {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={creatingUser}
                aria-busy={creatingUser}
                className="w-full bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] hover:bg-[#1a1a1a] dark:hover:bg-[#e5e5e5] font-medium py-3 rounded-full mt-4 border border-[#000000] dark:border-[#FFFFFF] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingUser ? t.usersLoading : t.usersCreate}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-[#000000]/50 dark:bg-[#000000]/70 flex items-center justify-center z-50" onClick={() => {
          setShowEditModal(false)
          setSelectedUser(null)
          setErrors({})
        }}>
          <div className="bg-[#FFFFFF] dark:bg-[#000000] rounded-2xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-[#000000] dark:text-[#FFFFFF]">{t.usersEdit}</h2>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedUser(null)
                  setErrors({})
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {errors.api && <div className="text-red-500 text-sm">{errors.api}</div>}
              
              <div>
                <label className="block text-sm mb-2 text-[#000000] dark:text-[#FFFFFF]">Логин*</label>
                <input
                  type="text"
                  value={editUserData.login}
                  onChange={(e) => setEditUserData({ ...editUserData, login: e.target.value })}
                  placeholder="Логин"
                  className={`w-full px-4 py-2 rounded-lg bg-[#FFFFFF] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] border ${
                    errors.login ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                  } focus:outline-none focus:ring-2 focus:ring-[#000000] dark:focus:ring-[#FFFFFF]`}
                />
                {errors.login && <p className="text-red-500 text-xs mt-1">{errors.login}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2 text-[#000000] dark:text-[#FFFFFF]">Фамилия*</label>
                  <input
                    type="text"
                    value={editUserData.last_name}
                    onChange={(e) => setEditUserData({ ...editUserData, last_name: e.target.value })}
                    placeholder="Фамилия"
                    className={`w-full px-4 py-2 rounded-lg bg-[#FFFFFF] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] border ${
                      errors.last_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                    } focus:outline-none focus:ring-2 focus:ring-[#000000] dark:focus:ring-[#FFFFFF]`}
                  />
                  {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
                </div>

                <div>
                  <label className="block text-sm mb-2 text-[#000000] dark:text-[#FFFFFF]">Роль*</label>
                  <select
                    value={editUserData.role}
                    onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value as ApiUserRole })}
                    className="w-full px-4 py-2 rounded-lg bg-[#FFFFFF] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#000000] dark:focus:ring-[#FFFFFF]"
                  >
                    <option value="STUDENT">Ученик</option>
                    <option value="TEACHER">Преподаватель</option>
                    <option value="ADMIN">Админ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2 text-[#000000] dark:text-[#FFFFFF]">Имя*</label>
                  <input
                    type="text"
                    value={editUserData.first_name}
                    onChange={(e) => setEditUserData({ ...editUserData, first_name: e.target.value })}
                    placeholder="Имя"
                    className={`w-full px-4 py-2 rounded-lg bg-[#FFFFFF] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] border ${
                      errors.first_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                    } focus:outline-none focus:ring-2 focus:ring-[#000000] dark:focus:ring-[#FFFFFF]`}
                  />
                  {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
                </div>

                <div>
                  <label className="block text-sm mb-2 text-[#000000] dark:text-[#FFFFFF]">Отчество</label>
                  <input
                    type="text"
                    value={editUserData.middle_name}
                    onChange={(e) => setEditUserData({ ...editUserData, middle_name: e.target.value })}
                    placeholder="Отчество"
                    className={`w-full px-4 py-2 rounded-lg bg-[#FFFFFF] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] border ${
                      errors.middle_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                    } focus:outline-none focus:ring-2 focus:ring-[#000000] dark:focus:ring-[#FFFFFF]`}
                  />
                  {errors.middle_name && <p className="text-red-500 text-xs mt-1">{errors.middle_name}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2 text-[#000000] dark:text-[#FFFFFF]">Email*</label>
                  <input
                    type="email"
                    value={editUserData.email}
                    onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                    placeholder="Email"
                    className={`w-full px-4 py-2 rounded-lg bg-[#FFFFFF] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] border ${
                      errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                    } focus:outline-none focus:ring-2 focus:ring-[#000000] dark:focus:ring-[#FFFFFF]`}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm mb-2 text-[#000000] dark:text-[#FFFFFF]">Дата рождения*</label>
                  <input
                    type="date"
                    value={editUserData.date_of_birth}
                    onChange={(e) => setEditUserData({ ...editUserData, date_of_birth: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg bg-[#FFFFFF] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] border ${
                      errors.date_of_birth ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                    } focus:outline-none focus:ring-2 focus:ring-[#000000] dark:focus:ring-[#FFFFFF]`}
                  />
                  {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth}</p>}
                </div>
              </div>

              <button
                onClick={handleEditUser}
                className="w-full bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] hover:bg-[#1a1a1a] dark:hover:bg-[#e5e5e5] font-medium py-3 rounded-full mt-4 border border-[#000000] dark:border-[#FFFFFF]"
              >
                {t.usersSave || 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-[#000000]/50 dark:bg-[#000000]/70 flex items-center justify-center z-50" onClick={() => {
          setShowDeleteModal(false)
          setSelectedUser(null)
        }}>
          <div className="bg-[#FFFFFF] dark:bg-[#000000] rounded-2xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-[#000000] dark:text-[#FFFFFF]">{t.usersDelete}</h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedUser(null)
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t.usersDeleteConfirm || 'This user will be permanently deleted'}
            </p>

            <button
              onClick={handleDeleteUser}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-full"
            >
              {t.usersDelete}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
