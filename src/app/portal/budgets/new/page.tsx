"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"
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
  item: string
  description: string
  quantity: number
  unit_price: number
  amount: number
}

export default function NewBudgetPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // 예산서 기본 정보
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear())
  const [note, setNote] = useState("")

  // 예산 항목
  const [items, setItems] = useState<BudgetItem[]>([
    {
      id: crypto.randomUUID(),
      category: "",
      detail: "",
      item: "",
      description: "",
      quantity: 1,
      unit_price: 0,
      amount: 0,
    },
  ])

  // 기업 정보 (임시 - 실제로는 user_companies에서 가져와야 함)
  const [companyId, setCompanyId] = useState("")

  // 카테고리 옵션
  const categories = [
    "인건비",
    "여비",
    "교육비",
    "회의비",
    "물품비",
    "기술운영비",
    "임차료",
    "공공요금",
    "수용료",
    "도서관운영비",
    "기타"
  ]

  // 항목 추가
  const addItem = () => {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        category: "",
        detail: "",
        item: "",
        description: "",
        quantity: 1,
        unit_price: 0,
        amount: 0,
      },
    ])
  }

  // 항목 삭제
  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  // 항목 업데이트
  const updateItem = (id: string, field: keyof BudgetItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value }

          // 금액 자동 계산
          if (field === "quantity" || field === "unit_price") {
            updated.amount = (Number(updated.quantity) || 0) * (Number(updated.unit_price) || 0)
          }

          return updated
        }
        return item
      })
    )
  }

  // 총액 계산
  const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0)

  // 임시저장
  const handleSaveDraft = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      // TODO: 실제로는 user_companies에서 company_id를 가져와야 함
      // 임시로 첫 번째 회사 ID 사용
      const { data: companies } = await supabase
        .from("user_companies")
        .select("company_id")
        .eq("user_id", user.id)
        .limit(1)

      const actualCompanyId = companies?.[0]?.company_id || ""

      // budget 생성
      const { data: budget, error: budgetError } = await supabase
        .from("budgets")
        .insert({
          company_id: actualCompanyId,
          fiscal_year: fiscalYear,
          status: "draft",
          total_amount: totalAmount,
          note: note || null,
        })
        .select()
        .single()

      if (budgetError) throw budgetError

      // budget_items 생성
      const itemsToInsert = items.map((item, index) => ({
        budget_id: budget.id,
        category: item.category,
        detail: item.detail,
        item: item.item || null,
        description: item.description || null,
        quantity: item.quantity || null,
        unit_price: item.unit_price || null,
        amount: item.amount || 0,
        sort_order: index,
      }))

      const { error: itemsError } = await supabase
        .from("budget_items")
        .insert(itemsToInsert)

      if (itemsError) throw itemsError

      router.push(`/portal/budgets/${budget.id}`)
    } catch (error) {
      console.error("임시저장 실패:", error)
      alert("임시저장에 실패했습니다.")
    } finally {
      setSaving(false)
    }
  }

  // 제출
  const handleSubmit = async () => {
    // 유효성 검사
    if (!items.every((item) => item.category && item.detail)) {
      alert("모든 항목의 카테고리와 세목을 입력해주세요.")
      return
    }

    if (totalAmount === 0) {
      alert("금액을 입력해주세요.")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      // 회사 ID 가져오기
      const { data: companies } = await supabase
        .from("user_companies")
        .select("company_id")
        .eq("user_id", user.id)
        .limit(1)

      const actualCompanyId = companies?.[0]?.company_id || ""

      // budget 생성 (submitted 상태)
      const { data: budget, error: budgetError } = await supabase
        .from("budgets")
        .insert({
          company_id: actualCompanyId,
          fiscal_year: fiscalYear,
          status: "submitted",
          submitted_by: user.id,
          submitted_at: new Date().toISOString(),
          total_amount: totalAmount,
          note: note || null,
        })
        .select()
        .single()

      if (budgetError) throw budgetError

      // budget_items 생성
      const itemsToInsert = items.map((item, index) => ({
        budget_id: budget.id,
        category: item.category,
        detail: item.detail,
        item: item.item || null,
        description: item.description || null,
        quantity: item.quantity || null,
        unit_price: item.unit_price || null,
        amount: item.amount || 0,
        sort_order: index,
      }))

      const { error: itemsError } = await supabase
        .from("budget_items")
        .insert(itemsToInsert)

      if (itemsError) throw itemsError

      alert("예산서가 제출되었습니다.")
      router.push("/portal/budgets")
    } catch (error) {
      console.error("제출 실패:", error)
      alert("제출에 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">예산서 작성</h1>
          <p className="text-muted-foreground">새로운 예산서를 작성합니다</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          취소
        </Button>
      </div>

      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fiscalYear">회계연도</Label>
              <Input
                id="fiscalYear"
                type="number"
                value={fiscalYear}
                onChange={(e) => setFiscalYear(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">비고</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="예산서에 대한 추가 설명을 입력하세요"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* 예산 항목 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>예산 항목</CardTitle>
            <Button size="sm" onClick={addItem}>
              + 항목 추가
            </Button>
          </div>
          <CardDescription>
            총액: {formatCurrency(totalAmount)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="border rounded-lg p-4 space-y-3 relative"
              >
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length === 1}
                >
                  삭제
                </Button>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>카테고리 *</Label>
                    <Select
                      value={item.category}
                      onValueChange={(value) => updateItem(item.id, "category", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>세목 *</Label>
                    <Input
                      value={item.detail}
                      onChange={(e) => updateItem(item.id, "detail", e.target.value)}
                      placeholder="세목 입력"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>품목</Label>
                    <Input
                      value={item.item}
                      onChange={(e) => updateItem(item.id, "item", e.target.value)}
                      placeholder="품목 입력"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>설명</Label>
                  <Textarea
                    value={item.description}
                    onChange={(e) => updateItem(item.id, "description", e.target.value)}
                    placeholder="상세 설명"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-2">
                    <Label>수량</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                      min={0}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>단가</Label>
                    <CurrencyInput
                      value={item.unit_price}
                      onChange={(value) => updateItem(item.id, "unit_price", value ?? 0)}
                      min={0}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>금액</Label>
                    <CurrencyInput
                      value={item.amount}
                      onChange={() => {}}
                      readOnly
                      placeholder="0"
                    />
                  </div>

                  <div className="flex items-end">
                    <div className="text-sm text-muted-foreground">
                      항목 #{index + 1}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 총액 요약 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center text-lg font-medium">
            <span>총액</span>
            <span>{formatCurrency(totalAmount)}</span>
          </div>
        </CardContent>
      </Card>

      {/* 버튼 */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={handleSaveDraft}
          disabled={saving}
        >
          {saving ? "저장 중..." : "임시저장"}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "제출 중..." : "제출"}
        </Button>
      </div>
    </div>
  )
}
