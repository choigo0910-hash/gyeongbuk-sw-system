"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getUserNotifications, markAsRead, markAllAsRead } from "@/lib/notifications"
import Link from "next/link"
import {
  Bell,
  Check,
  CheckCheck,
  FileText,
  ShoppingCart,
  RefreshCw,
  Calendar,
  Award,
  AlertCircle,
  X,
} from "lucide-react"
import type { Notification } from "@/types/database"

export default function NotificationsPage() {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread">("all")

  useEffect(() => {
    fetchNotifications()
  }, [filter])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const data = await getUserNotifications(user.id, filter === "unread")
      setNotifications(data)

      // 안읽은 알림 수
      const unread = data.filter((n) => !n.is_read).length
      setUnreadCount(unread)
    } catch (error) {
      console.error("알림 조회 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId)
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
      )
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const handleMarkAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await markAllAsRead(user.id)
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
    )
    setUnreadCount(0)
  }

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      "budget_submitted": <FileText className="w-5 h-5 text-blue-600" />,
      "budget_reviewed": <FileText className="w-5 h-5 text-blue-600" />,
      "budget_approved": <Check className="w-5 h-5 text-green-600" />,
      "budget_rejected": <X className="w-5 h-5 text-red-600" />,
      "purchase_submitted": <ShoppingCart className="w-5 h-5 text-purple-600" />,
      "purchase_approved": <Check className="w-5 h-5 text-green-600" />,
      "purchase_rejected": <X className="w-5 h-5 text-red-600" />,
      "purchase_proof_approved": <Check className="w-5 h-5 text-green-600" />,
      "purchase_proof_rejected": <X className="w-5 h-5 text-red-600" />,
      "refund_submitted": <RefreshCw className="w-5 h-5 text-teal-600" />,
      "refund_approved": <Check className="w-5 h-5 text-green-600" />,
      "refund_rejected": <X className="w-5 h-5 text-red-600" />,
      "refund_paid": <RefreshCw className="w-5 h-5 text-green-600" />,
      "program_published": <Calendar className="w-5 h-5 text-orange-600" />,
      "program_application_approved": <Check className="w-5 h-5 text-green-600" />,
      "program_application_rejected": <X className="w-5 h-5 text-red-600" />,
      "program_starting_soon": <Calendar className="w-5 h-5 text-orange-600" />,
      "certificate_issued": <Award className="w-5 h-5 text-indigo-600" />,
      "system_notice": <AlertCircle className="w-5 h-5 text-gray-600" />,
    }
    return icons[type] || <Bell className="w-5 h-5 text-gray-600" />
  }

  const getCategoryLabel = (type: string) => {
    const labels: Record<string, string> = {
      "budget_submitted": "예산",
      "budget_reviewed": "예산",
      "budget_approved": "예산",
      "budget_rejected": "예산",
      "purchase_submitted": "구매",
      "purchase_approved": "구매",
      "purchase_rejected": "구매",
      "purchase_proof_approved": "구매",
      "purchase_proof_rejected": "구매",
      "refund_submitted": "환급",
      "refund_approved": "환급",
      "refund_rejected": "환급",
      "refund_paid": "환급",
      "program_published": "프로그램",
      "program_application_approved": "프로그램",
      "program_application_rejected": "프로그램",
      "program_starting_soon": "프로그램",
      "certificate_issued": "확인서",
      "system_notice": "시스템",
    }
    return labels[type] || "알림"
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">알림</h1>
          <p className="text-gray-600 mt-1">
            시스템 알림을 확인하세요
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline">
            <CheckCheck className="w-4 h-4 mr-2" />
            모두 읽음 표시
          </Button>
        )}
      </div>

      {/* 필터 */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          전체 ({notifications.length})
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("unread")}
        >
          안읽은 ({unreadCount})
        </Button>
      </div>

      {/* 알림 목록 */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-gray-500">로딩 중...</p>
          </CardContent>
        </Card>
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={!notification.is_read ? "border-blue-200 bg-blue-50/30" : ""}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {!notification.is_read && (
                          <Badge variant="default" className="text-xs">
                            새 알림
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {getCategoryLabel(notification.type)}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDateTime(notification.created_at)}
                      </span>
                    </div>

                    {notification.link ? (
                      <Link
                        href={notification.link}
                        onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                        className="block"
                      >
                        <h3 className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                          {notification.title}
                        </h3>
                        {notification.content && (
                          <p className="text-sm text-gray-600 mt-1">{notification.content}</p>
                        )}
                      </Link>
                    ) : (
                      <>
                        <h3 className="font-medium text-gray-900">{notification.title}</h3>
                        {notification.content && (
                          <p className="text-sm text-gray-600 mt-1">{notification.content}</p>
                        )}
                      </>
                    )}
                  </div>

                  {!notification.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bell className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">알림이 없습니다</p>
            <Link href="/portal/dashboard">
              <Button variant="outline" size="sm">
                대시보드로 이동
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
