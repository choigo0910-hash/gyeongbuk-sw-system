"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardStat } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Building2,
  FileText,
  ShoppingCart,
  RefreshCw,
  Calendar,
  Users,
  TrendingUp,
  CheckCircle,
  Clock,
  ArrowRight,
  Shield,
  Settings,
  ChevronRight
} from "lucide-react"

type PendingItem = {
  id: string
  type: "budget" | "purchase" | "refund"
  title: string
  company: string
  submittedAt: string
  link: string
  urgent?: boolean
}

type MonthlyStats = {
  month: string
  budget: number
  purchase: number
  refund: number
}

export default function AdminDashboard() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<{
    companies: number
    users: number
    pendingBudgets: number
    pendingPurchases: number
    pendingRefunds: number
    pendingPrograms: number
    certificates: number
  }>({
    companies: 0,
    users: 0,
    pendingBudgets: 0,
    pendingPurchases: 0,
    pendingRefunds: 0,
    pendingPrograms: 0,
    certificates: 0,
  })
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const currentYear = new Date().getFullYear()

      // 전체 기업 수
      const { count: companyCount } = await supabase
        .from("companies")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)

      // 전체 사용자 수 (user_profiles 테이블 사용)
      const { count: userCount } = await supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true })

      // 예산 통계
      const { data: budgets } = await supabase
        .from("budgets")
        .select("id, status, created_at")
        .is("deleted_at", null)

      const pendingBudgets = budgets?.filter(b =>
        ["submitted", "reviewing", "revision_requested"].includes(b.status)
      ).length || 0

      // 구매요청 통계
      const { data: purchases } = await supabase
        .from("purchase_requests")
        .select("id, status, created_at, companies (name)")
        .in("status", ["submitted", "reviewing", "approved", "purchase_completed", "proof_submitted"])
        .is("deleted_at", null)

      const pendingPurchases = purchases?.filter(p =>
        ["submitted", "reviewing"].includes(p.status)
      ).length || 0

      // 환급신청 통계
      const { data: refunds } = await supabase
        .from("refund_applications")
        .select("id, status, created_at, companies (name)")
        .in("status", ["submitted", "reviewing", "approved", "processing"])
        .is("deleted_at", null)

      const pendingRefunds = refunds?.filter(r =>
        ["submitted", "reviewing"].includes(r.status)
      ).length || 0

      // 프로그램 신청 통계
      const { data: programs } = await supabase
        .from("program_applications")
        .select("id, status, created_at")
        .in("status", ["submitted", "reviewing"])
        .is("deleted_at", null)

      const pendingPrograms = programs?.length || 0

      // 확인서 발급 통계
      const { count: certificateCount } = await supabase
        .from("certificates")
        .select("*", { count: "exact", head: true })
        .gte("created_at", new Date(currentYear, 0, 1).toISOString())
        .is("deleted_at", null)

      setStats({
        companies: companyCount || 0,
        users: userCount || 0,
        pendingBudgets,
        pendingPurchases,
        pendingRefunds,
        pendingPrograms,
        certificates: certificateCount || 0,
      })

      // 대기 중인 항목
      const pending: PendingItem[] = []

      const { data: pendingBudgetsData } = await supabase
        .from("budgets")
        .select(`id, status, created_at, companies (name)`)
        .in("status", ["submitted", "reviewing", "revision_requested"])
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(5)

      pendingBudgetsData?.forEach((b: any) => {
        const companyName = Array.isArray(b.companies)
          ? b.companies[0]?.name
          : b.companies?.name

        pending.push({
          id: b.id,
          type: "budget",
          title: `${companyName || "알 수 없음"} 예산서`,
          company: companyName || "알 수 없음",
          submittedAt: b.created_at,
          link: `/admin/budgets/${b.id}/review`,
          urgent: b.status === "revision_requested",
        })
      })

      const { data: pendingPurchasesData } = await supabase
        .from("purchase_requests")
        .select(`id, status, created_at, item_name, companies (name)`)
        .in("status", ["submitted", "reviewing"])
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(5)

      pendingPurchasesData?.forEach((p: any) => {
        const companyName = Array.isArray(p.companies)
          ? p.companies[0]?.name
          : p.companies?.name

        pending.push({
          id: p.id,
          type: "purchase",
          title: `구매: ${p.item_name}`,
          company: companyName || "알 수 없음",
          submittedAt: p.created_at,
          link: `/admin/purchase-requests/${p.id}/review`,
        })
      })

      const { data: pendingRefundsData } = await supabase
        .from("refund_applications")
        .select(`id, status, created_at, refund_recipient_name, companies (name)`)
        .in("status", ["submitted", "reviewing"])
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(3)

      pendingRefundsData?.forEach((r: any) => {
        const companyName = Array.isArray(r.companies)
          ? r.companies[0]?.name
          : r.companies?.name

        pending.push({
          id: r.id,
          type: "refund",
          title: `환급: ${r.refund_recipient_name}`,
          company: companyName || "알 수 없음",
          submittedAt: r.created_at,
          link: `/admin/refunds/${r.id}/review`,
        })
      })

      pending.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      setPendingItems(pending.slice(0, 8))

      // 월별 통계 (최근 6개월)
      const monthlyData: MonthlyStats[] = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const month = date.toLocaleString("ko-KR", { month: "short" })
        const startDate = new Date(date.getFullYear(), date.getMonth(), 1)
        const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)

        const { count: monthBudget } = await supabase
          .from("budgets")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString())
          .is("deleted_at", null)

        const { count: monthPurchase } = await supabase
          .from("purchase_requests")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString())
          .is("deleted_at", null)

        const { count: monthRefund } = await supabase
          .from("refund_applications")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString())
          .is("deleted_at", null)

        monthlyData.push({
          month,
          budget: monthBudget || 0,
          purchase: monthPurchase || 0,
          refund: monthRefund || 0,
        })
      }
      setMonthlyStats(monthlyData)
    } catch (error) {
      console.error("대시보드 데이터 조회 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  const getPendingIcon = (type: string) => {
    const icons = {
      "budget": <FileText className="w-4 h-4 text-blue-600" />,
      "purchase": <ShoppingCart className="w-4 h-4 text-purple-600" />,
      "refund": <RefreshCw className="w-4 h-4 text-emerald-600" />,
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
  const maxValue = Math.max(
    ...monthlyStats.map(m => Math.max(m.budget, m.purchase, m.refund)),
    1
  )

  return (
    <div className="space-y-8">
      {/* Welcome Banner - 깔끔한 디자인 */}
      <div className="rounded-2xl bg-white border border-gray-200 p-6 sm:p-8 shadow-sm animate-slide-up">
        <div className="flex items-start justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
                <Shield className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">{currentYear}년도 사업 운영</p>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                  경북SW성장기업육성지원사업
                </h1>
              </div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed max-w-2xl">
              기업, 예산, 구매, 환급, 프로그램 등 전체 사업 현황을 한눈에 확인하고 효율적으로 관리하세요.
            </p>

            {/* Quick stats pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100">
                <Building2 className="h-4 w-4 text-gray-600" />
                <span className="text-gray-700 text-sm font-medium">기업 {stats.companies}개</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100">
                <FileText className="h-4 w-4 text-gray-600" />
                <span className="text-gray-700 text-sm font-medium">예산 {stats.pendingBudgets}건 대기</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100">
                <ShoppingCart className="h-4 w-4 text-gray-600" />
                <span className="text-gray-700 text-sm font-medium">구매 {stats.pendingPurchases}건 대기</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100">
                <RefreshCw className="h-4 w-4 text-gray-600" />
                <span className="text-gray-700 text-sm font-medium">환급 {stats.pendingRefunds}건 대기</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Items Alert - 토스 스타일 */}
      {pendingItems.length > 0 && (
        <Card className="border-warning bg-warning-light/50 animate-slide-up">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-warning-light">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  검토 대기 중인 요청이 <span className="font-bold text-warning">{pendingItems.length}</span>건 있습니다
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  빠른 처리를 위해 확인 바랍니다
                </p>
              </div>
              <Link href="/admin/applications">
                <Button size="sm" className="rounded-xl bg-warning text-white hover:bg-warning/90">
                  확인하기
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        <Link href="/admin/budgets">
          <CardStat
            label="예산 검토 대기"
            value={stats.pendingBudgets}
            icon={<FileText className="w-5 h-5" />}
            color="orange"
            className="cursor-pointer hover:shadow-md transition-shadow"
          />
        </Link>
        <Link href="/admin/purchase-requests">
          <CardStat
            label="구매요청 대기"
            value={stats.pendingPurchases}
            icon={<ShoppingCart className="w-5 h-5" />}
            color="emerald"
            className="cursor-pointer hover:shadow-md transition-shadow"
          />
        </Link>
        <Link href="/admin/refunds">
          <CardStat
            label="환급승인 대기"
            value={stats.pendingRefunds}
            icon={<RefreshCw className="w-5 h-5" />}
            color="primary"
            className="cursor-pointer hover:shadow-md transition-shadow"
          />
        </Link>
        <Link href="/admin/programs">
          <CardStat
            label="프로그램 검토"
            value={stats.pendingPrograms}
            icon={<Calendar className="w-5 h-5" />}
            color="pink"
            className="cursor-pointer hover:shadow-md transition-shadow"
          />
        </Link>
        <Link href="/admin/certificates">
          <CardStat
            label="확인서 발급"
            value={stats.certificates}
            icon={<CheckCircle className="w-5 h-5" />}
            color="blue"
            className="cursor-pointer hover:shadow-md transition-shadow"
          >
            <p className="text-xs text-gray-400">{currentYear}년</p>
          </CardStat>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>월별 현황</CardTitle>
                <CardDescription>최근 6개월간 신청/발급 현황</CardDescription>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-50">
                <TrendingUp className="h-5 w-5 text-pink-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                  <span className="text-gray-500">예산</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-purple-600" />
                  <span className="text-gray-500">구매</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span className="text-gray-500">환급</span>
                </div>
              </div>
              <div className="h-40 flex items-end gap-1">
                {monthlyStats.map((stat, index) => (
                  <div key={index} className="flex-1 flex gap-0.5 items-end justify-center">
                    <div
                      className="w-full max-w-[10px] bg-blue-600 rounded-t transition-all hover:bg-blue-700"
                      style={{ height: `${Math.max((stat.budget / maxValue) * 100, 4)}%` }}
                    />
                    <div
                      className="w-full max-w-[10px] bg-purple-600 rounded-t transition-all hover:bg-purple-700"
                      style={{ height: `${Math.max((stat.purchase / maxValue) * 100, 4)}%` }}
                    />
                    <div
                      className="w-full max-w-[10px] bg-emerald-600 rounded-t transition-all hover:bg-emerald-700"
                      style={{ height: `${Math.max((stat.refund / maxValue) * 100, 4)}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-400 px-1">
                {monthlyStats.map((stat, index) => (
                  <span key={index}>{stat.month}</span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>대기 중인 검토</CardTitle>
                <CardDescription>승인/검토가 필요한 항목</CardDescription>
              </div>
              {pendingItems.length > 0 && (
                <Badge className="bg-orange-100 text-orange-700 border-0">
                  {pendingItems.length}건
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {pendingItems.length > 0 ? (
              <div className="space-y-1 max-h-52 overflow-y-auto">
                {pendingItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.link}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                      {getPendingIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{item.title}</p>
                      <p className="text-xs text-gray-400 truncate">{item.company}</p>
                    </div>
                    <div className="text-xs text-gray-400 shrink-0">
                      {new Date(item.submittedAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-pink-600 transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400">대기 중인 항목이 없습니다.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 링크</CardTitle>
          <CardDescription>자주 사용하는 관리 기능</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/budgets"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-200"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm text-gray-900">예산 검토</h3>
              <p className="text-xs text-gray-400">예산서 승인</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-colors shrink-0" />
          </Link>

          <Link
            href="/admin/purchase-requests"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-200"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50">
              <ShoppingCart className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm text-gray-900">구매 검토</h3>
              <p className="text-xs text-gray-400">구매요청 승인</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-purple-600 transition-colors shrink-0" />
          </Link>

          <Link
            href="/admin/refunds"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-200"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
              <RefreshCw className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm text-gray-900">환급 승인</h3>
              <p className="text-xs text-gray-400">환급신청 처리</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-600 transition-colors shrink-0" />
          </Link>

          <Link
            href="/admin/programs"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-200"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm text-gray-900">프로그램 관리</h3>
              <p className="text-xs text-gray-400">프로그램 및 참가자</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-orange-600 transition-colors shrink-0" />
          </Link>
        </CardContent>
      </Card>

      {/* System Info - 토스 스타일 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">기업 관리</h3>
                <p className="text-sm text-gray-600 mb-4">
                  기업 정보를 등록하고 관리할 수 있습니다.
                </p>
                <Link href="/admin/companies">
                  <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100 rounded-xl">
                    기업 관리
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">사용자 관리</h3>
                <p className="text-sm text-gray-600 mb-4">
                  시스템 사용자와 권한을 관리할 수 있습니다.
                </p>
                <Link href="/admin/users">
                  <Button variant="outline" size="sm" className="border-emerald-300 text-emerald-700 hover:bg-emerald-100 rounded-xl">
                    사용자 관리
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
