"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { getSignedFileUrl } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Attachment {
  id: string
  attachment_type: string
  file_name: string
  file_url: string
  file_size: number | null
  uploaded_at: string
}

const attachmentTypeLabels: Record<string, string> = {
  quote: "견적서",
  additional: "추가 증빙",
  education_plan: "학습 계획서",
  service_document: "제출 서류",
}

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return ""
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

// 신청 단계 첨부파일 (견적서·학습 계획서·용역 서류 등) — 없으면 표시하지 않음
export function PurchaseRequestAttachmentsCard({ purchaseRequestId }: { purchaseRequestId: string }) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchAttachments = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("purchase_request_attachments")
        .select("id, attachment_type, file_name, file_url, file_size, uploaded_at")
        .eq("purchase_request_id", purchaseRequestId)
        .is("deleted_at", null)
        .order("uploaded_at")

      if (error) {
        console.error("첨부파일 조회 실패:", error)
        return
      }
      const rows = (data as Attachment[]) || []
      setAttachments(rows)

      // 버킷이 private이므로 서명 URL로 열람
      const urlMap: Record<string, string> = {}
      await Promise.all(
        rows.map(async (row) => {
          const url = await getSignedFileUrl(supabase, row.file_url)
          if (url) urlMap[row.id] = url
        })
      )
      setSignedUrls(urlMap)
    }

    if (purchaseRequestId) fetchAttachments()
  }, [purchaseRequestId])

  if (attachments.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>신청 첨부파일</CardTitle>
        <CardDescription>요청 제출 시 첨부한 서류 {attachments.length}건</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {attachments.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-4 p-3 border rounded-lg">
              <div className="min-w-0">
                <p className="text-xs text-gray-500">{attachmentTypeLabels[a.attachment_type] || a.attachment_type}</p>
                <p className="font-medium text-sm truncate">{a.file_name}</p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(a.file_size)}
                  {a.file_size ? " · " : ""}
                  {new Date(a.uploaded_at).toLocaleDateString("ko-KR")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={!signedUrls[a.id]}
                onClick={() => signedUrls[a.id] && window.open(signedUrls[a.id], "_blank")}
              >
                보기
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
