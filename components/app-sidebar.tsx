"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { User2, Users, Asterisk, Gift, ShoppingBag, History, LogOut, Globe, Sun, ListTodo, FolderKanban } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { clearAuthCredentials } from "@/lib/api"
import { Language, translations } from "@/lib/translations"
import { useTheme } from "next-themes"

const languages = [
  { code: "en" as Language, name: "English", flag: "🇬🇧" },
  { code: "ru" as Language, name: "Русский", flag: "🇷🇺" },
  { code: "fr" as Language, name: "Français", flag: "🇫🇷" },
]

interface AppSidebarProps {
  currentLanguage?: Language
  onLanguageChange?: (lang: Language) => void
}

export function AppSidebar({ currentLanguage = "ru", onLanguageChange }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [showLangMenu, setShowLangMenu] = React.useState(false)
  const [showLogoutMenu, setShowLogoutMenu] = React.useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const t = translations[currentLanguage]

  const menuItems = [
    {
      title: t.sidebarProfile,
      icon: User2,
      href: "/profile",
    },
    {
      title: t.sidebarUsers,
      icon: Users,
      href: "/users",
    },
    {
      title: t.sidebarGroups,
      icon: Asterisk,
      href: "/groups",
    },
    {
      title: t.sidebarGifts,
      icon: Gift,
      href: "/gifts",
    },
    {
      title: t.sidebarOrders,
      icon: ShoppingBag,
      href: "/orders",
    },
    {
      title: t.sidebarHistory,
      icon: History,
      href: "/history",
    },
    {
      title: t.sidebarTasks,
      icon: ListTodo,
      href: "/tasks",
    },
    {
      title: t.sidebarProjects,
      icon: FolderKanban,
      href: "/projects",
    },
  ]

  const handleLogout = () => {
    setShowLogoutMenu(false)
    clearAuthCredentials()
    router.push("/auth")
  }

  const handleLanguageSelect = (lang: Language) => {
    onLanguageChange?.(lang)
    setShowLangMenu(false)
  }

  const currentLang = languages.find((l) => l.code === currentLanguage)

  return (
    <Sidebar className="border-r border-gray-200 dark:border-gray-800">
      <SidebarHeader className="border-b border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-black dark:bg-white flex items-center justify-center">
            <Gift className="h-6 w-6 text-white dark:text-black" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">School Bonus</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-4">
        <SidebarGroup>
          <div className="text-xs text-gray-500 dark:text-gray-400 px-3 mb-2 font-medium">
            {t.sidebarSchoolBonus}
          </div>
          <SidebarMenu>
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link href={item.href}>
                      <Icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-gray-200 dark:border-gray-800 p-3 space-y-2">
        {/* Language Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-2 px-3 py-2 w-full text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Globe className="h-4 w-4" />
            <span className="flex-1">{currentLang?.name}</span>
            <span className="text-xs">{currentLang?.flag}</span>
          </button>
          
          {showLangMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg overflow-hidden z-50">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang.code)}
                  className="flex items-center gap-2 px-3 py-2 w-full text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <span>{lang.flag}</span>
                  <span className="flex-1 text-gray-700 dark:text-gray-300">{lang.name}</span>
                  {lang.code === currentLanguage && (
                    <span className="text-xs text-gray-500">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        {mounted && (
          <div className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300">
            <Sun className="h-4 w-4" />
            <span className="flex-1 text-sm">{t.sidebarTheme}</span>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked: boolean) => setTheme(checked ? "dark" : "light")}
            />
          </div>
        )}

        {/* User Profile with Logout */}
        <div className="relative">
          <button
            onClick={() => setShowLogoutMenu(!showLogoutMenu)}
            className="flex items-center gap-3 px-2 py-2 w-full hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src="https://github.com/shadcn.png" alt="Admin" />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                A
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">admin</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">admin@school.com</p>
            </div>
            <LogOut className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </button>

          {showLogoutMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg overflow-hidden z-50">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 w-full text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>{t.sidebarLogout}</span>
              </button>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
