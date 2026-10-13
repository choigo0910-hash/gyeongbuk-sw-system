"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"
import { getSignedFileUrl } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"
import Link from "next/link"

interface PurchaseRequest {
  id: string
  item_name: string
  quantity: number
  unit_price: number | null
  requested_amount: number
  approved_amount: number | null
  paid_amount: number | null
  vendor: string
  category: string
  purpose: string | null
  purchase_date: string | null
  status: string
  reviewed_by: string | null
  reviewed_at: string | null
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
  created_at: string
}

interface ProofDocument {
  id: string
  file_name: string
  file_url: string
  file_size: number | null
  uploaded_at: string
}

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

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-blue-100 text-blue-700",
  reviewing: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  purchase_completed: "bg-purple-100 text-purple-700",
  proof_submitted: "bg-indigo-100 text-indigo-700",
  proof_approved: "bg-teal-100 text-teal-700",
  proof_rejected: "bg-red-100 text-red-700",
  completed: "bg-gray-500 text-white",
}

export default function PurchaseRequestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [request, setRequest] = useState<PurchaseRequest | null>(null)
  const [proofDocuments, setProofDocuments] = useState<ProofDocument[]>([])
  // Storage 버킷이 private이므로 조회 시점에 서명된 URL을 생성
  const [proofSignedUrls, setProofSignedUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchRequestDetail()
    fetchProofDocuments()
  }, [id])

  const fetchRequestDetail = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("purchase_requests")
        .select("*")
        .eq("id", id)
        .single()

      if (error) throw error
      setRequest(data as PurchaseRequest)
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert("로그인이 필요합니다.")
        return
      }

      for (const file of Array.from(files)) {
        const fileName = `${Date.now()}_${file.name}`
        const { error: uploadError } = await supabase.storage
          .from("proof-documents")
          .upload(fileName, file)

        if (uploadError) {
          console.error("파일 업로드 실패:", uploadError)
          continue
        }

        // 버킷이 private이므로 절대 URL 대신 경로 저장 — 조회 시 서명 URL 생성
        const { error: insertError } = await supabase
          .from("proof_documents")
          .insert({
            purchase_request_id: id,
            file_name: file.name,
            file_url: `proof-documents/${fileName}`,
            file_size: file.size,
            uploaded_by: user.id,
          })

        if (insertError) {
          console.error("증빙서류 정보 저장 실패:", insertError)
        }
      }

      alert("증빙서류가 업로드되었습니다.")
      fetchProofDocuments()

      if (request && proofDocuments.length === 0) {
        await supabase
          .from("purchase_requests")
          .update({ status: "proof_submitted" })
          .eq("id", id)
        fetchRequestDetail()
      }
    } catch (error) {
      console.error("파일 업로드 실패:", error)
      alert("파일 업로드에 실패했습니다.")
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteProof = async (proofId: string) => {
    if (!confirm("증빙서류를 삭제하시겠습니까?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("proof_documents")
        .delete()
        .eq("id", proofId)

      if (error) throw error

      alert("증빙서류가 삭제되었습니다.")
      fetchProofDocuments()
    } catch (error) {
      console.error("증빙서류 삭제 실패:", error)
      alert("증빙서류 삭제에 실패했습니다.")
    }
  }

  const canSubmitProof = request && (
    request.status === "approved" ||
    request.status === "proof_rejected"
  )

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>
  }

  if (!request) {
    return <div className="text-center py-8">요청 내역을 찾을 수 없습니다.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">결제 및 구매 요청 상세</h1>
          <p className="text-muted-foreground">요청 정보를 확인하고 증빙서류를 제출합니다</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/portal/purchase-requests">목록으로</Link>
        </Button>
      </div>

      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{request.item_name}</CardTitle>
              <CardDescription>요청 정보</CardDescription>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                statusColors[request.status] || "bg-gray-100 text-gray-700"
              }`}
            >
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
              <span className="text-sm text-muted-foreground">구매처</span>
              <p className="font-medium">{request.vendor}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">요청 금액</span>
              <p className="font-medium text-lg">
                {formatCurrency(request.requested_amount)}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">승인 금액</span>
              <p className="font-medium text-green-600">
                {request.approved_amount ? formatCurrency(request.approved_amount) : "-"}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">요청일</span>
              <p className="font-medium">
                {new Date(request.created_at).toLocaleDateString("ko-KR")}
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
          </div>

          {request.purpose && (
            <PurposeDetail purpose={request.purpose} />
          )}

          {request.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <span className="text-sm font-medium text-red-700">반려 사유</span>
              <p className="text-red-600 mt-1">{request.rejection_reason}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 증빙서류 */}
      <Card>
        <CardHeader>
          <CardTitle>증빙서류</CardTitle>
          <CardDescription>
            {request.category.includes("용품") || request.category.includes("도서")
              ? "물품 수령 후 사진을 촬영하여 증빙서에 포함해주세요"
              : "구매/결제 완료 후 증빙서류를 제출해주세요"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {canSubmitProof && (
            <>
              <div>
                <Label htmlFor="proofFile">증빙서류 업로드</Label>
                <Input
                  id="proofFile"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, JPG, PNG 파일만 업로드 가능합니다
                </p>
              </div>

              <Button asChild variant="link" className="p-0 h-auto text-sm">
                <a href="/docs/proof-template.xlsx" target="_blank" rel="noopener noreferrer">
                  증빙서 양식 다운로드 →
                </a>
              </Button>
            </>
          )}

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
                  <div className="flex gap-2">
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
                    {canSubmitProof && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteProof(doc.id)}
                      >
                        삭제
                      </Button>
                    )}
                  </div>
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
      {request.status === "draft" && (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription className="text-sm text-yellow-700">
            임시저장 상태입니다. 제출하려면 편집 버튼을 클릭하세요.
          </AlertDescription>
        </Alert>
      )}

      {request.status === "approved" && (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription className="text-sm text-blue-700">
            요청이 승인되었습니다. 구매/결제를 완료한 후 증빙서류를 제출해주세요.
          </AlertDescription>
        </Alert>
      )}

      {request.status === "rejected" && (
        <Alert className="border-red-200 bg-red-50">
          <InfoIcon className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-sm text-red-700">
            요청이 반려되었습니다. 반려 사유를 확인하고 다시 제출해주세요.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
