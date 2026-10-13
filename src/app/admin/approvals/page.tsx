"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

type PendingApproval = {
  id: string
  user_id: string
  company_id: string
  user_name: string
  user_email: string
  user_phone: string
  company_name: string
  position: string
  created_at: string
  role_code: string
}

export default function AdminApprovalsPage() {
  const router = useRouter()
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchPendingApprovals = async () => {
    try {
      const supabase = createClient()

      // 대기 중인 신청 조회 (단계별 조회로 RLS 문제 회피)
      const { data: pendingCompanies, error: companiesError } = await supabase
        .from("user_companies")
        .select("*")
        .eq("status", "pending")

      console.log("🔍 조회된 pendingCompanies:", pendingCompanies)
      console.log("❌ companiesError:", companiesError)
      console.log("❌ companiesError.message:", companiesError?.message)
      console.log("❌ companiesError.details:", companiesError?.details)
      console.log("❌ companiesError.hint:", companiesError?.hint)

      if (companiesError) {
        console.error("승인 대기 목록 조회 실패:", companiesError)
        setLoading(false)
        return
      }

      if (!pendingCompanies || pendingCompanies.length === 0) {
        setPendingApprovals([])
        setLoading(false)
        return
      }

      // 각 신청에 대한 상세 정보 조회
      const formattedData = await Promise.all(
        pendingCompanies.map(async (uc: any) => {
          // 사용자 정보 조회
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("name, email, phone")
            .eq("user_id", uc.user_id)
            .single()

          // 기업 정보 조회
          const { data: company } = await supabase
            .from("companies")
            .select("name")
            .eq("id", uc.company_id)
            .single()

          // 역할 조회
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("roles!inner(code)")
            .eq("user_id", uc.user_id)
            .single()

          return {
            id: uc.id,
            user_id: uc.user_id,
            company_id: uc.company_id,
            user_name: profile?.name || "-",
            user_email: profile?.email || "-",
            user_phone: profile?.phone || "-",
            company_name: company?.name || "-",
            position: uc.position || "-",
            created_at: uc.created_at,
            role_code: (roleData as any)?.roles?.code || "company_user",
          }
        })
      )

      setPendingApprovals(formattedData)
    } catch (err) {
      console.error("승인 대기 목록 조회 실패:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingApprovals()
  }, [])

  const handleApproval = async (userCompanyId: string, approve: boolean) => {
    setActionLoading(userCompanyId)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("user_companies")
        .update({ status: approve ? "active" : "rejected" })
        .eq("id", userCompanyId)

      if (error) {
        alert(approve ? "승인에 실패했습니다." : "반려에 실패했습니다.")
        return
      }

      // 목록 새로고침
      await fetchPendingApprovals()
      alert(approve ? "승인되었습니다." : "반려되었습니다.")
    } catch (err) {
      alert("오류가 발생했습니다.")
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">대표자 승인 대기 목록</h1>
        <p className="text-muted-foreground">기업 대표자 가입 신청을 승인하거나 반려할 수 있습니다.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>승인 대기 목록</CardTitle>
          <CardDescription>
            {pendingApprovals.length}건의 대기 중인 신청이 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingApprovals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              대기 중인 신청이 없습니다.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>신청일</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead>기업명</TableHead>
                  <TableHead>직책</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingApprovals.map((approval) => (
                  <TableRow key={approval.id}>
                    <TableCell>
                      {new Date(approval.created_at).toLocaleDateString("ko-KR")}
                    </TableCell>
                    <TableCell className="font-medium">{approval.user_name}</TableCell>
                    <TableCell>{approval.user_email}</TableCell>
                    <TableCell>{approval.user_phone}</TableCell>
                    <TableCell>{approval.company_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{approval.position}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApproval(approval.id, false)}
                          disabled={actionLoading === approval.id}
                        >
                          반려
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApproval(approval.id, true)}
                          disabled={actionLoading === approval.id}
                        >
                          승인
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
