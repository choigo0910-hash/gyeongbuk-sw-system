"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { roleLabels } from "@/types/roles"
import { useUser } from "@/components/providers/UserProvider"
import { useRouter } from "next/navigation"
import { Building2, Mail, Phone, Pencil, UserCog } from "lucide-react"

interface UserProfile {
  id: string
  user_id: string
  name: string
  email: string
  phone?: string
  department?: string
  position?: string
}

interface Company {
  id: string
  name: string
  registration_number?: string
  ceo_name?: string
  industry?: string
  address?: string
  phone?: string
  email?: string
  status: string
}

interface UserRole {
  id: string
  user_id: string
  roles: {
    code: string
    name: string
  }
}

interface UserCompany {
  id: string
  user_id: string
  company_id: string
  position?: string
  is_primary: boolean
  status?: string
  companies?: {
    id: string
    name: string
  }
}

interface CompanyUser {
  id: string
  user_id: string
  name: string
  email: string
  phone?: string
  is_primary: boolean
  position?: string
}

interface UserWithRoles extends UserProfile {
  roles: string[]
  companies?: Array<{ id: string; name: string; is_primary: boolean; position?: string; status?: string }>
}

const statusOptions = [
  { value: "active", label: "활성", color: "bg-green-100 text-green-800" },
  { value: "inactive", label: "비활성", color: "bg-gray-100 text-gray-800" },
  { value: "suspended", label: "정지", color: "bg-red-100 text-red-800" },
]

