"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
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
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface Certificate {
  id: string
  document_number: string
  participant_name: string
  program_name: string
  program_start_at: string
  program_end_at: string
  issued_at: string
  verification_code: string
  pdf_path: string | null
  reissue_count: number
}

const statusLabels: Record<string, string> = {
  requested: "신청중",
  approved: "승인",
  rejected: "반려",
  issued: "발급완료",
}

const statusColors: Record<string, string> = {
  requested: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  issued: "bg-teal-100 text-teal-700",
}

export default function CertificatesListPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchCertificates()
  }, [])

  const fetchCertificates = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return
      }

      // 프로그램 완료 신청 조회 및 확인서 조회
      const { data } = await supabase
        .from("certificates")
        .select("*")
        .order("issued_at", { ascending: false })

      setCertificates((data as Certificate[]) || [])
    } catch (error) {
      console.error("확인서 목록 조회 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCertificates = certificates.filter((cert) => {
    const matchesSearch =
      searchQuery === "" ||
      cert.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.program_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.document_number.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const canRequestCertificate = () => {
    // 프로그램 완료 후 확인서 발급 가능
    // 실제로는 program_applications 테이블에서 completed 상태를 확인해야 함
    return certificates.filter((c) => !c.pdf_path).length < 3
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">확인서 발급</h1>
          <p className="text-muted-foreground">참여 완료 프로그램의 확인서를 발급받습니다</p>
        </div>
        <Button asChild>
          <Link href="/portal/certificates/new">+ 새 확인서 신청</Link>
        </Button>
      </div>

      {/* 검색 */}
      <Card>
        <CardContent className="pt-6">
          <Input
            placeholder="성명, 프로그램명, 문서번호 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* 확인서 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>확인서 목록</CardTitle>
          <CardDescription>
            총 {filteredCertificates.length}건
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : filteredCertificates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "검색 결과가 없습니다." : "발급된 확인서가 없습니다."}
              </p>
              <Button asChild>
                <Link href="/portal/certificates/new">첫 확인서 신청</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCertificates.map((cert) => (
                <div
                  key={cert.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{cert.participant_name}</span>
                        <span className="text-sm text-muted-foreground">{cert.program_name}</span>
                        {cert.pdf_path && (
                          <Badge className="bg-teal-100 text-teal-700">발급완료</Badge>
                        )}
                        {!cert.pdf_path && (
                          <Badge className="bg-blue-100 text-blue-700">발급대기</Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>문서번호: {cert.document_number}</p>
                        <p>
                          프로그램 기간:{" "}
                          {new Date(cert.program_start_at).toLocaleDateString("ko-KR")} - {" "}
                          {new Date(cert.program_end_at).toLocaleDateString("ko-KR")}
                        </p>
                        <p>발급일: {new Date(cert.issued_at).toLocaleDateString("ko-KR")}</p>
                        {cert.verification_code && (
                          <p>인증코드: {cert.verification_code}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {cert.pdf_path ? (
                        <Button asChild variant="outline" size="sm">
                          <a href={cert.pdf_path} target="_blank" rel="noopener noreferrer">
                            PDF 다운로드
                          </a>
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" disabled>
                          발급 대기중
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

      {/* 안내 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-medium mb-2">확인서 발급 안내</h3>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• 프로그램 참여 완료 후 확인서 발급이 가능합니다</li>
            <li>• 발급된 확인서는 언제든 다운로드 가능합니다</li>
            <li>• 인증코드로 확인서 진위 여부를 확인할 수 있습니다</li>
            <li>• 확인서 재발급은 관리자에게 문의해주세요</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
