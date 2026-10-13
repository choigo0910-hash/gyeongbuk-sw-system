"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"
import { getSignedFileUrl } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { sendNotification, type NotificationType } from "@/lib/notifications"
import { InfoIcon } from "lucide-react"
import Link from "next/link"

interface RefundApplication {
  id: string
  company_id: string
  refund_recipient_name: string
  refund_recipient_type: string
  requested_amount: number
  approved_amount: number | null
  paid_amount: number | null
  payment_date: string
  vendor: string
  purpose: string | null
  payment_method: string
  category: string
  bank_name: string | null
  bank_account: string | null
  bank_holder: string | null
  status: string
  rejection_reason: string | null
  created_at: string
  created_by: string | null
  company_name: string
}

interface ProofDocument {
  id: string
  file_name: string
  file_url: string
  file_size: number | null
  document_type: string
  uploaded_at: string
}

const statusLabels: Record<string, string> = {
  draft: "임시저장",
  submitted: "제출됨",
  reviewing: "검토중",
  revision_requested: "수정요청",
  approved: "승인완료",
  rejected: "반려",
  processing: "지급중",
  completed: "지급완료",
}

const categoryLabels: Record<string, string> = {
  supplies: "물품비",
  education: "교육비",
  travel: "여비",
  meeting: "회의비",
  promotion: "홍보비",
  other: "기타",
}

