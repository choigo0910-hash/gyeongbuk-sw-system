"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"
import { sendNotification, type NotificationType } from "@/lib/notifications"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface BudgetItem {
  id: string
  category: string
  detail: string
  item: string | null
  description: string | null
  quantity: number | null
  unit_price: number | null
  amount: number
}

interface Budget {
  id: string
  fiscal_year: number
  status: string
  total_amount: number
  company_id: string
  companies?: {
    name: string
  }
  submitted_by: string | null
  submitted_at: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  approved_by: string | null
  approved_at: string | null
  note: string | null
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

export default function BudgetReviewPage() {
  const params = useParams()
  const router = useRouter()
  const budgetId = params.id as string

  const [budget, setBudget] = useState<Budget | null>(null)
  const [items, setItems] = useState<BudgetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  // 검토 의견
  const [reviewNote, setReviewNote] = useState("")

  useEffect(() => {
    if (budgetId) {
      fetchBudget()
    }
  }, [budgetId])

  const fetchBudget = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      // 예산서 정보 (회사 이름 포함)
      const { data: budgetData } = await supabase
        .from("budgets")
        .select(`
          *,
          companies (name)
        `)
        .eq("id", budgetId)
        .single()

      if (!budgetData) {
        alert("예산서를 찾을 수 없습니다.")
        router.back()
        return
      }

      setBudget(budgetData as Budget)

      // 예산 항목
      const { data: itemsData } = await supabase
        .from("budget_items")
        .select("*")
        .eq("budget_id", budgetId)
        .order("sort_order", { ascending: true })

      setItems((itemsData as BudgetItem[]) || [])
    } catch (error) {
      console.error("예산서 조회 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  // 승인
  const handleApprove = async () => {
    if (!budget) return
    if (!confirm("이 예산서를 승인하시겠습니까?")) return

    setProcessing(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from("budgets")
        .update({
          status: "approved",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", budgetId)

      if (error) throw error

      // audit log 기록
      await supabase.from("audit_logs").insert({
        actor_user_id: user?.id || "",
        actor_name: user?.email || "",
        action: "approve_budget",
        entity_type: "budget",
        entity_id: budgetId,
        new_values: { status: "approved" },
      })

      // 알림 발송
      if (budget?.submitted_by) {
        await sendNotification({
          userId: budget.submitted_by,
          type: "budget_approved",
          title: "예산서가 승인되었습니다",
          content: `${budget.fiscal_year}년도 예산서가 승인되었습니다.`,
          link: `/portal/budgets/${budgetId}`,
          metadata: {
            budgetId,
            fiscalYear: budget.fiscal_year,
            totalAmount: budget.total_amount,
          },
          sendEmail: true,
        })
      }

      alert("승인되었습니다.")
      router.push("/admin/budgets")
    } catch (error) {
      console.error("승인 실패:", error)
      alert("승인에 실패했습니다.")
    } finally {
      setProcessing(false)
    }
  }

  // 반려
  const handleReject = async () => {
    if (!reviewNote.trim()) {
      alert("반려 사유를 입력해주세요.")
      return
    }

    if (!confirm("이 예산서를 반려하시겠습니까?")) return

    setProcessing(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from("budgets")
        .update({
          status: "rejected",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          note: reviewNote,
        })
        .eq("id", budgetId)

      if (error) throw error

      // 알림 발송
      if (budget?.submitted_by) {
        await sendNotification({
          userId: budget.submitted_by,
          type: "budget_rejected",
          title: "예산서가 반려되었습니다",
          content: `반려 사유: ${reviewNote}`,
          link: `/portal/budgets/${budgetId}`,
          metadata: {
            budgetId,
            rejectionReason: reviewNote,
          },
          sendEmail: true,
        })
      }

      alert("반려되었습니다.")
      router.push("/admin/budgets")
    } catch (error) {
      console.error("반려 실패:", error)
      alert("반려에 실패했습니다.")
    } finally {
      setProcessing(false)
    }
  }

  // 보완 요청
  const handleRequestRevision = async () => {
    if (!reviewNote.trim()) {
      alert("보완 요청 사유를 입력해주세요.")
      return
    }

    if (!confirm("보완을 요청하시겠습니까?")) return

    setProcessing(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from("budgets")
        .update({
          status: "revision_requested",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          note: reviewNote,
        })
        .eq("id", budgetId)

      if (error) throw error

      // 알림 발송
      if (budget?.submitted_by) {
        await sendNotification({
          userId: budget.submitted_by,
          type: "budget_reviewed",
          title: "예산서 보완 요청",
          content: `보완 요청 사유: ${reviewNote}`,
          link: `/portal/budgets/${budgetId}`,
          metadata: {
            budgetId,
            revisionReason: reviewNote,
          },
          sendEmail: true,
        })
      }

      alert("보완 요청되었습니다.")
      router.push("/admin/budgets")
    } catch (error) {
      console.error("보완 요청 실패:", error)
      alert("보완 요청에 실패했습니다.")
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>
  }

  if (!budget) {
    return <div className="text-center py-8">예산서를 찾을 수 없습니다.</div>
  }

  const canReview = budget.status === "submitted" || budget.status === "reviewing"

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">예산서 검토</h1>
          <p className="text-muted-foreground">
            {budget.companies?.name || "기업"}의 {budget.fiscal_year}년도 예산
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          목록
        </Button>
      </div>

      {/* 상태 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>진행 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>기업</Label>
              <p className="font-medium">{budget.companies?.name || "-"}</p>
            </div>
            <div>
              <Label>상태</Label>
              <p className="font-medium">
                {statusLabels[budget.status] || budget.status}
              </p>
            </div>
            <div>
              <Label>총액</Label>
              <p className="font-medium">
                {formatCurrency(budget.total_amount)}
              </p>
            </div>
            <div>
              <Label>제출일</Label>
              <p className="text-sm">
                {budget.submitted_at
                  ? new Date(budget.submitted_at).toLocaleString()
                  : "-"}
              </p>
            </div>
          </div>
          {budget.note && (
            <div className="mt-4">
              <Label>비고</Label>
              <p className="text-sm text-muted-foreground">{budget.note}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 예산 항목 */}
      <Card>
        <CardHeader>
          <CardTitle>예산 항목</CardTitle>
          <CardDescription>
            총 {items.length}개 항목
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">#{index + 1}</span>
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                        {item.category}
                      </span>
                    </div>
                    <p className="font-medium">{item.detail}</p>
                    {item.item && (
                      <p className="text-sm text-muted-foreground">품목: {item.item}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      {formatCurrency(item.amount)}
                    </p>
                  </div>
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {item.description}
                  </p>
                )}
                <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                  {item.quantity && item.quantity > 0 && (
                    <span>수량: {item.quantity}</span>
                  )}
                  {item.unit_price && item.unit_price > 0 && (
                    <span>단가: {formatCurrency(item.unit_price)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 검토 */}
      <Card>
        <CardHeader>
          <CardTitle>검토</CardTitle>
          <CardDescription>
            예산서를 검토하고 승인, 반려 또는 보완을 요청하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reviewNote">검토 의견</Label>
            <Textarea
              id="reviewNote"
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="승인/반려/보완 요청 사유를 입력하세요"
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleApprove}
              disabled={!canReview || processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? "처리 중..." : "승인"}
            </Button>
            <Button
              onClick={handleRequestRevision}
              disabled={!canReview || processing}
              variant="outline"
            >
              {processing ? "처리 중..." : "보완 요청"}
            </Button>
            <Button
              onClick={handleReject}
              disabled={!canReview || processing}
              variant="destructive"
            >
              {processing ? "처리 중..." : "반려"}
            </Button>
          </div>

          {!canReview && (
            <p className="text-sm text-muted-foreground">
              검토 가능한 상태가 아닙니다 (현재: {statusLabels[budget.status]})
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
