"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getSignedFileUrl } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { sendNotification, type NotificationType } from "@/lib/notifications"
import { InfoIcon } from "lucide-react"
import Link from "next/link"

interface CompanyDocument {
  id: string
  company_id: string
  document_type: string
  title: string
  description: string | null
  file_name: string
  file_url: string
  file_size: number | null
  status: string
  submitted_at: string | null
  submitted_by: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  created_at: string
  company_name: string
  submitted_by_email: string
}

const documentTypeLabels: Record<string, string> = {
  business_registration: "사업자등록증",
  interim_report: "중간 성과 보고서",
  final_report: "최종 성과 보고서",
}

const statusLabels: Record<string, string> = {
  draft: "임시저장",
  submitted: "제출됨",
  approved: "승인완료",
  rejected: "반려",
}

export default function AdminCompanyDocumentReviewPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [document, setDocument] = useState<CompanyDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  // Storage 버킷이 private이므로 조회 시점에 서명된 URL을 생성
  const [fileSignedUrl, setFileSignedUrl] = useState<string | null>(null)

  useEffect(() => {
    fetchDocumentDetail()
  }, [id])

  const fetchDocumentDetail = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("company_documents")
        .select(`
          *,
          companies!inner(name),
          submitted_by_user:user_profiles!company_documents_submitted_by_fkey(email)
        `)
        .eq("id", id)
        .single()

      if (error) throw error

      const formattedData = {
        ...(data as any),
        company_name: (data as any).companies.name,
        submitted_by_email: (data as any).submitted_by_user?.email || "",
      }
      setDocument(formattedData as CompanyDocument)
      setFileSignedUrl(await getSignedFileUrl(supabase, (data as any).file_url))
    } catch (error) {
      console.error("서류 상세 조회 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!confirm("이 서류를 승인하시겠습니까?")) return

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert("로그인이 필요합니다.")
        return
      }

      const { error } = await supabase
        .from("company_documents")
        .update({
          status: "approved",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: null,
        })
        .eq("id", id)

      if (error) throw error

      // 알림 발송
      if (document?.submitted_by) {
        await sendNotification({
          userId: document.submitted_by,
          type: "document_approved" as NotificationType,
          title: "서류 승인 완료",
          content: `[${document.title}] 서류가 승인되었습니다.`,
          link: `/portal/company-documents`,
        })
      }

      alert("승인되었습니다.")
      router.push("/admin/company-documents")
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

    if (!confirm("이 서류를 반려하시겠습니까?")) return

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert("로그인이 필요합니다.")
        return
      }

      const { error } = await supabase
        .from("company_documents")
        .update({
          status: "rejected",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason.trim(),
        })
        .eq("id", id)

      if (error) throw error

      // 알림 발송
      if (document?.submitted_by) {
        await sendNotification({
          userId: document.submitted_by,
          type: "document_rejected" as NotificationType,
          title: "서류 반려",
          content: `[${document.title}] 서류가 반려되었습니다. 사유: ${rejectionReason}`,
          link: `/portal/company-documents`,
        })
      }

      alert("반려되었습니다.")
      router.push("/admin/company-documents")
    } catch (error) {
      console.error("반려 실패:", error)
      alert("반려에 실패했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-"
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">서류를 찾을 수 없습니다.</p>
        <Button asChild className="mt-4">
          <Link href="/admin/company-documents">목록으로</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">서류 검토</h1>
          <p className="text-muted-foreground">제출된 서류를 검토합니다</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/company-documents">목록으로</Link>
        </Button>
      </div>

      {/* 서류 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>서류 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">기업명</Label>
              <p className="font-medium">{document.company_name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">서류 종류</Label>
              <p className="font-medium">
                {documentTypeLabels[document.document_type] || document.document_type}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">상태</Label>
              <p className="font-medium">
                {statusLabels[document.status] || document.status}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">제목</Label>
              <p className="font-medium">{document.title}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">파일명</Label>
              <p className="font-medium">{document.file_name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">파일 크기</Label>
              <p className="font-medium">{formatFileSize(document.file_size)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">제출일</Label>
              <p className="font-medium">
                {document.submitted_at
                  ? new Date(document.submitted_at).toLocaleString("ko-KR")
                  : "-"}
              </p>
            </div>
            {document.description && (
              <div className="col-span-2">
                <Label className="text-muted-foreground">설명</Label>
                <p className="font-medium">{document.description}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            {fileSignedUrl ? (
              <Button asChild variant="outline">
                <a href={fileSignedUrl} target="_blank" rel="noopener noreferrer">
                  파일 보기
                </a>
              </Button>
            ) : (
              <Button variant="outline" disabled>
                파일 보기
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 검토 폼 */}
      {document.status === "submitted" && (
        <Card>
          <CardHeader>
            <CardTitle>검토</CardTitle>
            <CardDescription>서류를 승인하거나 반려합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                승인 시 기업에게 알림이 발송됩니다. 반려 시 반려 사유를 입력해야 합니다.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="rejectionReason">반려 사유</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="반려 사유를 입력하세요"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleApprove}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitting ? "처리 중..." : "승인"}
              </Button>
              <Button
                onClick={handleReject}
                disabled={submitting}
                variant="destructive"
              >
                {submitting ? "처리 중..." : "반려"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 이미 처리된 경우 */}
      {document.status !== "submitted" && (
        <Card>
          <CardContent className="pt-6">
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                이 서류는 이미{" "}
                {statusLabels[document.status] || document.status}
                되었습니다.
                {document.rejection_reason && (
                  <>
                    <br />
                    반려 사유: {document.rejection_reason}
                  </>
                )}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
