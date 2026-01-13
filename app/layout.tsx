import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'School Bonus App',
  description: 'Мобильное приложение начисления бонусов для школьников',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
