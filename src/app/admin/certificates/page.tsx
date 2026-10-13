"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

interface Certificate {
  id: string
  document_number: string
  participant_name: string
  affiliation: string | null
  program_name: string
  program_start_at: string
  program_end_at: string
  application_id: string
  issued_at: string
  verification_code: string
  pdf_path: string | null
  user_email: string | null
  user_name: string | null
}

const statusLabels: Record<string, string> = {
  pending: "신청중",
  approved: "승인",
  rejected: "반려",
  issued: "발급완료",
}

const statusColors: Record<string, string> = {
  pending: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  issued: "bg-teal-100 text-teal-700",
}

export default function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [submitting, setSubmitting] = useState(false)

  // 발급 처리용 상태
  const [selectedCert, setSelectedCert] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")

  useEffect(() => {
    fetchCertificates()
  }, [])

  const fetchCertificates = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      const { data } = await supabase
        .from("certificates")
        .select(`
          *,
          program_applications!inner(
            applicant_id,
            applicants!inner(email, full_name)
          )
        `)
        .order("issued_at", { ascending: false })

      if (data) {
        const formattedData = data.map((item: any) => ({
          ...item,
          user_email: item.program_applications.applicants?.email,
          user_name: item.program_applications.applicants?.full_name,
        }))
        setCertificates(formattedData as Certificate[])
      }
    } catch (error) {
      console.error("확인서 목록 조회 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  const getCertStatus = (cert: Certificate) => {
    if (cert.pdf_path) return "issued"
    if (cert.document_number.startsWith("SW-")) return "approved"
    return "pending"
  }

  const handleApprove = async (certId: string) => {
    if (!confirm("이 확인서 발급을 승인하시겠습니까?")) return

    setSubmitting(true)
    try {
      const supabase = createClient()

      // 문서번호와 인증코드 생성
      const { data: functions } = await supabase.rpc("generate_document_number")
      const document_number = functions || `SW-${new Date().getFullYear()}-${Date.now()}`

      const { data: verifyData } = await supabase.rpc("generate_verification_code")
      const verification_code = verifyData || `VERIFY-${Date.now()}`

      const { error } = await supabase
        .from("certificates")
        .update({
          document_number,
          verification_code,
        })
        .eq("id", certId)

      if (error) throw error

      alert("승인되었습니다. PDF 생성 후 발급이 완료됩니다.")
      fetchCertificates()
    } catch (error) {
      console.error("승인 실패:", error)
      alert("승인에 실패했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async (certId: string) => {
    if (!rejectionReason.trim()) {
      alert("반려 사유를 입력해주세요.")
      return
    }

    if (!confirm("이 확인서 발급을 반려하시겠습니까?")) return

    setSubmitting(true)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("certificates")
        .delete()
        .eq("id", certId)

      if (error) throw error

      alert("반려 처리되었습니다.")
      setSelectedCert(null)
      setRejectionReason("")
      fetchCertificates()
    } catch (error) {
      console.error("반려 실패:", error)
      alert("반려에 실패했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  const filteredCertificates = certificates.filter((cert) => {
    const status = getCertStatus(cert)
    if (statusFilter === "all") return true
    return status === statusFilter
  })

  const pendingCount = certificates.filter((c) => getCertStatus(c) === "pending").length
  const approvedCount = certificates.filter((c) => getCertStatus(c) === "approved").length
  const issuedCount = certificates.filter((c) => getCertStatus(c) === "issued").length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">확인서 발급 관리</h1>
          <p className="text-muted-foreground">프로그램 참여 확인서 발급을 관리합니다</p>
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">전체 신청</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{certificates.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">신청 대기</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">승인 대기</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">발급 완료</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">{issuedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 */}
      <Card>
        <CardContent className="pt-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="상태 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="pending">신청중</SelectItem>
              <SelectItem value="approved">승인</SelectItem>
              <SelectItem value="issued">발급완료</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* 확인서 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>발급 신청 목록</CardTitle>
          <CardDescription>
            총 {filteredCertificates.length}건 (필터 적용)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : filteredCertificates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">발급 신청 내역이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCertificates.map((cert) => {
                const status = getCertStatus(cert)
                return (
                  <div
                    key={cert.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{cert.participant_name}</span>
                          {cert.affiliation && (
                            <span className="text-sm text-muted-foreground">({cert.affiliation})</span>
                          )}
                          <span className="text-sm text-muted-foreground">{cert.program_name}</span>
                          <Badge className={statusColors[status]}>
                            {statusLabels[status]}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>신청자: {cert.user_name || "미입력"} ({cert.user_email || "이메일 없음"})</p>
                          <p>
                            프로그램 기간:{" "}
                            {new Date(cert.program_start_at).toLocaleDateString("ko-KR")} - {" "}
                            {new Date(cert.program_end_at).toLocaleDateString("ko-KR")}
                          </p>
                          <p>신청일: {new Date(cert.issued_at).toLocaleDateString("ko-KR")}</p>
                          {status === "approved" && !cert.pdf_path && (
                            <p className="text-orange-600">PDF 생성 대기중</p>
                          )}
                        </div>

                        {/* 반려 사유 입력 */}
                        {selectedCert === cert.id && (
                          <div className="mt-3 pt-3 border-t space-y-3">
                            <div className="space-y-2">
                              <Label>반려 사유</Label>
                              <Textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="반려 사유 입력"
                                rows={2}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleReject(cert.id)}
                                disabled={submitting}
                                variant="destructive"
                              >
                                반려
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedCert(null)
                                  setRejectionReason("")
                                }}
                              >
                                취소
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(cert.id)}
                              disabled={submitting}
                            >
                              승인
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedCert(cert.id)}
                            >
                              반려
                            </Button>
                          </>
                        )}
                        {status === "issued" && cert.pdf_path && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={cert.pdf_path} target="_blank" rel="noopener noreferrer">
                              PDF 보기
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 안내 */}
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription className="text-sm">
          승인 후 문서번호와 인증코드가 자동 생성됩니다. PDF 생성은 별도 작업이 필요할 수 있습니다.
        </AlertDescription>
      </Alert>
    </div>
  )
}
