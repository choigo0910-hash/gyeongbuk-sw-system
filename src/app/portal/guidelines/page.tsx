"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { getSignedFileUrl } from "@/lib/storage"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// 타입 정의
type Guide = {
  id: string
  title: string
  slug: string
  content: string
  category: string | null
  sort_order: number
}

type FAQ = {
  id: string
  question: string
  answer: string
  category: string | null
  sort_order: number
}

type Notice = {
  id: string
  title: string
  content: string
  category: string
  is_important: boolean
  published_at: string
  view_count: number
}

type DocumentTemplate = {
  id: string
  title: string
  description: string | null
  category: string | null
  file_url: string
  file_name: string
  file_size: number | null
  download_count: number
  version: string | null
}

export default function GuidelinesPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState("guides")
  const [loading, setLoading] = useState(true)

  // 데이터 상태
  const [guides, setGuides] = useState<Guide[]>([])
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [notices, setNotices] = useState<Notice[]>([])
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])

  // 카테고리별 필터
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // 가이드 조회
      const { data: guidesData } = await supabase
        .from("guides")
        .select("*")
        .eq("is_published", true)
        .is("deleted_at", null)
        .order("sort_order", { ascending: true })

      if (guidesData) setGuides(guidesData)

      // FAQ 조회
      const { data: faqsData } = await supabase
        .from("faqs")
        .select("*")
        .eq("is_published", true)
        .is("deleted_at", null)
        .order("sort_order", { ascending: true })

      if (faqsData) setFaqs(faqsData)

      // 공지사항 조회
      const { data: noticesData } = await supabase
        .from("notices")
        .select("*")
        .eq("is_published", true)
        .is("deleted_at", null)
        .order("published_at", { ascending: false })
        .limit(20)

      if (noticesData) setNotices(noticesData)

      // 서류 양식 조회
      const { data: templatesData } = await supabase
        .from("document_templates")
        .select("*")
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("sort_order", { ascending: true })

      if (templatesData) setTemplates(templatesData)
    } catch (error) {
      console.error("가이드라인 데이터 조회 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (template: DocumentTemplate) => {
    try {
      // 다운로드 카운트 증가 (RLS: document_templates UPDATE는 관리자 전용 → RPC로 증가)
      await supabase.rpc("increment_document_template_download", {
        p_template_id: template.id,
      })

      // 파일 다운로드 (서명된 URL 생성 — file_url은 bucket/경로 형식이라
      // createSignedUrl 직접 호출하면 버킷이 이중 붙음 → 헬퍼로 경로 분리)
      const signedUrl = await getSignedFileUrl(supabase, template.file_url, 60)

      if (signedUrl) {
        window.open(signedUrl, "_blank")
      }
    } catch (error) {
      console.error("파일 다운로드 실패:", error)
    }
  }

  const getCategoryLabel = (category: string | null) => {
    const labels: Record<string, string> = {
      "getting-started": "시작하기",
      "budget": "예산관리",
      "purchase": "구매요청",
      "refund": "환급신청",
      "program": "프로그램",
      "certificate": "확인서",
      "general": "일반",
      "account": "계정",
      "maintenance": "시스템",
      "urgent": "긴급",
      "event": "이벤트",
    }
    return category ? labels[category] || category : "일반"
  }

  const getCategoryColor = (category: string | null) => {
    const colors: Record<string, string> = {
      "getting-started": "bg-blue-100 text-blue-800",
      "budget": "bg-green-100 text-green-800",
      "purchase": "bg-purple-100 text-purple-800",
      "refund": "bg-orange-100 text-orange-800",
      "program": "bg-pink-100 text-pink-800",
      "certificate": "bg-teal-100 text-teal-800",
      "general": "bg-gray-100 text-gray-800",
      "urgent": "bg-red-100 text-red-800",
    }
    return category ? colors[category] || "bg-gray-100 text-gray-800" : "bg-gray-100 text-gray-800"
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-"
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">가이드라인</h1>
        <p className="text-gray-600 mt-1">
          시스템 이용 방법, 자주 묻는 질문, 공지사항, 서류 양식을 확인하세요.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="guides">이용 가이드</TabsTrigger>
          <TabsTrigger value="faqs">자주 묻는 질문</TabsTrigger>
          <TabsTrigger value="notices">공지사항</TabsTrigger>
          <TabsTrigger value="templates">서류 양식</TabsTrigger>
        </TabsList>

        {/* 가이드 탭 */}
        <TabsContent value="guides">
          <div className="space-y-4">
            {guides.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-gray-500 text-center">등록된 가이드가 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              guides.map((guide) => (
                <Card key={guide.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{guide.title}</CardTitle>
                      {guide.category && (
                        <Badge className={getCategoryColor(guide.category)}>
                          {getCategoryLabel(guide.category)}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
                      {guide.content}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* FAQ 탭 */}
        <TabsContent value="faqs">
          <div className="space-y-3">
            {faqs.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-gray-500 text-center">등록된 FAQ가 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              faqs.map((faq) => (
                <Card key={faq.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold mt-1">Q.</span>
                      <CardTitle className="text-base">{faq.question}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 font-bold mt-1">A.</span>
                      <p className="text-gray-700 text-sm whitespace-pre-line">{faq.answer}</p>
                    </div>
                    {faq.category && (
                      <Badge className={`mt-3 ${getCategoryColor(faq.category)}`}>
                        {getCategoryLabel(faq.category)}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* 공지사항 탭 */}
        <TabsContent value="notices">
          <div className="space-y-4">
            {notices.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-gray-500 text-center">등록된 공지사항이 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              notices.map((notice) => (
                <Card key={notice.id} className={notice.is_important ? "border-red-200 bg-red-50/30" : ""}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {notice.is_important && (
                          <Badge className="bg-red-500 text-white">중요</Badge>
                        )}
                        <CardTitle className="text-lg">{notice.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getCategoryColor(notice.category)}>
                          {getCategoryLabel(notice.category)}
                        </Badge>
                        <span className="text-sm text-gray-500">{formatDate(notice.published_at)}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
                      {notice.content}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* 서류 양식 탭 */}
        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="pt-6">
                  <p className="text-gray-500 text-center">등록된 서류 양식이 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              templates.map((template) => (
                <Card key={template.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{template.title}</CardTitle>
                      {template.version && (
                        <Badge variant="outline">{template.version}</Badge>
                      )}
                    </div>
                    {template.category && (
                      <Badge className={`mt-2 ${getCategoryColor(template.category)}`}>
                        {getCategoryLabel(template.category)}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {template.description && (
                      <p className="text-sm text-gray-600">{template.description}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>📄 {template.file_name}</span>
                      <span>{formatFileSize(template.file_size)}</span>
                    </div>
                    <Button
                      onClick={() => handleDownload(template)}
                      className="w-full"
                      variant="outline"
                    >
                      다운로드 ({template.download_count || 0})
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
