"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  getNotificationSettings,
  updateNotificationSetting,
  initializeNotificationSettings,
} from "@/lib/notifications"
import type { NotificationSetting } from "@/types/database"
import { Loader2 } from "lucide-react"

// 알림 카테고리 정의
const NOTIFICATION_CATEGORIES = {
  budget: {
    label: "예산 관리",
    icon: "📊",
    settings: [
      { key: "budget_submitted", label: "예산서 제출 완료", description: "예산서를 제출했을 때 알림" },
      { key: "budget_reviewed", label: "예산 검토 완료", description: "예산 검토가 완료되었을 때 이메일" },
      { key: "budget_approved", label: "예산 승인", description: "예산이 승인되었을 때 이메일" },
      { key: "budget_rejected", label: "예산 반려", description: "예산이 반려되었을 때 이메일" },
    ],
  },
  purchase: {
    label: "구매 요청",
    icon: "🛒",
    settings: [
      { key: "purchase_submitted", label: "구매요청 제출 완료", description: "구매요청을 제출했을 때 알림" },
      { key: "purchase_approved", label: "구매 승인", description: "구매가 승인되었을 때 이메일" },
      { key: "purchase_rejected", label: "구매 반려", description: "구매가 반려되었을 때 이메일" },
      { key: "purchase_proof_approved", label: "증빙 승인", description: "증빙서류가 승인되었을 때 이메일" },
      { key: "purchase_proof_rejected", label: "증빙 반려", description: "증빙서류가 반려되었을 때 이메일" },
    ],
  },
  refund: {
    label: "환급 신청",
    icon: "💰",
    settings: [
      { key: "refund_submitted", label: "환급신청 제출 완료", description: "환급신청을 제출했을 때 알림" },
      { key: "refund_approved", label: "환급 승인", description: "환급이 승인되었을 때 이메일" },
      { key: "refund_rejected", label: "환급 반려", description: "환급이 반려되었을 때 이메일" },
      { key: "refund_paid", label: "환급금 지급", description: "환급금이 지급되었을 때 이메일" },
    ],
  },
  program: {
    label: "프로그램",
    icon: "📅",
    settings: [
      { key: "program_notifications", label: "프로그램 알림", description: "모든 프로그램 관련 알림 (오픈, 승인, 반려, 시작 안내 등)" },
    ],
  },
  certificate: {
    label: "확인서",
    icon: "📜",
    settings: [
      { key: "certificate_issued", label: "확인서 발급", description: "확인서가 발급되었을 때 이메일" },
    ],
  },
  system: {
    label: "시스템",
    icon: "🔔",
    settings: [
      { key: "system_notice", label: "시스템 공지", description: "중요 공지사항 알림" },
    ],
  },
}

