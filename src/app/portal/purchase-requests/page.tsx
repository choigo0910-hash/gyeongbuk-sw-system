"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { Pencil, Trash2 } from "lucide-react"
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
  purchase_date: string | null
  created_at: string
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

export default function PurchaseRequestsListPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<PurchaseRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // 수정 가능한 상태 확인
  const canEdit = (status: string) => {
    return status === "draft" || status === "submitted" || status === "rejected"
  }

  // 검토중 상태 확인
  const isReviewing = (status: string) => {
    return status === "reviewing"
  }

  // 수정 클릭 핸들러
  const handleEditClick = (request: PurchaseRequest) => {
    if (isReviewing(request.status)) {
      alert("이미 검토중입니다. 수정/삭제는 관리자에게 메일 및 유선전화 요망")
      return
    }
    router.push(`/portal/purchase-requests/${request.id}/edit`)
  }

  // 삭제 클릭 핸들러
  const handleDeleteClick = async (request: PurchaseRequest) => {
    if (isReviewing(request.status)) {
      alert("이미 검토중입니다. 수정/삭제는 관리자에게 메일 및 유선전화 요망")
      return
    }

    if (!confirm("이 요청을 삭제하시겠습니까?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("purchase_requests")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", request.id)

      if (error) throw error

      alert("삭제되었습니다.")
      fetchRequests() // 목록 새로고침
    } catch (error) {
      console.error("삭제 실패:", error)
      alert("삭제에 실패했습니다.")
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return
      }

      // 회사 ID 가져오기
      const { data: companies } = await supabase
        .from("user_companies")
        .select("company_id")
        .eq("user_id", user.id)

      const companyIds = companies?.map((c) => c.company_id) || []

      if (companyIds.length === 0) {
        setLoading(false)
        return
      }

      // 구매요청 목록 가져오기
      const { data } = await supabase
        .from("purchase_requests")
        .select("*")
        .in("company_id", companyIds)
        .order("created_at", { ascending: false })

      setRequests((data as PurchaseRequest[]) || [])
    } catch (error) {
      console.error("구매요청 목록 조회 실패:", error)
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
      request.category.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">결제 및 구매 요청</h1>
          <p className="text-muted-foreground">결제 및 구매 요청을 작성하고 관리합니다</p>
        </div>
        <Button asChild>
          <Link href="/portal/purchase-requests/new">+ 새 요청 작성</Link>
        </Button>
      </div>

      {/* 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="품목명, 구매처, 분류 검색..."
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
            총 {filteredRequests.length}건
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">요청 내역이 없습니다</p>
              <Button asChild>
                <Link href="/portal/purchase-requests/new">첫 요청 작성</Link>
              </Button>
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
                        {request.created_at && (
                          <span>
                            요청일: {new Date(request.created_at).toLocaleDateString("ko-KR")}
                          </span>
                        )}
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
                    <div className="flex gap-2">
                      {/* 상세 버튼 (항상 표시) */}
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/portal/purchase-requests/${request.id}`}>
                          상세
                        </Link>
                      </Button>

                      {/* 수정 버튼 (수정 가능한 상태일 때만) */}
                      {canEdit(request.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(request)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}

                      {/* 삭제 버튼 (수정 가능한 상태일 때만) */}
                      {canEdit(request.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(request)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}

                      {/* 검토중 상태일 때도 버튼 표시 (클릭 시 팝업) */}
                      {isReviewing(request.status) && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(request)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(request)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
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
