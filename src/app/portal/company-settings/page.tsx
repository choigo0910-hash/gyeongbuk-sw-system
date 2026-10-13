"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { Building2, Users, Trash2, AlertCircle } from "lucide-react"
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges"

type PendingTeamMember = {
  id: string
  user_id: string
  user_name: string
  user_email: string
  user_phone: string
  position: string
  created_at: string
  status: string
  is_primary: boolean
}

export default function CompanySettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // 기업 정보
  const [companyId, setCompanyId] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [representativeName, setRepresentativeName] = useState("")
  const [companyPhone, setCompanyPhone] = useState("")

  // 변경사항 추적 (초기값 저장)
  const initialDataRef = useRef({
    name: "",
    representative_name: "",
    phone: ""
  })
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // 변경사항 경고 훅 적용
  useUnsavedChanges(
    hasUnsavedChanges,
    "변경사항이 저장되지 않았습니다. 정말 나가시겠습니까?"
  )

  // 팀원 승인
  const [pendingMembers, setPendingMembers] = useState<PendingTeamMember[]>([])
  const [activeMembers, setActiveMembers] = useState<PendingTeamMember[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("company")
  const [pendingTabChange, setPendingTabChange] = useState<string | null>(null)

  // 휴대폰 번호 포맷 함수
  const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/\D/g, "") // 숫자만 추출

    if (numbers.length <= 3) {
      return numbers
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setCompanyPhone(formatted)
  }

  const fetchCompanyInfo = async () => {
    try {
      setFetchLoading(true)
      const supabase = createClient()

      // 현재 사용자 확인
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      setCurrentUserId(user.id)

      // 사용자가 속한 기업 확인 (대표자만 접근 가능)
      const { data: userCompany, error: companyError } = await supabase
        .from("user_companies")
        .select(`
          company_id,
          companies!inner(id, name, representative_name, phone)
        `)
        .eq("user_id", user.id)
        .eq("status", "active")
        .single()

      if (companyError || !userCompany) {
        setError("소속된 기업을 찾을 수 없습니다.")
        return
      }

      // 대표자(role: company_admin) 확인
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("roles!inner(code)")
        .eq("user_id", user.id)
        .eq("roles.code", "company_admin")
        .maybeSingle()

      if (!userRole) {
        setError("기업 정보를 수정할 권한이 없습니다. (대표자만 가능)")
        return
      }

      const company = userCompany.companies as any
      const initialName = company.name || ""
      const initialRepName = company.representative_name || ""
      const initialPhone = company.phone || ""

      setCompanyId(userCompany.company_id)
      setCompanyName(initialName)
      setRepresentativeName(initialRepName)
      setCompanyPhone(initialPhone)

      // 초기값 저장 (변경사항 추적용)
      initialDataRef.current = {
        name: initialName,
        representative_name: initialRepName,
        phone: initialPhone
      }
      setHasUnsavedChanges(false)

      // 팀원 승인 대기 목록 조회
      await fetchPendingMembers(userCompany.company_id)
    } catch (err) {
      setError("기업 정보를 불러오는데 실패했습니다.")
    } finally {
      setFetchLoading(false)
    }
  }

  const fetchPendingMembers = async (companyId: string) => {
    try {
      const supabase = createClient()

      // 해당 기업의 모든 팀원 조회 (단계별 조회로 RLS 문제 회피)
      const { data: allData, error: fetchError } = await supabase
        .from("user_companies")
        .select("*")
        .eq("company_id", companyId)
        .is("deleted_at", null)

      if (fetchError) {
        console.error("팀원 목록 조회 실패:", fetchError)
        return
      }

      if (!allData || allData.length === 0) {
        setPendingMembers([])
        setActiveMembers([])
        return
      }

      // 각 팀원의 상세 정보 조회
      const formattedData = await Promise.all(
        allData.map(async (uc: any) => {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("name, email, phone")
            .eq("user_id", uc.user_id)
            .maybeSingle()

          return {
            id: uc.id,
            user_id: uc.user_id,
            user_name: profile?.name || "-",
            user_email: profile?.email || "-",
            user_phone: profile?.phone || "-",
            position: uc.position || "-",
            created_at: uc.created_at,
            status: uc.status || "pending",
            is_primary: uc.is_primary || false,
          }
        })
      )

      // 상태별로 분류
      setPendingMembers(formattedData.filter((m) => m.status === "pending"))
      setActiveMembers(formattedData.filter((m) => m.status === "active"))
    } catch (err) {
      console.error("팀원 목록 조회 실패:", err)
    }
  }

  useEffect(() => {
    fetchCompanyInfo()
  }, [])

  // 변경사항 감지
  useEffect(() => {
    const isDirty =
      companyName !== initialDataRef.current.name ||
      representativeName !== initialDataRef.current.representative_name ||
      companyPhone !== initialDataRef.current.phone

    setHasUnsavedChanges(isDirty)
  }, [companyName, representativeName, companyPhone])

  // 탭 변경 처리 (변경사항 있을 때 확인)
  const handleTabChange = (newTab: string) => {
    if (hasUnsavedChanges && activeTab === "company") {
      if (!window.confirm("변경사항이 저장되지 않았습니다. 정말 나가시겠습니까?")) {
        return
      }
    }
    setActiveTab(newTab)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("companies")
        .update({
          name: companyName,
          representative_name: representativeName,
          phone: companyPhone,
        })
        .eq("id", companyId)

      if (error) {
        setError("기업 정보 저장에 실패했습니다: " + error.message)
        return
      }

      setSuccess("기업 정보가 저장되었습니다.")
      setTimeout(() => setSuccess(""), 3000)

      // 저장 완료 후 초기값 업데이트 (변경사항 추적용)
      initialDataRef.current = {
        name: companyName,
        representative_name: representativeName,
        phone: companyPhone
      }
      setHasUnsavedChanges(false)
    } catch (err) {
      setError("기업 정보 저장 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (userCompanyId: string, approve: boolean) => {
    setActionLoading(userCompanyId)
    try {
      const supabase = createClient()

      // 먼저 user_company 데이터를 가져와서 user_id를 확인
      const { data: userCompany } = await supabase
        .from("user_companies")
        .select("user_id, company_id")
        .eq("id", userCompanyId)
        .single()

      if (!userCompany) {
        alert("사용자 정보를 찾을 수 없습니다.")
        return
      }

      // 승인 시 역할 부여
      if (approve) {
        // company_user 역할 ID 가져오기
        const { data: roleData } = await supabase
          .from("roles")
          .select("id")
          .eq("code", "company_user")
          .single()

        if (roleData) {
          // 역할 부여 (이미 있으면 에러 무시)
          await supabase.from("user_roles").insert({
            user_id: userCompany.user_id,
            role_id: roleData.id,
            company_id: userCompany.company_id,
          })
        }
      }

      // user_companies 상태 업데이트
      const { error } = await supabase
        .from("user_companies")
        .update({ status: approve ? "active" : "rejected" })
        .eq("id", userCompanyId)

      if (error) {
        alert(approve ? "승인에 실패했습니다." : "반려에 실패했습니다.")
        return
      }

      // 목록 새로고칭
      await fetchPendingMembers(companyId)
      alert(approve ? "팀원이 승인되었습니다." : "신청이 반려되었습니다.")
    } catch (err) {
      alert("오류가 발생했습니다.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteMember = async (userCompanyId: string, memberName: string) => {
    if (!confirm(`"${memberName}" 팀원을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      return
    }

    setActionLoading(userCompanyId)
    try {
      const supabase = createClient()

      // 먼저 user_company 데이터를 가져와서 user_id 확인
      const { data: userCompany } = await supabase
        .from("user_companies")
        .select("user_id, company_id")
        .eq("id", userCompanyId)
        .single()

      if (!userCompany) {
        alert("사용자 정보를 찾을 수 없습니다.")
        return
      }

      // 팀원 역할 제거 (company_user)
      const { data: roleData } = await supabase
        .from("roles")
        .select("id")
        .eq("code", "company_user")
        .single()

      if (roleData) {
        await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userCompany.user_id)
          .eq("role_id", roleData.id)
          .eq("company_id", userCompany.company_id) // RLS 이중 안전장치: 해당 기업의 역할만 회수
      }

      // Soft delete user_companies
      const { error } = await supabase
        .from("user_companies")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", userCompanyId)

      if (error) {
        alert("삭제에 실패했습니다.")
        return
      }

      // 목록 새로고칭
      await fetchPendingMembers(companyId)
      alert("팀원이 삭제되었습니다.")
      setDeleteConfirm(null)
    } catch (err) {
      alert("오류가 발생했습니다.")
    } finally {
      setActionLoading(null)
    }
  }

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (error && !companyId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-red-600">{error}</p>
            <Button
              className="mt-4 w-full"
              onClick={() => router.push("/portal/dashboard")}
            >
              대시보드로 이동
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">기업 및 팀원 관리</h1>
        <p className="text-muted-foreground">기업 정보를 수정하고 팀원 가입을 승인할 수 있습니다. (대표자만 가능)</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            기업
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            팀원
          </TabsTrigger>
        </TabsList>

        {/* 기업 탭 */}
        <TabsContent value="company" className="mt-6">
          {hasUnsavedChanges && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">변경사항이 저장되지 않았습니다. 저장 버튼을 눌러주세요.</span>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>기업 정보</CardTitle>
              <CardDescription>
                기업명, 대표자명, 대표자 연락처를 수정할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-sm font-medium">기업명</Label>
                  <Input
                    id="companyName"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={loading}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="representativeName" className="text-sm font-medium">대표자명</Label>
                  <Input
                    id="representativeName"
                    type="text"
                    value={representativeName}
                    onChange={(e) => setRepresentativeName(e.target.value)}
                    disabled={loading}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyPhone" className="text-sm font-medium">대표자 휴대폰 번호</Label>
                  <Input
                    id="companyPhone"
                    type="tel"
                    value={companyPhone}
                    onChange={handlePhoneChange}
                    disabled={loading}
                    className="h-11"
                    placeholder="010-1234-5678"
                    maxLength={13}
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="text-sm text-green-600 bg-green-50 border border-green-200 p-3 rounded-lg">
                    {success}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={loading}
                >
                  {loading ? "저장 중..." : "저장"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 팀원 탭 */}
        <TabsContent value="team" className="mt-6">
          {/* 승인 대기 목록 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>팀원 승인 대기 목록</CardTitle>
              <CardDescription>
                {pendingMembers.length}건의 대기 중인 신청이 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingMembers.length === 0 ? (
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
                      <TableHead>직책</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          {new Date(member.created_at).toLocaleDateString("ko-KR")}
                        </TableCell>
                        <TableCell className="font-medium">{member.user_name}</TableCell>
                        <TableCell>{member.user_email}</TableCell>
                        <TableCell>{member.user_phone}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{member.position}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproval(member.id, false)}
                              disabled={actionLoading === member.id}
                            >
                              반려
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApproval(member.id, true)}
                              disabled={actionLoading === member.id}
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

          {/* 승인된 팀원 목록 */}
          <Card>
            <CardHeader>
              <CardTitle>팀원 목록</CardTitle>
              <CardDescription>
                현재 {activeMembers.length}명의 팀원이 활동 중입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  승인된 팀원이 없습니다.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>이름</TableHead>
                      <TableHead>이메일</TableHead>
                      <TableHead>연락처</TableHead>
                      <TableHead>직책</TableHead>
                      <TableHead>가입일</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.user_name}</TableCell>
                        <TableCell>{member.user_email}</TableCell>
                        <TableCell>{member.user_phone}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{member.position}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(member.created_at).toLocaleDateString("ko-KR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteMember(member.id, member.user_name)}
                            disabled={actionLoading === member.id || member.is_primary || member.user_id === currentUserId}
                            title={member.is_primary ? "대표자는 삭제할 수 없습니다" : member.user_id === currentUserId ? "본인은 삭제할 수 없습니다" : "팀원 삭제"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
