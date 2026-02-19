'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { setAuthCredentials, userApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { GridBackground } from '@/components/ui/grid-background'
import { LampContainer } from '@/components/ui/lamp'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSwitcher } from '@/components/language-switcher'
import { Language, translations } from '@/lib/translations'
import { Home } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AuthPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState<Language>('ru')
  
  const t = translations[currentLanguage]

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Simple validation
    if (!password) {
      setError('Введите пароль')
      return
    }

    setLoading(true)

    try {
      // Save credentials to localStorage
      const login = 'admin'
      setAuthCredentials(login, password)

      // Test the credentials by making a request using the API
      try {
        await userApi.getCurrentUser()
        // Credentials are valid, redirect to profile
        router.push('/profile')
      } catch (apiError: any) {
        // Invalid credentials or API error
        console.error('Login error:', apiError)
        if (apiError.status === 401 || apiError.status === 403) {
          setError('Неверный пароль')
        } else {
          setError(`Ошибка подключения: ${apiError.message || 'Проверьте соединение с сервером'}`)
        }
        localStorage.removeItem('auth_credentials')
      }
    } catch (err: any) {
      console.error('Connection error:', err)
      setError(`Ошибка подключения к серверу: ${err.message || 'Проверьте соединение'}`)
      localStorage.removeItem('auth_credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <GridBackground>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 relative">
        {/* Lamp Effect Positioned Above Card */}
        <div className="absolute top-0 left-0 right-0 w-full h-[60vh]">
          <LampContainer className="bg-transparent min-h-[60vh]">
            <div className="h-20"></div>
          </LampContainer>
        </div>

        {/* Login Card Container */}
        <div className="relative z-10 w-full max-w-sm mt-20">
          <Card className="border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-black shadow-2xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-black dark:text-white">
                {t.authTitle}
              </CardTitle>
              <CardDescription className="text-gray-700 dark:text-gray-300">
                {t.authDescription}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="login" className="text-black dark:text-white">
                      {t.authLoginLabel}
                    </Label>
                    <Input
                      id="login"
                      type="text"
                      value="admin"
                      disabled
                      className="bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                      autoComplete="username"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password" className="text-black dark:text-white">
                      {t.authPasswordLabel}
                    </Label>
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-black dark:text-white"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {error}
                    </p>
                  )}
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 border border-black dark:border-white rounded-full h-10"
              >
                {loading ? t.authLoading : t.authLoginButton}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="absolute bottom-8 left-0 right-0 px-4">
          <div className="max-w-7xl mx-auto">
            <Breadcrumb>
              <BreadcrumbList className="flex items-center justify-center gap-3">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/" className="flex items-center gap-1.5 text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-400 font-medium">
                      <Home className="h-4 w-4" />
                      <span>{t.authHome}</span>
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-gray-400" />
                <BreadcrumbItem>
                  <ThemeToggle />
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-gray-400" />
                <BreadcrumbItem>
                  <LanguageSwitcher
                    currentLanguage={currentLanguage}
                    onLanguageChange={setCurrentLanguage}
                    dropdownDirection="up"
                  />
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      </div>
    </GridBackground>
  )
}
