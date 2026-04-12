'use client'

import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, Trash2, X } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useLanguage } from '@/lib/language-context'
import { userApi } from '@/lib/api'
import { createProjectId, deleteProject, getProjects, upsertProject, validateProjectLink } from '@/lib/dashboard-storage'
import { ProjectItem, UserDTO } from '@/lib/types'

const localeMap = {
  en: 'en-US',
  ru: 'ru-RU',
  fr: 'fr-FR',
} as const

const emptyUser: UserDTO = {
  login: 'admin',
  role: 'ADMIN',
  first_name: '',
  last_name: '',
  middle_name: '',
  email: '',
  date_of_birth: '',
}

export default function ProjectsPage() {
  const { t, language } = useLanguage()
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<UserDTO | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
  })
  const [linkError, setLinkError] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    setProjects(getProjects())
  }, [])

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await userApi.getCurrentUser()
        setCurrentUser(user)
      } catch {
        if (typeof window !== 'undefined') {
          const credentials = window.localStorage.getItem('auth_credentials')
          if (credentials) {
            const { login } = JSON.parse(credentials) as { login: string }
            setCurrentUser({
              ...emptyUser,
              login,
              role: login === 'admin' ? 'ADMIN' : 'STUDENT',
              full_name: login,
            })
            return
          }
        }

        setCurrentUser(emptyUser)
      }
    }

    loadCurrentUser()
  }, [])

  const isAdmin = currentUser?.role === 'ADMIN'

  const visibleProjects = useMemo(() => {
    if (!currentUser || isAdmin) {
      return projects
    }

    return projects.filter((project) => {
      if (currentUser.id !== undefined && project.authorId === currentUser.id) {
        return true
      }

      return project.authorLogin === currentUser.login
    })
  }, [currentUser, isAdmin, projects])

  const selectedProject = useMemo(() => {
    if (!visibleProjects.length) {
      return null
    }

    if (isAdmin) {
      return visibleProjects.find((project) => project.id === selectedProjectId) ?? visibleProjects[0]
    }

    return visibleProjects[0]
  }, [isAdmin, selectedProjectId, visibleProjects])

  useEffect(() => {
    if (!currentUser) return

    if (isAdmin) {
      setSelectedProjectId((currentId) => {
        if (currentId && visibleProjects.some((project) => project.id === currentId)) {
          return currentId
        }

        return visibleProjects[0]?.id ?? null
      })
      return
    }

    const ownProject = visibleProjects[0] ?? null
    setSelectedProjectId(ownProject?.id ?? null)
    setFormData({
      title: ownProject?.title ?? '',
      description: ownProject?.description ?? '',
      link: ownProject?.link ?? '',
    })
  }, [currentUser, isAdmin, visibleProjects])

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat(localeMap[language], {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(date))
  }

  const getViewerName = () => {
    if (!currentUser) return 'student'

    const fullName = currentUser.full_name
      || [currentUser.last_name, currentUser.first_name, currentUser.middle_name].filter(Boolean).join(' ').trim()

    return fullName || currentUser.login
  }

  const handleSaveProject = () => {
    if (!currentUser) return

    if (!validateProjectLink(formData.link)) {
      setLinkError(t.projectsInvalidLink)
      return
    }

    const nextProject: ProjectItem = {
      id: selectedProject?.id ?? createProjectId(),
      title: formData.title.trim() || t.projectsMyProject,
      description: formData.description.trim(),
      link: formData.link.trim(),
      authorId: currentUser.id,
      authorLogin: currentUser.login,
      authorName: getViewerName(),
      teacherName: selectedProject?.teacherName || 'Иванов Иван',
      likes: selectedProject?.likes || 0,
      accessLabel: selectedProject?.accessLabel || 'Проект видят все ученики',
      comments: selectedProject?.comments || [],
      updatedAt: new Date().toISOString(),
    }

    const nextProjects = upsertProject(nextProject)
    setProjects(nextProjects)
    setSelectedProjectId(nextProject.id)
    setLinkError('')
  }

  const handleDeleteProject = () => {
    if (!selectedProject) return

    const nextProjects = deleteProject(selectedProject.id)
    setProjects(nextProjects)
    setShowDeleteModal(false)

    if (isAdmin) {
      setSelectedProjectId(nextProjects[0]?.id ?? null)
      return
    }

    setSelectedProjectId(null)
    setFormData({
      title: '',
      description: '',
      link: '',
    })
  }

  const handleOpenProject = () => {
    if (!selectedProject?.link || typeof window === 'undefined') return
    window.open(selectedProject.link, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex-1 min-h-screen bg-[#FFFFFF] dark:bg-[#000000]">
      <div className="border-b border-gray-200 dark:border-gray-800 px-6 md:px-10 py-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-3xl font-bold text-[#000000] dark:text-[#FFFFFF]">{t.projectsTitle}</h1>
        </div>
      </div>

      <div className="p-6 md:p-10">
        <div className="grid gap-6 xl:grid-cols-[280px,minmax(0,1fr),280px]">
          <aside className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 p-3 shadow-sm">
            {visibleProjects.length > 0 ? (
              <div className="space-y-2">
                {visibleProjects.map((project) => {
                  const isActive = project.id === selectedProject?.id

                  return (
                    <button
                      key={project.id}
                      onClick={() => setSelectedProjectId(project.id)}
                      className={`w-full rounded-2xl px-4 py-3 text-left transition-all ${
                        isActive
                          ? 'bg-[#132440] text-white shadow-lg'
                          : 'bg-gray-50 text-[#132440] hover:bg-gray-100 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="text-sm font-semibold">{project.title}</div>
                      <div className={`mt-1 text-xs ${isActive ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                        {project.authorName}
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                {isAdmin ? t.projectsEmpty : t.projectsMyProject}
              </div>
            )}
          </aside>

          <section className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 p-6 shadow-sm">
            {isAdmin ? (
              selectedProject ? (
                <>
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-[#132440] dark:text-white">{selectedProject.title}</h2>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {t.projectsUpdatedAt}: {formatDate(selectedProject.updatedAt)}
                      </p>
                    </div>

                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-red-900 dark:hover:bg-red-950/30"
                      aria-label={t.projectsDeleteTitle}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-white p-5 dark:from-gray-900 dark:to-gray-950">
                    <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {t.projectsDescription}
                    </div>
                    <div className="whitespace-pre-line text-[15px] leading-7 text-[#132440] dark:text-gray-100">
                      {selectedProject.description || t.projectsNoSelection}
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {t.projectsComments}
                    </div>
                    <div className="space-y-3">
                      {selectedProject.comments.length > 0 ? (
                        selectedProject.comments.map((comment) => (
                          <div key={comment.id} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                            <div className="text-sm font-semibold text-[#132440] dark:text-white">{comment.authorName}</div>
                            <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">{comment.text}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400">{t.projectsEmpty}</div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleOpenProject}
                    className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#5B63D3] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4951c2]"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {t.projectsOpenLink}
                  </button>
                </>
              ) : (
                <div className="text-gray-500 dark:text-gray-400">{t.projectsEmpty}</div>
              )
            ) : (
              <>
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[#132440] dark:text-white">{t.projectsMyProject}</h2>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t.projectsLinkHint}</p>
                  </div>

                  {selectedProject && (
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-red-900 dark:hover:bg-red-950/30"
                      aria-label={t.projectsDeleteTitle}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#132440] dark:text-white">
                      {t.projectsProjectTitle}
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                      className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#132440] outline-none transition focus:border-[#5B63D3] focus:ring-2 focus:ring-[#5B63D3]/20 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#132440] dark:text-white">
                      {t.projectsDescription}
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                      rows={7}
                      className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#132440] outline-none transition focus:border-[#5B63D3] focus:ring-2 focus:ring-[#5B63D3]/20 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#132440] dark:text-white">
                      {t.projectsLink}
                    </label>
                    <input
                      type="url"
                      value={formData.link}
                      onChange={(event) => {
                        setFormData((prev) => ({ ...prev, link: event.target.value }))
                        setLinkError('')
                      }}
                      placeholder={t.projectsLinkPlaceholder}
                      className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-[#132440] outline-none transition focus:border-[#5B63D3] focus:ring-2 focus:ring-[#5B63D3]/20 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                    />
                    {linkError && <div className="mt-2 text-sm text-red-500">{linkError}</div>}
                  </div>

                  <button
                    onClick={handleSaveProject}
                    className="inline-flex items-center justify-center rounded-2xl bg-[#5B63D3] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4951c2]"
                  >
                    {selectedProject ? t.projectsSaveAction : t.projectsCreateAction}
                  </button>
                </div>
              </>
            )}
          </section>

          <aside className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 p-6 shadow-sm">
            <h3 className="mb-6 text-lg font-semibold text-[#132440] dark:text-white">{t.projectsInformation}</h3>

            {selectedProject || !isAdmin ? (
              <div className="space-y-5">
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-400">{t.projectsAuthor}</div>
                  <div className="mt-1 text-sm font-medium text-[#132440] dark:text-gray-100">
                    {selectedProject?.authorName || getViewerName()}
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-400">{t.projectsTeacher}</div>
                  <div className="mt-1 text-sm font-medium text-[#132440] dark:text-gray-100">
                    {selectedProject?.teacherName || 'Иванов Иван'}
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-400">{t.projectsLikes}</div>
                  <div className="mt-1 text-sm font-medium text-[#132440] dark:text-gray-100">
                    {selectedProject?.likes || 0}
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-400">{t.projectsAccess}</div>
                  <div className="mt-1 text-sm font-medium text-[#132440] dark:text-gray-100">
                    {selectedProject?.accessLabel || 'Проект видят все ученики'}
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-400">{t.projectsUpdatedAt}</div>
                  <div className="mt-1 text-sm font-medium text-[#132440] dark:text-gray-100">
                    {selectedProject ? formatDate(selectedProject.updatedAt) : '-'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">{t.projectsNoSelection}</div>
            )}
          </aside>
        </div>
      </div>

      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/50 px-4"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-950"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#132440] dark:text-white">{t.projectsDeleteTitle}</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-2xl bg-gray-100 p-2 text-gray-500 hover:text-gray-700 dark:bg-gray-900 dark:hover:text-gray-200"
                aria-label={t.historyClose}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-6 text-sm leading-6 text-gray-500 dark:text-gray-400">
              {selectedProject?.title}. {t.projectsDeleteConfirm}
            </p>

            <button
              onClick={handleDeleteProject}
              className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              {t.projectsDeleteAction}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
