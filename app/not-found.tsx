export default function NotFound() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800">404</h1>
        <p className="text-xl text-gray-600 mt-4">Страница не найдена</p>
        <a href="/" className="mt-6 inline-block px-6 py-3 bg-[#132440] text-white rounded-xl hover:bg-[#132440]/90">
          Вернуться на главную
        </a>
      </div>
    </div>
  )
}