export default function AdminRefundReviewPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [application, setApplication] = useState<RefundApplication | null>(null)
  const [proofDocuments, setProofDocuments] = useState<ProofDocument[]>([])
  // Storage 버킷이 private이므로 조회 시점에 서명된 URL을 생성
  const [proofSignedUrls, setProofSignedUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [approvedAmount, setApprovedAmount] = useState(0)
  const [rejectionReason, setRejectionReason] = useState("")
  const [paidAmount, setPaidAmount] = useState(0)

  useEffect(() => {
    fetchApplicationDetail()
    fetchProofDocuments()
  }, [id])

  const fetchApplicationDetail = async () => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("refund_applications")
        .select(`
          *,
          companies!inner(name)
        `)
        .eq("id", id)
        .single()

      if (error) throw error

      const formattedData = {
        ...(data as any),
        company_name: (data as any).companies.name,
      }
      setApplication(formattedData as RefundApplication)
      setApprovedAmount(formattedData.approved_amount || formattedData.requested_amount)
      setPaidAmount(formattedData.paid_amount || formattedData.approved_amount || formattedData.requested_amount)
    } catch (error) {
      console.error("환급신청 상세 조회 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProofDocuments = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("refund_proof_documents")
        .select("*")
        .eq("refund_application_id", id)
        .order("uploaded_at", { ascending: false })

      if (error) throw error
      const docs = (data as ProofDocument[]) || []
      setProofDocuments(docs)

      const urlMap: Record<string, string> = {}
      await Promise.all(
        docs.map(async (doc) => {
          const url = await getSignedFileUrl(supabase, doc.file_url)
          if (url) urlMap[doc.id] = url
        })
      )
      setProofSignedUrls(urlMap)
    } catch (error) {
      console.error("증빙서류 조회 실패:", error)
    }
  }

  const handleApprove = async () => {
    if (!confirm("이 환급신청을 승인하시겠습니까?")) return

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert("로그인이 필요합니다.")
        return
      }

      const { error } = await supabase
        .from("refund_applications")
        .update({
          status: "approved",
          approved_amount: approvedAmount,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) throw error

      // 알림 발송
      if (application?.created_by) {
        await sendNotification({
          userId: application.created_by,
          type: "refund_approved" as NotificationType,
          title: "환급신청이 승인되었습니다",
          content: `승인 금액: ${formatCurrency(approvedAmount)}`,
          link: `/portal/refunds/${id}`,
          metadata: {
            refundApplicationId: id,
            approvedAmount: approvedAmount,
          },
          sendEmail: true,
        })
      }

      alert("승인이 완료되었습니다.")
      router.push("/admin/refunds")
    } catch (error) {
      console.error("승인 실패:", error)
      alert("승인에 실패했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("반려 사유를 입력해주세요.")
      return
    }

    if (!confirm("이 환급신청을 반려하시겠습니까?")) return

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert("로그인이 필요합니다.")
        return
      }

      const { error } = await supabase
        .from("refund_applications")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) throw error

      // 알림 발송
      if (application?.created_by) {
        await sendNotification({
          userId: application.created_by,
          type: "refund_rejected" as NotificationType,
          title: "환급신청이 반려되었습니다",
          content: `반려 사유: ${rejectionReason}`,
          link: `/portal/refunds/${id}`,
          metadata: {
            refundApplicationId: id,
            rejectionReason: rejectionReason,
          },
          sendEmail: true,
        })
      }

      alert("반려가 완료되었습니다.")
      router.push("/admin/refunds")
    } catch (error) {
      console.error("반려 실패:", error)
      alert("반려에 실패했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  const handlePayment = async () => {
    if (!confirm(`${formatCurrency(paidAmount)}을 지급 처리하시겠습니까?`)) return

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert("로그인이 필요합니다.")
        return
      }

      const { error } = await supabase
        .from("refund_applications")
        .update({
          status: "completed",
          paid_amount: paidAmount,
          paid_by: user.id,
          paid_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) throw error

      // 알림 발송
      if (application?.created_by) {
        await sendNotification({
          userId: application.created_by,
          type: "refund_paid" as NotificationType,
          title: "환급금이 지급되었습니다",
          content: `지급 금액: ${formatCurrency(paidAmount)}`,
          link: `/portal/refunds/${id}`,
          metadata: {
            refundApplicationId: id,
            paidAmount: paidAmount,
          },
          sendEmail: true,
        })
      }

      alert("지급이 완료되었습니다.")
      router.push("/admin/refunds")
    } catch (error) {
      console.error("지급 실패:", error)
      alert("지급에 실패했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>
  }

  if (!application) {
    return <div className="text-center py-8">환급신청 내역을 찾을 수 없습니다.</div>
  }

  const isSubmittedReview = application.status === "submitted"
  const isApprovedReview = application.status === "approved"

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">환급신청 검토</h1>
          <p className="text-muted-foreground">
            {isSubmittedReview && "환급신청을 검토하고 승인 여부를 결정합니다"}
            {isApprovedReview && "지급을 처리합니다"}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/refunds">목록으로</Link>
        </Button>
      </div>

      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{application.company_name}</CardTitle>
              <CardDescription>기업 정보</CardDescription>
            </div>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
              {statusLabels[application.status] || application.status}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">환급 수령인</span>
              <p className="font-medium">{application.refund_recipient_name}</p>
              <p className="text-xs text-muted-foreground">
                {application.refund_recipient_type === "company" ? "기업" : "개인"}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">환급 분류</span>
              <p className="font-medium">
                {categoryLabels[application.category] || application.category}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">구매처</span>
              <p className="font-medium">{application.vendor}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">결제일자</span>
              <p className="font-medium">
                {new Date(application.payment_date).toLocaleDateString("ko-KR")}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">신청일</span>
              <p className="font-medium">
                {new Date(application.created_at).toLocaleDateString("ko-KR")}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">신청 금액</span>
              <p className="font-medium text-lg">
                {formatCurrency(application.requested_amount)}
              </p>
            </div>
          </div>

          {application.purpose && (
            <div>
              <span className="text-sm text-muted-foreground">지출 목적</span>
              <p className="font-medium text-sm mt-1">{application.purpose}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 환급 계좌 정보 */}
      {(application.bank_name || application.bank_account || application.bank_holder) && (
        <Card>
          <CardHeader>
            <CardTitle>환급 계좌 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {application.bank_name && (
                <div>
                  <span className="text-sm text-muted-foreground">은행명</span>
                  <p className="font-medium">{application.bank_name}</p>
                </div>
              )}
              {application.bank_account && (
                <div>
                  <span className="text-sm text-muted-foreground">계좌번호</span>
                  <p className="font-medium">{application.bank_account}</p>
                </div>
              )}
              {application.bank_holder && (
                <div>
                  <span className="text-sm text-muted-foreground">예금주</span>
                  <p className="font-medium">{application.bank_holder}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 증빙서류 */}
      <Card>
        <CardHeader>
          <CardTitle>증빙서류</CardTitle>
        </CardHeader>
        <CardContent>
          {proofDocuments.length > 0 ? (
            <div className="space-y-2">
              {proofDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex justify-between items-center p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.file_size ? (doc.file_size / 1024).toFixed(1) + " KB" : "-"} •{" "}
                      {new Date(doc.uploaded_at).toLocaleString("ko-KR")}
                    </p>
                  </div>
                  {proofSignedUrls[doc.id] ? (
                    <Button variant="outline" size="sm" asChild>
                      <a href={proofSignedUrls[doc.id]} target="_blank" rel="noopener noreferrer">
                        보기
                      </a>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      보기
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              제출된 증빙서류가 없습니다
            </div>
          )}
        </CardContent>
      </Card>

      {/* 승인 결정 폼 */}
      {isSubmittedReview && (
        <Card>
          <CardHeader>
            <CardTitle>승인 결정</CardTitle>
            <CardDescription>환급신청을 승인하거나 반려합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="approvedAmount">승인 금액 (원)</Label>
              <CurrencyInput
                id="approvedAmount"
                value={approvedAmount}
                onChange={(value) => setApprovedAmount(value ?? 0)}
                min={0}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                신청 금액: {formatCurrency(application.requested_amount)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rejectionReason">반려 사유</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="반려하는 경우 사유를 입력하세요"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleApprove}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? "처리 중..." : "승인"}
              </Button>
              <Button
                onClick={handleReject}
                disabled={submitting}
                variant="destructive"
                className="flex-1"
              >
                {submitting ? "처리 중..." : "반려"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 지급 처리 폼 */}
      {isApprovedReview && (
        <Card>
          <CardHeader>
            <CardTitle>지급 처리</CardTitle>
            <CardDescription>환급금을 지급합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription className="text-sm">
                환급 계좌로 입금 처리 후 지급 완료를 클릭해주세요.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="paidAmount">지급 금액 (원)</Label>
              <CurrencyInput
                id="paidAmount"
                value={paidAmount}
                onChange={(value) => setPaidAmount(value ?? 0)}
                min={0}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                승인 금액: {application.approved_amount ? formatCurrency(application.approved_amount) : formatCurrency(application.requested_amount)}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                {application.bank_name && (
                  <div>
                    <span className="text-muted-foreground">은행명:</span>
                    <p className="font-medium">{application.bank_name}</p>
                  </div>
                )}
                {application.bank_account && (
                  <div>
                    <span className="text-muted-foreground">계좌번호:</span>
                    <p className="font-medium">{application.bank_account}</p>
                  </div>
                )}
                {application.bank_holder && (
                  <div>
                    <span className="text-muted-foreground">예금주:</span>
                    <p className="font-medium">{application.bank_holder}</p>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handlePayment}
              disabled={submitting}
              className="w-full"
            >
              {submitting ? "처리 중..." : "지급 완료"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 이미 완료된 경우 */}
      {!isSubmittedReview && !isApprovedReview && (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription className="text-sm text-gray-600">
            이 환급신청은 이미 {statusLabels[application.status]} 상태입니다.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