export default function NotificationSettingsPage() {
  const supabase = createClient()
  const [settings, setSettings] = useState<NotificationSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [notificationEmail, setNotificationEmail] = useState<string>("")

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      setNotificationEmail(user.email || "")
      await fetchSettings(user.id)
    }
  }

  const fetchSettings = async (userId: string) => {
    setLoading(true)
    try {
      let userSettings = await getNotificationSettings(userId)

      // 설정이 없으면 기본 설정 생성
      if (userSettings.length === 0) {
        await initializeNotificationSettings(userId)
        userSettings = await getNotificationSettings(userId)
      }

      setSettings(userSettings)
    } catch (error) {
      console.error("알림 설정 조회 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  const getSetting = (settingKey: string, notificationType: "email" | "in_app"): boolean => {
    const setting = settings.find(
      (s) => s.setting_key === settingKey && s.notification_type === notificationType
    )
    // 설정이 없으면 기본값 반환 (이메일은 false, 앱은 true)
    if (!setting) {
      return notificationType === "in_app"
    }
    return setting.is_enabled
  }

  const handleToggle = async (
    settingKey: string,
    notificationType: "email" | "in_app",
    isEnabled: boolean
  ) => {
    if (!user) return

    setSaving(settingKey)

    try {
      await updateNotificationSetting(user.id, settingKey, notificationType, isEnabled)

      // 로컬 상태 업데이트 (기존 설정이 있는 경우 수정)
      const existingIndex = settings.findIndex(
        (s) => s.setting_key === settingKey && s.notification_type === notificationType
      )

      if (existingIndex >= 0) {
        // 기존 설정 업데이트
        setSettings((prev) =>
          prev.map((s, idx) =>
            idx === existingIndex
              ? { ...s, is_enabled: isEnabled }
              : s
          )
        )
      } else {
        // 새 설정 추가
        setSettings((prev) => [
          ...prev,
          {
            id: `${settingKey}-${notificationType}`,
            user_id: user.id,
            setting_key: settingKey,
            notification_type: notificationType,
            is_enabled: isEnabled,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ])
      }
    } catch (error) {
      console.error("알림 설정 업데이트 실패:", error)
    } finally {
      setSaving(null)
    }
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
        <h1 className="text-2xl font-bold text-gray-900">알림 설정</h1>
        <p className="text-gray-600 mt-1">
          받고 싶은 알림을 선택하세요
        </p>
      </div>

      {/* 알림 수신 이메일 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>알림 수신 이메일</CardTitle>
          <CardDescription>
            알림을 받을 이메일 주소를 설정하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Checkbox
                id="use-account-email"
                checked={notificationEmail === user?.email}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setNotificationEmail(user?.email || "")
                  }
                }}
              />
              <label htmlFor="use-account-email" className="text-sm cursor-pointer">
                계정 이메일 사용 ({user?.email})
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="use-custom-email"
                checked={notificationEmail !== user?.email && notificationEmail !== ""}
                onCheckedChange={(checked) => {
                  if (checked && notificationEmail === user?.email) {
                    setNotificationEmail("")
                  } else if (!checked) {
                    setNotificationEmail(user?.email || "")
                  }
                }}
              />
              <Input
                type="email"
                value={notificationEmail !== user?.email ? notificationEmail : ""}
                onChange={(e) => setNotificationEmail(e.target.value)}
                placeholder="별도 이메일 주소 입력"
                disabled={notificationEmail === user?.email}
                className="flex-1 max-w-md"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Badge variant={notificationEmail ? "default" : "secondary"}>
              {notificationEmail ? "설정됨" : "미설정"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              현재: {notificationEmail || "이메일이 설정되지 않았습니다"}
            </span>
          </div>

          <Button
            onClick={async () => {
              if (!notificationEmail) {
                alert("이메일을 입력해주세요.")
                return
              }
              // TODO: 저장 로직 구현 필요
              alert("알림 수신 이메일이 저장되었습니다.")
            }}
            disabled={saving === "email"}
            size="sm"
          >
            {saving === "email" ? "저장 중..." : "이메일 저장"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {Object.entries(NOTIFICATION_CATEGORIES).map(([categoryKey, category]) => (
          <Card key={categoryKey}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{category.icon}</span>
                <div>
                  <CardTitle className="text-lg">{category.label}</CardTitle>
                  <CardDescription>
                    {category.label} 관련 알림 설정
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {category.settings.map((setting) => (
                <div
                  key={setting.key}
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{setting.label}</h4>
                    <p className="text-sm text-gray-500">{setting.description}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* 이메일 알림 */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">이메일</span>
                      <Switch
                        checked={getSetting(setting.key, "email")}
                        onCheckedChange={(checked) =>
                          handleToggle(setting.key, "email", checked)
                        }
                        disabled={saving === setting.key}
                      />
                      {saving === setting.key && (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      )}
                    </div>
                    {/* 인앱 알림 */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">앱</span>
                      <Switch
                        checked={getSetting(setting.key, "in_app")}
                        onCheckedChange={(checked) =>
                          handleToggle(setting.key, "in_app", checked)
                        }
                        disabled={saving === setting.key}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 안내 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h4 className="font-medium text-blue-900">알림 설정 안내</h4>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• 이메일: 해당 이벤트 발생 시 이메일로 알림을 받습니다</li>
                <li>• 앱: 우측 상단 알림 아이콘으로 알림을 받습니다</li>
                <li>• 중요한 알림(승인/반려 등)은 기본적으로 이메일로 발송됩니다</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
