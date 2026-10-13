"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Switch } from "@/components/ui/switch"

// 타입 정의
type Guide = {
  id: string
  title: string
  slug: string
  content: string
  category: string | null
  sort_order: number
  is_published: boolean
}

type FAQ = {
  id: string
  question: string
  answer: string
  category: string | null
  sort_order: number
  is_published: boolean
}

type Notice = {
  id: string
  title: string
  content: string
  category: string
  is_important: boolean
  is_published: boolean
  published_at: string | null
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
  sort_order: number
  is_active: boolean
  version: string | null
}

export default function AdminGuidelinesPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState("guides")
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(0)

  // 데이터 상태
  const [guides, setGuides] = useState<Guide[]>([])
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [notices, setNotices] = useState<Notice[]>([])
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])

  // 다이얼로그 상태
  const [guideDialog, setGuideDialog] = useState(false)
  const [faqDialog, setFaqDialog] = useState(false)
  const [noticeDialog, setNoticeDialog] = useState(false)
  const [templateDialog, setTemplateDialog] = useState(false)

  // 편집 상태
  const [editingItem, setEditingItem] = useState<any>(null)

  useEffect(() => {
    fetchData()
  }, [refresh])

  const fetchData = async () => {
    setLoading(true)
    try {
      // 가이드 조회
      const { data: guidesData } = await supabase
        .from("guides")
        .select("*")
        .is("deleted_at", null)
        .order("sort_order", { ascending: true })

      if (guidesData) setGuides(guidesData)

      // FAQ 조회
      const { data: faqsData } = await supabase
        .from("faqs")
        .select("*")
        .is("deleted_at", null)
        .order("sort_order", { ascending: true })

      if (faqsData) setFaqs(faqsData)

      // 공지사항 조회
      const { data: noticesData } = await supabase
        .from("notices")
        .select("*")
        .is("deleted_at", null)
        .order("published_at", { ascending: false })

      if (noticesData) setNotices(noticesData)

      // 서류 양식 조회
      const { data: templatesData } = await supabase
        .from("document_templates")
        .select("*")
        .is("deleted_at", null)
        .order("sort_order", { ascending: true })

      if (templatesData) setTemplates(templatesData)
    } catch (error) {
      console.error("가이드라인 데이터 조회 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  // 가이드 CRUD
  const handleSaveGuide = async (formData: FormData) => {
    try {
      const data = {
        title: formData.get("title") as string,
        slug: formData.get("slug") as string,
        content: formData.get("content") as string,
        category: formData.get("category") as string,
        sort_order: parseInt(formData.get("sort_order") as string) || 0,
        is_published: formData.get("is_published") === "true",
      }

      if (editingItem?.id) {
        await supabase.from("guides").update(data).eq("id", editingItem.id)
      } else {
        await supabase.from("guides").insert(data)
      }

      setGuideDialog(false)
      setEditingItem(null)
      setRefresh(refresh + 1)
    } catch (error) {
      console.error("가이드 저장 실패:", error)
    }
  }

  const handleDeleteGuide = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return
    try {
      await supabase.from("guides").update({ deleted_at: new Date().toISOString() }).eq("id", id)
      setRefresh(refresh + 1)
    } catch (error) {
      console.error("가이드 삭제 실패:", error)
    }
  }

  // FAQ CRUD
  const handleSaveFaq = async (formData: FormData) => {
    try {
      const data = {
        question: formData.get("question") as string,
        answer: formData.get("answer") as string,
        category: formData.get("category") as string,
        sort_order: parseInt(formData.get("sort_order") as string) || 0,
        is_published: formData.get("is_published") === "true",
      }

      if (editingItem?.id) {
        await supabase.from("faqs").update(data).eq("id", editingItem.id)
      } else {
        await supabase.from("faqs").insert(data)
      }

      setFaqDialog(false)
      setEditingItem(null)
      setRefresh(refresh + 1)
    } catch (error) {
      console.error("FAQ 저장 실패:", error)
    }
  }

  const handleDeleteFaq = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return
    try {
      await supabase.from("faqs").update({ deleted_at: new Date().toISOString() }).eq("id", id)
      setRefresh(refresh + 1)
    } catch (error) {
      console.error("FAQ 삭제 실패:", error)
    }
  }

  // 공지사항 CRUD
  const handleSaveNotice = async (formData: FormData) => {
    try {
      const data = {
        title: formData.get("title") as string,
        content: formData.get("content") as string,
        category: formData.get("category") as string,
        is_important: formData.get("is_important") === "true",
        is_published: formData.get("is_published") === "true",
        published_at: formData.get("is_published") === "true" ? new Date().toISOString() : null,
      }

      if (editingItem?.id) {
        await supabase.from("notices").update(data).eq("id", editingItem.id)
      } else {
        await supabase.from("notices").insert(data)
      }

      setNoticeDialog(false)
      setEditingItem(null)
      setRefresh(refresh + 1)
    } catch (error) {
      console.error("공지사항 저장 실패:", error)
    }
  }

  const handleDeleteNotice = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return
    try {
      await supabase.from("notices").update({ deleted_at: new Date().toISOString() }).eq("id", id)
      setRefresh(refresh + 1)
    } catch (error) {
      console.error("공지사항 삭제 실패:", error)
    }
  }

  // 서류 양식 CRUD
  const handleSaveTemplate = async (formData: FormData) => {
    try {
      const file = formData.get("file") as File
      let fileUrl = formData.get("file_url") as string
      let fileName = formData.get("file_name") as string
      let fileSize = formData.get("file_size") as string | null

      // 파일 업로드 처리
      if (file && file.size > 0) {
        const fileExt = file.name.split(".").pop()
        const fileNameSafe = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `documents/${fileNameSafe}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, file)

        if (uploadError) {
          console.error("파일 업로드 실패:", uploadError)
          return
        }

        fileUrl = filePath
        fileName = file.name
        fileSize = file.size.toString()
      }

      const data = {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        category: formData.get("category") as string,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize ? parseInt(fileSize) : null,
        sort_order: parseInt(formData.get("sort_order") as string) || 0,
        is_active: formData.get("is_active") === "true",
        version: formData.get("version") as string,
      }

      if (editingItem?.id) {
        await supabase.from("document_templates").update(data).eq("id", editingItem.id)
      } else {
        await supabase.from("document_templates").insert(data)
      }

      setTemplateDialog(false)
      setEditingItem(null)
      setRefresh(refresh + 1)
    } catch (error) {
      console.error("서류 양식 저장 실패:", error)
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return
    try {
      await supabase.from("document_templates").update({ deleted_at: new Date().toISOString() }).eq("id", id)
      setRefresh(refresh + 1)
    } catch (error) {
      console.error("서류 양식 삭제 실패:", error)
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
    return category ? labels[category] || category : "-"
  }

  const openGuideDialog = (guide?: Guide) => {
    setEditingItem(guide || { sort_order: guides.length + 1, is_published: false })
    setGuideDialog(true)
  }

  const openFaqDialog = (faq?: FAQ) => {
    setEditingItem(faq || { sort_order: faqs.length + 1, is_published: false })
    setFaqDialog(true)
  }

  const openNoticeDialog = (notice?: Notice) => {
    setEditingItem(notice || { category: "general", is_important: false, is_published: false })
    setNoticeDialog(true)
  }

  const openTemplateDialog = (template?: DocumentTemplate) => {
    setEditingItem(template || { sort_order: templates.length + 1, is_active: true })
    setTemplateDialog(true)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">가이드라인 관리</h1>
          <p className="text-gray-600 mt-1">
            가이드, FAQ, 공지사항, 서류 양식을 관리하세요.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="guides">가이드 관리</TabsTrigger>
          <TabsTrigger value="faqs">FAQ 관리</TabsTrigger>
          <TabsTrigger value="notices">공지사항 관리</TabsTrigger>
          <TabsTrigger value="templates">서류 양식 관리</TabsTrigger>
        </TabsList>

        {/* 가이드 관리 탭 */}
        <TabsContent value="guides">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => openGuideDialog()}>+ 가이드 추가</Button>
            </div>
            <div className="space-y-3">
              {guides.map((guide) => (
                <Card key={guide.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{guide.title}</CardTitle>
                        <CardDescription className="text-xs">/{guide.slug}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={guide.is_published ? "default" : "secondary"}>
                          {guide.is_published ? "게시" : "비공개"}
                        </Badge>
                        <Badge variant="outline">{getCategoryLabel(guide.category)}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => openGuideDialog(guide)}>
                      수정
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteGuide(guide.id)}>
                      삭제
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* FAQ 관리 탭 */}
        <TabsContent value="faqs">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => openFaqDialog()}>+ FAQ 추가</Button>
            </div>
            <div className="space-y-3">
              {faqs.map((faq) => (
                <Card key={faq.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{faq.question}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={faq.is_published ? "default" : "secondary"}>
                          {faq.is_published ? "게시" : "비공개"}
                        </Badge>
                        <Badge variant="outline">{getCategoryLabel(faq.category)}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-sm text-gray-600 line-clamp-2">{faq.answer}</p>
                  </CardContent>
                  <CardContent className="flex justify-end gap-2 pt-0">
                    <Button variant="outline" size="sm" onClick={() => openFaqDialog(faq)}>
                      수정
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteFaq(faq.id)}>
                      삭제
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* 공지사항 관리 탭 */}
        <TabsContent value="notices">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => openNoticeDialog()}>+ 공지사항 추가</Button>
            </div>
            <div className="space-y-3">
              {notices.map((notice) => (
                <Card key={notice.id} className={notice.is_important ? "border-red-200" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {notice.is_important && (
                          <Badge className="bg-red-500 text-white">중요</Badge>
                        )}
                        <CardTitle className="text-base">{notice.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={notice.is_published ? "default" : "secondary"}>
                          {notice.is_published ? "게시" : "비공개"}
                        </Badge>
                        <Badge variant="outline">{getCategoryLabel(notice.category)}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-sm text-gray-600 line-clamp-2">{notice.content}</p>
                  </CardContent>
                  <CardContent className="flex justify-end gap-2 pt-0">
                    <Button variant="outline" size="sm" onClick={() => openNoticeDialog(notice)}>
                      수정
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteNotice(notice.id)}>
                      삭제
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* 서류 양식 관리 탭 */}
        <TabsContent value="templates">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => openTemplateDialog()}>+ 서류 양식 추가</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{template.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        {template.version && (
                          <Badge variant="outline">{template.version}</Badge>
                        )}
                        <Badge variant={template.is_active ? "default" : "secondary"}>
                          {template.is_active ? "활성" : "비활성"}
                        </Badge>
                      </div>
                    </div>
                    {template.category && (
                      <Badge className={`mt-2 ${"bg-gray-100 text-gray-800"}`}>
                        {getCategoryLabel(template.category)}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {template.description && (
                      <p className="text-sm text-gray-600">{template.description}</p>
                    )}
                    <div className="text-xs text-gray-500">
                      📄 {template.file_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      다운로드: {template.download_count || 0}회
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openTemplateDialog(template)}>
                        수정
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteTemplate(template.id)}>
                        삭제
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* 가이드 다이얼로그 */}
      <Dialog open={guideDialog} onOpenChange={setGuideDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem?.id ? "가이드 수정" : "가이드 추가"}</DialogTitle>
            <DialogDescription>
              가이드 정보를 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <form action={handleSaveGuide}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">제목 *</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={editingItem?.title}
                  required
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  name="slug"
                  defaultValue={editingItem?.slug}
                  placeholder="예: getting-started"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">카테고리</Label>
                <Select name="category" defaultValue={editingItem?.category || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="getting-started">시작하기</SelectItem>
                    <SelectItem value="budget">예산관리</SelectItem>
                    <SelectItem value="purchase">구매요청</SelectItem>
                    <SelectItem value="refund">환급신청</SelectItem>
                    <SelectItem value="program">프로그램</SelectItem>
                    <SelectItem value="certificate">확인서</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sort_order">정렬 순서</Label>
                <Input
                  id="sort_order"
                  name="sort_order"
                  type="number"
                  defaultValue={editingItem?.sort_order || 0}
                />
              </div>
              <div>
                <Label htmlFor="content">내용 *</Label>
                <Textarea
                  id="content"
                  name="content"
                  defaultValue={editingItem?.content}
                  rows={10}
                  className="font-mono text-sm"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_published"
                  name="is_published"
                  defaultChecked={editingItem?.is_published}
                  value="true"
                  className="w-4 h-4"
                />
                <Label htmlFor="is_published" className="cursor-pointer">
                  게시 (공개)
                </Label>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setGuideDialog(false)}>
                취소
              </Button>
              <Button type="submit">저장</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* FAQ 다이얼로그 */}
      <Dialog open={faqDialog} onOpenChange={setFaqDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem?.id ? "FAQ 수정" : "FAQ 추가"}</DialogTitle>
            <DialogDescription>
              FAQ 정보를 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <form action={handleSaveFaq}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="question">질문 *</Label>
                <Input
                  id="question"
                  name="question"
                  defaultValue={editingItem?.question}
                  required
                />
              </div>
              <div>
                <Label htmlFor="answer">답변 *</Label>
                <Textarea
                  id="answer"
                  name="answer"
                  defaultValue={editingItem?.answer}
                  rows={5}
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">카테고리</Label>
                <Select name="category" defaultValue={editingItem?.category || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">일반</SelectItem>
                    <SelectItem value="account">계정</SelectItem>
                    <SelectItem value="budget">예산관리</SelectItem>
                    <SelectItem value="purchase">구매요청</SelectItem>
                    <SelectItem value="refund">환급신청</SelectItem>
                    <SelectItem value="program">프로그램</SelectItem>
                    <SelectItem value="certificate">확인서</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sort_order">정렬 순서</Label>
                <Input
                  id="sort_order"
                  name="sort_order"
                  type="number"
                  defaultValue={editingItem?.sort_order || 0}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_published"
                  name="is_published"
                  defaultChecked={editingItem?.is_published}
                  value="true"
                  className="w-4 h-4"
                />
                <Label htmlFor="is_published" className="cursor-pointer">
                  게시 (공개)
                </Label>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setFaqDialog(false)}>
                취소
              </Button>
              <Button type="submit">저장</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 공지사항 다이얼로그 */}
      <Dialog open={noticeDialog} onOpenChange={setNoticeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem?.id ? "공지사항 수정" : "공지사항 추가"}</DialogTitle>
            <DialogDescription>
              공지사항 정보를 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <form action={handleSaveNotice}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">제목 *</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={editingItem?.title}
                  required
                />
              </div>
              <div>
                <Label htmlFor="content">내용 *</Label>
                <Textarea
                  id="content"
                  name="content"
                  defaultValue={editingItem?.content}
                  rows={8}
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">카테고리</Label>
                <Select name="category" defaultValue={editingItem?.category || "general"}>
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">일반</SelectItem>
                    <SelectItem value="maintenance">시스템</SelectItem>
                    <SelectItem value="urgent">긴급</SelectItem>
                    <SelectItem value="event">이벤트</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_important"
                    name="is_important"
                    defaultChecked={editingItem?.is_important}
                    value="true"
                    className="w-4 h-4"
                  />
                  <Label htmlFor="is_important" className="cursor-pointer">
                    중요 공지
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_published"
                    name="is_published"
                    defaultChecked={editingItem?.is_published}
                    value="true"
                    className="w-4 h-4"
                  />
                  <Label htmlFor="is_published" className="cursor-pointer">
                    즉시 게시
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setNoticeDialog(false)}>
                취소
              </Button>
              <Button type="submit">저장</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 서류 양식 다이얼로그 */}
      <Dialog open={templateDialog} onOpenChange={setTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem?.id ? "서류 양식 수정" : "서류 양식 추가"}</DialogTitle>
            <DialogDescription>
              서류 양식 정보를 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <form action={handleSaveTemplate}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">제목 *</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={editingItem?.title}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingItem?.description}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="category">카테고리</Label>
                <Select name="category" defaultValue={editingItem?.category || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="budget">예산관리</SelectItem>
                    <SelectItem value="purchase">구매요청</SelectItem>
                    <SelectItem value="refund">환급신청</SelectItem>
                    <SelectItem value="program">프로그램</SelectItem>
                    <SelectItem value="certificate">확인서</SelectItem>
                    <SelectItem value="general">일반</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="version">버전</Label>
                <Input
                  id="version"
                  name="version"
                  defaultValue={editingItem?.version || ""}
                  placeholder="예: v1.0"
                />
              </div>
              <div>
                <Label htmlFor="sort_order">정렬 순서</Label>
                <Input
                  id="sort_order"
                  name="sort_order"
                  type="number"
                  defaultValue={editingItem?.sort_order || 0}
                />
              </div>
              <div>
                <Label htmlFor="file">파일 {editingItem?.id ? "(새 파일만 업로드 시 변경)" : "*"}</Label>
                <Input
                  id="file"
                  name="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.hwp,.ppt,.pptx"
                  required={!editingItem?.id}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  defaultChecked={editingItem?.is_active !== false}
                  value="true"
                  className="w-4 h-4"
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  활성 (다운로드 가능)
                </Label>
              </div>
              {/* 히든 필드 */}
              <input type="hidden" name="file_url" value={editingItem?.file_url || ""} />
              <input type="hidden" name="file_name" value={editingItem?.file_name || ""} />
              <input type="hidden" name="file_size" value={editingItem?.file_size?.toString() || ""} />
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setTemplateDialog(false)}>
                취소
              </Button>
              <Button type="submit">저장</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
