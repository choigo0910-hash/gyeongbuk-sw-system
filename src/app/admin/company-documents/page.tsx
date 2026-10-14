"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { getSignedFileUrl } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  company_name?: string
  submitted_by_email?: string
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

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
}

export default function AdminCompanyDocumentsPage() {
  const [documents, setDocuments] = useState<CompanyDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("submitted")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  // Storage 버킷이 private이므로 조회 시점에 서명된 URL을 생성
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      // 서류 목록 가져오기 (회사, 제출자 정보 포함)
      const { data } = await supabase
        .from("company_documents")
        .select(`
          *,
          companies(name),
          submitted_by_user:user_profiles!company_documents_submitted_by_fkey(email)
        `)
        .order("created_at", { ascending: false })

      const documentsWithNames = (data || []).map((doc: any) => ({
        ...doc,
        company_name: doc.companies?.name || "",
        submitted_by_email: doc.submitted_by_user?.email || "",
      }))

      setDocuments(documentsWithNames)

      const urlMap: Record<string, string> = {}
      await Promise.all(
        documentsWithNames.map(async (doc: CompanyDocument) => {
          const url = await getSignedFileUrl(supabase, doc.file_url)
          if (url) urlMap[doc.id] = url
        })
      )
      setSignedUrls(urlMap)
    } catch (error) {
      console.error("서류 목록 조회 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter
    const matchesType = typeFilter === "all" || doc.document_type === typeFilter
    const matchesSearch =
      searchQuery === "" ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesType && matchesSearch
  })

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-"
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  // 제출 건수 계산
  const pendingCount = documents.filter((d) => d.status === "submitted").length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">기업 서류 관리</h1>
          <p className="text-muted-foreground">제출된 서류를 검토하고 승인합니다</p>
        </div>
      </div>

      {/* 대기 항목 알림 */}
      {pendingCount > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                </span>
                <span className="font-medium text-yellow-900">
                  검토 대기 중인 서류가 {pendingCount}건 있습니다
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="제목, 기업명, 프로그램명 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="서류 종류" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="business_registration">사업자등록증</SelectItem>
                <SelectItem value="interim_report">중간 성과 보고서</SelectItem>
                <SelectItem value="final_report">최종 성과 보고서</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="submitted">제출됨</SelectItem>
                <SelectItem value="approved">승인완료</SelectItem>
                <SelectItem value="rejected">반려</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 서류 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>서류 목록</CardTitle>
          <CardDescription>
            총 {filteredDocuments.length}건
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">제출된 서류가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium">{doc.title}</span>
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                          {documentTypeLabels[doc.document_type] || doc.document_type}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            statusColors[doc.status] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {statusLabels[doc.status] || doc.status}
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>기업: {doc.company_name}</span>
                        <span>파일: {doc.file_name}</span>
                        <span>크기: {formatFileSize(doc.file_size)}</span>
                        {doc.submitted_at && (
                          <span>
                            제출일: {new Date(doc.submitted_at).toLocaleDateString("ko-KR")}
                          </span>
                        )}
                      </div>
                      {doc.rejection_reason && (
                        <div className="mt-2 text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                          반려 사유: {doc.rejection_reason}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {signedUrls[doc.id] ? (
                        <Button asChild variant="outline" size="sm">
                          <a href={signedUrls[doc.id]} target="_blank" rel="noopener noreferrer">
                            보기
                          </a>
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" disabled>
                          보기
                        </Button>
                      )}
                      {doc.status === "submitted" && (
                        <Button asChild size="sm">
                          <Link href={`/admin/company-documents/${doc.id}/review`}>
                            검토
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
