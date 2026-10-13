"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"
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
}

export default function VerifyCertificatePage() {
  const params = useParams()
  const code = params.code as string

  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    verifyCertificate()
  }, [code])

  const verifyCertificate = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .eq("verification_code", code)
        .single()

      if (error || !data) {
        setVerified(false)
        setLoading(false)
        return
      }

      setCertificate(data as Certificate)
      setVerified(true)
    } catch (error) {
      setVerified(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">확인 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl">
        {!verified ? (
          <Card className="border-red-200">
            <CardContent className="pt-12 pb-12 text-center">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-red-600 mb-2">확인서를 찾을 수 없습니다</h1>
              <p className="text-muted-foreground mb-6">
                입력하신 인증코드로 등록된 확인서가 없습니다.
              </p>
              <Button asChild>
                <Link href="/">홈으로</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-2xl">프로그램 참여 확인서</CardTitle>
              <CardDescription>진위 확인이 완료되었습니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 상태 배지 */}
              <div className="flex justify-center">
                <Badge className="bg-green-100 text-green-700 px-4 py-2 text-base">
                  ✓ 정식 확인서
                </Badge>
              </div>

              {/* 확인서 정보 */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">문서번호</span>
                    <p className="font-mono font-medium">{certificate?.document_number}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">인증코드</span>
                    <p className="font-mono font-medium">{certificate?.verification_code}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm text-muted-foreground">성명</span>
                    <p className="font-medium">{certificate?.participant_name}</p>
                  </div>
                  {certificate?.affiliation && (
                    <div className="col-span-2">
                      <span className="text-sm text-muted-foreground">소속</span>
                      <p className="font-medium">{certificate.affiliation}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <span className="text-sm text-muted-foreground">프로그램명</span>
                    <p className="font-medium">{certificate?.program_name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">시작일</span>
                    <p className="font-medium">
                      {certificate && new Date(certificate.program_start_at).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">종료일</span>
                    <p className="font-medium">
                      {certificate && new Date(certificate.program_end_at).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                  {certificate?.location && (
                    <div className="col-span-2">
                      <span className="text-sm text-muted-foreground">장소</span>
                      <p className="font-medium">{certificate.location}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <span className="text-sm text-muted-foreground">발급일</span>
                    <p className="font-medium">
                      {certificate && new Date(certificate.issued_at).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                </div>
              </div>

              {/* 안내 */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  이 확인서는 경북 SW 성장기업육성지원사업 프로그램 참여를 증명하는 정식 문서입니다.
                  위 정보가 변경된 경우 관리자에게 문의해주세요.
                </AlertDescription>
              </Alert>

              {/* QR 코드 영역 (실제 구현 시 QR 라이브러리 필요) */}
              <div className="flex justify-center">
                <div className="text-center text-sm text-muted-foreground">
                  <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center mb-2">
                    QR 코드 영역
                  </div>
                  <p>인증코드: {certificate?.verification_code}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
