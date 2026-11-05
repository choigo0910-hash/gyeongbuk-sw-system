"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface RefundPayment {
  id: string
  payment_date: string
  vendor: string
  purpose: string
  category: string
  payment_method: string
  amount: number
  sort_order: number
}

const paymentMethodLabels: Record<string, string> = {
  bank_transfer: "계좌이체",
  card: "카드",
  cash: "현금",
}

// 결제 내역이 2건 이상일 때만 표시 (1건이면 신청 정보 카드에 이미 표시됨)
export function RefundPaymentsCard({
  refundApplicationId,
  categoryLabels,
}: {
  refundApplicationId: string
  categoryLabels: Record<string, string>
}) {
  const [payments, setPayments] = useState<RefundPayment[]>([])

  useEffect(() => {
    const fetchPayments = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("refund_payments")
        .select("id, payment_date, vendor, purpose, category, payment_method, amount, sort_order")
        .eq("refund_application_id", refundApplicationId)
        .is("deleted_at", null)
        .order("sort_order")

      if (error) {
        console.error("결제 내역 조회 실패:", error)
        return
      }
      setPayments((data as RefundPayment[]) || [])
    }

    if (refundApplicationId) fetchPayments()
  }, [refundApplicationId])

  if (payments.length < 2) return null

  const total = payments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>결제 내역</CardTitle>
        <CardDescription>총 {payments.length}건</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2 pr-4 font-medium">결제일</th>
                <th className="py-2 pr-4 font-medium">구매처</th>
                <th className="py-2 pr-4 font-medium">지출 목적</th>
                <th className="py-2 pr-4 font-medium">세목</th>
                <th className="py-2 pr-4 font-medium">결제수단</th>
                <th className="py-2 text-right font-medium">금액</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 whitespace-nowrap">
                    {new Date(p.payment_date).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="py-2 pr-4">{p.vendor}</td>
                  <td className="py-2 pr-4">{p.purpose}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">{categoryLabels[p.category] || p.category}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">
                    {paymentMethodLabels[p.payment_method] || p.payment_method}
                  </td>
                  <td className="py-2 text-right whitespace-nowrap">{formatCurrency(p.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t font-medium">
                <td className="pt-3" colSpan={5}>합계</td>
                <td className="pt-3 text-right">{formatCurrency(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
