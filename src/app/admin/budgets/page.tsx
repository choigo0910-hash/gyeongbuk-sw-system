"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Upload, Download, Loader2 } from "lucide-react"
import Link from "next/link"

interface Budget {
  id: string
  fiscal_year: number
  status: string
  total_amount: number
  submitted_at: string | null
  companies?: {
    name: string
  }
}

interface Company {
  id: string
  name: string
}

interface Program {
  id: string
  name: string
}

const statusLabels: Record<string, string> = {
  draft: "임시저장",
  submitted: "제출됨",
  reviewing: "검토중",
  revision_requested: "보완요청",
  approved: "승인완료",
  rejected: "반려",
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-blue-100 text-blue-700",
  reviewing: "bg-yellow-100 text-yellow-700",
  revision_requested: "bg-orange-100 text-orange-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
}

export default function AdminBudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")

  // 업로드 관련 상태
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [companyId, setCompanyId] = useState<string>("")
  const [programId, setProgramId] = useState<string>("")
  const [fiscalYear, setFiscalYear] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 기업/프로그램 목록
  const [companies, setCompanies] = useState<Company[]>([])
  const [programs, setPrograms] = useState<Program[]>([])

  useEffect(() => {
    fetchBudgets()
    fetchCompanies()
    fetchPrograms()
  }, [])

  const fetchBudgets = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      let query = supabase
        .from("budgets")
        .select(`
          *,
          companies (name)
        `)
        .order("created_at", { ascending: false })

      // 필터 적용
      if (filter !== "all") {
        query = query.eq("status", filter)
      }

      const { data } = await query

      setBudgets((data as Budget[]) || [])
    } catch (error) {
      console.error("예산서 목록 조회 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompanies = async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from("companies")
        .select("id, name")
        .order("name")

      setCompanies((data as Company[]) || [])
    } catch (error) {
      console.error("기업 목록 조회 실패:", error)
    }
  }

  const fetchPrograms = async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from("programs")
        .select("id, name")
        .eq("status", "published")
        .order("name")

      setPrograms((data as Program[]) || [])
    } catch (error) {
      console.error("프로그램 목록 조회 실패:", error)
    }
  }

  const filteredBudgets = filter === "all"
    ? budgets
    : budgets.filter((b) => b.status === filter)

  const pendingCount = budgets.filter((b) => b.status === "submitted" || b.status === "reviewing").length

  // 템플릿 다운로드
  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/api/admin/budgets/template")
      if (!response.ok) throw new Error("템플릿 다운로드 실패")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "예산서_템플릿.xlsx"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("템플릿 다운로드 오류:", error)
      alert("템플릿 다운로드에 실패했습니다.")
    }
  }

  // 파일 선택 처리
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // .xlsx 파일만 허용
      if (!file.name.endsWith(".xlsx")) {
        alert("엑셀 파일(.xlsx)만 업로드 가능합니다.")
        return
      }
      setSelectedFile(file)
    }
  }

  // 업로드 처리
  const handleUpload = async () => {
    if (!selectedFile) {
      alert("파일을 선택해주세요.")
      return
    }
    if (!companyId || !programId || !fiscalYear) {
      alert("모든 필드를 입력해주세요.")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("company_id", companyId)
      formData.append("program_id", programId)
      formData.append("fiscal_year", fiscalYear)

      const response = await fetch("/api/admin/budgets/import", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "업로드 실패")
      }

      const result = await response.json()

      alert(`예산서가 성공적으로 생성되었습니다.\n항목 수: ${result.itemsCount}건\n총액: ${formatCurrency(result.totalAmount)}`)

      // 다이얼로그 닫기 및 상태 초기화
      setUploadDialogOpen(false)
      setSelectedFile(null)
      setCompanyId("")
      setProgramId("")
      setFiscalYear("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // 목록 새로고침
      fetchBudgets()
    } catch (error) {
      console.error("업로드 오류:", error)
      alert(error instanceof Error ? error.message : "업로드에 실패했습니다.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">예산 관리</h1>
          <p className="text-muted-foreground">
            기업 예산서를 검토하고 승인합니다
            {pendingCount > 0 && ` (검토 대기: ${pendingCount}건)`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDownloadTemplate} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            템플릿 다운로드
          </Button>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            엑셀 업로드
          </Button>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          전체
        </Button>
        <Button
          size="sm"
          variant={filter === "submitted" ? "default" : "outline"}
          onClick={() => setFilter("submitted")}
        >
          제출됨
        </Button>
        <Button
          size="sm"
          variant={filter === "reviewing" ? "default" : "outline"}
          onClick={() => setFilter("reviewing")}
        >
          검토중
        </Button>
        <Button
          size="sm"
          variant={filter === "approved" ? "default" : "outline"}
          onClick={() => setFilter("approved")}
        >
          승인완료
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>예산서 목록</CardTitle>
          <CardDescription>
            총 {filteredBudgets.length}건의 예산서
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : filteredBudgets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              예산서가 없습니다
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBudgets.map((budget) => (
                <div
                  key={budget.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium">
                          {budget.companies?.name || "알 수 없는 기업"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {budget.fiscal_year}년도
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            statusColors[budget.status] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {statusLabels[budget.status] || budget.status}
                        </span>
                      </div>
                      <div className="text-lg font-semibold">
                        {formatCurrency(budget.total_amount)}
                      </div>
                      {budget.submitted_at && (
                        <p className="text-sm text-muted-foreground">
                          제출: {new Date(budget.submitted_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {(budget.status === "submitted" || budget.status === "reviewing") ? (
                        <Button asChild size="sm">
                          <Link href={`/admin/budgets/${budget.id}/review`}>검토</Link>
                        </Button>
                      ) : (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/budgets/${budget.id}`}>상세</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 업로드 다이얼로그 */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>예산서 엑셀 업로드</DialogTitle>
            <DialogDescription>
              엑셀 템플릿에 작성한 예산서를 업로드하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 기업 선택 */}
            <div className="space-y-2">
              <Label>기업</Label>
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger>
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

            {/* 프로그램 선택 */}
            <div className="space-y-2">
              <Label>프로그램</Label>
              <Select value={programId} onValueChange={setProgramId}>
                <SelectTrigger>
                  <SelectValue placeholder="프로그램 선택" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 연도 입력 */}
            <div className="space-y-2">
              <Label>연도</Label>
              <Input
                type="number"
                placeholder="예: 2026"
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                min={2020}
                max={2100}
              />
            </div>

            {/* 파일 선택 */}
            <div className="space-y-2">
              <Label>엑셀 파일</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                onChange={handleFileSelect}
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  선택된 파일: {selectedFile.name}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  업로드 중...
                </>
              ) : (
                "업로드"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
