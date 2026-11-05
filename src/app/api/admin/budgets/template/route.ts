import { NextResponse } from "next/server"
import * as XLSX from 'xlsx'
import { generateBudgetTemplate } from "@/lib/excel"
import { createClient } from "@/lib/supabase/server"

// user_roles + roles(code) 조인 결과 행
interface UserRoleRow {
  role_id: string
  roles: { code: string } | null
}

export async function GET() {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 관리자 권한 확인
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role_id, roles(code)")
      .eq("user_id", user.id)

    const isAdmin = (userRoles as UserRoleRow[] | null)?.some((ur) => ur.roles?.code === "admin" || ur.roles?.code === "super_admin")
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // 엑셀 템플릿 생성
    const workbook = generateBudgetTemplate()

    // 버퍼로 변환
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // 응답 반환
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        // HTTP 헤더는 ASCII만 허용 — 한글 파일명은 RFC 5987(filename*)로 인코딩
        'Content-Disposition': `attachment; filename="budget_template.xlsx"; filename*=UTF-8''${encodeURIComponent('예산서_템플릿.xlsx')}`,
      },
    })

  } catch (error) {
    console.error("템플릿 다운로드 오류:", error)
    return NextResponse.json(
      { error: "서버 오류" },
      { status: 500 }
    )
  }
}
