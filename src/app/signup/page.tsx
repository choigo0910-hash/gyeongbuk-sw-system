"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Image from "next/image"

type MemberType = "representative" | "team"

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

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // 사용자 정보
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")

  // 회원 유형
  const [memberType, setMemberType] = useState<MemberType>("representative")

  // 휴대폰 번호 포맷 함수
  const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/\D/g, "") // 숫자만 추출

    if (numbers.length <= 3) {
      return numbers
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
    }
  }

  // 기업 정보 (대표자)
  const [companyName, setCompanyName] = useState("")
  const [representativeName, setRepresentativeName] = useState("")
  const [companyPhone, setCompanyPhone] = useState("")

  // 기업 선택 (팀원)
  const [selectedCompany, setSelectedCompany] = useState("")
  const [existingCompanies, setExistingCompanies] = useState<any[]>([])
  const [searchCompany, setSearchCompany] = useState("")

  // 기업 검색
  const searchCompanies = async (query: string) => {
    if (query.length < 2) {
      setExistingCompanies([])
      return
    }

    try {
      const supabase = createClient()
      const { data } = await supabase
        .from("companies")
        .select("id, name, business_number")
        .or(`name.ilike.%${query}%,business_number.ilike.%${query}%`)
        .limit(10)

      setExistingCompanies(data || [])
    } catch (err) {
      console.error("기업 검색 실패:", err)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const supabase = createClient()

      // 1. Supabase Auth로 사용자 생성
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      })

      if (authError) {
        // 에러 메시지 한국어 변환
        const errorMessage = translateAuthError(authError.message)
        setError(errorMessage)
        return
      }

      if (!authData.user) {
        setError("사용자 생성에 실패했습니다.")
        return
      }

      const userId = authData.user.id

      let companyId: string

      // 2. 기업 정보 처리 (대표자 vs 팀원)
      if (memberType === "representative") {
        // 대표자: 새 기업 생성
        const { data: companyData, error: companyError } = await supabase
          .from("companies")
          .insert({
            name: companyName,
            representative_name: representativeName,
            phone: companyPhone,
            status: "active",
            created_by: userId, // RLS: 본인이 생성한 기업에만 company_admin 역할 부여 허용
          })
          .select()
          .single()

        if (companyError) {
          setError("기업 정보 저장에 실패했습니다: " + companyError.message)
          return
        }

        companyId = companyData.id
      } else {
        // 팀원: 기존 기업 선택
        if (!selectedCompany) {
          setError("소속할 기업을 선택해주세요.")
          return
        }
        companyId = selectedCompany
      }

      // 3. user_profile 생성
      const { error: profileError } = await supabase.from("user_profiles").insert({
        user_id: userId,
        name,
        email,
        phone,
      })

      if (profileError) {
        setError("프로필 저장에 실패했습니다: " + profileError.message)
        return
      }

      // 4. user_company 매핑 (status: pending - 승인 대기)
      const { error: userCompanyError } = await supabase.from("user_companies").insert({
        user_id: userId,
        company_id: companyId,
        position: memberType === "representative" ? "대표자" : "팀원",
        is_primary: memberType === "representative",
        status: "pending",
      })

      if (userCompanyError) {
        setError("기업 연결에 실패했습니다: " + userCompanyError.message)
        return
      }

      // 5. 역할 할당 (대표자만 즉시 할당, 팀원은 승인 후 할당)
      if (memberType === "representative") {
        const { data: roleData } = await supabase
          .from("roles")
          .select("id")
          .eq("code", "company_admin")
          .single()

        if (roleData) {
          await supabase.from("user_roles").insert({
            user_id: userId,
            role_id: roleData.id,
            company_id: companyId,
          })
        }
      }
      // 팀원은 대표자 승인 후 역할이 부여됨 (user_companies status가 active일 때)

      // 회원가입 성공 - sessionStorage에 플래그 저장 (승인 대기)
      sessionStorage.setItem("signupSuccess", "true")
      sessionStorage.setItem("pendingApproval", "true")
      sessionStorage.setItem("memberType", memberType)
      router.push("/signup/complete")
      router.refresh()
    } catch (err) {
      setError("회원가입 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-mint-50 px-4 py-12">
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-100/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-2xl relative card-enhanced border-0 shadow-xl mx-auto mt-8 mb-auto">
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
              통합 관리 시스템에 회원가입하세요
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSignup} className="space-y-6">
            {/* 사용자 정보 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">사용자 정보</h3>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">이름 *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="홍길동"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">이메일 *</Label>
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
                <Label htmlFor="password" className="text-sm font-medium">비밀번호 *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">연락처 *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="010-1234-5678"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                  required
                  disabled={loading}
                  className="h-11"
                  maxLength={13}
                />
              </div>
            </div>

            {/* 회원 유형 선택 */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold text-foreground">회원 유형</h3>

              <RadioGroup
                value={memberType}
                onValueChange={(value) => {
                  setMemberType(value as MemberType)
                  setError("")
                }}
                disabled={loading}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="representative" id="representative" />
                  <Label htmlFor="representative" className="font-normal cursor-pointer">
                    대표자 (기업 관리자 권한)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="team" id="team" />
                  <Label htmlFor="team" className="font-normal cursor-pointer">
                    팀원 (일반 사용자 권한)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* 기업 정보 */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold text-foreground">
                {memberType === "representative" ? "기업 정보 (신규 등록)" : "소속 기업 선택"}
              </h3>

              {memberType === "representative" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-sm font-medium">기업명 *</Label>
                    <Input
                      id="companyName"
                      type="text"
                      placeholder="(주)샘플기업"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      disabled={loading}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="representativeName" className="text-sm font-medium">대표자명 *</Label>
                    <Input
                      id="representativeName"
                      type="text"
                      placeholder="김대표"
                      value={representativeName}
                      onChange={(e) => setRepresentativeName(e.target.value)}
                      required
                      disabled={loading}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyPhone" className="text-sm font-medium">대표자 휴대폰 번호 *</Label>
                    <Input
                      id="companyPhone"
                      type="tel"
                      placeholder="010-1234-5678"
                      value={companyPhone}
                      onChange={(e) => setCompanyPhone(formatPhoneNumber(e.target.value))}
                      required
                      disabled={loading}
                      className="h-11"
                      maxLength={13}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="searchCompany" className="text-sm font-medium">기업 검색 *</Label>
                    <Input
                      id="searchCompany"
                      type="text"
                      placeholder="기업명 또는 사업자등록번호 입력"
                      value={searchCompany}
                      onChange={(e) => {
                        setSearchCompany(e.target.value)
                        searchCompanies(e.target.value)
                      }}
                      disabled={loading}
                      className="h-11"
                    />
                  </div>

                  {existingCompanies.length > 0 && (
                    <div className="space-y-2 border rounded-lg p-3 max-h-48 overflow-y-auto">
                      <Label className="text-xs text-muted-foreground">검색 결과</Label>
                      {existingCompanies.map((company) => (
                        <div
                          key={company.id}
                          className={`p-2 rounded cursor-pointer hover:bg-muted transition-colors ${
                            selectedCompany === company.id ? "bg-primary-50 border border-primary-200" : ""
                          }`}
                          onClick={() => {
                            setSelectedCompany(company.id)
                            setSearchCompany(company.name)
                            setExistingCompanies([])
                          }}
                        >
                          <div className="text-sm font-medium">{company.name}</div>
                          <div className="text-xs text-muted-foreground">{company.business_number}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedCompany && (
                    <div className="text-sm text-green-600 bg-green-50 border border-green-200 p-2 rounded">
                      ✓ 선택된 기업: {existingCompanies.find(c => c.id === selectedCompany)?.name}
                    </div>
                  )}
                </>
              )}
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 btn-primary text-base font-medium"
              disabled={loading}
            >
              {loading ? "가입 중..." : "회원가입"}
            </Button>
          </form>

          <div className="pt-4 text-center text-sm text-muted-foreground">
            <p>
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                로그인
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 하단 브랜딩 */}
      <div className="text-center text-xs text-muted-foreground py-8">
        <p>© 2026 경북 SW 성장기업육성지원사업. All rights reserved.</p>
      </div>
    </div>
  )
}