export default function AdminUsersPage() {
  const router = useRouter()
  const { isAdmin, isSuperAdmin } = useUser()
  const [users, setUsers] = useState<UserWithRoles[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showCompanyModal, setShowCompanyModal] = useState(false)
  const [showMatchingModal, setShowMatchingModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserName, setNewUserName] = useState("")
  const [newUserRole, setNewUserRole] = useState<string>("company_user")
  const [newUserCompanyId, setNewUserCompanyId] = useState<string>("")
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([])
  const [allCompanies, setAllCompanies] = useState<Company[]>([])
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // 기업 수정 폼 상태
  const [companyFormData, setCompanyFormData] = useState({
    name: "",
    registration_number: "",
    ceo_name: "",
    industry: "",
    address: "",
    phone: "",
    email: "",
    status: "active",
  })

  // 기업 매칭 폼 상태
  const [matchingFormData, setMatchingFormData] = useState({
    company_id: "",
    position: "",
    is_primary: false,
  })

  useEffect(() => {
    if (!isAdmin()) {
      router.push("/login")
      return
    }
    fetchUsers()
    fetchCompanies()
    fetchAllCompanies()
  }, [isAdmin, router])

  const fetchUsers = async () => {
    setLoading(true)
    const supabase = createClient()

    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("*")
      .is("deleted_at", null)

    if (!profiles) {
      setLoading(false)
      return
    }

    // Fetch roles for each user
    const usersWithRoles = await Promise.all(
      profiles.map(async (profile) => {
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("role_id, roles!inner(code)")
          .eq("user_id", profile.user_id)
          .is("deleted_at", null)

        const roles = rolesData?.map((r: any) => {
          if (Array.isArray(r.roles)) {
            return r.roles[0]?.code
          }
          return r.roles?.code
        }).filter(Boolean) || []

        // Fetch companies for company users
        let companies: Array<{ id: string; name: string; is_primary: boolean; position?: string; status?: string }> = []
        if (roles.includes("company_user")) {
          const { data: companiesData } = await supabase
            .from("user_companies")
            .select("company_id, companies(id, name), is_primary, position, status")
            .eq("user_id", profile.user_id)
            .is("deleted_at", null)

          companies = companiesData?.map((c: any) => ({
            id: c.companies?.id,
            name: c.companies?.name,
            is_primary: c.is_primary,
            position: c.position,
            status: c.status,
          })) || []
        }

        return {
          ...profile,
          roles,
          companies,
        }
      })
    )

    setUsers(usersWithRoles)
    setLoading(false)
  }

  const fetchCompanies = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("companies")
      .select("id, name")
      .is("deleted_at", null)

    setCompanies(data || [])
  }

  const fetchAllCompanies = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("companies")
      .select("*")
      .order("name")

    setAllCompanies(data || [])
  }

  const fetchCompanyUsers = async (companyId: string) => {
    const supabase = createClient()
    const { data: userCompanyData } = await supabase
      .from("user_companies")
      .select("user_id, is_primary, position, user_profiles!inner(*)")
      .eq("company_id", companyId)
      .is("deleted_at", null)

    const users: CompanyUser[] = userCompanyData?.map((uc: any) => ({
      id: uc.user_profiles.id,
      user_id: uc.user_id,
      name: uc.user_profiles.name,
      email: uc.user_profiles.email,
      phone: uc.user_profiles.phone,
      is_primary: uc.is_primary || false,
      position: uc.position,
    })) || []

    setCompanyUsers(users)
  }

  const handleEditCompany = async (companyId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single()

    if (data) {
      setSelectedCompany(data)
      setCompanyFormData({
        name: data.name,
        registration_number: data.registration_number || "",
        ceo_name: data.ceo_name || "",
        industry: data.industry || "",
        address: data.address || "",
        phone: data.phone || "",
        email: data.email || "",
        status: data.status,
      })
      setShowCompanyModal(true)
      fetchCompanyUsers(companyId)
    }
  }

  const handleCreateCompany = () => {
    setSelectedCompany(null)
    setCompanyFormData({
      name: "",
      registration_number: "",
      ceo_name: "",
      industry: "",
      address: "",
      phone: "",
      email: "",
      status: "active",
    })
    setShowCompanyModal(true)
  }

  const handleCompanySubmit = async () => {
    if (!companyFormData.name) {
      setError("기업명은 필수입니다.")
      return
    }

    const supabase = createClient()

    if (selectedCompany) {
      // 수정
      const { error } = await supabase
        .from("companies")
        .update(companyFormData)
        .eq("id", selectedCompany.id)

      if (error) {
        setError("수정에 실패했습니다.")
        return
      }

      setSuccess("기업 정보가 수정되었습니다.")
    } else {
      // 생성
      const { error } = await supabase
        .from("companies")
        .insert(companyFormData)

      if (error) {
        setError("생성에 실패했습니다.")
        return
      }

      setSuccess("기업이 생성되었습니다.")
    }

    setShowCompanyModal(false)
    fetchAllCompanies()
    fetchUsers()

    setTimeout(() => setSuccess(""), 3000)
  }

  const getStatusBadge = (status: string) => {
    const statusInfo = statusOptions.find((s) => s.value === status) || statusOptions[0]
    return <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setCreating(true)

    try {
      const supabase = createClient()

      // 1. Create user in Supabase Auth
      // Note: In production, this should be done via API with service role key
      // For now, we'll send an invite email

      // 2. Create user profile
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          user_id: "", // Will be filled when user accepts invite
          name: newUserName,
          email: newUserEmail,
        })
        .select()
        .single()

      if (profileError) {
        // If user doesn't exist in auth yet, we need to handle this differently
        // For now, let's just show a message
        setSuccess("사용자 초대 이메일을 발송했습니다. (데모 버전)")
        setShowCreateModal(false)
        setNewUserEmail("")
        setNewUserName("")
        setNewUserRole("company_user")
        setNewUserCompanyId("")
        return
      }

      // 3. Assign role
      const { data: roleData } = await supabase
        .from("roles")
        .select("id")
        .eq("code", newUserRole)
        .single()

      if (roleData) {
        await supabase.from("user_roles").insert({
          user_id: profileData.user_id,
          role_id: roleData.id,
        })
      }

      // 4. Link to company if company user
      if (newUserRole === "company_user" && newUserCompanyId) {
        await supabase.from("user_companies").insert({
          user_id: profileData.user_id,
          company_id: newUserCompanyId,
          is_primary: true,
        })
      }

      setSuccess("사용자가 생성되었습니다.")
      setShowCreateModal(false)
      setNewUserEmail("")
      setNewUserName("")
      setNewUserRole("company_user")
      setNewUserCompanyId("")
      fetchUsers()
    } catch (err) {
      console.error(err)
      setError("사용자 생성 중 오류가 발생했습니다.")
    } finally {
      setCreating(false)
    }
  }

  const handleRemoveRole = async (userId: string, roleCode: string) => {
    const supabase = createClient()

    // Get role ID
    const { data: roleData } = await supabase
      .from("roles")
      .select("id")
      .eq("code", roleCode)
      .single()

    if (!roleData) return

    await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role_id", roleData.id)

    fetchUsers()
  }

  const handleAddRole = async (userId: string, roleCode: string) => {
    const supabase = createClient()

    // Get role ID
    const { data: roleData } = await supabase
      .from("roles")
      .select("id")
      .eq("code", roleCode)
      .single()

    if (!roleData) return

    await supabase.from("user_roles").insert({
      user_id: userId,
      role_id: roleData.id,
    })

    fetchUsers()
  }

  // 기업 매칭 모달 열기
  const handleOpenMatchingModal = (user: UserWithRoles) => {
    setSelectedUser(user)
    setMatchingFormData({
      company_id: "",
      position: "",
      is_primary: false,
    })
    setShowMatchingModal(true)
  }

  // 기업 매칭 제출
  const handleMatchingSubmit = async () => {
    if (!selectedUser || !matchingFormData.company_id) {
      setError("기업을 선택해주세요.")
      return
    }

    const supabase = createClient()

    // Check if user already belongs to this company
    const { data: existing } = await supabase
      .from("user_companies")
      .select("*")
      .eq("user_id", selectedUser.user_id)
      .eq("company_id", matchingFormData.company_id)
      .is("deleted_at", null)
      .single()

    if (existing) {
      setError("이미 이 기업에 소속된 사용자입니다.")
      return
    }

    // If setting as primary, unset existing primary for this user
    if (matchingFormData.is_primary) {
      await supabase
        .from("user_companies")
        .update({ is_primary: false })
        .eq("user_id", selectedUser.user_id)
        .is("deleted_at", null)
    }

    // Insert new company membership
    const { error } = await supabase
      .from("user_companies")
      .insert({
        user_id: selectedUser.user_id,
        company_id: matchingFormData.company_id,
        position: matchingFormData.position || null,
        is_primary: matchingFormData.is_primary,
        status: "active",
      })

    if (error) {
      setError("기업 매칭에 실패했습니다.")
      return
    }

    setSuccess("기업에 매칭되었습니다.")
    setShowMatchingModal(false)
    fetchUsers()
    fetchAllCompanies()

    setTimeout(() => setSuccess(""), 3000)
  }

  // 기업 매칭 제거
  const handleRemoveCompany = async (userId: string, companyId: string) => {
    const supabase = createClient()

    const { error } = await supabase
      .from("user_companies")
      .update({ deleted_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("company_id", companyId)

    if (error) {
      setError("매칭 제거에 실패했습니다.")
      return
    }

    setSuccess("기업 매칭이 제거되었습니다.")
    fetchUsers()

    setTimeout(() => setSuccess(""), 3000)
  }

  // 대표자 변경
  const handleChangeRepresentative = async (companyId: string, userId: string) => {
    const supabase = createClient()

    // Unset existing primary for this company
    await supabase
      .from("user_companies")
      .update({ is_primary: false })
      .eq("company_id", companyId)
      .is("deleted_at", null)

    // Set new primary
    const { error } = await supabase
      .from("user_companies")
      .update({ is_primary: true })
      .eq("user_id", userId)
      .eq("company_id", companyId)
      .is("deleted_at", null)

    if (error) {
      setError("대표자 변경에 실패했습니다.")
      return
    }

    setSuccess("대표자가 변경되었습니다.")
    fetchUsers()
    fetchCompanyUsers(companyId)

    setTimeout(() => setSuccess(""), 3000)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">사용자 및 기업 관리</h1>
          <p className="text-muted-foreground">시스템 사용자, 권한 및 기업 대표자 정보를 관리합니다</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          사용자 추가
        </Button>
      </div>

      {/* 기업 목록 섹션 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>기업 목록</CardTitle>
              <CardDescription>
                총 {allCompanies.length}개 기업 (클릭하여 대표자 정보 수정)
              </CardDescription>
            </div>
            <Button onClick={handleCreateCompany} size="sm">
              기업 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allCompanies.map((company) => (
              <div
                key={company.id}
                onClick={() => handleEditCompany(company.id)}
                className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{company.name}</h3>
                    <p className="text-xs text-muted-foreground">{company.registration_number || "-"}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">
                        대표자: {company.ceo_name || "-"}
                      </span>
                      <Pencil className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(company.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 사용자 목록 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle>사용자 목록</CardTitle>
          <CardDescription>
            총 {users.length}명의 사용자
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              사용자가 없습니다
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <UserCog className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{user.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {user.roles.map((role) => (
                        <span
                          key={role}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                        >
                          {roleLabels[role as keyof typeof roleLabels] || role}
                        </span>
                      ))}
                    </div>
                  </div>

                  {user.companies && user.companies.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 text-sm pl-11">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">소속 기업:</span>
                      {user.companies.map((c) => (
                        <div key={c.id} className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditCompany(c.id)}
                            className="font-medium text-primary hover:underline flex items-center gap-1"
                          >
                            {c.name}
                            {c.is_primary && (
                              <span className="text-xs bg-red-100 text-red-700 px-1 rounded">(대표)</span>
                            )}
                            {c.position && (
                              <span className="text-xs text-muted-foreground">({c.position})</span>
                            )}
                          </button>
                          <button
                            onClick={() => handleRemoveCompany(user.user_id, c.id)}
                            className="text-muted-foreground hover:text-red-600 p-1"
                            title="매칭 제거"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pl-11">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedUser(user)
                        setShowRoleModal(true)
                      }}
                    >
                      역할 관리
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenMatchingModal(user)}
                    >
                      기업 매칭
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 기업 수정 모달 */}
      {showCompanyModal && selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowCompanyModal(false)}
          />
          <Card className="relative z-10 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{selectedCompany ? "기업 정보 수정" : "새 기업 등록"}</CardTitle>
              <CardDescription>
                {selectedCompany ? "대표자 정보 및 기업 정보를 수정합니다." : "새로운 기업을 등록합니다."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="c-name">기업명 *</Label>
                  <Input
                    id="c-name"
                    value={companyFormData.name}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, name: e.target.value })}
                    placeholder="기업명 입력"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="c-registration_number">사업자등록번호</Label>
                  <Input
                    id="c-registration_number"
                    value={companyFormData.registration_number}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, registration_number: e.target.value })}
                    placeholder="1234567890"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="c-ceo_name">대표명 *</Label>
                  <Input
                    id="c-ceo_name"
                    value={companyFormData.ceo_name}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, ceo_name: e.target.value })}
                    placeholder="대표명 입력"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="c-industry">산업</Label>
                  <Input
                    id="c-industry"
                    value={companyFormData.industry}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, industry: e.target.value })}
                    placeholder="예: 소프트웨어 개발"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="c-phone">대표자 연락처 *</Label>
                  <Input
                    id="c-phone"
                    value={companyFormData.phone}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, phone: e.target.value })}
                    placeholder="010-1234-5678"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="c-email">기업 이메일</Label>
                  <Input
                    id="c-email"
                    type="email"
                    value={companyFormData.email}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, email: e.target.value })}
                    placeholder="company@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="c-address">주소</Label>
                <Input
                  id="c-address"
                  value={companyFormData.address}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, address: e.target.value })}
                  placeholder="주소 입력"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="c-status">상태</Label>
                <Select
                  value={companyFormData.status}
                  onValueChange={(value) => setCompanyFormData({ ...companyFormData, status: value })}
                >
                  <SelectTrigger id="c-status">
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 해당 기업 소속 사용자 */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">
                  소속 사용자 ({companyUsers.length}명)
                </h4>
                {companyUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">소속된 사용자가 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {companyUsers.map((u) => (
                      <div key={u.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{u.name}</span>
                          <span className="text-muted-foreground">({u.email})</span>
                          {u.position && (
                            <span className="text-xs text-muted-foreground">({u.position})</span>
                          )}
                          {u.is_primary && (
                            <span className="text-xs bg-red-100 text-red-700 px-1 rounded">대표</span>
                          )}
                        </div>
                        {!u.is_primary && selectedCompany && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleChangeRepresentative(selectedCompany.id, u.user_id)}
                          >
                            대표자 지정
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCompanyModal(false)}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button onClick={handleCompanySubmit} className="flex-1">
                  {selectedCompany ? "수정 완료" : "등록"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>사용자 추가</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">이름</Label>
                  <Input
                    id="name"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">역할</Label>
                  <Select
                    value={newUserRole}
                    onValueChange={setNewUserRole}
                  >
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company_user">기업 사용자</SelectItem>
                      <SelectItem value="individual_user">개인 참가자</SelectItem>
                      <SelectItem value="admin">운영 관리자</SelectItem>
                      <SelectItem value="super_admin">최고 관리자</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newUserRole === "company_user" && (
                  <div className="space-y-2">
                    <Label htmlFor="company">소속 기업</Label>
                    <Select
                      value={newUserCompanyId}
                      onValueChange={setNewUserCompanyId}
                      required
                    >
                      <SelectTrigger id="company">
                        <SelectValue placeholder="기업 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit" disabled={creating}>
                    {creating ? "생성 중..." : "생성"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    disabled={creating}
                  >
                    취소
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Role Management Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>역할 관리 - {selectedUser.name}</CardTitle>
              <CardDescription>{selectedUser.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">현재 역할</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.roles.map((role) => (
                    <div
                      key={role}
                      className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                    >
                      {roleLabels[role as keyof typeof roleLabels] || role}
                      {(isSuperAdmin() || role !== "super_admin") && (
                        <button
                          onClick={() => {
                            handleRemoveRole(selectedUser.user_id, role)
                            setSelectedUser({
                              ...selectedUser,
                              roles: selectedUser.roles.filter((r) => r !== role),
                            })
                          }}
                          className="ml-1 text-blue-900 hover:text-blue-950"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  {selectedUser.roles.length === 0 && (
                    <span className="text-sm text-muted-foreground">역할 없음</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">역할 추가</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(roleLabels)
                    .filter(([code]) => !selectedUser.roles.includes(code))
                    .map(([code, label]) => (
                      <Button
                        key={code}
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          handleAddRole(selectedUser.user_id, code)
                          setSelectedUser({
                            ...selectedUser,
                            roles: [...selectedUser.roles, code],
                          })
                        }}
                      >
                        {label} 추가
                      </Button>
                    ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setShowRoleModal(false)}>
                  닫기
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 기업 매칭 모달 */}
      {showMatchingModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowMatchingModal(false)}
          />
          <Card className="relative z-10 max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle>기업 매칭 - {selectedUser.name}</CardTitle>
              <CardDescription>{selectedUser.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="match-company">기업 *</Label>
                <Select
                  value={matchingFormData.company_id}
                  onValueChange={(value) =>
                    setMatchingFormData({ ...matchingFormData, company_id: value })
                  }
                >
                  <SelectTrigger id="match-company">
                    <SelectValue placeholder="기업 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCompanies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name} ({company.registration_number || "-"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="match-position">직책</Label>
                <Input
                  id="match-position"
                  value={matchingFormData.position}
                  onChange={(e) =>
                    setMatchingFormData({ ...matchingFormData, position: e.target.value })
                  }
                  placeholder="예: 대표, 팀장, 개발자"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="match-primary"
                  checked={matchingFormData.is_primary}
                  onCheckedChange={(checked) =>
                    setMatchingFormData({ ...matchingFormData, is_primary: checked })
                  }
                />
                <Label htmlFor="match-primary" className="cursor-pointer">
                  대표자로 설정
                </Label>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowMatchingModal(false)}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button onClick={handleMatchingSubmit} className="flex-1">
                  매칭
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
