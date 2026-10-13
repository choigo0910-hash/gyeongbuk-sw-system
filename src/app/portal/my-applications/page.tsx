"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface ProgramApplication {
  id: string
  program_id: string
  status: string
  application_data: Record<string, any> | null
  created_at: string
  program_name: string
  program_starts_at: string | null
  program_ends_at: string | null
  program_location: string | null
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

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<ProgramApplication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return
      }

      const { data } = await supabase
        .from("program_applications")
        .select(`
          *,
          programs!inner(name, starts_at, ends_at, location)
        `)
        .eq("applicant_id", user.id)
        .order("created_at", { ascending: false })

      if (data) {
        const formattedData = data.map((item: any) => ({
          ...item,
          program_name: item.programs.name,
          program_starts_at: item.programs.starts_at,
          program_ends_at: item.programs.ends_at,
          program_location: item.programs.location,
        }))
        setApplications(formattedData as ProgramApplication[])
      }
    } catch (error) {
      console.error("신청 내역 조회 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">내 신청 현황</h1>
          <p className="text-muted-foreground">프로그램 참여 신청 내역을 확인합니다</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/portal/programs">프로그램 목록</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>신청 내역</CardTitle>
          <CardDescription>
            총 {applications.length}건
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">신청 내역이 없습니다</p>
              <Button asChild>
                <Link href="/portal/programs">프로그램 둘러보기</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{app.program_name}</span>
                        <Badge className={statusColors[app.status]}>
                          {statusLabels[app.status] || app.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {app.program_starts_at && app.program_ends_at && (
                          <p>
                            프로그램 기간:{" "}
                            {new Date(app.program_starts_at).toLocaleDateString("ko-KR")} - {" "}
                            {new Date(app.program_ends_at).toLocaleDateString("ko-KR")}
                          </p>
                        )}
                        {app.program_location && (
                          <p>장소: {app.program_location}</p>
                        )}
                        <p>
                          신청일: {new Date(app.created_at).toLocaleString("ko-KR")}
                        </p>
                      </div>
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
