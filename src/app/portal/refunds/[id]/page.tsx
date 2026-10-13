"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"
import { getSignedFileUrl } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"
import Link from "next/link"

interface RefundApplication {
  id: string
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
  reviewed_by: string | null
  reviewed_at: string | null
  approved_by: string | null
  approved_at: string | null
  paid_by: string | null
  paid_at: string | null
  rejection_reason: string | null
  created_at: string
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

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-blue-100 text-blue-700",
  reviewing: "bg-yellow-100 text-yellow-700",
  revision_requested: "bg-orange-100 text-orange-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  processing: "bg-purple-100 text-purple-700",
  completed: "bg-teal-100 text-teal-700",
}

const categoryLabels: Record<string, string> = {
  supplies: "물품비",
  education: "교육비",
  travel: "여비",
  meeting: "회의비",
  promotion: "홍보비",
  other: "기타",
}

const paymentMethodLabels: Record<string, string> = {
  bank_transfer: "계좌이체",
  card: "카드",
  cash: "현금",
}

export default function RefundDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [application, setApplication] = useState<RefundApplication | null>(null)
  const [proofDocuments, setProofDocuments] = useState<ProofDocument[]>([])
  // Storage 버킷이 private이므로 조회 시점에 서명된 URL을 생성
  const [proofSignedUrls, setProofSignedUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApplicationDetail()
    fetchProofDocuments()
  }, [id])

  const fetchApplicationDetail = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("refund_applications")
        .select("*")
        .eq("id", id)
        .single()

      if (error) throw error
      setApplication(data as RefundApplication)
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

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>
  }

  if (!application) {
    return <div className="text-center py-8">환급신청 내역을 찾을 수 없습니다.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">환급신청 상세</h1>
          <p className="text-muted-foreground">환급신청 정보를 확인합니다</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/portal/refunds">목록으로</Link>
        </Button>
      </div>

      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{application.refund_recipient_name}</CardTitle>
              <CardDescription>환급 수령인</CardDescription>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                statusColors[application.status] || "bg-gray-100 text-gray-700"
              }`}
            >
              {statusLabels[application.status] || application.status}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">수령인 유형</span>
              <p className="font-medium">
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
              <span className="text-sm text-muted-foreground">결제 수단</span>
              <p className="font-medium">
                {paymentMethodLabels[application.payment_method] || application.payment_method}
              </p>
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
          </div>

          {application.purpose && (
            <div>
              <span className="text-sm text-muted-foreground">지출 목적</span>
              <p className="font-medium text-sm mt-1">{application.purpose}</p>
            </div>
          )}

          {/* 금액 정보 */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <span className="text-xs text-muted-foreground">신청 금액</span>
              <p className="font-medium text-lg">
                {formatCurrency(application.requested_amount)}
              </p>
            </div>
            {application.approved_amount && (
              <div>
                <span className="text-xs text-muted-foreground">승인 금액</span>
                <p className="font-medium text-lg text-green-600">
                  {formatCurrency(application.approved_amount)}
                </p>
              </div>
            )}
            {application.paid_amount && (
              <div>
                <span className="text-xs text-muted-foreground">지급 금액</span>
                <p className="font-medium text-lg text-blue-600">
                  {formatCurrency(application.paid_amount)}
                </p>
              </div>
            )}
          </div>

          {application.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <span className="text-sm font-medium text-red-700">반려 사유</span>
              <p className="text-red-600 mt-1">{application.rejection_reason}</p>
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

      {/* 상태별 안내 */}
      {application.status === "submitted" && (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription className="text-sm text-blue-700">
            환급신청이 제출되었습니다. 관리자 검토 후 승인됩니다.
          </AlertDescription>
        </Alert>
      )}

      {application.status === "approved" && (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription className="text-sm text-green-700">
            환급신청이 승인되었습니다. 곧 지급이 완료됩니다.
          </AlertDescription>
        </Alert>
      )}

      {application.status === "rejected" && (
        <Alert className="border-red-200 bg-red-50">
          <InfoIcon className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-sm text-red-700">
            환급신청이 반려되었습니다. 반려 사유를 확인하고 다시 제출해주세요.
          </AlertDescription>
        </Alert>
      )}

      {application.status === "completed" && (
        <Alert className="border-teal-200 bg-teal-50">
          <InfoIcon className="h-4 w-4 text-teal-600" />
          <AlertDescription className="text-sm text-teal-700">
            환급 지급이 완료되었습니다.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
