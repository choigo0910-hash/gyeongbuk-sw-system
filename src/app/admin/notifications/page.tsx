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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Mail,
  Bell,
  Send,
  Edit,
  Trash2,
  Check,
  X,
} from "lucide-react"
import type { EmailTemplate, Notification } from "@/types/database"

export default function AdminNotificationsPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState("templates")
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(0)

  // 데이터 상태
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])

  // 다이얼로그 상태
  const [templateDialog, setTemplateDialog] = useState(false)
  const [sendNotificationDialog, setSendNotificationDialog] = useState(false)

  // 편집 상태
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)

  useEffect(() => {
    fetchData()
  }, [refresh])

  const fetchData = async () => {
    setLoading(true)
    try {
      // 이메일 템플릿 조회
      const { data: templatesData } = await supabase
        .from("email_templates")
        .select("*")
        .is("deleted_at", null)
        .order("template_key", { ascending: true })

      if (templatesData) setTemplates(templatesData)

      // 최근 알림 조회 (auth.users는 PostgREST 노출 스키마 밖 — 임베드 제거)
      const { data: notificationsData } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)

      if (notificationsData) setNotifications(notificationsData as any[])
    } catch (error) {
      console.error("알림 데이터 조회 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  // 템플릿 CRUD
  const handleSaveTemplate = async (formData: FormData) => {
    try {
      const data = {
        template_key: formData.get("template_key") as string,
        subject: formData.get("subject") as string,
        body: formData.get("body") as string,
        description: formData.get("description") as string,
        is_active: formData.get("is_active") === "true",
      }

      if (editingTemplate?.id) {
        await supabase.from("email_templates").update(data).eq("id", editingTemplate.id)
      } else {
        await supabase.from("email_templates").insert(data)
      }

      setTemplateDialog(false)
      setEditingTemplate(null)
      setRefresh(refresh + 1)
    } catch (error) {
      console.error("템플릿 저장 실패:", error)
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return
    try {
      await supabase.from("email_templates").update({ deleted_at: new Date().toISOString() }).eq("id", id)
      setRefresh(refresh + 1)
    } catch (error) {
      console.error("템플릿 삭제 실패:", error)
    }
  }

  const handleSendNotification = async (formData: FormData) => {
    // 실제로는 API 라우트를 통해 발송해야 합니다
    alert("알림 발송 기능은 API 라우트 구현 후 사용 가능합니다.")
    setSendNotificationDialog(false)
  }

  const openTemplateDialog = (template?: EmailTemplate) => {
    setEditingTemplate(template || {
      template_key: "",
      subject: "",
      body: "",
      description: "",
      is_active: true,
      created_at: "",
      updated_at: "",
    } as EmailTemplate)
    setTemplateDialog(true)
  }

  const getTemplateLabel = (key: string) => {
    const labels: Record<string, string> = {
      "budget_reviewed": "예산 검토 완료",
      "budget_approved": "예산 승인",
      "budget_rejected": "예산 반려",
      "purchase_approved": "구매 승인",
      "purchase_rejected": "구매 반려",
      "refund_approved": "환급 승인",
      "refund_paid": "환급금 지급",
      "program_published": "새로운 프로그램",
      "program_application_approved": "프로그램 참가 승인",
      "certificate_issued": "확인서 발급",
      "system_notice": "시스템 공지",
    }
    return labels[key] || key
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
        <h1 className="text-2xl font-bold text-gray-900">알림 관리</h1>
        <p className="text-gray-600 mt-1">
          이메일 템플릿과 알림 현황을 관리하세요
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="templates">이메일 템플릿</TabsTrigger>
          <TabsTrigger value="history">알림 히스토리</TabsTrigger>
          <TabsTrigger value="send">알림 발송</TabsTrigger>
        </TabsList>

        {/* 템플릿 관리 */}
        <TabsContent value="templates">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => openTemplateDialog()}>
                <Mail className="w-4 h-4 mr-2" />
                템플릿 추가
              </Button>
            </div>

            <div className="grid gap-4">
              {templates.map((template) => (
                <Card key={template.id} className={!template.is_active ? "opacity-60" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{getTemplateLabel(template.template_key)}</CardTitle>
                        <CardDescription className="text-xs font-mono mt-1">
                          {template.template_key}
                        </CardDescription>
                      </div>
                      <Badge variant={template.is_active ? "default" : "secondary"}>
                        {template.is_active ? "활성" : "비활성"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">제목</p>
                      <p className="text-sm text-gray-600">{template.subject}</p>
                    </div>
                    {template.description && (
                      <div>
                        <p className="text-sm font-medium">설명</p>
                        <p className="text-sm text-gray-600">{template.description}</p>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => openTemplateDialog(template)}>
                        <Edit className="w-3 h-3 mr-1" />
                        수정
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteTemplate(template.id)}>
                        <Trash2 className="w-3 h-3 mr-1" />
                        삭제
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* 알림 히스토리 */}
        <TabsContent value="history">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">전체 알림</h3>
                <p className="text-sm text-gray-500">최근 100개</p>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{notification.title}</p>
                            <Badge variant={notification.is_read ? "secondary" : "default"} className="text-xs">
                              {notification.is_read ? "읽음" : "안읽음"}
                            </Badge>
                            {notification.sent_email && (
                              <Badge variant="outline" className="text-xs">
                                <Mail className="w-3 h-3 mr-1" />
                                이메일 전송
                              </Badge>
                            )}
                          </div>
                          {notification.content && (
                            <p className="text-sm text-gray-600 mb-2">{notification.content}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>유형: {notification.type}</span>
                            <span>생성: {formatDateTime(notification.created_at)}</span>
                            {notification.read_at && (
                              <span>읽음: {formatDateTime(notification.read_at)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <p className="text-center text-gray-500 py-8">알림 히스토리가 없습니다</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 알림 발송 */}
        <TabsContent value="send">
          <Card>
            <CardHeader>
              <CardTitle>전체 알림 발송</CardTitle>
              <CardDescription>
                시스템 공지사항 등을 전체 사용자에게 발송합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Bell className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-blue-900">시스템 공지 발송</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        전체 사용자 또는 특정 그룹에게 알림을 발송할 수 있습니다.
                      </p>
                    </div>
                  </div>
                </div>

                <Button onClick={() => setSendNotificationDialog(true)}>
                  <Send className="w-4 h-4 mr-2" />
                  알림 발송하기
                </Button>

                {/* 발송 가이드 */}
                <div className="space-y-2 text-sm text-gray-600">
                  <h4 className="font-medium">발송 가능한 알림 유형</h4>
                  <ul className="space-y-1 pl-4">
                    <li>• 시스템 공지사항 (전체 사용자)</li>
                    <li>• 프로그램 오픈 안내 (전체 사용자)</li>
                    <li>• 긴급 장애 안내 (전체 사용자)</li>
                    <li>• 기업 사용자 그룹별 알림</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 템플릿 추가/수정 다이얼로그 */}
      <Dialog open={templateDialog} onOpenChange={setTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTemplate?.id ? "템플릿 수정" : "템플릿 추가"}</DialogTitle>
            <DialogDescription>
              이메일 템플릿을 설정하세요. {'{변수}'} 형태로 동적 값을 사용할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <form action={handleSaveTemplate}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="template_key">템플릿 키 *</Label>
                <Input
                  id="template_key"
                  name="template_key"
                  defaultValue={editingTemplate?.template_key}
                  placeholder="예: budget_approved"
                  required
                />
              </div>
              <div>
                <Label htmlFor="subject">제목 *</Label>
                <Input
                  id="subject"
                  name="subject"
                  defaultValue={editingTemplate?.subject}
                  placeholder="예: 예산서 승인 완료"
                  required
                />
              </div>
              <div>
                <Label htmlFor="body">내용 *</Label>
                <Textarea
                  id="body"
                  name="body"
                  defaultValue={editingTemplate?.body}
                  rows={10}
                  className="font-mono text-sm"
                  placeholder="<h2>안녕하세요 {{user_name}}님</h2>..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  HTML 태그 사용 가능. 변수: {"{{user_name}}"}, {"{{budget_link}}"} 등
                </p>
              </div>
              <div>
                <Label htmlFor="description">설명</Label>
                <Input
                  id="description"
                  name="description"
                  defaultValue={editingTemplate?.description || ""}
                  placeholder="예: 예산서 승인 시 발송"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  defaultChecked={editingTemplate?.is_active !== false}
                  value="true"
                  className="w-4 h-4"
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  활성 (사용)
                </Label>
              </div>
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

      {/* 알림 발송 다이얼로그 */}
      <Dialog open={sendNotificationDialog} onOpenChange={setSendNotificationDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>전체 알림 발송</DialogTitle>
            <DialogDescription>
              시스템 공지사항을 전체 사용자에게 발송합니다.
            </DialogDescription>
          </DialogHeader>
          <form action={handleSendNotification}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="notify_title">제목 *</Label>
                <Input
                  id="notify_title"
                  name="title"
                  placeholder="예: 시스템 점검 안내"
                  required
                />
              </div>
              <div>
                <Label htmlFor="notify_content">내용 *</Label>
                <Textarea
                  id="notify_content"
                  name="content"
                  rows={5}
                  placeholder="알림 내용을 입력하세요"
                  required
                />
              </div>
              <div>
                <Label htmlFor="notify_link">관련 링크 (선택)</Label>
                <Input
                  id="notify_link"
                  name="link"
                  placeholder="예: /portal/guidelines"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="send_email_also"
                  name="send_email"
                  className="w-4 h-4"
                />
                <Label htmlFor="send_email_also" className="cursor-pointer">
                  이메일도 함께 발송
                </Label>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setSendNotificationDialog(false)}>
                취소
              </Button>
              <Button type="submit">발송</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
