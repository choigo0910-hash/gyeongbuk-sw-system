"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Suspense } from "react"

// 에러 메시지 한국어 변환
function translateAuthError(message: string): string {
  const errorMap: Record<string, string> = {
    "User already registered": "이미 가입된 회원입니다.",
    "Invalid login credentials": "이메일 또는 비밀번호가 올바르지 않습니다.",
    "Email not confirmed": "이메일 인증이 완료되지 않았습니다.",
    "Weak password": "비밀번호가 안전하지 않습니다. (6자 이상 입력해주세요)",
    "Password should be at least 6 characters": "비밀번호는 최소 6자 이상이어야 합니다.",
    "Unable to validate email address": "유효하지 않은 이메일 주소입니다.",
    "User not found": "존재하지 않는 회원입니다.",
    "Invalid email": "유효하지 않은 이메일 형식입니다.",
    "Email rate limit exceeded": "이메일 전송 횟수가 초과되었습니다. 잠시 후 다시 시도해주세요.",
    "Password is too weak": "비밀번호가 너무 약합니다. 더 강력한 비밀번호를 사용해주세요.",
    "Password should contain characters": "비밀번호에 영문, 숫자, 특수문자가 포함되어야 합니다.",
    "Only allowed to sign up": "이미 가입된 이메일입니다. 로그인을 시도해주세요.",
    "Signups not allowed": "현재 회원가입이 허용되지 않습니다.",
    "Phone rate limit exceeded": "문자 메시지 전송 횟수가 초과되었습니다. 잠시 후 다시 시도해주세요.",
    "OTP rate limit exceeded": "인증 코드 전송 횟수가 초과되었습니다. 잠시 후 다시 시도해주세요.",
    "Invalid OTP": "인증 코드가 올바르지 않습니다.",
    "OTP expired": "인증 코드가 만료되었습니다. 다시 요청해주세요.",
    "A user with this email has already been registered": "이미 가입된 이메일입니다.",
    "User already belongs to this organization": "이미 이 기업에 소속된 사용자입니다.",
  }

  return errorMap[message] || message
}

function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(translateAuthError(error.message))
        return
      }

      // 로그인 성공 후 역할에 따라 리다이렉트
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError("사용자 정보를 가져오지 못했습니다.")
        return
      }

      // 사용자 역할 확인 (RLS를 통해)
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("roles(code)")
        .eq("user_id", user.id)

      const roles = rolesData?.map((r: any) => r.roles?.code) || []
      const isAdmin = roles.includes("admin") || roles.includes("super_admin")

      // 기업 사용자 승인 상태 확인
      if (!isAdmin) {
        const { data: companyData } = await supabase
          .from("user_companies")
          .select("status")
          .eq("user_id", user.id)
          .maybeSingle()

        if (companyData && companyData.status === "pending") {
          setError("관리자 승인 대기 중입니다. 영업일 기준 1~2일 소요될 수 있습니다.")
          setLoading(false)
          return
        }

        if (companyData && companyData.status === "rejected") {
          setError("가입 신청이 반려되었습니다. 관리자에게 문의해 주세요.")
          setLoading(false)
          return
        }
      }

      // 역할에 따라 리다이렉트
      router.push(isAdmin ? "/admin/dashboard" : "/portal/dashboard")
      router.refresh()
    } catch (err) {
      setError("로그인 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-mint-50 px-4 py-12">
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-100/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative card-enhanced border-0 shadow-xl">
        <CardHeader className="space-y-4 pb-6">
          {/* 브랜드 로고 영역 */}
          <div className="flex justify-center">
            <Image
              src="/postech-logo.jpg"
              alt="POSTECH 로고"
              width={240}
              height={96}
              className="object-contain"
            />
          </div>

          <div className="text-center space-y-2">
            <CardTitle className="text-lg font-bold text-red-700">
              경북SW성장기업육성지원사업
            </CardTitle>
            <CardDescription className="text-base">
              통합 관리 시스템에 로그인하세요
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="text-sm text-green-600 bg-green-50 border border-green-200 p-3 rounded-lg">
                {successMessage}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 btn-primary text-base font-medium"
              disabled={loading}
            >
              {loading ? "로그인 중..." : "로그인"}
            </Button>
          </form>

          <div className="pt-4 text-center text-sm text-muted-foreground">
            <p>
              아직 계정이 없으신가요?{" "}
              <Link href="/signup" className="text-primary font-medium hover:underline">
                회원가입
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 하단 브랜딩 */}
      <div className="absolute bottom-4 text-center text-xs text-muted-foreground">
        <p>© 2026 경북 SW 성장기업육성지원사업. All rights reserved.</p>
      </div>
    </div>
  )
}

