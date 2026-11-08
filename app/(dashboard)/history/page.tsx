'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { userApi, groupApi, ApiError, clearAuthCredentials } from '@/lib/api'
import { CoinsHistoryRecord, GroupDTO, UserDTO } from '@/lib/types'
import { SidebarTrigger } from '@/components/ui/sidebar'

interface HistoryRecord {
  id: number
  date: string
  teacher: string
  group: string
  student: string
  coins: number
  reason: string
}

interface GroupWithStudents {
  id: number
  name: string
  students: { id: number; name: string }[]
}

export default function HistoryPage() {
  const router = useRouter()
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  
  const [teachers, setTeachers] = useState<string[]>([])
  const [groupsData, setGroupsData] = useState<GroupWithStudents[]>([])
  const [availableStudents, setAvailableStudents] = useState<{ id: number; name: string }[]>([])
  
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  useEffect(() => {
    loadGroups()
  }, [])
  
  useEffect(() => {
    if (selectedStudentId) {
      loadHistoryForStudent(selectedStudentId)
    }
  }, [selectedStudentId])

  const loadGroups = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load all groups
      let allGroups: GroupDTO[] = []
      let page = 0
      let hasMore = true
      
      while (hasMore) {
        const response = await groupApi.getAvailableGroups(page, 100)
        allGroups.push(...response.content)
        hasMore = !response.last
        page++
      }
      
      // Transform groups data
      const groupsWithStudents: GroupWithStudents[] = allGroups.map(g => ({
        id: g.id!,
        name: g.group_name,
        students: (g.students || []).map(s => ({
          id: s.id!,
          name: `${s.last_name} ${s.first_name}`
        }))
      }))
      
      setGroupsData(groupsWithStudents)
      
      // Auto-select first group and its first student
      if (groupsWithStudents.length > 0) {
        const firstGroup = groupsWithStudents[0]
        setSelectedGroupId(firstGroup.id)
        setAvailableStudents(firstGroup.students)
        
        if (firstGroup.students.length > 0) {
          setSelectedStudentId(firstGroup.students[0].id)
        }
      }
    } catch (err) {
      console.error('Error loading groups:', err)
      if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 403) {
          clearAuthCredentials()
          router.push('/auth')
          return
        }
        setError(err.message)
      } else {
        setError('Ошибка загрузки групп')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadHistoryForStudent = async (studentId: number) => {
    try {
      setLoading(true)
      setError(null)
      
      // Load all pages of coins history for this student
      const allHistory: CoinsHistoryRecord[] = []
      let page = 0
      let hasMore = true
      
      while (hasMore) {
        const response = await userApi.getStudentCoinsHistory(studentId, page, 100)
        allHistory.push(...response.content)
        hasMore = !response.last
        page++
      }
      
      // Convert to our format
      const records: HistoryRecord[] = allHistory.map((h) => ({
        id: h.id,
        date: new Date(h.date).toLocaleDateString('ru-RU'),
        teacher: h.teacher_name,
        group: groupsData.find(g => g.students.some(s => s.id === studentId))?.name || 'Не указана',
        student: h.student_name,
        coins: h.enrolled_coins,
        reason: 'Не указана'
      }))
      
      setHistoryRecords(records)
      
      // Extract unique teachers
      const uniqueTeachers = [...new Set(records.map(r => r.teacher))].sort()
      setTeachers(uniqueTeachers)
    } catch (err) {
      console.error('Error loading history:', err)
      if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 403) {
          clearAuthCredentials()
          router.push('/auth')
          return
        }
        setError(err.message)
      } else {
        setError('Ошибка загрузки истории')
      }
    } finally {
      setLoading(false)
    }
  }

  // Convert dd.mm.yyyy to comparable format
  const parseRussianDate = (dateStr: string): Date => {
    const parts = dateStr.split('.')
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
  }

  // Filter and sort records
  const filteredRecords = historyRecords
    .filter((record) => {
      // Date filter
      if (dateFrom) {
        const recordDate = parseRussianDate(record.date)
        const fromDate = new Date(dateFrom)
        if (recordDate < fromDate) return false
      }
      if (dateTo) {
        const recordDate = parseRussianDate(record.date)
        const toDate = new Date(dateTo)
        if (recordDate > toDate) return false
      }
      
      return true
    })
    .sort((a, b) => {
      const dateA = parseRussianDate(a.date)
      const dateB = parseRussianDate(b.date)
      return dateB.getTime() - dateA.getTime()
    })

  const clearFilters = () => {
    setDateFrom('')
    setDateTo('')
    setSelectedGroupId(null)
    setSelectedStudentId(null)
    setAvailableStudents([])
    setHistoryRecords([])
  }
  
  const applyFilters = () => {
    setShowFilterModal(false)
    setCurrentPage(1)
  }
  
  const handleGroupSelect = async (groupId: number) => {
    setSelectedGroupId(groupId)
    const selectedGroup = groupsData.find(g => g.id === groupId)
    if (selectedGroup) {
      setAvailableStudents(selectedGroup.students)
      // Auto-select first student
      if (selectedGroup.students.length > 0) {
        setSelectedStudentId(selectedGroup.students[0].id)
      } else {
        setSelectedStudentId(null)
        setHistoryRecords([])
      }
    }
  }
  
  const handleStudentSelect = (studentId: number) => {
    setSelectedStudentId(studentId)
  }

  // Calculate total coins for filtered records
  const totalCoins = filteredRecords.reduce((sum, r) => sum + r.coins, 0)
  
  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex)
  
  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }
  
  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
  }

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-[#FFFFFF] dark:bg-[#000000] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#000000] dark:border-[#FFFFFF]"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-screen bg-[#FFFFFF] dark:bg-[#000000]">
      {/* Top Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 px-6 md:px-10 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-3xl font-bold text-[#000000] dark:text-[#FFFFFF]">История</h1>
          </div>
          <button
            onClick={() => setShowFilterModal(true)}
            className="p-2 hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] rounded-lg transition-colors"
            title="Фильтры"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-6 md:mx-10 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
          {error}
        </div>
      )}

      {/* Content Area */}
      <div className="p-6 md:p-10">
        {/* Filter Modal */}
        {showFilterModal && (
            <div className="fixed inset-0 bg-[#000000]/50 dark:bg-[#000000]/70 flex items-start justify-end z-50 p-4">
              <div className="bg-[#FFFFFF] dark:bg-[#000000] rounded-2xl shadow-2xl w-full max-w-md mt-20 max-h-[80vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-800">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                  <h2 className="text-xl font-semibold text-gray-800">Фильтр</h2>
                  <button
                    onClick={() => setShowFilterModal(false)}
                    className="p-1 rounded-lg transition-colors"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {/* Groups Section */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-3">Группа</h3>
                    <div className="space-y-2">
                      {groupsData.slice(0, 10).map((group) => (
                        <label key={group.id} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg">
                          <input
                            type="radio"
                            name="group"
                            checked={selectedGroupId === group.id}
                            onChange={() => handleGroupSelect(group.id)}
                            className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-800">{group.name}</span>
                        </label>
                      ))}
                    </div>
                    {groupsData.length > 10 && (
                      <button className="text-sm text-indigo-600 mt-2 flex items-center gap-1">
                        Посмотреть больше
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {/* Students Section - Only show when group is selected */}
                  {selectedGroupId && availableStudents.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-600 mb-3">Ученик</h3>
                      <div className="space-y-2">
                        {availableStudents.slice(0, 10).map((student) => (
                          <label key={student.id} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg">
                            <input
                              type="radio"
                              name="student"
                              checked={selectedStudentId === student.id}
                              onChange={() => handleStudentSelect(student.id)}
                              className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-800">{student.name}</span>
                          </label>
                        ))}
                      </div>
                      {availableStudents.length > 10 && (
                        <button className="text-sm text-indigo-600 mt-2 flex items-center gap-1">
                          Посмотреть больше
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Modal Footer */}
                <div className="px-6 py-4 border-t">
                  <button
                    onClick={applyFilters}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg transition-colors font-medium"
                  >
                    Сохранить фильтр
                  </button>
                </div>
              </div>
            </div>
          )}

        {/* History Table */}
        <div className="space-y-3">
            {paginatedRecords.length === 0 ? (
              <div className="bg-[#FFFFFF] dark:bg-[#000000] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-12 text-center text-gray-400">
                Нет записей
              </div>
            ) : (
              paginatedRecords.map((record, index) => (
                <div 
                  key={record.id} 
                  className={`rounded-xl border-2 shadow-sm p-5 ${
                    index === 0 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                      : 'border-gray-200 dark:border-gray-800 bg-[#FFFFFF] dark:bg-[#000000]'
                  }`}
                >
                  <div className="grid grid-cols-5 gap-6">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">ФИО ученика</div>
                      <div className="text-sm text-[#000000] dark:text-[#FFFFFF]">{record.student}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">ФИО преподавателя</div>
                      <div className="text-sm text-[#000000] dark:text-[#FFFFFF]">{record.teacher}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Группа</div>
                      <div className="text-sm text-[#000000] dark:text-[#FFFFFF]">{record.group}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Дата зачисления</div>
                      <div className="text-sm text-[#000000] dark:text-[#FFFFFF]">{record.date}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Кол-во алгокоинов</div>
                      <div className="text-sm text-gray-900">{record.coins}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        {/* Pagination */}
        {filteredRecords.length > 0 && (
            <div className="flex items-center justify-end mt-6">
              <span className="text-sm text-gray-600 mr-4">
                {startIndex + 1}-{Math.min(endIndex, filteredRecords.length)} из {filteredRecords.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="p-1 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            </div>
          )}
      </div>
    </div>
  )
}
