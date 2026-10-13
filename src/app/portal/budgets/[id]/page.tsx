"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

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
  submitted_at: string | null
  reviewed_at: string | null
  approved_at: string | null
  approved_by: string | null
  note: string | null
  created_at: string
  updated_at: string
}

const statusLabels: Record<string, string> = {
  draft: "임시저장",
  submitted: "제출됨",
  reviewing: "검토중",
  revision_requested: "보완요청",
  approved: "승인완료",
  rejected: "반려",
}

export default function BudgetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const budgetId = params.id as string

  const [budget, setBudget] = useState<Budget | null>(null)
  const [items, setItems] = useState<BudgetItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (budgetId) {
      fetchBudget()
    }
  }, [budgetId])

  const fetchBudget = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      // 예산서 정보
      const { data: budgetData } = await supabase
        .from("budgets")
        .select("*")
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

  const handleSubmit = async () => {
    if (!budget || budget.status !== "draft") return

    if (!confirm("예산서를 제출하시겠습니까?")) return

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from("budgets")
        .update({
          status: "submitted",
          submitted_by: user?.id,
          submitted_at: new Date().toISOString(),
        })
        .eq("id", budgetId)

      if (error) throw error

      alert("제출되었습니다.")
      fetchBudget()
    } catch (error) {
      console.error("제출 실패:", error)
      alert("제출에 실패했습니다.")
    }
  }

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>
  }

  if (!budget) {
    return <div className="text-center py-8">예산서를 찾을 수 없습니다.</div>
  }

  const canEdit = budget.status === "draft"
  const canSubmit = budget.status === "draft"

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">예산서 상세</h1>
          <p className="text-muted-foreground">{budget.fiscal_year}년도 예산</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            목록
          </Button>
          {canSubmit && (
            <Button onClick={handleSubmit}>
              제출
            </Button>
          )}
        </div>
      </div>

      {/* 상태 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>진행 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>상태</Label>
              <p className="text-lg font-medium">
                {statusLabels[budget.status] || budget.status}
              </p>
            </div>
            <div>
              <Label>총액</Label>
              <p className="text-lg font-medium">
                {formatCurrency(budget.total_amount)}
              </p>
            </div>
            <div>
              <Label>작성일</Label>
              <p className="text-sm">
                {new Date(budget.created_at).toLocaleDateString()}
              </p>
            </div>
            {budget.submitted_at && (
              <div>
                <Label>제출일</Label>
                <p className="text-sm">
                  {new Date(budget.submitted_at).toLocaleString()}
                </p>
              </div>
            )}
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
    </div>
  )
}
