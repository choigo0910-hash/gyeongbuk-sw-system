"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import Link from "next/link"

const documentTypes = [
  { value: "business_registration", label: "사업자등록증" },
  { value: "interim_report", label: "중간 성과 보고서" },
  { value: "final_report", label: "최종 성과 보고서" },
]

export default function CompanyDocumentUploadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    document_type: "",
    title: "",
    description: "",
  })
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // 파일 크기 확인 (10MB 제한)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("파일 크기는 10MB를 초과할 수 없습니다.")
        setFile(null)
        return
      }

      // 파일 형식 확인
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ]
      if (!allowedTypes.includes(selectedFile.type)) {
        setError("PDF, JPG, JPEG, PNG 형식만 업로드 가능합니다.")
        setFile(null)
        return
      }

      setFile(selectedFile)
      setError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError("파일을 선택해주세요.")
      return
    }

    if (!formData.document_type || !formData.title) {
      setError("필수 항목을 모두 입력해주세요.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError("로그인이 필요합니다.")
        setLoading(false)
        return
      }

      // 회사 ID 가져오기
      const { data: companies } = await supabase
        .from("user_companies")
        .select("company_id")
        .eq("user_id", user.id)
        .eq("is_primary", true)
        .single()

      if (!companies) {
        setError("소속된 기업 정보를 찾을 수 없습니다.")
        setLoading(false)
        return
      }

      const companyId = companies.company_id

      // 파일명 생성 (UUID + 확장자 - 한글 문제 해결)
      const fileExt = file.name.split(".").pop()
      const uniqueId = Math.random().toString(36).substring(2, 15)
      const fileName = `${Date.now()}_${uniqueId}.${fileExt}`

      // Storage 업로드
      setUploadProgress(10)
      const { error: uploadError } = await supabase.storage
        .from("company-documents")
        .upload(fileName, file)

      if (uploadError) {
        // 버킷이 없는 경우 생성 필요 안내
        if (uploadError.message.includes("bucket")) {
          setError("Storage 버킷이 필요합니다. 관리자에게 문의해주세요.")
        } else {
          throw uploadError
        }
        setLoading(false)
        return
      }

      setUploadProgress(70)

      // DB 저장 (버킷이 private이므로 절대 URL 대신 경로 저장 — 조회 시 서명 URL 생성)
      const { error: dbError } = await supabase
        .from("company_documents")
        .insert({
          company_id: companyId,
          document_type: formData.document_type,
          title: formData.title,
          description: formData.description || null,
          file_name: file.name,
          file_url: `company-documents/${fileName}`,
          file_size: file.size,
          status: "draft",
        })

      if (dbError) {
        throw dbError
      }

      setUploadProgress(100)

      // 목록 페이지로 이동
      router.push("/portal/company-documents")
    } catch (error) {
      console.error("서류 업로드 실패:", error)
      setError("업로드에 실패했습니다. 다시 시도해주세요.")
      setLoading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">서류 제출</h1>
          <p className="text-muted-foreground">서류를 제출합니다</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/portal/company-documents">목록으로</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>서류 정보</CardTitle>
          <CardDescription>제출할 서류의 정보를 입력합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 서류 종류 */}
            <div className="space-y-2">
              <Label htmlFor="document_type">
                서류 종류 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.document_type}
                onValueChange={(value) => {
                  setFormData({ ...formData, document_type: value })
                  // 자동으로 제목 설정
                  const type = documentTypes.find((t) => t.value === value)
                  if (type) {
                    setFormData((prev) => ({
                      ...prev,
                      document_type: value,
                      title: type.label,
                    }))
                  }
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="서류 종류를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 제목 */}
            <div className="space-y-2">
              <Label htmlFor="title">
                제목 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="서류 제목을 입력하세요"
                required
              />
            </div>

            {/* 설명 */}
            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="서류에 대한 추가 설명을 입력하세요"
                rows={3}
              />
            </div>

            {/* 파일 업로드 */}
            <div className="space-y-2">
              <Label htmlFor="file">
                파일 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                required
              />
              <p className="text-sm text-muted-foreground">
                PDF, JPG, JPEG, PNG 형식, 최대 10MB
              </p>
              {file && (
                <p className="text-sm text-green-600">
                  선택된 파일: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            {/* 업로드 진행률 */}
            {loading && uploadProgress > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>업로드 중...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* 버튼 */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                asChild
                disabled={loading}
              >
                <Link href="/portal/company-documents">취소</Link>
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "업로드 중..." : "임시저장"}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  // 제출 로직 (status를 submitted로 변경)
                  handleSubmit(new Event("submit") as any)
                }}
                disabled={loading}
              >
                {loading ? "제출 중..." : "제출하기"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 안내 카드 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 mb-2">제출 안내</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 사업자등록증: 프로그램 참여 시 최초 1회 제출</li>
            <li>• 중간 성과 보고서: 프로그램 진행 중간 제출</li>
            <li>• 최종 성과 보고서: 프로그램 완료 후 제출</li>
            <li>• 파일 형식: PDF, JPG, JPEG, PNG (최대 10MB)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
