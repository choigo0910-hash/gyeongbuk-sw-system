import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const redirectTo = searchParams.get("redirectTo") || "/portal/dashboard"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // OAuth 로그인 성공 후 사용자 역할 확인
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // 사용자 역할 확인
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("roles(code)")
          .eq("user_id", user.id)

        const roles = rolesData?.map((r: any) => r.roles?.code) || []
        const isAdmin = roles.includes("admin") || roles.includes("super_admin")

        // 역할에 따라 리다이렉트
        const finalRedirect = isAdmin ? "/admin/dashboard" : "/portal/dashboard"
        return NextResponse.redirect(`${origin}${redirectTo !== "/portal/dashboard" ? redirectTo : finalRedirect}`)
      }

      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  // 에러 발생 시 로그인 페이지로
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
