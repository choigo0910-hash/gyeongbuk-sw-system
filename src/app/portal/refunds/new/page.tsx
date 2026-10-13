"use client"

"use client"

import { useState, useEffect } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Download, Plus, Trash2, FileText } from "lucide-react"

// 세목 (예산 항목 카테고리)
const categories = [
  { value: "인건비", label: "인건비" },
  { value: "여비", label: "여비" },
  { value: "교육비", label: "교육비" },
  { value: "회의비", label: "회의비" },
  { value: "물품비", label: "물품비" },
  { value: "기술운영비", label: "기술운영비" },
  { value: "임차료", label: "임차료" },
  { value: "공공요금", label: "공공요금" },
  { value: "수용료", label: "수용료" },
  { value: "도서관운영비", label: "도서관운영비" },
  { value: "기타", label: "기타" },
]

interface PaymentInfo {
  id: string
  paymentDate: string
  vendor: string
  purpose: string
  category: string
  amount: number
}

// ID 생성을 위한 카운터 (서버/클라이언트 간 일치)
let paymentIdCounter = 0
const generatePaymentId = () => `payment-${Date.now()}-${paymentIdCounter++}`

export default function NewRefundApplicationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // 환급 수령인 정보 (기업만)
  const [recipientName, setRecipientName] = useState("")

  // 결제 정보 (여러 건) - 클라이언트에서만 초기화
  const [payments, setPayments] = useState<PaymentInfo[]>([
    {
      id: `payment-init-1`,
      paymentDate: "",
      vendor: "",
      purpose: "",
      category: "",
      amount: 0,
    },
  ])

  // 환급 계좌 정보
  const [bankName, setBankName] = useState("")
  const [bankAccount, setBankAccount] = useState("")
  const [bankHolder, setBankHolder] = useState("")

  // 첫 환급 여부 및 추가 서류
  const [isFirstRefund, setIsFirstRefund] = useState(false)
  const [bankDepositRequest, setBankDepositRequest] = useState<File | null>(null)
  const [idCardCopy, setIdCardCopy] = useState<File | null>(null)
  const [bankbookCopy, setBankbookCopy] = useState<File | null>(null)

  // 증빙서류
  const [proofFiles, setProofFiles] = useState<File[]>([])

  // 금액 확인 체크박스
  const [amountConfirmed, setAmountConfirmed] = useState(false)

  // 동의
  const [agree, setAgree] = useState(false)

  // 총 금액 계산
  const totalAmount = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0)

  // 결제 정보 추가
  const addPayment = () => {
    setPayments([
      ...payments,
      {
        id: generatePaymentId(),
        paymentDate: "",
        vendor: "",
        purpose: "",
        category: "",
        amount: 0,
      },
    ])
  }

  // 결제 정보 삭제
  const removePayment = (id: string) => {
    if (payments.length > 1) {
      setPayments(payments.filter((p) => p.id !== id))
    }
  }

  // 결제 정보 업데이트
  const updatePayment = (id: string, field: keyof PaymentInfo, value: string | number) => {
    setPayments(
      payments.map((p) => {
        if (p.id === id) {
          return { ...p, [field]: value }
        }
        return p
      })
    )
  }

  // 증빙서류 예시 다운로드
  const handleDownloadSample = () => {
    // TODO: 실제 예시 파일을 public 폴더에 두고 다운로드
    alert("증빙서류 예시 파일을 다운로드합니다.\n(실제 구현 시 public/docs/refund-sample.pdf 등에서 제공)")
  }

  // 임시저장
  const handleSaveDraft = async () => {
    if (!recipientName || payments.some((p) => !p.paymentDate || !p.vendor || !p.purpose || !p.category || p.amount <= 0)) {
      alert("필수 항목을 입력해주세요.")
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      const { data: companies } = await supabase
        .from("user_companies")
        .select("company_id")
        .eq("user_id", user.id)
        .limit(1)

      const companyId = companies?.[0]?.company_id || ""

      if (!companyId) {
        alert("기업 정보를 찾을 수 없습니다.")
        return
      }

      const { error } = await supabase
        .from("refund_applications")
        .insert({
          company_id: companyId,
          applicant_id: user.id,
          refund_recipient_name: recipientName,
          refund_recipient_type: "company",
          requested_amount: totalAmount,
          payment_date: new Date(payments[0].paymentDate).toISOString(),
          vendor: payments[0].vendor,
          purpose: payments[0].purpose,
          category: payments[0].category,
          bank_name: bankName || null,
          bank_account: bankAccount || null,
          bank_holder: bankHolder || null,
          status: "draft",
        })

      if (error) throw error

      alert("임시저장되었습니다.")
      router.push("/portal/refunds")
    } catch (error) {
      console.error("임시저장 실패:", error)
      alert("임시저장에 실패했습니다.")
    } finally {
      setSaving(false)
    }
  }

  // 제출
  const handleSubmit = async () => {
    if (!recipientName) {
      alert("환급 수령인(기업명)을 입력해주세요.")
      return
    }

    if (payments.some((p) => !p.paymentDate || !p.vendor || !p.purpose || !p.category || p.amount <= 0)) {
      alert("모든 결제 정보의 필수 항목을 입력해주세요.")
      return
    }

    if (!amountConfirmed) {
      alert("결제 금액을 확인해주세요.")
      return
    }

    if (!bankName || !bankAccount || !bankHolder) {
      alert("환급 계좌 정보를 입력해주세요.")
      return
    }

    if (isFirstRefund && (!bankDepositRequest || !idCardCopy || !bankbookCopy)) {
      alert("첫 환급의 경우 필수 서류를 모두 제출해야 합니다.")
      return
    }

    if (!agree) {
      alert("환급 규정에 동의해주세요.")
      return
    }

    if (!confirm(`환급 ${formatCurrency(totalAmount)}을 신청하시겠습니까?`)) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      const { data: companies } = await supabase
        .from("user_companies")
        .select("company_id")
        .eq("user_id", user.id)
        .limit(1)

      const companyId = companies?.[0]?.company_id || ""

      if (!companyId) {
        alert("기업 정보를 찾을 수 없습니다.")
        return
      }

      const { data: refundData, error: insertError } = await supabase
        .from("refund_applications")
        .insert({
          company_id: companyId,
          applicant_id: user.id,
          refund_recipient_name: recipientName,
          refund_recipient_type: "company",
          requested_amount: totalAmount,
          payment_date: new Date(payments[0].paymentDate).toISOString(),
          vendor: payments[0].vendor,
          purpose: payments[0].purpose,
          category: payments[0].category,
          bank_name: bankName,
          bank_account: bankAccount,
          bank_holder: bankHolder,
          status: "submitted",
        })
        .select()
        .single()

      if (insertError) throw insertError

      // 결제 정보 추가 저장 (여러 건인 경우)
      if (payments.length > 1) {
        const additionalPayments = payments.slice(1).map((p) => ({
          refund_application_id: refundData.id,
          payment_date: new Date(p.paymentDate).toISOString(),
          vendor: p.vendor,
          purpose: p.purpose,
          category: p.category,
          amount: p.amount,
        }))

        const { error: paymentsError } = await supabase
          .from("refund_payments")
          .insert(additionalPayments)

        if (paymentsError) console.error("추가 결제 정보 저장 실패:", paymentsError)
      }

      // 증빙서류 업로드
      if (proofFiles.length > 0) {
        for (const file of proofFiles) {
          const fileName = `refund_${refundData.id}_${Date.now()}_${file.name}`
          const { error: uploadError } = await supabase.storage
            .from("refund-documents")
            .upload(fileName, file)

          if (uploadError) {
            console.error("파일 업로드 실패:", uploadError)
            continue
          }

          // 버킷이 private이므로 절대 URL 대신 경로 저장 — 조회 시 서명 URL 생성
          await supabase
            .from("refund_proof_documents")
            .insert({
              refund_application_id: refundData.id,
              file_name: file.name,
              file_url: `refund-documents/${fileName}`,
              file_size: file.size,
              document_type: "proof",
              uploaded_by: user.id,
            })
        }
      }

      // 첫 환급 서류 업로드
      if (isFirstRefund) {
        const additionalFiles = [
          { file: bankDepositRequest, type: "bank_deposit_request" },
          { file: idCardCopy, type: "id_card" },
          { file: bankbookCopy, type: "bankbook" },
        ]

        for (const { file, type } of additionalFiles) {
          if (file) {
            const fileName = `refund_additional_${refundData.id}_${type}_${Date.now()}_${file.name}`
            const { error: uploadError } = await supabase.storage
              .from("refund-documents")
              .upload(fileName, file)

            if (!uploadError) {
              // 버킷이 private이므로 절대 URL 대신 경로 저장 — 조회 시 서명 URL 생성
              await supabase
                .from("refund_proof_documents")
                .insert({
                  refund_application_id: refundData.id,
                  file_name: file.name,
                  file_url: `refund-documents/${fileName}`,
                  file_size: file.size,
                  document_type: type,
                  uploaded_by: user.id,
                })
            }
          }
        }
      }

      alert("환급신청이 제출되었습니다.")
      router.push("/portal/refunds")
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
          <h1 className="text-3xl font-bold">환급신청 작성</h1>
          <p className="text-muted-foreground">새로운 환급신청을 작성합니다</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          취소
        </Button>
      </div>

      {/* 환급 수령인 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>환급 수령인 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipientName">기업명 *</Label>
            <Input
              id="recipientName"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="기업명 입력"
            />
          </div>
        </CardContent>
      </Card>

      {/* 결제 정보 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>결제 정보</CardTitle>
            <Button size="sm" onClick={addPayment}>
              <Plus className="w-4 h-4 mr-1" />
              건 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {payments.map((payment, index) => (
            <div key={payment.id} className="border rounded-lg p-4 space-y-4 relative">
              {payments.length > 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  onClick={() => removePayment(payment.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}

              <div className="text-sm font-medium text-muted-foreground">
                결제 #{index + 1}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`paymentDate-${payment.id}`}>결제일자 *</Label>
                  <Input
                    id={`paymentDate-${payment.id}`}
                    type="date"
                    value={payment.paymentDate}
                    onChange={(e) => updatePayment(payment.id, "paymentDate", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`amount-${payment.id}`}>결제 금액 (원) *</Label>
                  <CurrencyInput
                    id={`amount-${payment.id}`}
                    value={payment.amount}
                    onChange={(value) => updatePayment(payment.id, "amount", value ?? 0)}
                    min={0}
                    placeholder="결제 금액 입력"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`vendor-${payment.id}`}>구매처 *</Label>
                <Input
                  id={`vendor-${payment.id}`}
                  value={payment.vendor}
                  onChange={(e) => updatePayment(payment.id, "vendor", e.target.value)}
                  placeholder="구매처 상호명 입력"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`purpose-${payment.id}`}>지출 목적 *</Label>
                <Textarea
                  id={`purpose-${payment.id}`}
                  value={payment.purpose}
                  onChange={(e) => updatePayment(payment.id, "purpose", e.target.value)}
                  placeholder="지출 목적을 설명하세요"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`category-${payment.id}`}>세목 선택 *</Label>
                <Select
                  value={payment.category}
                  onValueChange={(value) => updatePayment(payment.id, "category", value)}
                >
                  <SelectTrigger id={`category-${payment.id}`}>
                    <SelectValue placeholder="세목 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}

          {/* 총액 표시 */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">최종 환급 금액</span>
              <span className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalAmount)}
              </span>
            </div>
            <div className="flex items-start space-x-2 mt-3">
              <Checkbox
                id="amountConfirm"
                checked={amountConfirmed}
                onCheckedChange={(checked) => setAmountConfirmed(checked as boolean)}
              />
              <Label htmlFor="amountConfirm" className="text-sm cursor-pointer">
                위 금액을 확인하였으며 정확함을 동의합니다.
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 환급 계좌 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>환급 계좌 정보</CardTitle>
          <CardDescription>환급받을 계좌 정보를 입력해주세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="firstRefund"
              checked={isFirstRefund}
              onCheckedChange={(checked) => setIsFirstRefund(checked as boolean)}
            />
            <Label htmlFor="firstRefund" className="cursor-pointer">
              첫 환급입니다 (추가 서류 제출 필요)
            </Label>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">은행명 *</Label>
              <Input
                id="bankName"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="은행명 입력"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankAccount">계좌번호 *</Label>
              <Input
                id="bankAccount"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="계좌번호 입력"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankHolder">예금주 *</Label>
              <Input
                id="bankHolder"
                value={bankHolder}
                onChange={(e) => setBankHolder(e.target.value)}
                placeholder="예금주명 입력"
              />
            </div>
          </div>

          {isFirstRefund && (
            <div className="border-t pt-4 space-y-4">
              <div>
                <h4 className="font-medium mb-3 text-red-600">
                  첫 환급 시 추가 서류 제출
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  첫 환급의 경우 아래 서류를 모두 제출해야 합니다.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="bankDepositRequest">계좌입금의뢰서 *</Label>
                  <Input
                    id="bankDepositRequest"
                    type="file"
                    onChange={(e) => setBankDepositRequest(e.target.files?.[0] || null)}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="idCardCopy">신분증 사본 *</Label>
                  <Input
                    id="idCardCopy"
                    type="file"
                    onChange={(e) => setIdCardCopy(e.target.files?.[0] || null)}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="bankbookCopy">통장 사본 *</Label>
                  <Input
                    id="bankbookCopy"
                    type="file"
                    onChange={(e) => setBankbookCopy(e.target.files?.[0] || null)}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 증빙서류 */}
      <Card>
        <CardHeader>
          <CardTitle>증빙서류</CardTitle>
          <CardDescription className="flex items-center gap-2">
            결제 영수증, 세금계산서 등 증빙서류를 업로드해주세요
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDownloadSample}
              className="text-blue-600 hover:text-blue-700"
            >
              <Download className="w-4 h-4 mr-1" />
              증빙서류 예시 다운로드
            </Button>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="file"
              multiple
              onChange={(e) => setProofFiles(Array.from(e.target.files || []))}
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <p className="text-xs text-muted-foreground mt-1">
              PDF, JPG, PNG 파일만 업로드 가능합니다 (최대 5MB)
            </p>
          </div>

          {proofFiles.length > 0 && (
            <div className="space-y-2">
              <Label>선택된 파일:</Label>
              {proofFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>{file.name}</span>
                  <span className="text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 동의 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="agree"
              checked={agree}
              onCheckedChange={(checked) => setAgree(checked as boolean)}
            />
            <Label htmlFor="agree" className="text-sm cursor-pointer">
              제출하는 환급신청 및 증빙서류가 사실과 다름이 없으며, 환급 규정을 준수할 것을 동의합니다.
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* 버튼 */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={saving}
              className="min-w-[140px] h-11"
            >
              {saving ? "저장 중..." : "임시저장"}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="min-w-[140px] h-11 px-8"
            >
              {loading ? "제출 중..." : "제출"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
