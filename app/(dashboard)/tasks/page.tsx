'use client'

import { useEffect, useMemo, useState } from 'react'
import { Trash2, X } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useLanguage } from '@/lib/language-context'
import { deleteTask, getTasks } from '@/lib/dashboard-storage'
import { TaskItem } from '@/lib/types'

const localeMap = {
  en: 'en-US',
  ru: 'ru-RU',
  fr: 'fr-FR',
} as const

export default function TasksPage() {
  const { t, language } = useLanguage()
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    const storedTasks = getTasks()
    setTasks(storedTasks)
    setSelectedTaskId(storedTasks[0]?.id ?? null)
  }, [])

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks]
  )

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat(localeMap[language], {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(date))
  }

  const handleDeleteTask = () => {
    if (!selectedTaskId) return

    const nextTasks = deleteTask(selectedTaskId)
    setTasks(nextTasks)
    setSelectedTaskId(nextTasks[0]?.id ?? null)
    setShowDeleteModal(false)
  }

  return (
    <div className="flex-1 min-h-screen bg-[#FFFFFF] dark:bg-[#000000]">
      <div className="border-b border-gray-200 dark:border-gray-800 px-6 md:px-10 py-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-3xl font-bold text-[#000000] dark:text-[#FFFFFF]">{t.tasksTitle}</h1>
        </div>
      </div>

      <div className="p-6 md:p-10">
        {tasks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-950/60 px-6 py-12 text-center text-gray-500 dark:text-gray-400">
            {t.tasksEmpty}
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[280px,minmax(0,1fr),280px]">
            <aside className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 p-3 shadow-sm">
              <div className="space-y-2">
                {tasks.map((task) => {
                  const isActive = task.id === selectedTaskId

                  return (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className={`w-full rounded-2xl px-4 py-3 text-left transition-all ${
                        isActive
                          ? 'bg-[#132440] text-white shadow-lg'
                          : 'bg-gray-50 text-[#132440] hover:bg-gray-100 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="text-sm font-semibold">{task.title}</div>
                      <div className={`mt-1 text-xs ${isActive ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                        {t.tasksCreatedAt}: {formatDate(task.createdAt)}
                      </div>
                    </button>
                  )
                })}
              </div>
            </aside>

            <section className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 p-6 shadow-sm">
              {selectedTask ? (
                <>
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-[#132440] dark:text-white">{selectedTask.title}</h2>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {t.tasksCreatedAt}: {formatDate(selectedTask.createdAt)}
                      </p>
                    </div>

                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-red-900 dark:hover:bg-red-950/30"
                      aria-label={t.tasksDeleteTitle}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-white p-5 dark:from-gray-900 dark:to-gray-950">
                    <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {t.tasksDescription}
                    </div>
                    <div className="whitespace-pre-line text-[15px] leading-7 text-[#132440] dark:text-gray-100">
                      {selectedTask.description}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-gray-500 dark:text-gray-400">{t.tasksEmpty}</div>
              )}
            </section>

            <aside className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 p-6 shadow-sm">
              {selectedTask && (
                <>
                  <h3 className="mb-6 text-lg font-semibold text-[#132440] dark:text-white">{t.tasksInformation}</h3>

                  <div className="space-y-5">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-400">{t.tasksTeacher}</div>
                      <div className="mt-1 text-sm font-medium text-[#132440] dark:text-gray-100">{selectedTask.teacherName}</div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-400">{t.tasksReward}</div>
                      <div className="mt-1 text-sm font-medium text-[#132440] dark:text-gray-100">{selectedTask.reward}</div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-400">{t.tasksDeadline}</div>
                      <div className="mt-1 text-sm font-medium text-[#132440] dark:text-gray-100">{selectedTask.deadline}</div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-400">{t.tasksGroup}</div>
                      <div className="mt-1 text-sm font-medium text-[#132440] dark:text-gray-100">{selectedTask.groupName}</div>
                    </div>
                  </div>
                </>
              )}
            </aside>
          </div>
        )}
      </div>

      {showDeleteModal && selectedTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/50 px-4"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-950"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#132440] dark:text-white">{t.tasksDeleteTitle}</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-2xl bg-gray-100 p-2 text-gray-500 hover:text-gray-700 dark:bg-gray-900 dark:hover:text-gray-200"
                aria-label={t.historyClose}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-6 text-sm leading-6 text-gray-500 dark:text-gray-400">
              {selectedTask.title}. {t.tasksDeleteConfirm}
            </p>

            <button
              onClick={handleDeleteTask}
              className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              {t.tasksDeleteAction}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
