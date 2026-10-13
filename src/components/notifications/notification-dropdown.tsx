"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import Link from "next/link"
import { getUnreadCount, getUserNotifications, markAsRead, markAllAsRead } from "@/lib/notifications"
import type { Notification } from "@/types/database"

export function NotificationDropdown() {
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user && isOpen) {
      fetchNotifications()
    }
  }, [isOpen, user])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      // 안읽은 알림 수 조회
      const count = await getUnreadCount(user.id)
      setUnreadCount(count)
    }
  }

  const fetchNotifications = async () => {
    if (!user) return

    setLoading(true)
    try {
      const data = await getUserNotifications(user.id, false)
      setNotifications(data)

      // 안읽은 알림 수 업데이트
      const unread = await getUnreadCount(user.id)
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
    if (!user) return
    await markAllAsRead(user.id)
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
    )
    setUnreadCount(0)
  }

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      "budget_submitted": <FileText className="w-4 h-4 text-blue-600" />,
      "budget_reviewed": <FileText className="w-4 h-4 text-blue-600" />,
      "budget_approved": <Check className="w-4 h-4 text-green-600" />,
      "budget_rejected": <X className="w-4 h-4 text-red-600" />,
      "purchase_submitted": <ShoppingCart className="w-4 h-4 text-purple-600" />,
      "purchase_approved": <Check className="w-4 h-4 text-green-600" />,
      "purchase_rejected": <X className="w-4 h-4 text-red-600" />,
      "purchase_proof_approved": <Check className="w-4 h-4 text-green-600" />,
      "purchase_proof_rejected": <X className="w-4 h-4 text-red-600" />,
      "refund_submitted": <RefreshCw className="w-4 h-4 text-teal-600" />,
      "refund_approved": <Check className="w-4 h-4 text-green-600" />,
      "refund_rejected": <X className="w-4 h-4 text-red-600" />,
      "refund_paid": <RefreshCw className="w-4 h-4 text-green-600" />,
      "program_published": <Calendar className="w-4 h-4 text-orange-600" />,
      "program_application_approved": <Check className="w-4 h-4 text-green-600" />,
      "program_application_rejected": <X className="w-4 h-4 text-red-600" />,
      "program_starting_soon": <Calendar className="w-4 h-4 text-orange-600" />,
      "certificate_issued": <Award className="w-4 h-4 text-indigo-600" />,
      "system_notice": <AlertCircle className="w-4 h-4 text-gray-600" />,
    }
    return icons[type] || <Bell className="w-4 h-4 text-gray-600" />
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "방금 전"
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    if (diffDays < 7) return `${diffDays}일 전`
    return date.toLocaleDateString("ko-KR")
  }

  if (!user) {
    return null
  }

  return (
    <div className="relative">
      {/* 알림 버튼 */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge
            className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {/* 알림 드롭다운 */}
      {isOpen && (
        <>
          {/* 백드롭 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* 드롭다운 내용 */}
          <Card className="absolute right-0 top-12 w-80 max-h-[500px] z-50 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">알림</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs"
                >
                  <CheckCheck className="w-4 h-4 mr-1" />
                  모두 읽음
                </Button>
              )}
            </div>

            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm text-gray-500">로딩 중...</p>
                </div>
              ) : notifications.length > 0 ? (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.is_read ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <Link
                        href={notification.link || "#"}
                        onClick={() => {
                          if (!notification.is_read) {
                            handleMarkAsRead(notification.id)
                          }
                          setIsOpen(false)
                        }}
                        className="block"
                      >
                        <div className="flex items-start gap-3">
                          <div className="shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium truncate">
                                {notification.title}
                              </p>
                              {!notification.is_read && (
                                <Badge variant="secondary" className="shrink-0">
                                  새 알림
                                </Badge>
                              )}
                            </div>
                            {notification.content && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {notification.content}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTime(notification.created_at)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Bell className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">알림이 없습니다</p>
                </div>
              )}
            </ScrollArea>

            {notifications.length > 0 && (
              <div className="p-4 border-t">
                <Link
                  href="/portal/notifications"
                  onClick={() => setIsOpen(false)}
                  className="block text-center text-sm text-blue-600 hover:text-blue-700"
                >
                  모든 알림 보기
                </Link>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
