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

interface OfficeItem {
  id: string
  itemName: string
  quantity: number
  option?: string
  link?: string
  amount: number
}

interface ShippingInfo {
  recipientName: string
  address: string
  contactPhone: string
}

interface PurposeData {
  officeItems?: OfficeItem[]
  shippingInfo?: ShippingInfo
  reason?: string
}

interface PurchaseRequest {
  id: string
  company_id: string
  item_name: string
  quantity: number
  unit_price: number | null
  requested_amount: number
  approved_amount: number | null
  vendor: string
  category: string
  purpose: string | null
  purchase_date: string | null
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
  uploaded_at: string
}

const statusLabels: Record<string, string> = {
  draft: "임시저장",
  submitted: "제출됨",
  reviewing: "검토중",
  approved: "승인완료",
  rejected: "반려",
  purchase_completed: "구매완료",
  proof_submitted: "증빙제출",
  proof_approved: "증빙승인",
  proof_rejected: "증빙반려",
  completed: "완료",
}

// JSON 파싱 함수
const parsePurpose = (purpose: string | null): PurposeData | null => {
  if (!purpose) return null
  try {
    return JSON.parse(purpose) as PurposeData
  } catch {
    return null
  }
}

// 상세 내용 렌더링 컴포넌트
function PurposeDetail({ purpose }: { purpose: string | null }) {
  const parsed = parsePurpose(purpose)

  // JSON 파싱 실패 또는 빈 데이터면 원본 텍스트 표시
  if (!parsed) {
    return (
      <div>
        <span className="text-sm text-muted-foreground">상세 내용</span>
        <p className="font-medium text-sm mt-1 whitespace-pre-wrap">{purpose || "-"}</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <span className="text-sm font-medium text-gray-700">상세 내용</span>

      {/* 품목 목록 */}
      {parsed.officeItems && parsed.officeItems.length > 0 && (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
            <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              품목 정보
            </h4>
          </div>
          <div className="divide-y divide-gray-100">
            {parsed.officeItems.map((item, idx) => (
              <div key={item.id || idx} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <p className="font-medium text-gray-900">{item.itemName}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-8 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold px-1">수량</span>
                        {item.quantity}개
                      </span>
                      {item.option && (
                        <span className="inline-flex items-center gap-1">
                          <span className="w-8 h-4 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-[10px] font-bold px-1">옵션</span>
                          {item.option}
                        </span>
                      )}
                    </div>
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        상품 링크
                      </a>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg text-gray-900">
                      {formatCurrency(item.amount, { showSymbol: false })}
                      <span className="text-sm font-normal text-gray-600 ml-1">원</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 배송 정보 */}
      {parsed.shippingInfo && (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
            <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              배송 정보
            </h4>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">수령인</p>
                  <p className="font-medium text-gray-900">{parsed.shippingInfo.recipientName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">연락처</p>
                  <p className="font-medium text-gray-900">{parsed.shippingInfo.contactPhone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 md:col-span-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">배송지 주소</p>
                  <p className="font-medium text-gray-900">{parsed.shippingInfo.address}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 사유 */}
      {parsed.reason && (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
            <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              구매 사유
            </h4>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-700 leading-relaxed">{parsed.reason}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminPurchaseRequestReviewPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [request, setRequest] = useState<PurchaseRequest | null>(null)
  const [proofDocuments, setProofDocuments] = useState<ProofDocument[]>([])
  // Storage 버킷이 private이므로 조회 시점에 서명된 URL을 생성
  const [proofSignedUrls, setProofSignedUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [approvedAmount, setApprovedAmount] = useState(0)
  const [rejectionReason, setRejectionReason] = useState("")

  useEffect(() => {
    fetchRequestDetail()
    fetchProofDocuments()
  }, [id])

  const fetchRequestDetail = async () => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("purchase_requests")
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
      setRequest(formattedData as PurchaseRequest)
      setApprovedAmount(formattedData.approved_amount || formattedData.requested_amount)
    } catch (error) {
      console.error("요청 상세 조회 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProofDocuments = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("proof_documents")
        .select("*")
        .eq("purchase_request_id", id)
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
    if (!confirm("이 요청을 승인하시겠습니까?")) return

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert("로그인이 필요합니다.")
        return
      }

      const { error } = await supabase
        .from("purchase_requests")
        .update({
          status: "approved",
          approved_amount: approvedAmount,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) throw error

      // 알림 발송
      if (request?.created_by) {
        await sendNotification({
          userId: request.created_by,
          type: "purchase_approved" as NotificationType,
          title: "구매요청이 승인되었습니다",
          content: `승인 금액: ${formatCurrency(approvedAmount)}`,
          link: `/portal/purchase-requests/${id}`,
          metadata: {
            purchaseRequestId: id,
            itemName: request.item_name,
            approvedAmount: approvedAmount,
          },
          sendEmail: true,
        })
      }

      alert("승인이 완료되었습니다.")
      router.push("/admin/purchase-requests")
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

    if (!confirm("이 요청을 반려하시겠습니까?")) return

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert("로그인이 필요합니다.")
        return
      }

      const { error } = await supabase
        .from("purchase_requests")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) throw error

      // 알림 발송
      if (request?.created_by) {
        await sendNotification({
          userId: request.created_by,
          type: "purchase_rejected" as NotificationType,
          title: "구매요청이 반려되었습니다",
          content: `반려 사유: ${rejectionReason}`,
          link: `/portal/purchase-requests/${id}`,
          metadata: {
            purchaseRequestId: id,
            itemName: request.item_name,
            rejectionReason: rejectionReason,
          },
          sendEmail: true,
        })
      }

      alert("반려가 완료되었습니다.")
      router.push("/admin/purchase-requests")
    } catch (error) {
      console.error("반려 실패:", error)
      alert("반려에 실패했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleStartReview = async () => {
    if (!confirm("검토를 시작하시겠습니까?")) return

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert("로그인이 필요합니다.")
        return
      }

      const { error } = await supabase
        .from("purchase_requests")
        .update({
          status: "reviewing",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) throw error

      // 알림 발송
      if (request?.created_by) {
        await sendNotification({
          userId: request.created_by,
          type: "purchase_reviewing" as NotificationType,
          title: "구매요청 검토가 시작되었습니다",
          content: `제출하신 ${request.item_name}의 검토가 시작되었습니다.`,
          link: `/portal/purchase-requests/${id}`,
          metadata: {
            purchaseRequestId: id,
            itemName: request.item_name,
          },
          sendEmail: true,
        })
      }

      alert("검토가 시작되었습니다.")
      fetchRequestDetail() // 상태 새로고침
    } catch (error) {
      console.error("검토 시작 실패:", error)
      alert("검토 시작에 실패했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleProofApprove = async () => {
    if (!confirm("증빙서류를 승인하시겠습니까?")) return

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert("로그인이 필요합니다.")
        return
      }

      const { error } = await supabase
        .from("purchase_requests")
        .update({
          status: "proof_approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) throw error

      // 알림 발송
      if (request?.created_by) {
        await sendNotification({
          userId: request.created_by,
          type: "purchase_proof_approved" as NotificationType,
          title: "증빙서류가 승인되었습니다",
          content: `제출하신 ${request.item_name}의 증빙서류가 승인되었습니다.`,
          link: `/portal/purchase-requests/${id}`,
          metadata: {
            purchaseRequestId: id,
            itemName: request.item_name,
          },
          sendEmail: true,
        })
      }

      alert("증빙승인이 완료되었습니다.")
      router.push("/admin/purchase-requests")
    } catch (error) {
      console.error("증빙승인 실패:", error)
      alert("증빙승인에 실패했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleProofReject = async () => {
    if (!rejectionReason.trim()) {
      alert("반려 사유를 입력해주세요.")
      return
    }

    if (!confirm("증빙서류를 반려하시겠습니까?")) return

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert("로그인이 필요합니다.")
        return
      }

      const { error } = await supabase
        .from("purchase_requests")
        .update({
          status: "proof_rejected",
          rejection_reason: rejectionReason,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) throw error

      // 알림 발송
      if (request?.created_by) {
        await sendNotification({
          userId: request.created_by,
          type: "purchase_proof_rejected" as NotificationType,
          title: "증빙서류가 반려되었습니다",
          content: `반려 사유: ${rejectionReason}`,
          link: `/portal/purchase-requests/${id}`,
          metadata: {
            purchaseRequestId: id,
            itemName: request.item_name,
            rejectionReason: rejectionReason,
          },
          sendEmail: true,
        })
      }

      alert("증빙반려가 완료되었습니다.")
      router.push("/admin/purchase-requests")
    } catch (error) {
      console.error("증빙반려 실패:", error)
      alert("증빙반려에 실패했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>
  }

  if (!request) {
    return <div className="text-center py-8">요청 내역을 찾을 수 없습니다.</div>
  }

  const isSubmittedReview = request.status === "submitted" || request.status === "reviewing" || request.status === "rejected"
  const isProofReview = request.status === "proof_submitted"
  const canStartReview = request.status === "submitted" || request.status === "rejected"
  const isRejected = request.status === "rejected"

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">결제 및 구매 요청 검토</h1>
          <p className="text-muted-foreground">
            {isSubmittedReview && "요청을 검토하고 승인 여부를 결정합니다"}
            {isProofReview && "증빙서류를 검토하고 승인 여부를 결정합니다"}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/purchase-requests">목록으로</Link>
        </Button>
      </div>

      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{request.company_name}</CardTitle>
              <CardDescription>기업 정보</CardDescription>
            </div>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
              {statusLabels[request.status] || request.status}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">분류</span>
              <p className="font-medium">{request.category}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">품목명</span>
              <p className="font-medium">{request.item_name}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">구매처</span>
              <p className="font-medium">{request.vendor}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">요청 금액</span>
              <p className="font-medium text-lg">
                {formatCurrency(request.requested_amount)}
              </p>
            </div>
            {request.purchase_date && (
              <div>
                <span className="text-sm text-muted-foreground">구매일자</span>
                <p className="font-medium">
                  {new Date(request.purchase_date).toLocaleDateString("ko-KR")}
                </p>
              </div>
            )}
            <div>
              <span className="text-sm text-muted-foreground">요청일</span>
              <p className="font-medium">
                {new Date(request.created_at).toLocaleDateString("ko-KR")}
              </p>
            </div>
          </div>

          {request.purpose && (
            <PurposeDetail purpose={request.purpose} />
          )}
        </CardContent>
      </Card>

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

      {/* 검토 폼 */}
      {isSubmittedReview && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isRejected ? "재검토" : "승인 결정"}
            </CardTitle>
            <CardDescription>
              {isRejected
                ? "반려된 요청을 재검토합니다"
                : "요청을 승인하거나 반려합니다"}
            </CardDescription>
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
                요청 금액: {formatCurrency(request.requested_amount)}
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

            {/* 검토 시작 버튼 (submitted 상태일 때만) */}
            {canStartReview && (
              <Button
                onClick={handleStartReview}
                disabled={submitting}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
              >
                {submitting ? "처리 중..." : "검토 시작"}
              </Button>
            )}

            {/* 승인/반려 버튼 (reviewing 상태일 때) */}
            {!canStartReview && (
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
            )}
          </CardContent>
        </Card>
      )}

      {isProofReview && (
        <Card>
          <CardHeader>
            <CardTitle>증빙 검토</CardTitle>
            <CardDescription>제출된 증빙서류를 검토하고 승인 여부를 결정합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {request.category.includes("용품") || request.category.includes("도서")
                  ? "물품 수령 사진이 포함되어 있는지 확인해주세요."
                  : "증빙서류가 적절한지 확인해주세요."}
              </AlertDescription>
            </Alert>

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
                onClick={handleProofApprove}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? "처리 중..." : "증빙 승인"}
              </Button>
              <Button
                onClick={handleProofReject}
                disabled={submitting}
                variant="destructive"
                className="flex-1"
              >
                {submitting ? "처리 중..." : "증빙 반려"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 이미 완료된 경우 */}
      {!isSubmittedReview && !isProofReview && (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription className="text-sm text-gray-600">
            이 요청은 이미 {statusLabels[request.status]} 상태입니다.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
