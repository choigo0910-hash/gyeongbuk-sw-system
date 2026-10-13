"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardStat } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"
import { getUserRolesClient } from "@/lib/auth.client"
import { Role } from "@/types"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  FileText,
  ShoppingCart,
  RefreshCw,
  Calendar,
  Clock,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  Sparkles,
  HelpCircle,
  AlertCircle,
  ChevronRight,
  Building2,
  DollarSign,
  Bell
} from "lucide-react"

type BudgetStatus = {
  total: number
  used: number
  remaining: number
}

type RecentActivity = {
  id: string
  type: "budget" | "purchase" | "refund" | "program"
  title: string
  status: string
  date: string
  link: string
}

type PendingItem = {
  id: string
  type: "purchase" | "refund" | "program"
  title: string
  status: string
  date: string
  link: string
}

export default function PortalDashboard() {
  const supabase = createClient()
  const [roles, setRoles] = useState<Role[]>([])
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState<{
    budget: number
    purchase: number
    refund: number
    programs: number
  }>({ budget: 0, purchase: 0, refund: 0, programs: 0 })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus | null>(null)
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
  const [unreadNotifications, setUnreadNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const init = async () => {
      const userRoles = await getUserRolesClient()
      setRoles(userRoles)

      let currentCompanyId: string | null = null

      if (userRoles.includes(Role.COMPANY_USER) || userRoles.includes(Role.COMPANY_ADMIN)) {
        const company = await getPrimaryCompany()
        setCompanyName(company?.name || null)
        currentCompanyId = company?.id || null
        setCompanyId(currentCompanyId)
      }

      if (currentCompanyId) {
        await fetchDashboardData(currentCompanyId)
      } else {
        setLoading(false)
      }
    }
    init()
  }, [])

  const getPrimaryCompany = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // 먼저 is_primary: true인 기업을 찾음 (대표자)
    let { data } = await supabase
      .from("user_companies")
      .select(`
        company_id,
        companies (*)
      `)
      .eq("user_id", user.id)
      .eq("is_primary", true)
      .eq("status", "active")
      .maybeSingle()

    // is_primary: true인 기업이 없으면, 첫 번째 active 기업을 찾음 (팀원)
    if (!data) {
      const { data: firstCompany } = await supabase
        .from("user_companies")
        .select(`
          company_id,
          companies (*)
        `)
        .eq("user_id", user.id)
        .eq("status", "active")
        .is("deleted_at", null)
        .limit(1)
        .maybeSingle()

      data = firstCompany
    }

    const companies = data?.companies as any
    return Array.isArray(companies) ? companies[0] : companies
  }

  const fetchDashboardData = async (companyId: string) => {
    try {
      const currentYear = new Date().getFullYear()

      // 예산 통계
      const { data: budgets } = await supabase
        .from("budgets")
        .select("id, status, total_amount")
        .eq("company_id", companyId)
        .eq("fiscal_year", currentYear)
        .is("deleted_at", null)

      const approvedBudgets = budgets?.filter(b => b.status === "approved") || []
      const totalBudget = approvedBudgets.reduce((sum, b) => sum + (b.total_amount || 0), 0)

      // 구매요청 통계
      const { data: purchases } = await supabase
        .from("purchase_requests")
        .select("id, status")
        .eq("company_id", companyId)
        .in("status", ["submitted", "reviewing", "approved", "purchase_completed", "proof_submitted"])
        .is("deleted_at", null)

      const pendingPurchases = purchases?.filter(p =>
        ["submitted", "reviewing", "approved"].includes(p.status)
      ).length || 0

      // 환급신청 통계
      const { data: refunds } = await supabase
        .from("refund_applications")
        .select("id, status, approved_amount")
        .eq("company_id", companyId)
        .in("status", ["submitted", "reviewing", "approved", "processing", "completed"])
        .is("deleted_at", null)

      const pendingRefunds = refunds?.filter(r =>
        ["submitted", "reviewing", "approved", "processing"].includes(r.status)
      ).length || 0

      const totalRefundApproved = refunds?.filter(r => r.status === "completed")
        .reduce((sum, r) => sum + (r.approved_amount || 0), 0) || 0

      // 프로그램 참가 통계
      const { data: programs } = await supabase
        .from("program_applications")
        .select(`
          id,
          status,
          programs (
            id,
            name,
            starts_at,
            ends_at
          )
        `)
        .eq("applicant_id", (await supabase.auth.getUser()).data.user?.id || "")
        .in("status", ["approved", "completed"])
        .is("deleted_at", null)

      const activePrograms = programs?.filter((p: any) => {
        const now = new Date()
        const programData = Array.isArray(p.programs) ? p.programs[0] : p.programs
        const start = programData?.starts_at ? new Date(programData.starts_at) : null
        const end = programData?.ends_at ? new Date(programData.ends_at) : null
        return start && end && now >= start && now <= end && p.status === "approved"
      }) || []

      setStats({
        budget: totalBudget,
        purchase: pendingPurchases,
        refund: totalRefundApproved,
        programs: activePrograms.length,
      })

      // 최근 활동
      const activities: RecentActivity[] = []

      const { data: recentPurchases } = await supabase
        .from("purchase_requests")
        .select("id, item_name, status, created_at")
        .eq("company_id", companyId)
        .in("status", ["submitted", "reviewing", "approved", "purchase_completed", "proof_submitted"])
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(5)

      recentPurchases?.forEach(p => {
        activities.push({
          id: p.id,
          type: "purchase",
          title: `구매요청: ${p.item_name}`,
          status: p.status,
          date: p.created_at,
          link: `/portal/purchase-requests/${p.id}`,
        })
      })

      const { data: recentRefunds } = await supabase
        .from("refund_applications")
        .select("id, refund_recipient_name, status, created_at")
        .eq("company_id", companyId)
        .in("status", ["submitted", "reviewing", "approved", "processing", "completed"])
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(3)

      recentRefunds?.forEach(r => {
        activities.push({
          id: r.id,
          type: "refund",
          title: `환급신청: ${r.refund_recipient_name}`,
          status: r.status,
          date: r.created_at,
          link: `/portal/refunds/${r.id}`,
        })
      })

      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setRecentActivities(activities.slice(0, 6))

      // 대기 업무 (검토 대기 중인 항목)
      const pending: PendingItem[] = []

      // 검토 대기 중인 구매요청
      const { data: pendingPurchasesItems } = await supabase
        .from("purchase_requests")
        .select("id, item_name, status, created_at")
        .eq("company_id", companyId)
        .in("status", ["submitted", "reviewing"])
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(5)

      pendingPurchasesItems?.forEach(p => {
        pending.push({
          id: p.id,
          type: "purchase",
          title: p.item_name,
          status: p.status,
          date: p.created_at,
          link: `/portal/purchase-requests/${p.id}`,
        })
      })

      // 검토 대기 중인 환급신청
      const { data: pendingRefundsItems } = await supabase
        .from("refund_applications")
        .select("id, refund_recipient_name, status, created_at")
        .eq("company_id", companyId)
        .in("status", ["submitted", "reviewing"])
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(5)

      pendingRefundsItems?.forEach(r => {
        pending.push({
          id: r.id,
          type: "refund",
          title: `환급: ${r.refund_recipient_name}`,
          status: r.status,
          date: r.created_at,
          link: `/portal/refunds/${r.id}`,
        })
      })

      pending.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      setPendingItems(pending.slice(0, 5))

      // 안읽은 알림 가져오기
      const { data: notifications } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id || "")
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(5)

      setUnreadNotifications(notifications || [])
      setUnreadCount((notifications || []).length)

      // 예산 현황
      if (approvedBudgets.length > 0) {
        const { data: spentPurchases } = await supabase
          .from("purchase_requests")
          .select("approved_amount")
          .eq("company_id", companyId)
          .in("status", ["proof_approved", "completed"])
          .is("deleted_at", null)

        const spent = spentPurchases?.reduce((sum, p) => sum + (p.approved_amount || 0), 0) || 0

        setBudgetStatus({
          total: totalBudget,
          used: spent,
          remaining: totalBudget - spent,
        })
      }
    } catch (error) {
      console.error("대시보드 데이터 조회 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      "submitted": { label: "제출됨", className: "badge-neutral" },
      "reviewing": { label: "검토 중", className: "badge-neutral" },
      "approved": { label: "승인됨", className: "badge-success" },
      "rejected": { label: "반려됨", className: "badge-error" },
      "purchase_completed": { label: "구매 완료", className: "badge-success" },
      "proof_submitted": { label: "증빙 제출", className: "badge-neutral" },
      "completed": { label: "완료", className: "badge-success" },
      "processing": { label: "처리 중", className: "badge-warning" },
    }
    return badges[status] || { label: status, className: "badge-neutral" }
  }

  const getActivityIcon = (type: string) => {
    const icons = {
      "budget": <FileText className="w-4 h-4 text-pink-600" />,
      "purchase": <ShoppingCart className="w-4 h-4 text-purple-600" />,
      "refund": <RefreshCw className="w-4 h-4 text-emerald-600" />,
      "program": <Calendar className="w-4 h-4 text-orange-600" />,
    }
    return icons[type as keyof typeof icons] || <Clock className="w-4 h-4 text-gray-400" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-gray-400">
          <div className="w-4 h-4 border-2 border-pink-600 border-t-transparent rounded-full animate-spin" />
          <span>로딩 중...</span>
        </div>
      </div>
    )
  }

  const currentYear = new Date().getFullYear()

  // 기업이 배정되지 않은 경우
  if (!companyId) {
    return <NoCompanyAssigned onCompanyAssigned={(id, name) => {
      setCompanyId(id)
      setCompanyName(name)
      fetchDashboardData(id)
    }} />
  }

  return (
    <div className="space-y-8">
      {/* Company Name */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="p-4 sm:p-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {companyName || "기업명"}
          </h1>
        </div>
      </div>

      {/* Unread Notifications Alert */}
      {unreadCount > 0 && (
        <Card className="border-primary bg-primary-50/50 animate-slide-up stagger-1">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-100">
                <Bell className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  새로운 알림이 <span className="font-bold text-primary-600">{unreadCount}</span>건 있습니다
                </p>
                {unreadNotifications.length > 0 && (
                  <p className="text-xs text-gray-600 mt-1 truncate">
                    {unreadNotifications[0].title}
                    {unreadNotifications.length > 1 && ` 외 ${unreadNotifications.length - 1}건`}
                  </p>
                )}
              </div>
              <Link href="/portal/notifications">
                <Button size="sm" className="rounded-xl bg-primary-600 text-white hover:bg-primary-700">
                  확인하기
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/portal/budgets" className="block">
          <CardStat
            label="승인 예산"
            value={stats.budget > 0 ? formatCurrency(stats.budget, { style: 'man' }) : "-"}
            icon={<DollarSign className="w-5 h-5" />}
            color="primary"
            className="animate-slide-up stagger-1 cursor-pointer hover:shadow-md transition-shadow"
          >
            <p className="text-xs text-gray-400 mt-1">{currentYear}년도</p>
          </CardStat>
        </Link>

        <Link href="/portal/purchase-requests" className="block">
          <CardStat
            label="진행 구매"
            value={stats.purchase}
            icon={<ShoppingCart className="w-5 h-5" />}
            color="purple"
            className="animate-slide-up stagger-2 cursor-pointer hover:shadow-md transition-shadow"
          >
            <p className="text-xs text-gray-400 mt-1">승인/집행 중</p>
          </CardStat>
        </Link>

        <Link href="/portal/refunds" className="block">
          <CardStat
            label="환급 금액"
            value={stats.refund > 0 ? formatCurrency(stats.refund, { style: 'man' }) : "-"}
            icon={<RefreshCw className="w-5 h-5" />}
            color="emerald"
            className="animate-slide-up stagger-3 cursor-pointer hover:shadow-md transition-shadow"
          >
            <p className="text-xs text-gray-400 mt-1">누계</p>
          </CardStat>
        </Link>

        <Link href="/portal/programs" className="block">
          <CardStat
            label="참가 프로그램"
            value={stats.programs}
            icon={<Calendar className="w-5 h-5" />}
            color="orange"
            className="animate-slide-up stagger-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            <p className="text-xs text-gray-400 mt-1">진행 중인 프로그램</p>
          </CardStat>
        </Link>
      </div>

      {/* Budget Status Card */}
      {budgetStatus && budgetStatus.total > 0 && (
        <Card className="animate-slide-up">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>예산 사용 현황</CardTitle>
                <CardDescription>승인된 예산 대비 집행 현황</CardDescription>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-50">
                <TrendingUp className="h-6 w-6 text-pink-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-sm text-gray-500">전체 예산</span>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {(budgetStatus.total / 10000).toFixed(0)}
                    <span className="text-base font-normal text-gray-500 ml-1">만원</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-500">사용률</span>
                  <p className="text-lg font-semibold text-pink-600 mt-1">
                    {((budgetStatus.used / budgetStatus.total) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 font-medium">집행 금액</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(budgetStatus.used, { style: 'man' })}
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-pink-500 to-pink-600 transition-all duration-700 ease-out"
                    style={{ width: `${Math.min((budgetStatus.used / budgetStatus.total) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 font-medium">잔여 예산</span>
                  <span className="font-semibold text-emerald-600">
                    {formatCurrency(budgetStatus.remaining, { style: 'man' })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle>최근 활동</CardTitle>
          <CardDescription>최근 진행한 업무 현황</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivities.length > 0 ? (
            <div className="space-y-1.5">
              {recentActivities.map((activity) => {
                const badge = getStatusBadge(activity.status)
                return (
                  <Link
                    key={activity.id}
                    href={activity.link}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 group-hover:bg-white group-hover:shadow-md transition-all">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{activity.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(activity.date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <Badge className={badge.className}>{badge.label}</Badge>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 mx-auto mb-3">
                <Clock className="w-7 h-7 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">최근 활동이 없습니다.</p>
              <p className="text-xs text-gray-400 mt-1">첫 요청을 시작해보세요</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Banner - 토스 스타일 */}
      <Card className="bg-gradient-to-br from-primary to-secondary border-0 text-white shadow-primary-lg overflow-hidden animate-slide-up">
        {/* Decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-white/5 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl"></div>
        <CardContent className="p-6 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <HelpCircle className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">도움이 필요하신가요?</h3>
              <p className="text-white/90 text-sm">
                우측 하단의 챗봇을 통해 실시간 문의가 가능하거나, 가이드라인을 확인하세요.
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Link href="/portal/guidelines" className="flex-1 sm:flex-none">
                <Button size="default" className="bg-white text-primary hover:bg-white/90 w-full sm:w-auto rounded-xl shadow-sm">
                  가이드라인 보기
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 기업이 배정되지 않은 사용자를 위한 컴포넌트
function NoCompanyAssigned({ onCompanyAssigned }: { onCompanyAssigned: (id: string, name: string) => void }) {
  const supabase = createClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // 기업 검색
  useEffect(() => {
    const searchCompanies = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([])
        return
      }

      const { data } = await supabase
        .from("companies")
        .select("id, name, business_number")
        .or(`name.ilike.%${searchQuery}%,business_number.ilike.%${searchQuery}%`)
        .eq("status", "active")
        .limit(10)

      setSearchResults(data || [])
    }

    const timeout = setTimeout(searchCompanies, 300)
    return () => clearTimeout(timeout)
  }, [searchQuery])

  // 기업 선택 요청
  const handleRequestJoin = async () => {
    if (!selectedCompany) {
      setError("기업을 선택해주세요.")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError("로그인이 필요합니다.")
        return
      }

      // 이미 소속된 기업이 있는지 확인 (삭제된 기업 포함)
      const { data: existing } = await supabase
        .from("user_companies")
        .select("*")
        .eq("user_id", user.id)
        .eq("company_id", selectedCompany.id)
        .maybeSingle()

      if (existing) {
        if (existing.deleted_at) {
          // 삭제된 레코드가 있으면 복구
          const { error: restoreError } = await supabase
            .from("user_companies")
            .update({
              deleted_at: null,
              status: "pending",
              position: "팀원",
              is_primary: false,
            })
            .eq("id", existing.id)

          if (restoreError) {
            setError("기업 가입 요청에 실패했습니다: 복구 실패")
            return
          }

          setSuccess("기업 대표자의 승인을 기다려주세요. 영업일 기준 1~2일 소요될 수 있습니다.")
          setSearchQuery("")
          setSearchResults([])
          setSelectedCompany(null)
          setLoading(false)
          return
        } else {
          // 이미 활성화된 기업 소속이 있음
          setError("이미 이 기업에 가입 요청을 보냈거나 소속되어 있습니다.")
          return
        }
      }

      // 기업 가입 요청 (status: pending)
      const { error: joinError } = await supabase
        .from("user_companies")
        .insert({
          user_id: user.id,
          company_id: selectedCompany.id,
          position: "팀원",
          is_primary: false,
          status: "pending",
        })

      if (joinError) {
        console.error("기업 가입 요청 실패:", joinError)
        setError(`기업 가입 요청에 실패했습니다: ${joinError.message}`)
        return
      }

      setSuccess("기업 대표자의 승인을 기다려주세요. 영업일 기준 1~2일 소요될 수 있습니다.")
      setSearchQuery("")
      setSearchResults([])
      setSelectedCompany(null)
    } catch (err) {
      setError("오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-amber-100 rounded-full">
              <Building2 className="w-8 h-8 text-amber-600" />
            </div>
          </div>
          <CardTitle className="text-xl">기업이 배정되지 않았습니다</CardTitle>
          <CardDescription>
            소속할 기업을 검색하고 가입 요청을 보내세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>기업 검색</Label>
            <Input
              placeholder="기업명 또는 사업자등록번호 입력"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11"
            />
          </div>

          {searchResults.length > 0 && (
            <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
              <Label className="text-xs text-muted-foreground">검색 결과</Label>
              {searchResults.map((company) => (
                <div
                  key={company.id}
                  onClick={() => setSelectedCompany(company)}
                  className={`p-3 rounded cursor-pointer transition-colors ${
                    selectedCompany?.id === company.id
                      ? "bg-primary-50 border border-primary-200"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="font-medium">{company.name}</div>
                  <div className="text-xs text-muted-foreground">{company.business_number || "-"}</div>
                </div>
              ))}
            </div>
          )}

          {selectedCompany && (
            <div className="text-sm text-green-600 bg-green-50 border border-green-200 p-3 rounded">
              ✓ 선택된 기업: {selectedCompany.name}
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-green-600 bg-green-50 border border-green-200 p-3 rounded">
              {success}
            </div>
          )}

          <Button
            onClick={handleRequestJoin}
            disabled={!selectedCompany || loading}
            className="w-full h-11"
          >
            {loading ? "요청 중..." : "기업 가입 요청"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
