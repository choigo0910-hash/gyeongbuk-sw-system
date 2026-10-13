"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

interface Budget {
  id: string
  fiscal_year: number
  status: string
  total_amount: number
  created_at: string
  version?: number
}

interface BudgetItem {
  id: string
  budget_id: string
  category: string
  amount: number
}

interface PurchaseRequest {
  id: string
  item_name: string
  vendor: string
  approved_amount: number | null
  paid_amount: number | null
  requested_amount: number
  status: string
  purchase_date: string | null
  category: string
  created_at: string
}

interface BudgetChange {
  id: string
  budget_id: string
  version: number
  change_type: string
  reason: string
  total_amount: number | null
  created_at: string
}

interface CategoryBudget {
  category: string
  totalBudget: number
  totalSpent: number
  remaining: number
}

interface RefundApplication {
  id: string
  refund_recipient_name: string
  requested_amount: number
  approved_amount: number | null
  paid_amount: number | null
  status: string
  payment_date: string
  vendor: string
  category: string
  created_at: string
}

const statusLabels: Record<string, string> = {
  draft: "임시저장",
  submitted: "제출됨",
  reviewing: "검토중",
  revision_requested: "보완요청",
  approved: "승인완료",
  rejected: "반려",
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-blue-100 text-blue-700",
  reviewing: "bg-yellow-100 text-yellow-700",
  revision_requested: "bg-orange-100 text-orange-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
}

const purchaseStatusLabels: Record<string, string> = {
  draft: "임시저장",
  submitted: "제출됨",
  reviewing: "검토중",
  approved: "승인완료",
  rejected: "반려",
  purchase_completed: "구매완료",
  proof_submitted: "증빙제출",
  proof_approved: "증빙승인",
  proof_rejected: "증빙반려",
  completed: "지급완료",
}

const purchaseStatusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-blue-100 text-blue-700",
  reviewing: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  purchase_completed: "bg-emerald-100 text-emerald-700",
  proof_submitted: "bg-purple-100 text-purple-700",
  proof_approved: "bg-green-100 text-green-700",
  proof_rejected: "bg-red-100 text-red-700",
  completed: "bg-green-100 text-green-700",
}

const changeTypeLabels: Record<string, string> = {
  new: "신규",
  delete: "삭제",
  amount_increase: "증액",
  amount_decrease: "감액",
  category_change: "세목 변경",
  content_change: "내용 변경",
}

const refundStatusLabels: Record<string, string> = {
  draft: "임시저장",
  submitted: "제출됨",
  reviewing: "검토중",
  revision_requested: "보완요청",
  approved: "승인완료",
  rejected: "반려",
  processing: "처리중",
  completed: "지급완료",
}

const refundStatusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-blue-100 text-blue-700",
  reviewing: "bg-yellow-100 text-yellow-700",
  revision_requested: "bg-orange-100 text-orange-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  processing: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
}

// 세목 (카테고리) 목록
const CATEGORIES = [
  "인건비", "여비", "교육비", "회의비", "물품비",
  "기술운영비", "임차료", "공공요금", "수용료", "도서관운영비", "기타"
]

