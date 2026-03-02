'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { groupApi, userApi, ApiError, clearAuthCredentials } from '@/lib/api'
import { GroupDTO, UserDTO } from '@/lib/types'
import { SidebarTrigger } from '@/components/ui/sidebar'

// Local types for UI
interface Teacher {
  id: number
  fullName: string
}

interface Student {
  id: number
  fullName: string
  login: string
}

interface Group {
  id: number
  name: string
  teacher: Teacher
  participants: Student[]
}

// Convert API GroupDTO to local Group type
function convertGroupDTOToGroup(dto: GroupDTO): Group {  
  return {
    id: dto.id || 0,
    name: dto.group_name,
    teacher: dto.teacher ? {
      id: dto.teacher.id || 0,
      fullName: dto.teacher.full_name || `${dto.teacher.last_name} ${dto.teacher.first_name} ${dto.teacher.middle_name || ''}`.trim()
    } : { id: 0, fullName: 'Не назначен' },
    participants: (dto.students || []).map(s => ({
      id: s.id || 0,
      fullName: s.full_name || `${s.last_name} ${s.first_name} ${s.middle_name || ''}`.trim(),
      login: s.login
    }))
  }
}

export default function GroupsPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([])
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form states for Create/Edit Group
  const [groupName, setGroupName] = useState('')
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedParticipants, setSelectedParticipants] = useState<Student[]>([])
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      const groupsResponse = await groupApi.getAvailableGroups(0, 1000);
      const groupsData = groupsResponse.content;

      const convertedGroups = groupsData.map(convertGroupDTOToGroup);
      setGroups(convertedGroups);

      const teachersResponse = await userApi.getTeachers(0, 1000);
      const studentsResponse = await userApi.getStudents(0, 1000);

      const teachers: Teacher[] = teachersResponse.content.map(t => ({
        id: t.id,
        fullName: t.fullName
      }));

      const students: Student[] = studentsResponse.content.map(s => ({
        id: s.id,
        fullName: s.fullName,
        login: s.login
      }));

      setAllTeachers(teachers);
      setAllStudents(students);

      if (convertedGroups.length > 0) {
        setSelectedGroup(convertedGroups[0]);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          clearAuthCredentials();
          router.push('/auth');
          return;
        }
        setError(err.message);
      } else {
        setError('Ошибка загрузки данных');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = searchQuery.length >= 3
    ? allStudents.filter(
        (s) =>
          s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !selectedParticipants.some((p) => p.id === s.id)
      )
    : []

  const handleCreateGroup = async () => {
    const newErrors: { [key: string]: string } = {}

    if (!groupName.trim()) {
      newErrors.name = 'Название группы обязательно'
    }

    if (!selectedTeacherId) {
      newErrors.teacher = 'Выберите преподавателя'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      const newGroup = await groupApi.createGroup({
        group_name: groupName,
        teacher_id: selectedTeacherId!
      })
      
      for (const student of selectedParticipants) {
        await groupApi.addStudentToGroup(newGroup.id!, student.id)
      }
      
      await loadGroups()
      setShowCreateModal(false)
      resetForm()
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors({ api: err.message })
      }
    }
  }

  const handleEditGroup = async () => {
    if (!selectedGroup) return

    const newErrors: { [key: string]: string } = {}

    if (!groupName.trim()) {
      newErrors.name = 'Название группы обязательно'
    }

    if (!selectedTeacherId) {
      newErrors.teacher = 'Выберите преподавателя'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      await groupApi.updateGroup(selectedGroup.id, {
        id: selectedGroup.id,
        group_name: groupName,
        teacher_id: selectedTeacherId!
      })

      const currentParticipantIds = new Set(selectedGroup.participants.map(p => p.id))
      const newParticipantIds = new Set(selectedParticipants.map(p => p.id))

      for (const participant of selectedGroup.participants) {
        if (!newParticipantIds.has(participant.id)) {
          await groupApi.removeStudentFromGroup(selectedGroup.id, participant.id)
        }
      }

      for (const participant of selectedParticipants) {
        if (!currentParticipantIds.has(participant.id)) {
          await groupApi.addStudentToGroup(selectedGroup.id, participant.id)
        }
      }

      await loadGroups()
      setShowEditModal(false)
      resetForm()
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors({ api: err.message })
      }
    }
  }

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return
    
    try {
      await groupApi.deleteGroup(selectedGroup.id)
      await loadGroups()
      setShowDeleteModal(false)
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors({ api: err.message })
      }
    }
  }

  const resetForm = () => {
    setGroupName('')
    setSelectedTeacherId(null)
    setSearchQuery('')
    setSelectedParticipants([])
    setErrors({})
  }

  const openCreateModal = () => {
    resetForm()
    setShowCreateModal(true)
  }

  const openEditModal = () => {
    if (!selectedGroup) return
    setGroupName(selectedGroup.name)
    setSelectedTeacherId(selectedGroup.teacher.id)
    setSelectedParticipants([...selectedGroup.participants])
    setSearchQuery('')
    setErrors({})
    setShowEditModal(true)
  }

  const openDeleteModal = () => {
    setShowDeleteModal(true)
  }

  const addParticipant = (student: Student) => {
    setSelectedParticipants([...selectedParticipants, student])
    setSearchQuery('')
  }

  const removeParticipant = (studentId: number) => {
    setSelectedParticipants(selectedParticipants.filter((p) => p.id !== studentId))
  }

  const sortedGroups = [...groups].sort((a, b) => {
    const aStartsWithNumber = /^\d/.test(a.name)
    const bStartsWithNumber = /^\d/.test(b.name)

    if (aStartsWithNumber && !bStartsWithNumber) return 1
    if (!aStartsWithNumber && bStartsWithNumber) return -1

    return a.name.localeCompare(b.name, 'ru', { numeric: true })
  })

  const sortedParticipants = selectedGroup
    ? [...selectedGroup.participants].sort((a, b) =>
        a.fullName.localeCompare(b.fullName, 'ru')
      )
    : []

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-screen bg-[#FFFFFF] dark:bg-[#000000]">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 px-6 md:px-10 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-3xl font-bold text-[#000000] dark:text-[#FFFFFF]">Группы</h1>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] hover:bg-[#1a1a1a] dark:hover:bg-[#e5e5e5] px-6 py-3 rounded-full font-medium transition border border-[#000000] dark:border-[#FFFFFF]"
          >
            Создать группу
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-6 md:mx-10 mt-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="p-6 md:p-10">
        <div className="flex gap-6">
          {/* Groups List */}
          <div className="w-80 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="space-y-3">
              {sortedGroups.length === 0 ? (
                <p className="text-gray-400 dark:text-gray-600 text-center py-4">Нет групп</p>
              ) : (
                sortedGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroup(group)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                      selectedGroup?.id === group.id
                        ? 'bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] font-medium'
                        : 'bg-[#FFFFFF] dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-[#000000] dark:text-[#FFFFFF] border border-gray-200 dark:border-gray-800'
                    }`}
                  >
                    {group.name}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Group Details */}
          {selectedGroup ? (
            <div className="flex-1 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#000000] dark:text-[#FFFFFF]">{selectedGroup.name}</h2>
                <div className="flex gap-3">
                  <button
                    onClick={openEditModal}
                    className="px-4 py-2 bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] hover:bg-[#1a1a1a] dark:hover:bg-[#e5e5e5] rounded-full transition border border-[#000000] dark:border-[#FFFFFF]"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={openDeleteModal}
                    className="px-4 py-2 bg-[#FFFFFF] dark:bg-[#000000] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition border border-red-600 dark:border-red-400"
                  >
                    Удалить
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Преподаватель:</p>
                <p className="text-[#000000] dark:text-[#FFFFFF] font-medium">{selectedGroup.teacher.fullName}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-3">Участники группы:</p>
                <ol className="space-y-2">
                  {sortedParticipants.map((participant, index) => (
                    <li key={participant.id} className="text-[#000000] dark:text-[#FFFFFF]">
                      {index + 1}. {participant.fullName}
                    </li>
                  ))}
                </ol>
                {sortedParticipants.length === 0 && (
                  <p className="text-gray-400 dark:text-gray-600 italic">Нет участников</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 flex items-center justify-center">
              <p className="text-gray-400 dark:text-gray-600 text-lg">Выберите группу для просмотра</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-[#000000]/50 dark:bg-[#000000]/70 flex items-center justify-center z-50">
          <div className="bg-[#FFFFFF] dark:bg-gray-950 rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-[#000000] dark:text-[#FFFFFF]">Создать группу</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {errors.api && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {errors.api}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-[#000000] dark:text-[#FFFFFF]">Название группы</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Название группы"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                  } bg-[#FFFFFF] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#000000] dark:focus:ring-[#FFFFFF]`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm mb-2 text-[#000000] dark:text-[#FFFFFF]">Выбрать</label>
                <select
                  value={selectedTeacherId || ''}
                  onChange={(e) => setSelectedTeacherId(Number(e.target.value))}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    errors.teacher ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                  } bg-[#FFFFFF] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#000000] dark:focus:ring-[#FFFFFF]`}
                >
                  <option value="">Выбрать</option>
                  {allTeachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.fullName}
                    </option>
                  ))}
                </select>
                {errors.teacher && <p className="text-red-500 text-xs mt-1">{errors.teacher}</p>}
              </div>

              <div>
                <label className="block text-sm mb-2 text-black dark:text-white">Поиск</label>
                <div className="relative">
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
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  />
                </div>
                {searchQuery.length > 0 && searchQuery.length < 3 && (
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">Введите минимум 3 символа</p>
                )}
                {filteredStudents.length > 0 && (
                  <div className="mt-2 border border-gray-300 dark:border-gray-700 rounded-lg max-h-40 overflow-y-auto bg-white dark:bg-black">
                    {filteredStudents.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => addParticipant(student)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-900 border-b border-gray-200 dark:border-gray-800 last:border-b-0 text-black dark:text-white"
                      >
                        {student.fullName}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm mb-2 text-black dark:text-white">Нет участников</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedParticipants
                    .sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru'))
                    .map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-900 rounded-lg"
                      >
                        <span className="text-sm text-black dark:text-white">{participant.fullName}</span>
                        <button
                          onClick={() => removeParticipant(participant.id)}
                          className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  {selectedParticipants.length === 0 && (
                    <div className="text-gray-400 dark:text-gray-600 text-sm italic px-4 py-2">Нет участников</div>
                  )}
                </div>
              </div>

              <button
                onClick={handleCreateGroup}
                className="w-full bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] hover:bg-[#1a1a1a] dark:hover:bg-[#e5e5e5] font-medium py-3 rounded-full mt-4 border border-[#000000] dark:border-[#FFFFFF]"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {showEditModal && selectedGroup && (
        <div className="fixed inset-0 bg-[#000000]/50 dark:bg-[#000000]/70 flex items-center justify-center z-50">
          <div className="bg-[#FFFFFF] dark:bg-gray-950 rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-[#000000] dark:text-[#FFFFFF]">Отредактировать группу</h2>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {errors.api && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {errors.api}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-black dark:text-white">Название*</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Название группы"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                  } bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm mb-2 text-black dark:text-white">Закрепить преподавателя за группой*</label>
                <select
                  value={selectedTeacherId || ''}
                  onChange={(e) => setSelectedTeacherId(Number(e.target.value))}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    errors.teacher ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                  } bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white`}
                >
                  <option value="">Выбрать</option>
                  {allTeachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.fullName}
                    </option>
                  ))}
                </select>
                {errors.teacher && <p className="text-red-500 text-xs mt-1">{errors.teacher}</p>}
              </div>

              <div>
                <label className="block text-sm mb-2 text-black dark:text-white">Найти ученика</label>
                <div className="relative">
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
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  />
                </div>
                {searchQuery.length > 0 && searchQuery.length < 3 && (
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">Введите минимум 3 символа</p>
                )}
                {filteredStudents.length > 0 && (
                  <div className="mt-2 border border-gray-300 dark:border-gray-700 rounded-lg max-h-40 overflow-y-auto bg-white dark:bg-black">
                    {filteredStudents.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => addParticipant(student)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-900 border-b border-gray-200 dark:border-gray-800 last:border-b-0 text-black dark:text-white"
                      >
                        {student.fullName}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm mb-2 text-black dark:text-white">Участники группы</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedParticipants
                    .sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru'))
                    .map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-900 rounded-lg"
                      >
                        <span className="text-sm text-black dark:text-white">{participant.fullName}</span>
                        <button
                          onClick={() => removeParticipant(participant.id)}
                          className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  {selectedParticipants.length === 0 && (
                    <div className="text-gray-400 dark:text-gray-600 text-sm italic px-4 py-2">Нет участников</div>
                  )}
                </div>
              </div>

              <button
                onClick={handleEditGroup}
                className="w-full bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] hover:bg-[#1a1a1a] dark:hover:bg-[#e5e5e5] font-medium py-3 rounded-full mt-4 border border-[#000000] dark:border-[#FFFFFF]"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Modal */}
      {showDeleteModal && selectedGroup && (
        <div className="fixed inset-0 bg-[#000000]/50 dark:bg-[#000000]/70 flex items-center justify-center z-50">
          <div className="bg-[#FFFFFF] dark:bg-gray-950 rounded-2xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-[#000000] dark:text-[#FFFFFF]">Удалить группу</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {errors.api && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {errors.api}
              </div>
            )}

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Группа будет удалена навсегда. Вы точно хотите ее удалить?
            </p>

            <button
              onClick={handleDeleteGroup}
              className="w-full bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800 text-white font-medium py-3 rounded-full border border-red-600 dark:border-red-700"
            >
              Удалить
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
