"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image"
import { CheckCircle } from "lucide-react"

type MemberType = "representative" | "team"

export default function SignupCompletePage() {
  const router = useRouter()
  const [memberType, setMemberType] = useState<MemberType>("representative")
  const [pendingApproval, setPendingApproval] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // sessionStorage 플래그 확인
    const signupSuccess = sessionStorage.getItem("signupSuccess")
    const pendingApprovalFlag = sessionStorage.getItem("pendingApproval")
    const memberTypeFlag = sessionStorage.getItem("memberType") as MemberType

    if (signupSuccess !== "true") {
      // 플래그가 없으면 signup 페이지로 리다이렉트
      router.push("/signup")
      return
    }

    // 상태 설정
    setMemberType(memberTypeFlag === "representative" ? "representative" : "team")
    setPendingApproval(pendingApprovalFlag === "true")

    // 플래그 삭제 (일회성)
    sessionStorage.removeItem("signupSuccess")
    sessionStorage.removeItem("pendingApproval")
    sessionStorage.removeItem("memberType")

    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-mint-50">
        <div className="text-center">로딩 중...</div>
      </div>
    )
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
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 성공 메시지 */}
          <div className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
            <h2 className="text-2xl font-bold">회원가입이 완료되었습니다</h2>
            <p className="text-gray-600">
              {memberType === "representative" ? (
                <>
                  관리자 승인 후 로그인할 수 있습니다.
                  <br />
                  영업일 기준 1~2일 소요될 수 있습니다.
                </>
              ) : (
                <>
                  기업 대표자의 승인 후 로그인할 수 있습니다.
                  <br />
                  영업일 기준 1~2일 소요될 수 있습니다.
                </>
              )}
            </p>
          </div>

          {/* 승인 대기 안내 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-blue-900">승인 대기 안내</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 가입 신청이 접수되었습니다.</li>
              <li>• 관리자 승인 후 이메일로 알림을 보내드립니다.</li>
              <li>• 승인 완료 후 로그인하여 서비스를 이용하실 수 있습니다.</li>
            </ul>
          </div>

          {/* CTA 버튼 */}
          <Button asChild className="w-full h-11 btn-primary text-base font-medium">
            <Link href="/login">로그인 페이지로 이동</Link>
          </Button>

          <div className="pt-4 text-center text-sm text-muted-foreground">
            <p>문의사항이 있으시면 관리자에게 연락해주세요.</p>
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
