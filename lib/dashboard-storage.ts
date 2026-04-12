import { ProjectItem, TaskItem } from './types';

const TASKS_STORAGE_KEY = 'school_bonus_tasks_v1';
const PROJECTS_STORAGE_KEY = 'school_bonus_projects_v1';

const defaultTasks: TaskItem[] = [
  {
    id: 'task-python',
    title: 'Задача Python',
    createdAt: '2025-05-28',
    description:
      '1. Откройте среду разработки.\n2. В левом меню найдите календарь и нажмите на трёхточечное меню рядом с его названием.\n3. Выберите пункт "Настройки и общий доступ".\n4. Пролистайте страницу до раздела "Открыть доступ пользователям или группам".\n5. Прикрепите ссылку на решение.',
    teacherName: 'Смирнов Денис',
    reward: '12 коинов + 3 EXP первым трём',
    deadline: '2026-04-13 - 2026-04-20',
    groupName: 'Телепузики',
  },
  {
    id: 'task-scratch',
    title: 'Задача в Scratch',
    createdAt: '2025-04-20',
    description:
      '1. Создайте интерактивную сцену.\n2. Добавьте минимум двух персонажей.\n3. Используйте циклы и условия.\n4. Подготовьте короткое описание проекта.\n5. Отправьте ссылку преподавателю.',
    teacherName: 'Иванова Анна',
    reward: '8 коинов + 2 EXP',
    deadline: '2026-04-21 - 2026-04-28',
    groupName: 'Алгоритмы',
  },
];

const defaultProjects: ProjectItem[] = [
  {
    id: 'project-go',
    title: 'Проект на GO',
    description:
      'Предложенный редизайн полностью опирается на принципы UX-дизайна, учитывает потребности целевой аудитории и использует разработанную дизайн-систему. Проект направлен на повышение вовлечённости пользователей и мотивации учеников.',
    link: 'https://google.com',
    authorId: 1,
    authorLogin: 'kosseivan',
    authorName: 'Коссе Иван Николаевич',
    teacherName: 'Иванов Иван',
    likes: 11,
    accessLabel: 'Проект видят все ученики',
    updatedAt: '2026-04-12',
    comments: [
      { id: 'comment-1', authorName: 'Петя Васильев', text: 'Отличный проект, продолжай в том же духе.' },
      { id: 'comment-2', authorName: 'Иванов Петр Сергеевич', text: 'Я бы сделал лучше, но идея сильная.' },
      { id: 'comment-3', authorName: 'Канаева Анна Владимировна', text: 'Очень понравилось решение.' },
    ],
  },
  {
    id: 'project-demo',
    title: 'Какой-то проектик',
    description:
      'Небольшой учебный проект для демонстрации логики выбора подарков и визуализации прогресса ученика.',
    link: 'https://example.com',
    authorId: 2,
    authorLogin: 'vasapupkin',
    authorName: 'Вася Пупкин',
    teacherName: 'Сидорова Елена',
    likes: 4,
    accessLabel: 'Проект видят только ученики группы',
    updatedAt: '2026-04-11',
    comments: [],
  },
];

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function readStorage<T>(key: string, fallback: T): T {
  if (!isBrowser()) {
    return fallback;
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) {
      return fallback;
    }

    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getTasks(): TaskItem[] {
  const tasks = readStorage<TaskItem[]>(TASKS_STORAGE_KEY, []);
  if (tasks.length > 0) {
    return tasks;
  }

  writeStorage(TASKS_STORAGE_KEY, defaultTasks);
  return defaultTasks;
}

export function saveTasks(tasks: TaskItem[]): void {
  writeStorage(TASKS_STORAGE_KEY, tasks);
}

export function deleteTask(taskId: string): TaskItem[] {
  const nextTasks = getTasks().filter((task) => task.id !== taskId);
  saveTasks(nextTasks);
  return nextTasks;
}

export function getProjects(): ProjectItem[] {
  const projects = readStorage<ProjectItem[]>(PROJECTS_STORAGE_KEY, []);
  if (projects.length > 0) {
    return projects;
  }

  writeStorage(PROJECTS_STORAGE_KEY, defaultProjects);
  return defaultProjects;
}

export function saveProjects(projects: ProjectItem[]): void {
  writeStorage(PROJECTS_STORAGE_KEY, projects);
}

export function upsertProject(project: ProjectItem): ProjectItem[] {
  const projects = getProjects();
  const existingIndex = projects.findIndex((item) => item.id === project.id);

  if (existingIndex >= 0) {
    const nextProjects = [...projects];
    nextProjects[existingIndex] = project;
    saveProjects(nextProjects);
    return nextProjects;
  }

  const nextProjects = [project, ...projects];
  saveProjects(nextProjects);
  return nextProjects;
}

export function deleteProject(projectId: string): ProjectItem[] {
  const nextProjects = getProjects().filter((project) => project.id !== projectId);
  saveProjects(nextProjects);
  return nextProjects;
}

export function validateProjectLink(link: string): boolean {
  try {
    const url = new URL(link.trim());
    return url.protocol === 'https:' && url.hostname.length > 0;
  } catch {
    return false;
  }
}

export function createProjectId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `project-${Date.now()}`;
}
