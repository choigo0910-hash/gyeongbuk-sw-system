"use client"

import { useEffect, useRef, useCallback } from "react"

// 전역 상태 (window 객체 사용)
declare global {
  interface Window {
    __hasUnsavedChanges__?: boolean
    __unsavedChangesMessage__?: string
  }
}

/**
 * 저장되지 않은 변경사항 상태를 설정하는 훅
 *
 * @param hasUnsavedChanges - 저장되지 않은 변경사항이 있는지 여부
 * @param message - 경고 메시지
 *
 * @example
 * ```tsx
 * const [isDirty, setIsDirty] = useState(false)
 * useUnsavedChanges(isDirty, "변경사항이 저장되지 않았습니다.")
 * ```
 */
export function useUnsavedChanges(
  hasUnsavedChanges: boolean,
  message: string = "변경사항이 저장되지 않았습니다. 정말 나가시겠습니까?"
) {
  // 브라우저 닫기/새로고침 방지
  useEffect(() => {
    if (!hasUnsavedChanges) {
      window.__hasUnsavedChanges__ = false
      return
    }

    window.__hasUnsavedChanges__ = true
    window.__unsavedChangesMessage__ = message

    const handleBeforeUnload = (e: Event) => {
      const event = e as any
      event.preventDefault()
      event.returnValue = message // Chrome을 위해 returnValue 설정 필요
      return message
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.__hasUnsavedChanges__ = false
    }
  }, [hasUnsavedChanges, message])
}

/**
 * 안전한 라우팅 함수를 반환하는 훅
 * 변경사항이 있으면 확인 메시지를 표시합니다.
 *
 * @param hasUnsavedChanges - 저장되지 않은 변경사항이 있는지 여부
 * @param message - 경고 메시지
 * @returns navigateFn - 확인 후 안전하게 이동하는 함수
 *
 * @example
 * ```tsx
 * const { safeNavigate } = useSafeNavigation(isDirty, "저장하지 않고 떠나시겠습니까?")
 *
 * <Button onClick={() => safeNavigate("/other-page")}>이동</Button>
 * ```
 */
export function useSafeNavigation(
  hasUnsavedChanges: boolean,
  message: string = "변경사항이 저장되지 않았습니다. 이동하시겠습니까?"
) {
  const safeNavigate = useCallback(
    (href: string) => {
      if (!hasUnsavedChanges) {
        window.location.href = href
        return true
      }

      if (window.confirm(message)) {
        window.location.href = href
        return true
      }

      return false
    },
    [hasUnsavedChanges, message]
  )

  return { safeNavigate }
}

/**
 * 전역 변경사항 상태를 확인하는 함수
 */
export function checkUnsavedChanges(): { hasChanges: boolean; message: string } {
  return {
    hasChanges: window.__hasUnsavedChanges__ || false,
    message: window.__unsavedChangesMessage__ || "변경사항이 저장되지 않았습니다. 정말 나가시겠습니까?"
  }
}

/**
 * 전역 변경사항 상태를 리셋하는 함수
 */
export function resetUnsavedChanges() {
  window.__hasUnsavedChanges__ = false
  window.__unsavedChangesMessage__ = undefined
}
