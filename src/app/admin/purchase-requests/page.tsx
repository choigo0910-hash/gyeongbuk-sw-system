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

interface PurchaseRequest {
  id: string
  item_name: string
  quantity: number
  unit_price: number | null
  requested_amount: number
  approved_amount: number | null
  vendor: string
  category: string
  status: string
  created_at: string
  company_name: string
}

const statusLabels: Record<string, string> = {
  draft: "임시저장",
  submitted: "제출됨",
  reviewing: "검토중",
  approved: "승인완료",
  rejected: "반려",
  purchase_completed: "구매완료",
  proof_submitted: "증빙제출",
  proof_approved: "증빙승인",
  proof_rejected: "증빙반려",
  completed: "완료",
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-blue-100 text-blue-700",
  reviewing: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  purchase_completed: "bg-purple-100 text-purple-700",
  proof_submitted: "bg-indigo-100 text-indigo-700",
  proof_approved: "bg-teal-100 text-teal-700",
  proof_rejected: "bg-red-100 text-red-700",
  completed: "bg-gray-500 text-white",
}

export default function AdminPurchaseRequestsPage() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      const { data } = await supabase
        .from("purchase_requests")
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
        setRequests(formattedData as PurchaseRequest[])
      }
    } catch (error) {
      console.error("요청 목록 조회 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRequests = requests.filter((request) => {
    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    const matchesSearch =
      searchQuery === "" ||
      request.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.category.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const pendingCount = requests.filter((r) => r.status === "submitted").length
  const proofPendingCount = requests.filter((r) => r.status === "proof_submitted").length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">결제 및 구매 요청 검토</h1>
          <p className="text-muted-foreground">기업의 결제 및 구매 요청을 검토하고 승인합니다</p>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">전체 요청</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests.length}</div>
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
            <CardTitle className="text-sm font-medium">증빙 검토 대기</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{proofPendingCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="품목명, 구매처, 기업명, 분류 검색..."
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
                <SelectItem value="rejected">반려</SelectItem>
                <SelectItem value="proof_submitted">증빙제출</SelectItem>
                <SelectItem value="proof_approved">증빙승인</SelectItem>
                <SelectItem value="proof_rejected">증빙반려</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 요청 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>요청 목록</CardTitle>
          <CardDescription>
            총 {filteredRequests.length}건 (필터 적용)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">요청 내역이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium">{request.company_name}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm font-medium">{request.item_name}</span>
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                          {request.category}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            statusColors[request.status] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {statusLabels[request.status] || request.status}
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>구매처: {request.vendor}</span>
                        <span>
                          요청일: {new Date(request.created_at).toLocaleDateString("ko-KR")}
                        </span>
                      </div>
                      <div className="mt-2 flex gap-4">
                        <div>
                          <span className="text-xs text-muted-foreground">요청 금액</span>
                          <p className="font-medium">
                            {formatCurrency(request.requested_amount)}
                          </p>
                        </div>
                        {request.approved_amount && (
                          <div>
                            <span className="text-xs text-muted-foreground">승인 금액</span>
                            <p className="font-medium text-green-600">
                              {formatCurrency(request.approved_amount)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/purchase-requests/${request.id}/review`}>
                        {request.status === "submitted" || request.status === "proof_submitted"
                          ? "검토"
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
