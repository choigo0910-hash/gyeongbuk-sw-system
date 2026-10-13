/**
 * 알림 관련 함수
 */

import { createClient } from "./supabase/client"
import type { Notification, NotificationSetting } from "@/types/database"

// 알림 타입 정의
export const NOTIFICATION_TYPES = {
  // 예산
  BUDGET_SUBMITTED: "budget_submitted",
  BUDGET_REVIEWED: "budget_reviewed",
  BUDGET_APPROVED: "budget_approved",
  BUDGET_REJECTED: "budget_rejected",
  // 구매요청
  PURCHASE_SUBMITTED: "purchase_submitted",
  PURCHASE_REVIEWING: "purchase_reviewing",
  PURCHASE_APPROVED: "purchase_approved",
  PURCHASE_REJECTED: "purchase_rejected",
  PURCHASE_PROOF_APPROVED: "purchase_proof_approved",
  PURCHASE_PROOF_REJECTED: "purchase_proof_rejected",
  // 환급
  REFUND_SUBMITTED: "refund_submitted",
  REFUND_APPROVED: "refund_approved",
  REFUND_REJECTED: "refund_rejected",
  REFUND_PAID: "refund_paid",
  // 프로그램 (통합)
  PROGRAM_NOTIFICATIONS: "program_notifications",
  // 확인서
  CERTIFICATE_ISSUED: "certificate_issued",
  // 기업 서류
  DOCUMENT_APPROVED: "document_approved",
  DOCUMENT_REJECTED: "document_rejected",
  // 시스템
  SYSTEM_NOTICE: "system_notice",
} as const

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES]

/**
 * 알림 생성
 */
export async function createNotification(params: {
  userId: string
  type: NotificationType
  title: string
  content?: string
  link?: string
  metadata?: Record<string, any>
}): Promise<Notification | null> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        content: params.content || null,
        link: params.link || null,
        metadata: params.metadata || {},
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("알림 생성 실패:", error)
    return null
  }
}

/**
 * 사용자 알림 조회
 */
export async function getUserNotifications(userId: string, unreadOnly = false): Promise<Notification[]> {
  const supabase = createClient()

  try {
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (unreadOnly) {
      query = query.eq("is_read", false)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("알림 조회 실패:", error)
    return []
  }
}

/**
 * 안읽은 알림 수 조회
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = createClient()

  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (error) throw error
    return count || 0
  } catch (error) {
    console.error("안읽은 알림 수 조회 실패:", error)
    return 0
  }
}

/**
 * 알림 읽음 처리
 */
export async function markAsRead(notificationId: string): Promise<boolean> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId)

    if (error) throw error
    return true
  } catch (error) {
    console.error("알림 읽음 처리 실패:", error)
    return false
  }
}

/**
 * 모든 알림 읽음 처리
 */
export async function markAllAsRead(userId: string): Promise<boolean> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (error) throw error
    return true
  } catch (error) {
    console.error("전체 알림 읽음 처리 실패:", error)
    return false
  }
}

/**
 * 알림 설정 조회
 */
export async function getNotificationSettings(userId: string): Promise<NotificationSetting[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("user_id", userId)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("알림 설정 조회 실패:", error)
    return []
  }
}

/**
 * 알림 설정 업데이트
 */
export async function updateNotificationSetting(
  userId: string,
  settingKey: string,
  notificationType: "email" | "sms" | "in_app",
  isEnabled: boolean
): Promise<boolean> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("notification_settings")
      .upsert({
        user_id: userId,
        setting_key: settingKey,
        notification_type: notificationType,
        is_enabled: isEnabled,
      }, {
        onConflict: "user_id,setting_key,notification_type"
      })

    if (error) {
      console.error("Supabase upsert error:", error)
      throw error
    }
    return true
  } catch (error) {
    console.error("알림 설정 업데이트 실패:", error)
    return false
  }
}

/**
 * 알림 설정 초기화 (신규 사용자)
 */
export async function initializeNotificationSettings(userId: string): Promise<boolean> {
  const supabase = createClient()

  try {
    const { error } = await supabase.rpc("create_default_notification_settings", {
      user_id: userId,
    })

    if (error) throw error
    return true
  } catch (error) {
    console.error("알림 설정 초기화 실패:", error)
    return false
  }
}

/**
 * 사용자 이메일 주소 조회
 */
async function getUserEmail(userId: string): Promise<string | null> {
  const supabase = createClient()

  try {
    // user_profiles 테이블에서 이메일 조회
    const { data, error } = await supabase
      .from("user_profiles")
      .select("email")
      .eq("user_id", userId)
      .single()

    if (error) {
      // RLS 등의 이유로 조회 실패 시 현재 세션 사용자와 비교
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id === userId) {
        return user.email || null
      }
      return null
    }

    return (data as any)?.email || null
  } catch (error) {
    console.error("사용자 이메일 조회 실패:", error)
    return null
  }
}

/**
 * 이메일 발송 (Resend 사용 - 서버 측에서만 호출)
 */
export async function sendEmail(params: {
  to: string
  subject: string
  html: string
}): Promise<boolean> {
  try {
    // 이 함수는 API 라우트를 통해서만 호출되어야 합니다
    const response = await fetch("/api/notifications/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })

    return response.ok
  } catch (error) {
    console.error("이메일 발송 실패:", error)
    return false
  }
}

/**
 * 알림 발송 (설정에 따라 이메일/인앱 알림)
 */
export async function sendNotification(params: {
  userId: string
  type: NotificationType
  title: string
  content?: string
  link?: string
  metadata?: Record<string, any>
  sendEmail?: boolean
}): Promise<{ notification: Notification | null; emailSent: boolean }> {
  // 인앱 알림 생성
  const notification = await createNotification(params)

  // 이메일 발송 여부 확인
  let emailSent = false
  if (params.sendEmail) {
    const settings = await getNotificationSettings(params.userId)
    const emailSetting = settings.find(
      s => s.setting_key === params.type && s.notification_type === "email" && s.is_enabled
    )

    if (emailSetting) {
      // 사용자 이메일 주소 조회
      const userEmail = await getUserEmail(params.userId)

      if (userEmail) {
        // 이메일 발송
        emailSent = await sendEmail({
          to: userEmail,
          subject: params.title,
          html: params.content || params.title,
        })
      } else {
        console.warn("사용자 이메일을 찾을 수 없어 이메일을 발송하지 않았습니다:", params.userId)
      }
    }

    // 이메일 발송 상태 업데이트
    if (notification && emailSent) {
      const supabase = createClient()
      await supabase
        .from("notifications")
        .update({
          sent_email: true,
          sent_email_at: new Date().toISOString(),
        })
        .eq("id", notification.id)
    }
  }

  return { notification, emailSent }
}
