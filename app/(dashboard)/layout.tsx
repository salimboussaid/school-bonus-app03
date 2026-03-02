"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { GridBackground } from "@/components/ui/grid-background"
import { LanguageProvider, useLanguage } from "@/lib/language-context"

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { language, setLanguage } = useLanguage()

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar 
        currentLanguage={language} 
        onLanguageChange={setLanguage}
      />
      <SidebarInset>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <GridBackground>
      <LanguageProvider>
        <DashboardContent>{children}</DashboardContent>
      </LanguageProvider>
    </GridBackground>
  )
}
