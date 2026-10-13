"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { sendNotification, type NotificationType } from "@/lib/notifications"

interface ProgramApplication {
  id: string
  program_id: string
  applicant_id: string
  status: string
  application_data: Record<string, any> | null
  created_at: string
  program_name: string
  program_starts_at: string | null
  program_ends_at: string | null
  program_location: string | null
  applicant_email: string
  applicant_name: string | null
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

export default function AdminApplicationsPage() {
  const supabase = createClient()
  const [applications, setApplications] = useState<ProgramApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterProgram, setFilterProgram] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [programs, setPrograms] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // 프로그램 목록 조회
      const { data: programsData } = await supabase
        .from("programs")
        .select("id, name")
        .order("name")

      if (programsData) {
        setPrograms(programsData)
      }

      // 프로그램 신청 내역 조회
      const { data: applicationsData, error } = await supabase
        .from("program_applications")
        .select(`
          *,
          programs!inner(name, starts_at, ends_at, location),
          user_profiles!inner(email, name)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      if (applicationsData) {
        // 기업명 가져오기
        const formattedData = await Promise.all(
          applicationsData.map(async (item: any) => {
            const { data: companyData } = await supabase
              .from("user_companies")
              .select("companies!inner(name)")
              .eq("user_id", item.applicant_id)
              .limit(1)
              .single()

            const companyName = (companyData as any)?.companies?.name || null

            return {
              ...item,
              program_name: item.programs.name,
              program_starts_at: item.programs.starts_at,
              program_ends_at: item.programs.ends_at,
              program_location: item.programs.location,
              applicant_email: item.user_profiles.email,
              applicant_name: item.user_profiles.name,
              company_name: companyName,
            } as ProgramApplication
          })
        )

        setApplications(formattedData)
      }
    } catch (error) {
      console.error("신청 내역 조회 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  // 상태 변경
  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      // 변경 전 현재 상태 확인을 위해 먼저 조회
      const currentApp = applications.find(app => app.id === applicationId)
      if (!currentApp) return

      const { error } = await supabase
        .from("program_applications")
        .update({ status: newStatus })
        .eq("id", applicationId)

      if (error) throw error

      // 알림 발송 (승인 또는 반려인 경우)
      if (newStatus === "approved" || newStatus === "rejected") {
        const title = newStatus === "approved"
          ? `프로그램 참가 신청이 승인되었습니다`
          : `프로그램 참가 신청이 반려되었습니다`

        const content = newStatus === "approved"
          ? `${currentApp.program_name} 프로그램 참가 신청이 승인되었습니다.`
          : `${currentApp.program_name} 프로그램 참가 신청이 반려되었습니다.`

        await sendNotification({
          userId: currentApp.applicant_id,
          type: "program_notifications" as NotificationType,
          title,
          content,
          link: `/portal/my-applications`,
          metadata: {
            programApplicationId: applicationId,
            programName: currentApp.program_name,
            newStatus,
          },
          sendEmail: true,
        })
      }

      // 데이터 새로고침
      fetchData()
    } catch (error) {
      console.error("상태 변경 실패:", error)
      alert("상태 변경에 실패했습니다.")
    }
  }

  // 필터링
  const filteredApplications = applications.filter((app) => {
    const statusMatch = filterStatus === "all" || app.status === filterStatus
    const programMatch = filterProgram === "all" || app.program_id === filterProgram
    const searchMatch =
      searchTerm === "" ||
      app.applicant_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.program_name?.toLowerCase().includes(searchTerm.toLowerCase())

    return statusMatch && programMatch && searchMatch
  })

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("ko-KR")
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR")
  }

  // 상태별 통계
  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">프로그램 신청 관리</h1>
          <p className="text-muted-foreground">전체 프로그램 신청 내역을 조회하고 관리합니다</p>
        </div>
        <Button onClick={fetchData} variant="outline">
          새로고침
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              전체 신청
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              제출됨
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statusCounts.submitted || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              승인
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statusCounts.approved || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              완료
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">
              {statusCounts.completed || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="이름, 이메일, 기업명, 프로그램명 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="draft">임시저장</SelectItem>
                <SelectItem value="submitted">제출됨</SelectItem>
                <SelectItem value="reviewing">검토중</SelectItem>
                <SelectItem value="approved">승인</SelectItem>
                <SelectItem value="waitlisted">대기</SelectItem>
                <SelectItem value="rejected">반려</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
                <SelectItem value="no_show">불참</SelectItem>
                <SelectItem value="cancelled">취소</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterProgram} onValueChange={setFilterProgram}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="프로그램 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 프로그램</SelectItem>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 신청 내역 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>신청 내역</CardTitle>
          <CardDescription>
            총 {filteredApplications.length}건
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              표시할 신청 내역이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>프로그램</TableHead>
                    <TableHead>신청자</TableHead>
                    <TableHead>기업</TableHead>
                    <TableHead>프로그램 기간</TableHead>
                    <TableHead>신청일</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">
                        {app.program_name}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{app.applicant_name || app.applicant_email}</div>
                          <div className="text-xs text-muted-foreground">
                            {app.applicant_email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{app.company_name || "-"}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(app.program_starts_at)} ~ {formatDate(app.program_ends_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDateTime(app.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[app.status]}>
                          {statusLabels[app.status] || app.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={app.status}
                          onValueChange={(value) => handleStatusChange(app.id, value)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="submitted">제출됨</SelectItem>
                            <SelectItem value="reviewing">검토중</SelectItem>
                            <SelectItem value="approved">승인</SelectItem>
                            <SelectItem value="waitlisted">대기</SelectItem>
                            <SelectItem value="rejected">반려</SelectItem>
                            <SelectItem value="completed">완료</SelectItem>
                            <SelectItem value="no_show">불참</SelectItem>
                            <SelectItem value="cancelled">취소</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
