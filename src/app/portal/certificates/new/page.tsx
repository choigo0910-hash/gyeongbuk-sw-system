"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"
import Link from "next/link"

interface CompletedProgram {
  application_id: string
  program_name: string
  program_start_at: string
  program_end_at: string
  location: string | null
  completed_at: string
}

interface CertificateRequest {
  application_id: string
  program_name: string
  participant_name: string
  affiliation: string
}

export default function NewCertificatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [completedPrograms, setCompletedPrograms] = useState<CompletedProgram[]>([])
  const [selectedProgram, setSelectedProgram] = useState<string>("")
  const [participantName, setParticipantName] = useState("")
  const [affiliation, setAffiliation] = useState("")
  const [agree, setAgree] = useState(false)

  useEffect(() => {
    fetchCompletedPrograms()
  }, [])

  const fetchCompletedPrograms = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      // 완료된 프로그램 조회 (completed 상태의 program_applications)
      const { data } = await supabase
        .from("program_applications")
        .select(`
          id,
          programs!inner(name, starts_at, ends_at, location),
          completed_at
        `)
        .eq("applicant_id", user.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })

      if (data) {
        const formattedData = data.map((item: any) => ({
          application_id: item.id,
          program_name: item.programs.name,
          program_start_at: item.programs.starts_at,
          program_end_at: item.programs.ends_at,
          location: item.programs.location,
          completed_at: item.completed_at,
        }))
        setCompletedPrograms(formattedData as CompletedProgram[])
      }
    } catch (error) {
      console.error("완료된 프로그램 조회 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedProgram || !participantName || !affiliation) {
      alert("필수 항목을 입력해주세요.")
      return
    }

    if (!agree) {
      alert("동의가 필요합니다.")
      return
    }

    if (!confirm("확인서 발급을 신청하시겠습니까?")) return

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      // 이미 발급된 확인서가 있는지 확인
      const { data: existingCert } = await supabase
        .from("certificates")
        .select("*")
        .eq("application_id", selectedProgram)
        .single()

      if (existingCert) {
        alert("이미 발급된 확인서가 있습니다. 확인서 목록에서 다운로드 받을 수 있습니다.")
        router.push("/portal/certificates")
        return
      }

      const program = completedPrograms.find((p) => p.application_id === selectedProgram)

      // 확인서 레코드 생성 (상태는 requested, 관리자 승인 후 issued로 변경)
      const { error } = await supabase
        .from("certificates")
        .insert({
          application_id: selectedProgram,
          document_number: "PENDING-" + Date.now(), // 임시 번호, 승인 시 정식 번호 부여
          participant_name: participantName,
          affiliation: affiliation,
          program_name: program?.program_name || "",
          program_start_at: program?.program_start_at || "",
          program_end_at: program?.program_end_at || "",
          location: program?.location || null,
          issued_at: new Date().toISOString(),
          issued_by: user.id,
          verification_code: "PENDING", // 임시 코드, 승인 시 정식 코드 부여
        })

      if (error) throw error

      alert("확인서 발급 신청이 완료되었습니다. 관리자 승인 후 발급됩니다.")
      router.push("/portal/certificates")
    } catch (error) {
      console.error("신청 실패:", error)
      alert("신청에 실패했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">확인서 발급 신청</h1>
          <p className="text-muted-foreground">프로그램 참여 완료 확인서를 발급받습니다</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/portal/certificates">취소</Link>
        </Button>
      </div>

      {completedPrograms.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              완료된 프로그램이 없습니다.
            </p>
            <p className="text-sm text-muted-foreground">
              프로그램 참여 완료 후 확인서 발급이 가능합니다.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 프로그램 선택 */}
          <Card>
            <CardHeader>
              <CardTitle>프로그램 선택</CardTitle>
              <CardDescription>
                확인서를 발급받을 완료된 프로그램을 선택하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {completedPrograms.map((program) => (
                <div
                  key={program.application_id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedProgram === program.application_id
                      ? "bg-blue-50 border-blue-300"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedProgram(program.application_id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{program.program_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(program.program_start_at).toLocaleDateString("ko-KR")} - {" "}
                        {new Date(program.program_end_at).toLocaleDateString("ko-KR")}
                      </p>
                      {program.location && (
                        <p className="text-sm text-muted-foreground">장소: {program.location}</p>
                      )}
                    </div>
                    {selectedProgram === program.application_id && (
                      <span className="text-blue-600">✓</span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 신청자 정보 */}
          {selectedProgram && (
            <Card>
              <CardHeader>
                <CardTitle>신청자 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="participantName">성명 *</Label>
                  <Input
                    id="participantName"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    placeholder="확인서에 표시될 성명 입력"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="affiliation">소속 *</Label>
                  <Input
                    id="affiliation"
                    value={affiliation}
                    onChange={(e) => setAffiliation(e.target.value)}
                    placeholder="확인서에 표시될 소속 기업/기관명 입력"
                  />
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="agree"
                    checked={agree}
                    onCheckedChange={(checked) => setAgree(checked as boolean)}
                  />
                  <Label htmlFor="agree" className="text-sm cursor-pointer">
                    입력하신 성명과 소속 정보가 확인서에 표시됩니다. 정보가 정확한 것을 확인하고 동의합니다.
                  </Label>
                </div>

                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    신청 후 관리자 승인이 완료되면 확인서가 발급됩니다.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting ? "신청 중..." : "확인서 발급 신청"}
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
