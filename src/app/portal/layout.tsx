"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getUserRolesClient } from "@/lib/auth.client"
import { NotificationDropdown } from "@/components/notifications/notification-dropdown"
import { checkUnsavedChanges } from "@/hooks/useUnsavedChanges"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  RefreshCw,
  Calendar,
  Award,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  FolderOpen,
  CheckCircle,
  Building
} from "lucide-react"

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [userName, setUserName] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // 사용자 프로필에서 이름 가져오기
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("name")
          .eq("user_id", user.id)
          .maybeSingle()

        setUserName(profile?.name || user.email || null)

        // 소속 기업명 가져오기
        const { data: userCompany } = await supabase
          .from("user_companies")
          .select(`
            companies (name)
          `)
          .eq("user_id", user.id)
          .eq("status", "active")
          .is("deleted_at", null)
          .limit(1)
          .maybeSingle()

        if (userCompany?.companies) {
          const company = Array.isArray(userCompany.companies)
            ? userCompany.companies[0]
            : userCompany.companies
          setCompanyName(company?.name || null)
        }
      }
    }
    init()
  }, [])

  // 네비게이션 클릭 시 변경사항 확인
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a[href]')

      // 현재 페이지가 아니고, 내부 링크인 경우에만 확인
      if (!link) return

      const href = link.getAttribute('href')
      if (!href) return

      // 외부 링크나 로그아웃 버튼은 무시
      if (href.startsWith('http') || href.includes('logout')) return

      // 변경사항 확인
      const { hasChanges, message } = checkUnsavedChanges()
      if (hasChanges) {
        e.preventDefault()
        e.stopPropagation()

        if (window.confirm(message)) {
          // 변경사항 리셋 후 이동
          window.__hasUnsavedChanges__ = false
          router.push(href)
        }
      }
    }

    // 캡처 단계에서 이벤트를 가로챕니다
    document.addEventListener('click', handleClick, true)

    return () => {
      document.removeEventListener('click', handleClick, true)
    }
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const navigation = [
    { name: "대시보드", href: "/portal/dashboard", icon: LayoutDashboard },
    { name: "기업 및 팀원 관리", href: "/portal/company-settings", icon: Building },
    { name: "예산관리", href: "/portal/budgets", icon: FileText },
    { name: "구매요청", href: "/portal/purchase-requests", icon: ShoppingCart },
    { name: "환급신청", href: "/portal/refunds", icon: RefreshCw },
    { name: "프로그램", href: "/portal/programs", icon: Calendar },
    { name: "기업 서류", href: "/portal/company-documents", icon: FolderOpen },
    { name: "프로그램 신청 내역", href: "/portal/my-applications", icon: Calendar },
    { name: "확인서", href: "/portal/certificates", icon: Award },
    { name: "가이드라인", href: "/portal/guidelines", icon: BookOpen },
    { name: "설정", href: "/portal/settings/notifications", icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-surface-variant">
      {/* Header - 토스 스타일 */}
      <header className="header sticky top-0 z-50">
        <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Logo - POSTECH 로고 */}
          <Link href="/portal/dashboard" className="flex items-center gap-3">
            <img
              src="/postech-logo.jpg"
              alt="POSTECH Logo"
              className="h-7 w-auto object-contain"
            />
            <div className="block">
              <h1 className="font-bold text-gray-900 leading-tight" style={{ fontSize: "17px", lineHeight: "1.2" }}>
                경북SW성장기업육성지원사업
              </h1>
            </div>
          </Link>

          {/* Right side - 토스 스타일 */}
          <div className="ml-auto flex items-center gap-3">
            <NotificationDropdown />
            <div className="hidden md:block h-6 w-px bg-gray-200" />
            <div className="hidden md:flex flex-col items-end px-3 py-1 rounded-lg bg-primary-50 text-primary-700">
              <span className="text-xs font-semibold">{userName}</span>
              <span className="text-[10px] text-primary-600">
                {companyName || "소속 기업 없음(신청필요)"}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="rounded-full"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar - Desktop 토스 스타일 */}
        <aside className="hidden lg:block sidebar h-[calc(100vh-4rem)] sticky top-16">
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "nav-item",
                    isActive && "active"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.name}</span>
                  {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Mobile Menu 토스 스타일 */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}>
            <aside
              className="sidebar h-full shadow-xl animate-slide-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "nav-item",
                        isActive && "active"
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>{item.name}</span>
                      {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                    </Link>
                  )
                })}
              </div>
            </aside>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 min-h-[calc(100vh-4rem)]">
          <div className="p-4 lg:p-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
