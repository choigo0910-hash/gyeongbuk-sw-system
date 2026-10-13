"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon, CalendarIcon, MapPinIcon, UsersIcon } from "lucide-react"

interface Program {
  id: string
  name: string
  description: string | null
  status: string
  application_opens_at: string | null
  application_closes_at: string | null
  starts_at: string | null
  ends_at: string | null
  location: string | null
  capacity: number | null
  current_applicants: number
}

interface UserApplication {
  id: string
  program_id: string
  status: string
  application_data: Record<string, any> | null
  created_at: string
}

const statusLabels: Record<string, string> = {
  draft: "임시저장",
  published: "공개",
  unpublished: "비공개",
  archived: "보관",
}

const applicationStatusLabels: Record<string, string> = {
  draft: "임시저장",
  submitted: "제출됨",
  reviewing: "검토중",
  approved: "승인",
  waitlisted: "대기",
  rejected: "반려",
  cancelled: "취소",
  completed: "완료",
  no_show: "불참",
}

export default function ProgramDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [program, setProgram] = useState<Program | null>(null)
  const [userApplication, setUserApplication] = useState<UserApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // 신청서 폼
  const [applicantName, setApplicantName] = useState("")
  const [applicantPhone, setApplicantPhone] = useState("")
  const [applicantEmail, setApplicantEmail] = useState("")
  const [companyAffiliation, setCompanyAffiliation] = useState("")
  const [position, setPosition] = useState("")
  const [specialNote, setSpecialNote] = useState("")
  const [agree, setAgree] = useState(false)

  useEffect(() => {
    fetchProgramDetail()
    fetchUserApplication()
  }, [id])

  const fetchProgramDetail = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .eq("id", id)
        .single()

      if (error) throw error
      setProgram(data as Program)
    } catch (error) {
      console.error("프로그램 상세 조회 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserApplication = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data } = await supabase
        .from("program_applications")
        .select("*")
        .eq("program_id", id)
        .eq("applicant_id", user.id)
        .single()

      if (data) {
        setUserApplication(data as UserApplication)
        const appData = data.application_data as any
        if (appData) {
          setApplicantName(appData.applicantName || "")
          setApplicantPhone(appData.applicantPhone || "")
          setApplicantEmail(appData.applicantEmail || "")
          setCompanyAffiliation(appData.companyAffiliation || "")
          setPosition(appData.position || "")
          setSpecialNote(appData.specialNote || "")
        }
      }
    } catch (error) {
      // 신청 내역이 없는 경우 (정상)
    }
  }

  const handleSubmitApplication = async () => {
    if (!applicantName || !applicantPhone || !applicantEmail || !companyAffiliation || !position) {
      alert("필수 항목을 모두 입력해주세요.")
      return
    }

    if (!agree) {
      alert("동의가 필요합니다.")
      return
    }

    if (!confirm("프로그램 참여 신청을 제출하시겠습니까?")) return

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      // 회사 ID 가져오기
      const { data: companies } = await supabase
        .from("user_companies")
        .select("company_id")
        .eq("user_id", user.id)
        .limit(1)

      const companyId = companies?.[0]?.company_id || null

      const applicationData = {
        applicantName,
        applicantPhone,
        applicantEmail,
        companyAffiliation,
        position,
        specialNote,
      }

      const { error } = await supabase
        .from("program_applications")
        .upsert({
          program_id: id,
          applicant_id: user.id,
          company_id: companyId,
          status: "submitted",
          application_data: applicationData,
        })

      if (error) throw error

      alert("신청이 완료되었습니다.")
      fetchUserApplication()
      fetchProgramDetail()
    } catch (error) {
      console.error("신청 실패:", error)
      alert("신청에 실패했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  const isApplicationOpen = () => {
    if (!program?.application_opens_at || !program?.application_closes_at) return false
    const now = new Date()
    const opensAt = new Date(program.application_opens_at)
    const closesAt = new Date(program.application_closes_at)
    return now >= opensAt && now <= closesAt
  }

  const isProgramFull = () => {
    return program && program.capacity !== null && program.current_applicants >= program.capacity
  }

  const canApply = () => {
    return isApplicationOpen() && !isProgramFull() && !userApplication
  }

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>
  }

  if (!program) {
    return <div className="text-center py-8">프로그램을 찾을 수 없습니다.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">프로그램 상세</h1>
        </div>
        <Button variant="outline" asChild>
          <a href="/portal/programs">목록으로</a>
        </Button>
      </div>

      {/* 프로그램 정보 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-2xl">{program.name}</CardTitle>
              <CardDescription className="mt-2">
                {program.description}
              </CardDescription>
            </div>
            <Badge className={statusColors[program.status]}>
              {statusLabels[program.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {program.starts_at && program.ends_at && (
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">프로그램 기간</p>
                  <p className="font-medium">
                    {new Date(program.starts_at).toLocaleDateString("ko-KR")} - {" "}
                    {new Date(program.ends_at).toLocaleDateString("ko-KR")}
                  </p>
                </div>
              </div>
            )}
            {program.application_opens_at && program.application_closes_at && (
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">신청 기간</p>
                  <p className="font-medium">
                    {new Date(program.application_opens_at).toLocaleDateString("ko-KR")} - {" "}
                    {new Date(program.application_closes_at).toLocaleDateString("ko-KR")}
                  </p>
                </div>
              </div>
            )}
            {program.location && (
              <div className="flex items-center gap-3">
                <MapPinIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">장소</p>
                  <p className="font-medium">{program.location}</p>
                </div>
              </div>
            )}
            {program.capacity && (
              <div className="flex items-center gap-3">
                <UsersIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">정원</p>
                  <p className="font-medium">
                    {program.current_applicants} / {program.capacity}명
                    {isProgramFull() && (
                      <span className="text-red-600 ml-2">(마감)</span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 신청 상태 */}
      {userApplication && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">신청 상태</p>
                <p className="text-sm text-muted-foreground mt-1">
                  현재 상태:{" "}
                  <span className="font-medium text-blue-700">
                    {applicationStatusLabels[userApplication.status] || userApplication.status}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  신청일: {new Date(userApplication.created_at).toLocaleString("ko-KR")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 신청 폼 */}
      {canApply() && (
        <Card>
          <CardHeader>
            <CardTitle>프로그램 참여 신청</CardTitle>
            <CardDescription>
              필수 정보를 입력하고 신청해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="applicantName">이름 *</Label>
                <Input
                  id="applicantName"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="이름 입력"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">직급 *</Label>
                <Input
                  id="position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="직급 입력"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="applicantPhone">연락처 *</Label>
                <Input
                  id="applicantPhone"
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  placeholder="010-0000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="applicantEmail">이메일 *</Label>
                <Input
                  id="applicantEmail"
                  type="email"
                  value={applicantEmail}
                  onChange={(e) => setApplicantEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyAffiliation">소속 기업/기관 *</Label>
              <Input
                id="companyAffiliation"
                value={companyAffiliation}
                onChange={(e) => setCompanyAffiliation(e.target.value)}
                placeholder="소속 기업명 입력"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialNote">특이사항</Label>
              <Textarea
                id="specialNote"
                value={specialNote}
                onChange={(e) => setSpecialNote(e.target.value)}
                placeholder="프로그램 참여에 필요한 특이사항이 있다면 입력해주세요"
                rows={3}
              />
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="agree"
                checked={agree}
                onCheckedChange={(checked) => setAgree(checked as boolean)}
              />
              <Label htmlFor="agree" className="text-sm cursor-pointer">
                위 내용이 사실과 다름이 없으며, 프로그램 참여 규정을 준수할 것을 동의합니다.
              </Label>
            </div>

            <Button
              onClick={handleSubmitApplication}
              disabled={submitting}
              className="w-full"
            >
              {submitting ? "제출 중..." : "신청하기"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 신청 불가 안내 */}
      {!canApply() && !userApplication && (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {!isApplicationOpen() && "현재 신청 기간이 아닙니다."}
            {isProgramFull() && "정원이 마감되었습니다."}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  published: "bg-green-100 text-green-700",
  unpublished: "bg-yellow-100 text-yellow-700",
  archived: "bg-gray-500 text-white",
}
