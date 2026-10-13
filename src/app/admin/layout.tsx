"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { isAdmin } from "@/lib/auth"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Shield,
  Building2,
  Users,
  FileText,
  ShoppingCart,
  RefreshCw,
  Calendar,
  UserCheck,
  Award,
  BookOpen,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  FolderOpen,
  CheckCircle
} from "lucide-react"

export default function AdminLayout({
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

      if (!user) {
        router.push("/login")
        return
      }

      // 사용자 프로필에서 이름 가져오기
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("name")
        .eq("user_id", user.id)
        .maybeSingle()

      setUserName(profile?.name || user.email || null)

      // 소속 기업명 가져오기 (관리자는 여러 기업을 관리할 수 있으므로 첫 번째 기업)
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
    init()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const navigation = [
    { name: "대시보드", href: "/admin/dashboard", icon: Shield },
    { name: "승인 대기 목록", href: "/admin/approvals", icon: CheckCircle },
    { name: "기업 관리", href: "/admin/companies", icon: Building2 },
    { name: "사용자 관리", href: "/admin/users", icon: Users },
    { name: "예산 관리", href: "/admin/budgets", icon: FileText },
    { name: "구매요청 관리", href: "/admin/purchase-requests", icon: ShoppingCart },
    { name: "환급 관리", href: "/admin/refunds", icon: RefreshCw },
    { name: "프로그램 관리", href: "/admin/programs", icon: Calendar },
    { name: "신청서 관리", href: "/admin/applications", icon: UserCheck },
    { name: "확인서 관리", href: "/admin/certificates", icon: Award },
    { name: "기업 서류 관리", href: "/admin/company-documents", icon: FolderOpen },
    { name: "가이드라인", href: "/admin/guidelines", icon: BookOpen },
    { name: "챗봇 관리", href: "/admin/chatbot", icon: MessageSquare },
    { name: "알림 관리", href: "/admin/notifications", icon: Bell },
    { name: "설정", href: "/admin/settings", icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - 깔끔한 디자인 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
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
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <img
              src="/postech-logo.jpg"
              alt="POSTECH Logo"
              className="h-7 w-auto object-contain"
            />
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-gray-900 leading-tight" style={{ fontSize: "17px", lineHeight: "1.2" }}>
                경북SW성장기업육성지원사업
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">관리자 포털</p>
            </div>
          </Link>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden md:block h-6 w-px bg-gray-200" />
            <div className="hidden md:flex flex-col items-end px-3 py-1 rounded-lg bg-primary-50 text-primary-700">
              <span className="text-xs font-semibold">{userName}</span>
              <span className="text-[10px] text-primary-600">
                {companyName || "관리자"}
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