export default function BudgetsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("applications")

  const [budgets, setBudgets] = useState<Budget[]>([])
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([])
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([])
  const [refundApplications, setRefundApplications] = useState<RefundApplication[]>([])
  const [budgetChanges, setBudgetChanges] = useState<BudgetChange[]>([])
  const [allowBudgetChange, setAllowBudgetChange] = useState(false)

  // 세목별 예산 현황 계산
  const categoryBudgets = CATEGORIES.map(category => {
    const totalBudget = budgetItems
      .filter(item => {
        const budget = budgets.find(b => b.id === item.budget_id)
        return budget && budget.status === "approved" && item.category === category
      })
      .reduce((sum, item) => sum + (item.amount || 0), 0)

    const totalSpent = purchaseRequests
      .filter(p => (p.status === "completed" || p.status === "proof_approved") && p.category === category)
      .reduce((sum, p) => sum + (p.paid_amount || p.approved_amount || 0), 0)

    return {
      category,
      totalBudget,
      totalSpent,
      remaining: Math.max(0, totalBudget - totalSpent)
    }
  }).filter(cb => cb.totalBudget > 0 || cb.totalSpent > 0)

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 기업 ID 가져오기
      const { data: companies } = await supabase
        .from("user_companies")
        .select("company_id")
        .eq("user_id", user.id)
        .limit(1)

      const companyId = companies?.[0]?.company_id
      if (!companyId) return

      // 예산서 조회
      const { data: budgetsData } = await supabase
        .from("budgets")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
      setBudgets(budgetsData || [])

      // 예산 항목 조회
      const { data: itemsData } = await supabase
        .from("budget_items")
        .select("*")
        .in("budget_id", budgetsData?.map(b => b.id) || [])
      setBudgetItems(itemsData || [])

      // 구매요청 조회
      const { data: purchaseData } = await supabase
        .from("purchase_requests")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
      setPurchaseRequests(purchaseData || [])

      // 환급신청 조회
      const { data: refundData } = await supabase
        .from("refund_applications")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
      setRefundApplications(refundData || [])

      // 예산 변경 조회
      const { data: changesData } = await supabase
        .from("budget_changes")
        .select("*")
        .in("budget_id", budgetsData?.map(b => b.id) || [])
        .order("created_at", { ascending: false })

      // 예산별로 최신 버전 계산
      const budgetVersions: Record<string, number> = {}
      changesData?.forEach((change: any) => {
        if (!budgetVersions[change.budget_id] || change.version > budgetVersions[change.budget_id]) {
          budgetVersions[change.budget_id] = change.version
        }
      })

      // 버전 정보를 예산 데이터에 병합
      const budgetsWithVersion = (budgetsData || []).map((budget: any) => ({
        ...budget,
        version: budgetVersions[budget.id] || 1  // 변경 이력이 없으면 1차
      }))

      setBudgets(budgetsWithVersion)
      setBudgetChanges(changesData || [])

      // 프로그램별 예산 변경 허용 여부 조회 (회사의 활성 프로그램)
      const { data: programsData } = await supabase
        .from("programs")
        .select("allow_budget_change")
        .eq("status", "published")
        .limit(1)

      // 프로그램이 여러 개일 경우, 하나라도 허용되면 true
      const hasAllow = programsData?.some((p: any) => p.allow_budget_change) || false
      setAllowBudgetChange(hasAllow)

      setLoading(false)
    }

    fetchData()
  }, [supabase])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR")
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">예산관리</h1>
            <p className="text-muted-foreground">예산 신청, 사용 내역, 변경 신청을 관리합니다</p>
          </div>
          {allowBudgetChange ? (
            <Button asChild>
              <Link href="/portal/budgets/new">+ 새 예산서(변경)</Link>
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block">
                  <Button disabled>+ 새 예산서(변경)</Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>현재 예산서 제출 및 변경 기간이 아닙니다</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

      {loading ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">로딩 중...</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="applications">예산 신청(변경)</TabsTrigger>
            <TabsTrigger value="usage">예산 사용 내역</TabsTrigger>
          </TabsList>

          {/* Tab 1: 예산 신청 */}
          <TabsContent value="applications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>예산서 목록</CardTitle>
                <CardDescription>총 {budgets.length}건의 예산서</CardDescription>
              </CardHeader>
              <CardContent>
                {budgets.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">예산서가 없습니다</p>
                    {allowBudgetChange ? (
                      <Button asChild>
                        <Link href="/portal/budgets/new">첫 예산서(변경) 작성</Link>
                      </Button>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-block">
                            <Button disabled>첫 예산서(변경) 작성</Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>현재 예산서 제출 및 변경 기간이 아닙니다</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {budgets.map((budget) => (
                      <div
                        key={budget.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium">
                                {budget.fiscal_year}년도-{budget.version || 1}차
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  statusColors[budget.status] || "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {statusLabels[budget.status] || budget.status}
                              </span>
                            </div>
                            <div className="text-lg font-semibold">
                              {formatCurrency(budget.total_amount)}
                            </div>
                          </div>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/portal/budgets/${budget.id}`}>상세</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: 예산 사용 내역 */}
          <TabsContent value="usage" className="space-y-4">
            {/* 세목별 예산 현황 */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle>세목별 예산 현황</CardTitle>
              </CardHeader>
              <CardContent>
                {/* 통계 카드 */}
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">승인된 총 예산</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(categoryBudgets.reduce((sum, cb) => sum + cb.totalBudget, 0))}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">총 사용 금액</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(categoryBudgets.reduce((sum, cb) => sum + cb.totalSpent, 0))}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">예산 잔액</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(categoryBudgets.reduce((sum, cb) => sum + cb.remaining, 0))}
                    </p>
                  </div>
                </div>

                {/* 세목별 테이블 */}
                <div className="border rounded-lg overflow-hidden bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-bold">세목</TableHead>
                        <TableHead className="font-bold text-right">승인 예산</TableHead>
                        <TableHead className="font-bold text-right">집행 금액</TableHead>
                        <TableHead className="font-bold text-right">잔액</TableHead>
                        <TableHead className="font-bold text-center">사용률</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryBudgets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            예산 항목이 없습니다
                          </TableCell>
                        </TableRow>
                      ) : (
                        categoryBudgets.map((cb) => {
                          const usageRate = cb.totalBudget > 0
                            ? Math.round((cb.totalSpent / cb.totalBudget) * 100)
                            : 0
                          const isOverBudget = cb.totalSpent > cb.totalBudget

                          return (
                            <TableRow key={cb.category}>
                              <TableCell className="font-medium">{cb.category}</TableCell>
                              <TableCell className="text-right">{formatCurrency(cb.totalBudget)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(cb.totalSpent)}</TableCell>
                              <TableCell className={`text-right font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                                {formatCurrency(cb.remaining)}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <span className={isOverBudget ? 'text-red-600 font-bold' : ''}>
                                    {usageRate}%
                                  </span>
                                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${isOverBudget ? 'bg-red-500' : usageRate > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                      style={{ width: `${Math.min(usageRate, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* 구매요청 집행 내역 */}
            <Card>
              <CardHeader>
                <CardTitle>구매요청 집행 내역</CardTitle>
                <CardDescription>승인된 구매요청의 집행 현황</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-bold">품목</TableHead>
                        <TableHead className="font-bold">구매처</TableHead>
                        <TableHead className="font-bold">세목</TableHead>
                        <TableHead className="font-bold text-right">집행 금액</TableHead>
                        <TableHead className="font-bold">상태</TableHead>
                        <TableHead className="font-bold">결제일</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseRequests.filter(p => p.status === "approved" || p.status === "completed" || p.status === "proof_approved").length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            집행 내역이 없습니다
                          </TableCell>
                        </TableRow>
                      ) : (
                        purchaseRequests
                          .filter(p => p.status === "approved" || p.status === "completed" || p.status === "proof_approved")
                          .map((request) => (
                            <TableRow key={request.id}>
                              <TableCell className="font-medium">{request.item_name}</TableCell>
                              <TableCell>{request.vendor}</TableCell>
                              <TableCell>{request.category}</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(request.paid_amount || request.approved_amount || request.requested_amount)}
                              </TableCell>
                              <TableCell>
                                <Badge className={purchaseStatusColors[request.status] || "bg-gray-100 text-gray-700"}>
                                  {purchaseStatusLabels[request.status] || request.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {request.purchase_date ? formatDate(request.purchase_date) : "-"}
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* 환급신청 내역 */}
            <Card>
              <CardHeader>
                <CardTitle>환급신청 내역</CardTitle>
                <CardDescription>제출한 환급신청의 처리 현황</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-bold">결제 대상자</TableHead>
                        <TableHead className="font-bold">구매처</TableHead>
                        <TableHead className="font-bold">세목</TableHead>
                        <TableHead className="font-bold text-right">신청 금액</TableHead>
                        <TableHead className="font-bold text-right">지급 금액</TableHead>
                        <TableHead className="font-bold">상태</TableHead>
                        <TableHead className="font-bold">결제일</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {refundApplications.filter(r => r.status === "approved" || r.status === "completed" || r.status === "processing").length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            환급 내역이 없습니다
                          </TableCell>
                        </TableRow>
                      ) : (
                        refundApplications
                          .filter(r => r.status === "approved" || r.status === "completed" || r.status === "processing")
                          .map((refund) => (
                            <TableRow key={refund.id}>
                              <TableCell className="font-medium">{refund.refund_recipient_name}</TableCell>
                              <TableCell>{refund.vendor}</TableCell>
                              <TableCell>{refund.category}</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(refund.requested_amount)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(refund.paid_amount || refund.approved_amount || 0)}
                              </TableCell>
                              <TableCell>
                                <Badge className={refundStatusColors[refund.status] || "bg-gray-100 text-gray-700"}>
                                  {refundStatusLabels[refund.status] || refund.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {refund.payment_date ? formatDate(refund.payment_date) : "-"}
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
    </TooltipProvider>
  )
}
