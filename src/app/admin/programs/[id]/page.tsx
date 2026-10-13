"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
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
import { sendNotification, type NotificationType } from "@/lib/notifications"
import { InfoIcon } from "lucide-react"
import Link from "next/link"

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

interface ProgramApplication {
  id: string
  program_id: string
  applicant_id: string
  status: string
  application_data: Record<string, any> | null
  created_at: string
  user_email: string | null
  user_name: string | null
  company_name: string | null
}

const statusLabels: Record<string, string> = {
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

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-blue-100 text-blue-700",
  reviewing: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  waitlisted: "bg-orange-100 text-orange-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-gray-500 text-white",
  completed: "bg-teal-100 text-teal-700",
  no_show: "bg-purple-100 text-purple-700",
}

export default function AdminProgramDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [program, setProgram] = useState<Program | null>(null)
  const [applications, setApplications] = useState<ProgramApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // 상태 변경용
  const [selectedApplication, setSelectedApplication] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")

  useEffect(() => {
    fetchProgramDetail()
    fetchApplications()
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

  const fetchApplications = async () => {
    try {
      const supabase = createClient()

      const { data } = await supabase
        .from("program_applications")
        .select(`
          *,
          applicants!inner(email, full_name),
          companies!inner(name)
        `)
        .eq("program_id", id)
        .order("created_at", { ascending: false })

      if (data) {
        const formattedData = data.map((item: any) => ({
          ...item,
          user_email: item.applicants.email,
          user_name: item.applicants.full_name,
          company_name: item.companies.name,
        }))
        setApplications(formattedData as ProgramApplication[])
      }
    } catch (error) {
      console.error("신청 내역 조회 실패:", error)
    }
  }

  const handleUpdateStatus = async () => {
    if (!selectedApplication || !newStatus) return

    if (newStatus === "rejected" && !rejectionReason.trim()) {
      alert("반려 사유를 입력해주세요.")
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()

      // 변경 전 현재 신청 정보 확인
      const currentApp = applications.find(app => app.id === selectedApplication)
      if (!currentApp) return

      const updateData: any = {
        status: newStatus,
      }

      if (newStatus === "rejected") {
        updateData.rejection_reason = rejectionReason
      }

      const { error } = await supabase
        .from("program_applications")
        .update(updateData)
        .eq("id", selectedApplication)

      if (error) throw error

      // 알림 발송 (승인 또는 반려인 경우)
      if (newStatus === "approved" || newStatus === "rejected") {
        const title = newStatus === "approved"
          ? `프로그램 참가 신청이 승인되었습니다`
          : `프로그램 참가 신청이 반려되었습니다`

        const content = newStatus === "approved"
          ? `${program?.name} 프로그램 참가 신청이 승인되었습니다.`
          : `${program?.name} 프로그램 참가 신청이 반려되었습니다.${rejectionReason ? ` (사유: ${rejectionReason})` : ""}`

        await sendNotification({
          userId: currentApp.applicant_id,
          type: "program_notifications" as NotificationType,
          title,
          content,
          link: `/portal/my-applications`,
          metadata: {
            programApplicationId: selectedApplication,
            programName: program?.name,
            newStatus,
            rejectionReason: newStatus === "rejected" ? rejectionReason : undefined,
          },
          sendEmail: true,
        })
      }

      alert("상태가 변경되었습니다.")
      setSelectedApplication(null)
      setNewStatus("")
      setRejectionReason("")
      fetchApplications()
    } catch (error) {
      console.error("상태 변경 실패:", error)
      alert("상태 변경에 실패했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>
  }

  if (!program) {
    return <div className="text-center py-8">프로그램을 찾을 수 없습니다.</div>
  }

  const approvedCount = applications.filter((a) => a.status === "approved").length
  const completedCount = applications.filter((a) => a.status === "completed").length
  const noShowCount = applications.filter((a) => a.status === "no_show").length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">프로그램 참가자 관리</h1>
          <p className="text-muted-foreground">{program.name}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/programs">목록으로</Link>
        </Button>
      </div>

      {/* 프로그램 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>프로그램 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">상태</span>
              <p className="font-medium">{statusLabels[program.status]}</p>
            </div>
            {program.starts_at && program.ends_at && (
              <div>
                <span className="text-sm text-muted-foreground">프로그램 기간</span>
                <p className="font-medium text-sm">
                  {new Date(program.starts_at).toLocaleDateString("ko-KR")} ~{" "}
                  {new Date(program.ends_at).toLocaleDateString("ko-KR")}
                </p>
              </div>
            )}
            {program.location && (
              <div>
                <span className="text-sm text-muted-foreground">장소</span>
                <p className="font-medium">{program.location}</p>
              </div>
            )}
            <div>
              <span className="text-sm text-muted-foreground">정원</span>
              <p className="font-medium">
                {program.current_applicants}
                {program.capacity && ` / ${program.capacity}`}명
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 통계 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">전체 신청</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">승인</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">완료</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">{completedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">불참</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{noShowCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* 신청자 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>신청자 목록</CardTitle>
          <CardDescription>
            총 {applications.length}명
          </CardDescription>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              신청자가 없습니다
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{app.user_name || "미입력"}</span>
                        <span className="text-sm text-muted-foreground">{app.user_email}</span>
                        {app.company_name && (
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                            {app.company_name}
                          </span>
                        )}
                        <Badge className={statusColors[app.status]}>
                          {statusLabels[app.status] || app.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {app.application_data?.position && (
                          <p>직급: {app.application_data.position}</p>
                        )}
                        {app.application_data?.applicantPhone && (
                          <p>연락처: {app.application_data.applicantPhone}</p>
                        )}
                        <p>신청일: {new Date(app.created_at).toLocaleString("ko-KR")}</p>
                        {app.application_data?.specialNote && (
                          <p>특이사항: {app.application_data.specialNote}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedApplication(app.id)}
                    >
                      상태 변경
                    </Button>
                  </div>

                  {/* 상태 변경 폼 */}
                  {selectedApplication === app.id && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>새 상태</Label>
                          <Select value={newStatus} onValueChange={setNewStatus}>
                            <SelectTrigger>
                              <SelectValue placeholder="상태 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="submitted">제출됨</SelectItem>
                              <SelectItem value="reviewing">검토중</SelectItem>
                              <SelectItem value="approved">승인</SelectItem>
                              <SelectItem value="waitlisted">대기</SelectItem>
                              <SelectItem value="rejected">반려</SelectItem>
                              <SelectItem value="cancelled">취소</SelectItem>
                              <SelectItem value="completed">완료</SelectItem>
                              <SelectItem value="no_show">불참</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {newStatus === "rejected" && (
                          <div>
                            <Label>반려 사유</Label>
                            <Input
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="반려 사유 입력"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleUpdateStatus}
                          disabled={submitting || !newStatus}
                          size="sm"
                        >
                          {submitting ? "변경 중..." : "적용"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedApplication(null)
                            setNewStatus("")
                            setRejectionReason("")
                          }}
                          size="sm"
                        >
                          취소
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 일괄 처리 */}
      {applications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>일괄 처리</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription className="text-sm">
                선택한 신청자들의 상태를 일괄 변경합니다.
              </AlertDescription>
            </Alert>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  if (!confirm("모든 신청자를 승인하시겠습니까?")) return
                  // 일괄 승인 로직
                }}
              >
                전체 승인
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (!confirm("승인된 모든 참가자를 완료로 변경하시겠습니까?")) return
                  // 일괄 완료 로직
                }}
              >
                전체 완료
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
