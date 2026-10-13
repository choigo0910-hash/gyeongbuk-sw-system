"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon, DownloadIcon, ExternalLinkIcon } from "lucide-react"
import Link from "next/link"

interface Certificate {
  id: string
  document_number: string
  participant_name: string
  affiliation: string | null
  program_name: string
  program_start_at: string
  program_end_at: string
  location: string | null
  issued_at: string
  verification_code: string
  pdf_path: string | null
  reissue_count: number
}

interface CertificateStatus {
  status: "pending" | "approved" | "rejected" | "issued"
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

export default function CertificateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [status, setStatus] = useState<CertificateStatus>({ status: "pending" })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCertificateDetail()
  }, [id])

  const fetchCertificateDetail = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .eq("id", id)
        .single()

      if (error) throw error

      const cert = data as Certificate

      // 상태 결정 (문서번호와 PDF 경로로 판단)
      let certStatus: "pending" | "approved" | "rejected" | "issued" = "pending"
      if (cert.pdf_path) {
        certStatus = "issued"
      } else if (cert.document_number.startsWith("SW-")) {
        certStatus = "approved"
      }

      setCertificate(cert)
      setStatus({ status: certStatus })
    } catch (error) {
      console.error("확인서 상세 조회 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  const downloadCertificate = () => {
    if (certificate?.pdf_path) {
      window.open(certificate.pdf_path, "_blank")
    }
  }

  const verifyCertificate = () => {
    if (certificate?.verification_code && certificate.verification_code !== "PENDING") {
      window.open(`/verify/${certificate.verification_code}`, "_blank")
    }
  }

  const isIssued = status.status === "issued"

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>
  }

  if (!certificate) {
    return <div className="text-center py-8">확인서를 찾을 수 없습니다.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">확인서 상세</h1>
        </div>
        <Button variant="outline" asChild>
          <Link href="/portal/certificates">목록으로</Link>
        </Button>
      </div>

      {/* 상태 표시 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>참여 확인서</CardTitle>
              <CardDescription>프로그램 참여 완료 확인서</CardDescription>
            </div>
            <Badge className={statusColors[status.status]}>
              {statusLabels[status.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 문서번호 */}
          {certificate.document_number && certificate.document_number !== "PENDING" && (
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm text-muted-foreground">문서번호</span>
                <p className="font-mono font-medium text-lg">{certificate.document_number}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => {
                navigator.clipboard.writeText(certificate.document_number)
                alert("문서번호가 복사되었습니다.")
              }}>
                복사
              </Button>
            </div>
          )}

          {/* 기본 정보 */}
          <div className="space-y-3">
            <div>
              <span className="text-sm text-muted-foreground">성명</span>
              <p className="font-medium">{certificate.participant_name}</p>
            </div>
            {certificate.affiliation && (
              <div>
                <span className="text-sm text-muted-foreground">소속</span>
                <p className="font-medium">{certificate.affiliation}</p>
              </div>
            )}
            <div>
              <span className="text-sm text-muted-foreground">프로그램명</span>
              <p className="font-medium">{certificate.program_name}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">프로그램 기간</span>
              <p className="font-medium">
                {new Date(certificate.program_start_at).toLocaleDateString("ko-KR")} - {" "}
                {new Date(certificate.program_end_at).toLocaleDateString("ko-KR")}
              </p>
            </div>
            {certificate.location && (
              <div>
                <span className="text-sm text-muted-foreground">장소</span>
                <p className="font-medium">{certificate.location}</p>
              </div>
            )}
            <div>
              <span className="text-sm text-muted-foreground">발급일</span>
              <p className="font-medium">
                {new Date(certificate.issued_at).toLocaleDateString("ko-KR")}
              </p>
            </div>
          </div>

          {/* 인증코드 */}
          {certificate.verification_code && certificate.verification_code !== "PENDING" && (
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
              <div>
                <span className="text-sm text-muted-foreground">인증코드</span>
                <p className="font-mono font-medium text-lg">{certificate.verification_code}</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={`/verify/${certificate.verification_code}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLinkIcon className="h-4 w-4 mr-2" />
                  인증하기
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 액션 버튼 */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          {isIssued && (
            <Button onClick={downloadCertificate} className="w-full">
              <DownloadIcon className="h-4 w-4 mr-2" />
              PDF 다운로드
            </Button>
          )}

          {!isIssued && status.status !== "rejected" && (
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {status.status === "pending" && "관리자 승인 후 확인서가 발급됩니다."}
                {status.status === "approved" && "발급 처리 중입니다. 곧 다운로드 가능합니다."}
              </AlertDescription>
            </Alert>
          )}

          {status.status === "rejected" && (
            <Alert className="border-red-200 bg-red-50">
              <InfoIcon className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-sm text-red-700">
                확인서 발급이 반려되었습니다. 관리자에게 문의해주세요.
              </AlertDescription>
            </Alert>
          )}

          {/* 재발급 안내 */}
          {certificate.reissue_count > 0 && (
            <div className="text-sm text-muted-foreground">
              재발급 횟수: {certificate.reissue_count}회
            </div>
          )}
        </CardContent>
      </Card>

      {/* 확인서 진위 확인 안내 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-medium mb-2">확인서 진위 확인</h3>
          <p className="text-sm text-muted-foreground mb-2">
            확인서의 진위 여부는 인증코드로 확인할 수 있습니다.
          </p>
          <p className="text-sm text-muted-foreground">
            인증코드를 입력하거나 QR코드를 스캔하면 확인서의 진위 여부와 정보를 확인할 수 있습니다.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
