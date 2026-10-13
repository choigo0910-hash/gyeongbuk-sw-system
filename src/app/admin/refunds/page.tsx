"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"
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

interface RefundApplication {
  id: string
  refund_recipient_name: string
  refund_recipient_type: string
  requested_amount: number
  approved_amount: number | null
  paid_amount: number | null
  vendor: string
  category: string
  payment_date: string
  status: string
  created_at: string
  company_name: string
}

const statusLabels: Record<string, string> = {
  draft: "임시저장",
  submitted: "제출됨",
  reviewing: "검토중",
  revision_requested: "수정요청",
  approved: "승인완료",
  rejected: "반려",
  processing: "지급중",
  completed: "지급완료",
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-blue-100 text-blue-700",
  reviewing: "bg-yellow-100 text-yellow-700",
  revision_requested: "bg-orange-100 text-orange-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  processing: "bg-purple-100 text-purple-700",
  completed: "bg-teal-100 text-teal-700",
}

const categoryLabels: Record<string, string> = {
  supplies: "물품비",
  education: "교육비",
  travel: "여비",
  meeting: "회의비",
  promotion: "홍보비",
  other: "기타",
}

export default function AdminRefundsPage() {
  const [applications, setApplications] = useState<RefundApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      const { data } = await supabase
        .from("refund_applications")
        .select(`
          *,
          companies!inner(name)
        `)
        .order("created_at", { ascending: false })

      if (data) {
        const formattedData = data.map((item: any) => ({
          ...item,
          company_name: item.companies.name,
        }))
        setApplications(formattedData as RefundApplication[])
      }
    } catch (error) {
      console.error("환급신청 목록 조회 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredApplications = applications.filter((app) => {
    const matchesStatus = statusFilter === "all" || app.status === statusFilter
    const matchesSearch =
      searchQuery === "" ||
      app.refund_recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.company_name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const pendingCount = applications.filter((a) => a.status === "submitted").length
  const approvedCount = applications.filter((a) => a.status === "approved").length
  const processingCount = applications.filter((a) => a.status === "processing").length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">환급신청 검토</h1>
          <p className="text-muted-foreground">기업의 환급신청을 검토하고 지급을 처리합니다</p>
        </div>
      </div>

      {/* 통계 카드 */}
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
            <CardTitle className="text-sm font-medium">검토 대기</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">지급 대기</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">지급중</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{processingCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="수령인, 구매처, 기업명 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="submitted">제출됨</SelectItem>
                <SelectItem value="reviewing">검토중</SelectItem>
                <SelectItem value="approved">승인완료</SelectItem>
                <SelectItem value="processing">지급중</SelectItem>
                <SelectItem value="completed">지급완료</SelectItem>
                <SelectItem value="rejected">반려</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 신청 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>신청 목록</CardTitle>
          <CardDescription>
            총 {filteredApplications.length}건 (필터 적용)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">신청 내역이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApplications.map((app) => (
                <div
                  key={app.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium">{app.company_name}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm font-medium">{app.refund_recipient_name}</span>
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                          {categoryLabels[app.category] || app.category}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            statusColors[app.status] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {statusLabels[app.status] || app.status}
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>구매처: {app.vendor}</span>
                        <span>
                          결제일: {new Date(app.payment_date).toLocaleDateString("ko-KR")}
                        </span>
                      </div>
                      <div className="mt-2 flex gap-4">
                        <div>
                          <span className="text-xs text-muted-foreground">신청 금액</span>
                          <p className="font-medium">
                            {formatCurrency(app.requested_amount)}
                          </p>
                        </div>
                        {app.approved_amount && (
                          <div>
                            <span className="text-xs text-muted-foreground">승인 금액</span>
                            <p className="font-medium text-green-600">
                              {formatCurrency(app.approved_amount)}
                            </p>
                          </div>
                        )}
                        {app.paid_amount && (
                          <div>
                            <span className="text-xs text-muted-foreground">지급 금액</span>
                            <p className="font-medium text-blue-600">
                              {formatCurrency(app.paid_amount)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/refunds/${app.id}/review`}>
                        {app.status === "submitted" || app.status === "approved"
                          ? "검토/지급"
                          : "상세"}
                      </Link>
                    </Button>
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
