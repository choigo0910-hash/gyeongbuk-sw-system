"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

interface SystemSettings {
  id: string
  key: string
  value: string
  description: string | null
  updated_at: string
}

export default function AdminSettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 시스템 설정 상태
  const [systemSettings, setSystemSettings] = useState<Record<string, string>>({})
  const [siteName, setSiteName] = useState("경북 SW 성장기업지원사업")
  const [siteDescription, setSiteDescription] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")

  // 알림 설정 상태
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [botNotifications, setBotNotifications] = useState(true)

  // Tabs 상태
  const [activeTab, setActiveTab] = useState("site")

  // 자동 알림 발송 기준 상태
  const [notifyOnSubmit, setNotifyOnSubmit] = useState(true)
  const [notifyAdminOnSubmit, setNotifyAdminOnSubmit] = useState(true)
  const [notifyOnReview, setNotifyOnReview] = useState(true)
  const [notifyBeforeDeadline, setNotifyBeforeDeadline] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      // 기본 설정 값 로드 (실제로는 DB나 설정 파일에서 가져와야 함)
      setSiteName("경북 SW 성장기업지원사업")
      setSiteDescription("경북 SW 성장기업육성지원사업 통합 관리 시스템")
      setContactEmail("support@example.com")
      setContactPhone("054-XXX-XXXX")
    } catch (error) {
      console.error("설정 조회 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSiteSettings = async () => {
    setSaving(true)
    try {
      // 실제로는 DB에 저장하는 로직 필요
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert("사이트 설정이 저장되었습니다.")
    } catch (error) {
      console.error("설정 저장 실패:", error)
      alert("저장에 실패했습니다.")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotificationSettings = async () => {
    setSaving(true)
    try {
      // 실제로는 DB에 저장하는 로직 필요
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert("알림 설정이 저장되었습니다.")
    } catch (error) {
      console.error("설정 저장 실패:", error)
      alert("저장에 실패했습니다.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">시스템 설정</h1>
          <p className="text-muted-foreground">시스템 전체 설정을 관리합니다</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="site">사이트 설정</TabsTrigger>
          <TabsTrigger value="notifications">알림 설정</TabsTrigger>
          <TabsTrigger value="system">시스템 정보</TabsTrigger>
        </TabsList>

        {/* 사이트 설정 */}
        <TabsContent value="site" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>사이트 기본 정보</CardTitle>
              <CardDescription>
                사이트의 기본 정보를 설정합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="siteName">사이트명</Label>
                <Input
                  id="siteName"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="사이트 이름"
                />
              </div>
              <div>
                <Label htmlFor="siteDescription">사이트 설명</Label>
                <Textarea
                  id="siteDescription"
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                  placeholder="사이트에 대한 설명"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactEmail">연락처 이메일</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contact@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="contactPhone">연락처 전화번호</Label>
                  <Input
                    id="contactPhone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="054-XXX-XXXX"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveSiteSettings} disabled={saving}>
                  {saving ? "저장 중..." : "저장"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>사이트 바닥글 정보</CardTitle>
              <CardDescription>
                사이트 하단에 표시될 정보를 설정합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="footerAddress">주소</Label>
                <Input
                  id="footerAddress"
                  placeholder="경북도청 주소"
                  defaultValue="경상북도..."
                />
              </div>
              <div>
                <Label htmlFor="footerCopyright">저작권 정보</Label>
                <Input
                  id="footerCopyright"
                  placeholder="© 2026 경북 SW 성장기업지원사업"
                  defaultValue="© 2026 경북 SW 성장기업지원사업 All rights reserved."
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveSiteSettings} disabled={saving}>
                  {saving ? "저장 중..." : "저장"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 알림 설정 */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>알림 기능 설정</CardTitle>
              <CardDescription>
                각 알림 기능을 활성화하거나 비활성화합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotif">이메일 알림</Label>
                  <p className="text-sm text-muted-foreground">
                    중요 알림을 이메일로 발송합니다
                  </p>
                </div>
                <Switch
                  id="emailNotif"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="smsNotif">SMS 알림</Label>
                  <p className="text-sm text-muted-foreground">
                    긴급 알림을 SMS로 발송합니다
                  </p>
                </div>
                <Switch
                  id="smsNotif"
                  checked={smsNotifications}
                  onCheckedChange={setSmsNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="botNotif">챗봇 알림</Label>
                  <p className="text-sm text-muted-foreground">
                    시스템 알림을 챗봇을 통해 전송합니다
                  </p>
                </div>
                <Switch
                  id="botNotif"
                  checked={botNotifications}
                  onCheckedChange={setBotNotifications}
                />
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveNotificationSettings} disabled={saving}>
                  {saving ? "저장 중..." : "저장"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>자동 알림 발송 기준</CardTitle>
              <CardDescription>
                특정 상황에서 자동으로 발송되는 알림을 설정합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>신청 접수 시</Label>
                <div className="flex items-center gap-2">
                  <Switch checked={notifyOnSubmit} onCheckedChange={setNotifyOnSubmit} />
                  <span className="text-sm text-muted-foreground">신청자에게 알림 발송</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={notifyAdminOnSubmit} onCheckedChange={setNotifyAdminOnSubmit} />
                  <span className="text-sm text-muted-foreground">관리자에게 알림 발송</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>검토 완료 시</Label>
                <div className="flex items-center gap-2">
                  <Switch checked={notifyOnReview} onCheckedChange={setNotifyOnReview} />
                  <span className="text-sm text-muted-foreground">신청자에게 결과 알림</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>마감 임박 시</Label>
                <div className="flex items-center gap-2">
                  <Switch checked={notifyBeforeDeadline} onCheckedChange={setNotifyBeforeDeadline} />
                  <span className="text-sm text-muted-foreground">
                    프로그램 신청 마감 3일 전 알림
                  </span>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveNotificationSettings} disabled={saving}>
                  {saving ? "저장 중..." : "저장"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 시스템 정보 */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>시스템 정보</CardTitle>
              <CardDescription>
                현재 시스템의 기본 정보를 확인합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">버전</dt>
                  <dd className="text-lg font-semibold">1.0.0</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">환경</dt>
                  <dd>
                    <Badge variant="secondary">Development</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">프레임워크</dt>
                  <dd>Next.js 16</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">데이터베이스</dt>
                  <dd>Supabase (PostgreSQL)</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">배포</dt>
                  <dd>Vercel</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">마지막 업데이트</dt>
                  <dd>2026-07-12</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>데이터베이스 상태</CardTitle>
              <CardDescription>
                주요 테이블의 레코드 수를 확인합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>사용자</span>
                  <Badge variant="outline">조회 필요</Badge>
                </div>
                <div className="flex justify-between">
                  <span>기업</span>
                  <Badge variant="outline">조회 필요</Badge>
                </div>
                <div className="flex justify-between">
                  <span>예산서</span>
                  <Badge variant="outline">조회 필요</Badge>
                </div>
                <div className="flex justify-between">
                  <span>구매요청</span>
                  <Badge variant="outline">조회 필요</Badge>
                </div>
                <div className="flex justify-between">
                  <span>환급신청</span>
                  <Badge variant="outline">조회 필요</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