function SignupSuccessChecker() {
  const router = useRouter()

  useEffect(() => {
    // URL 쿼리 파라미터 확인을 위해 세션 스토리지 사용
    const showSuccessMessage = sessionStorage.getItem("signupSuccess")
    const pendingApproval = sessionStorage.getItem("pendingApproval")
    const memberType = sessionStorage.getItem("memberType")

    if (showSuccessMessage === "true") {
      sessionStorage.removeItem("signupSuccess")
      sessionStorage.removeItem("pendingApproval")
      sessionStorage.removeItem("memberType")

      // 커스텀 이벤트 발생으로 성공 메시지 표시
      const detail = {
        pendingApproval: pendingApproval === "true",
        memberType: memberType === "representative" ? "representative" : "team",
      }
      window.dispatchEvent(new CustomEvent("signupSuccess", { detail }))
    }
  }, [router])

  return null
}

export default function LoginPage() {
  return (
    <>
      <SignupSuccessChecker />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
        <LoginFormWithSuccess />
      </Suspense>
    </>
  )
}

function LoginFormWithSuccess() {
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    const handleSignupSuccess = (event: any) => {
      const { pendingApproval, memberType } = event.detail || {}

      if (pendingApproval) {
        if (memberType === "representative") {
          setSuccessMessage("회원가입이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다. (영업일 기준 1~2일 소예될 수 있습니다.)")
        } else {
          setSuccessMessage("회원가입이 완료되었습니다. 기업 대표자 승인 후 로그인할 수 있습니다.")
        }
      } else {
        setSuccessMessage("회원가입이 완료되었습니다. 로그인해주세요.")
      }
    }

    window.addEventListener("signupSuccess", handleSignupSuccess)
    return () => window.removeEventListener("signupSuccess", handleSignupSuccess)
  }, [])

  // LoginForm의 모든 로직을 여기에 통합
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(translateAuthError(error.message))
        return
      }

      // 로그인 성공 후 역할에 따라 리다이렉트
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError("사용자 정보를 가져오지 못했습니다.")
        return
      }

      // 사용자 역할 확인 (RLS를 통해)
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("roles(code)")
        .eq("user_id", user.id)

      const roles = rolesData?.map((r: any) => r.roles?.code) || []
      const isAdmin = roles.includes("admin") || roles.includes("super_admin")

      // 기업 사용자 승인 상태 확인
      if (!isAdmin) {
        const { data: companyData } = await supabase
          .from("user_companies")
          .select("status")
          .eq("user_id", user.id)
          .maybeSingle()

        if (companyData && companyData.status === "pending") {
          setError("관리자 승인 대기 중입니다. 영업일 기준 1~2일 소요될 수 있습니다.")
          setLoading(false)
          return
        }

        if (companyData && companyData.status === "rejected") {
          setError("가입 신청이 반려되었습니다. 관리자에게 문의해 주세요.")
          setLoading(false)
          return
        }
      }

      // 역할에 따라 리다이렉트
      router.push(isAdmin ? "/admin/dashboard" : "/portal/dashboard")
      router.refresh()
    } catch (err) {
      setError("로그인 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-mint-50 px-4 py-12">
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-100/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative card-enhanced border-0 shadow-xl">
        <CardHeader className="space-y-4 pb-6">
          {/* 브랜드 로고 영역 */}
          <div className="flex justify-center">
            <Image
              src="/postech-logo.jpg"
              alt="POSTECH 로고"
              width={240}
              height={96}
              className="object-contain"
            />
          </div>

          <div className="text-center space-y-2">
            <CardTitle className="text-lg font-bold text-red-700">
              경북SW성장기업육성지원사업
            </CardTitle>
            <CardDescription className="text-base">
              통합 관리 시스템에 로그인하세요
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="text-sm text-green-600 bg-green-50 border border-green-200 p-3 rounded-lg">
                {successMessage}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 btn-primary text-base font-medium"
              disabled={loading}
            >
              {loading ? "로그인 중..." : "로그인"}
            </Button>
          </form>

          <div className="pt-4 text-center text-sm text-muted-foreground">
            <p>
              아직 계정이 없으신가요?{" "}
              <Link href="/signup" className="text-primary font-medium hover:underline">
                회원가입
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 하단 브랜딩 */}
      <div className="absolute bottom-4 text-center text-xs text-muted-foreground">
        <p>© 2026 경북 SW 성장기업육성지원사업. All rights reserved.</p>
      </div>
    </div>
  )
}
