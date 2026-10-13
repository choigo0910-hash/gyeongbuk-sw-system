import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 공개 경로는 통과
  const isPublicPath =
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/about") ||
    pathname === "/"

  if (isPublicPath) {
    return NextResponse.next()
  }

  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          request.cookies.delete(name)
          response.cookies.delete(name)
        },
      },
    }
  )

  // 세션 확인 및 갱신
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    console.error("Session error in middleware:", sessionError)
  }

  if (!session) {
    // 인증되지 않은 사용자는 로그인 페이지로
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 세션 갱신 (getUser가 자동으로 토큰 갱신 시도)
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("User error in middleware:", userError)
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 경로별 권한 체크
  if (pathname.startsWith("/admin")) {
    // 관리자 권한 확인
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("roles(code)")
      .eq("user_id", user.id)

    const roles = rolesData?.map((r: any) => r.roles?.code) || []
    const isAdmin = roles.includes("admin") || roles.includes("super_admin")

    if (!isAdmin) {
      // 관리자가 아니면 사용자 포털로
      return NextResponse.redirect(new URL("/portal/dashboard", request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
