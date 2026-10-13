import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency in Korean Won with comma separators
 * @param amount - Amount in won (integer)
 * @param options - Formatting options
 * @returns Formatted string (e.g., "100,000원" or "10만원")
 */
export function formatCurrency(
  amount: number | null | undefined,
  options: {
    style?: 'standard' | 'man' | 'full'  // standard: "100,000원", man: "10만원", full: "10만 0,000원"
    showSymbol?: boolean  // Show "원" suffix
  } = {}
): string {
  if (amount == null || isNaN(amount)) return options.showSymbol !== false ? '0원' : '0'

  const { style = 'standard', showSymbol = true } = options

  if (style === 'man') {
    // 만원 단위 표시 (대시보드용)
    const manWon = amount / 10000
    if (manWon === 0) return showSymbol ? '0원' : '0'
    return `${Math.floor(manWon).toLocaleString('ko-KR')}만원`
  }

  if (style === 'full') {
    // 전체 표시 (10만 0,000원)
    const man = Math.floor(amount / 10000)
    const remainder = amount % 10000
    let result = ''
    if (man > 0) result += `${man}만`
    if (remainder > 0) result += `${remainder.toLocaleString('ko-KR')}`
    if (result === '') result = '0'
    return result + '원'
  }

  // 표준 천 단위 콤마 표시
  const formatted = amount.toLocaleString('ko-KR')
  return showSymbol ? `${formatted}원` : formatted
}

/**
 * Parse formatted currency string to number
 * Handles formats: "100,000원", "100,000", "10만원", "10만 5,000원"
 * @param value - Formatted currency string
 * @returns Parsed number in won
 */
export function parseCurrency(value: string | number | null | undefined): number {
  if (value == null) return 0
  if (typeof value === 'number') return value

  // Remove "원" suffix and whitespace
  const cleaned = value.replace(/[원\s]/g, '')
  if (!cleaned) return 0

  // Handle "만" notation
  const manParts = cleaned.split('만')
  let total = 0

  for (let i = 0; i < manParts.length; i++) {
    const part = manParts[i].replace(/,/g, '')
    if (part) {
      const num = parseInt(part, 10)
      if (!isNaN(num)) {
        // Multiply by appropriate power of 10000
        total += num * Math.pow(10000, manParts.length - 1 - i)
      }
    }
  }

  return total
}

/**
 * Format currency for input fields (without symbol)
 * @param amount - Amount in won
 * @returns Formatted string for input (e.g., "100,000")
 */
export function formatCurrencyInput(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return ''
  return amount.toLocaleString('ko-KR')
}

/**
 * Format date to Seoul timezone
 */
export function toSeoulTime(date: Date): Date {
  return new Date(
    date.toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  )
}

/**
 * Format date to Korean format
 */
export function formatKoreanDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[\/\\:*?"<>|]/g, "") // Remove dangerous characters
    .replace(/\s+/g, "_") // Replace spaces with underscore
    .trim()
    .substring(0, 255) // Limit length
}
