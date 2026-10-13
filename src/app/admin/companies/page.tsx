"use client"

import { useState, useEffect } from "react"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, Search } from "lucide-react"

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
  created_at: string
}

const statusOptions = [
  { value: "active", label: "활성", color: "bg-green-100 text-green-800" },
  { value: "inactive", label: "비활성", color: "bg-gray-100 text-gray-800" },
  { value: "suspended", label: "정지", color: "bg-red-100 text-red-800" },
]

export default function AdminCompaniesPage() {
  const supabase = createClient()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // 폼 상태
  const [formData, setFormData] = useState({
    name: "",
    registration_number: "",
    ceo_name: "",
    industry: "",
    address: "",
    phone: "",
    email: "",
    status: "active",
  })

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setCompanies(data)
    }
    setLoading(false)
  }

  const handleCreate = () => {
    setEditingCompany(null)
    setFormData({
      name: "",
      registration_number: "",
      ceo_name: "",
      industry: "",
      address: "",
      phone: "",
      email: "",
      status: "active",
    })
    setShowModal(true)
  }

  const handleEdit = (company: Company) => {
    setEditingCompany(company)
    setFormData({
      name: company.name,
      registration_number: company.registration_number || "",
      ceo_name: company.ceo_name || "",
      industry: company.industry || "",
      address: company.address || "",
      phone: company.phone || "",
      email: company.email || "",
      status: company.status,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까? 관련된 모든 데이터가 삭제됩니다.")) return

    const { error } = await supabase
      .from("companies")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      alert("삭제에 실패했습니다.")
      return
    }

    alert("삭제되었습니다.")
    fetchCompanies()
  }

  const handleSubmit = async () => {
    if (!formData.name) {
      alert("기업명은 필수입니다.")
      return
    }

    if (editingCompany) {
      // 수정
      const { error } = await supabase
        .from("companies")
        .update(formData)
        .eq("id", editingCompany.id)

      if (error) {
        alert("수정에 실패했습니다.")
        return
      }

      alert("수정되었습니다.")
    } else {
      // 생성
      const { error } = await supabase
        .from("companies")
        .insert(formData)

      if (error) {
        alert("생성에 실패했습니다.")
        return
      }

      alert("생성되었습니다.")
    }

    setShowModal(false)
    fetchCompanies()
  }

  const getStatusBadge = (status: string) => {
    const statusInfo = statusOptions.find((s) => s.value === status) || statusOptions[0]
    return <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
  }

  // 검색 필터링
  const filteredCompanies = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.registration_number?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (company.ceo_name?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">기업 관리</h1>
          <p className="text-muted-foreground">등록된 기업 정보를 관리합니다</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          기업 추가
        </Button>
      </div>

      {/* 검색 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="기업명, 사업자등록번호, 대표명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardContent>
      </Card>

      {/* 기업 목록 테이블 */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">로딩 중...</div>
          ) : filteredCompanies.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {searchTerm ? "검색 결과가 없습니다." : "등록된 기업이 없습니다."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>기업명</TableHead>
                  <TableHead>사업자등록번호</TableHead>
                  <TableHead>대표명</TableHead>
                  <TableHead>산업</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.registration_number || "-"}</TableCell>
                    <TableCell>{company.ceo_name || "-"}</TableCell>
                    <TableCell>{company.industry || "-"}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {company.phone && <div>{company.phone}</div>}
                        {company.email && <div className="text-muted-foreground">{company.email}</div>}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(company.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(company)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(company.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* 생성/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
          />
          <Card className="relative z-10 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{editingCompany ? "기업 정보 수정" : "새 기업 추가"}</CardTitle>
              <CardDescription>
                {editingCompany ? "기업 정보를 수정합니다." : "새로운 기업을 등록합니다."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">기업명 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="기업명 입력"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registration_number">사업자등록번호</Label>
                  <Input
                    id="registration_number"
                    value={formData.registration_number}
                    onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                    placeholder="1234567890"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ceo_name">대표명</Label>
                  <Input
                    id="ceo_name"
                    value={formData.ceo_name}
                    onChange={(e) => setFormData({ ...formData, ceo_name: e.target.value })}
                    placeholder="대표명 입력"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">산업</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="예: 소프트웨어 개발"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">연락처</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="02-1234-5678"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="company@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">주소</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="주소 입력"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">상태</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status">
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

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button onClick={handleSubmit} className="flex-1">
                  {editingCompany ? "수정" : "생성"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
