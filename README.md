# School Bonus Application

Мобильное приложение начисления бонусов (алгокоинов) для школьников.![photo_2025-11-14_22-55-45 (5)](https://github.com/user-attachments/assets/ea9952ed-fa50-4902-a74c-3595a111d69c)
![photo_2025-11-14_22-55-45 (4)](https://github.com/user-attachments/assets/1bdc92a1-044b-4eea-b517-6a84e1384555)
![photo_2025-11-14_22-55-45 (3)](https://github.com/user-attachments/assets/e1761ece-a4f0-440f-a791-a0e479ba0f39)
![photo_2025-11-14_22-55-45 (2)](https://github.com/user-attachments/assets/f1df9b8e-f40d-49f9-a87f-bf32ea70279d)
![photo_2025-11-14_22-55-45](https://github.com/user-attachments/assets/812cbd8a-2c78-45d7-b6ba-47b89918dfe6)
![photo_2025-11-14_22-55-45 (6)](https://github.com/user-attachments/assets/d63876cd-4c00-454c-ba79-dd6318983978)


## Технологический стек

- **Next.js 15** - React фреймворк
- **React 19** - UI библиотека
- **TypeScript** - Типизация
- **Tailwind CSS** - Стилизация
- **Express.js** - Proxy сервер для решения CORS
- **Backend API** - http://212.220.105.29:8079

## Архитектура

Приложение использует proxy-сервер для обхода CORS ограничений:

```
Frontend (Next.js)     Proxy Server (Express)     Backend API
localhost:3000    -->  localhost:3001        -->  212.220.105.29:8079
```

## Структура проекта

```
├── app/
│   ├── auth/          # Страница авторизации
│   ├── profile/       # Страница профиля
│   ├── layout.tsx     # Основной layout
│   ├── page.tsx       # Главная страница (редирект)
│   └── globals.css    # Глобальные стили
├── .github/
│   └── copilot-instructions.md  # Инструкции для Copilot
└── package.json
```

## Функциональность

### Страница авторизации (`/auth`)
- Логин: "admin" (поле неактивное, изменить нельзя)
- Поле ввода пароля с возможностью показа/скрытия
- Кнопка "Войти" с переходом на страницу профиля

### Страница профиля (`/profile`)
- Боковое меню навигации:
  - Профиль (активная)
  - Пользователи
  - Группы
  - Подарки
  - Заказы
  - История
  - Выйти

- **Основная информация:**
  - Логин: "admin" (неактивное поле)
  - Email: можно редактировать
  - Валидация email: формат xxx@xxx.xx
  - Кнопка "Сохранить" для email

- **Смена пароля:**
  - Старый пароль
  - Новый пароль
  - Повторите новый пароль
  - Валидация:
    - Новый пароль и повтор должны совпадать
    - Старый пароль должен быть верным
  - Сообщения об ошибках на русском языке

## Установка и запуск

1. Установите зависимости:
```bash
npm install
```

2. Создайте файл `.env.local` (опционально, уже настроен):
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

3. Запустите приложение с proxy сервером:

**Вариант 1: Запуск всего сразу (рекомендуется)**
```bash
npm run dev:all
```

**Вариант 2: Запуск вручную в двух терминалах**

Терминал 1 - Proxy сервер:
```bash
npm run proxy
```

Терминал 2 - Next.js:
```bash
npm run dev
```

4. Откройте браузер по адресу [http://localhost:3000](http://localhost:3000)

### Проверка работы proxy сервера

Откройте [http://localhost:3001/health](http://localhost:3001/health) - должен вернуться JSON с информацией о сервере.

## Команды

- `npm run dev` - Запуск только Next.js dev сервера
- `npm run proxy` - Запуск только proxy сервера
- `npm run dev:all` - Запуск Next.js + Proxy одновременно (рекомендуется)
- `npm run build` - Сборка для production
- `npm start` - Запуск production сервера
- `npm run lint` - Проверка кода

## API Integration

### Доступные endpoints

Все запросы проходят через proxy на `http://localhost:3001/api`:

**Users:**
- `GET /api/users/me` - Получить текущего пользователя
- `GET /api/users/{id}` - Получить пользователя по ID
- `POST /api/users` - Создать пользователя
- `PUT /api/users/{id}` - Обновить пользователя
- `DELETE /api/users/{id}` - Удалить пользователя

**Groups:**
- `GET /api/groups` - Получить группы
- `GET /api/groups/{id}` - Получить группу по ID
- `POST /api/groups` - Создать группу
- `PUT /api/groups/{id}` - Обновить группу
- `DELETE /api/groups/{id}` - Удалить группу
- `POST /api/groups/{groupId}/students/{studentId}` - Добавить студента
- `DELETE /api/groups/{groupId}/students/{studentId}` - Удалить студента

**Presents (Подарки):**
- `GET /api/presents` - Получить подарки
- `GET /api/presents/{id}` - Получить подарок по ID
- `GET /api/presents/search?query=xxx` - Поиск подарков
- `POST /api/presents` - Создать подарок
- `PUT /api/presents/{id}` - Обновить подарок
- `DELETE /api/presents/{id}` - Удалить подарок
- `POST /api/presents/{id}/photos` - Добавить фото
- `DELETE /api/presents/{presentId}/photos/{photoId}` - Удалить фото

### Решение проблемы CORS

Proxy сервер (`server.js`) решает проблему CORS, перенаправляя все запросы к backend API и добавляя необходимые CORS заголовки.

**Как это работает:**
1. Frontend делает запрос на `http://localhost:3001/api/...`
2. Proxy сервер получает запрос и пересылает его на `http://212.220.105.29:8079/api/...`
3. Backend отвечает proxy серверу
4. Proxy сервер добавляет CORS заголовки и возвращает ответ frontend

## Требования к валидации

### Email
- Формат: `xxx@xxx.xx`
- Регулярное выражение: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Сообщение об ошибке: "Неверный формат email. Используйте формат: xxx@xxx.xx"

### Пароль
- Если пароли не совпадают: "Пароли не совпадают, попробуйте снова"
- Если старый пароль неверный: "Старый пароль введен неверно, попробуйте снова"

## Следующие шаги

- [ ] Создание страницы "Пользователи"
- [ ] Создание страницы "Группы"
- [ ] Создание страницы "Подарки"
- [ ] Создание страницы "Заказы"
- [ ] Создание страницы "История"
- [ ] Подключение к backend API
- [ ] Настройка авторизации
- [ ] Деплой на облачный сервер

## Дизайн

Дизайн в Figma: [Ссылка на макеты](https://www.figma.com/design/MIrRIIAMtPjC7O9oTe4lXU/%D0%9C%D0%BE%D0%B1%D0%B8%D0%BB%D1%8C%D0%BD%D0%BE%D0%B5-%D0%BF%D1%80%D0%B8%D0%BB%D0%BE%D0%B6%D0%B5%D0%BD%D0%B8%D0%B5-%D0%B4%D0%BB%D1%8F-%D1%83%D1%87%D0%B5%D0%BD%D0%B8%D0%BA%D0%BE%D0%B2?node-id=0-1&t=J5Tksb4CIysZXOxu-1)

## Паспорт проекта

- **Номер:** No2086/ЛКП-5610-2025
- **Дата:** 26.08.2025
- **Организация:** ООО "АКАДЕМИЯ ПРИКЛАДНОЙ ИНФОРМАТИКИ"
- **Период реализации:** 01.09.2025 - 31.01.2026
