import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { parseBudgetExcel } from "@/lib/excel"

export async function POST(request: NextRequest) {
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

    const isAdmin = userRoles?.some((ur: any) => ur.roles?.code === "admin" || ur.roles?.code === "super_admin")
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const companyId = formData.get("company_id") as string
    const programId = formData.get("program_id") as string
    const fiscalYear = formData.get("fiscal_year") as string

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 })
    }

    if (!companyId || !programId || !fiscalYear) {
      return NextResponse.json({ error: "필수 필드가 누락되었습니다." }, { status: 400 })
    }

    // 파일 읽기
    const arrayBuffer = await file.arrayBuffer()

    // 엑셀 파싱
    let budgetItems
    try {
      budgetItems = parseBudgetExcel(arrayBuffer)
    } catch (parseError) {
      return NextResponse.json(
        { error: `엑셀 파싱 오류: ${parseError instanceof Error ? parseError.message : "알 수 없는 오류"}` },
        { status: 400 }
      )
    }

    if (!budgetItems || budgetItems.length === 0) {
      return NextResponse.json({ error: "파싱된 데이터가 없습니다." }, { status: 400 })
    }

    // 총액 계산
    const totalAmount = budgetItems.reduce((sum, item) => sum + (item?.amount || 0), 0)

    // 예산서 생성
    const { data: budget, error: budgetError } = await supabase
      .from("budgets")
      .insert({
        company_id: companyId,
        program_id: programId,
        fiscal_year: Number(fiscalYear),
        total_amount: totalAmount,
        status: "draft",
        submitted_by: user.id,
      })
      .select()
      .single()

    if (budgetError) {
      return NextResponse.json({ error: "예산서 생성 실패", details: budgetError.message }, { status: 500 })
    }

    // 예산 항목 생성
    const budgetItemsToInsert = budgetItems.map((item: any) => ({
      budget_id: budget.id,
      ...item,
    }))

    const { error: itemsError } = await supabase
      .from("budget_items")
      .insert(budgetItemsToInsert)

    if (itemsError) {
      // 예산 항목 생성 실패 시 예산서도 삭제
      await supabase.from("budgets").delete().eq("id", budget.id)
      return NextResponse.json({ error: "예산 항목 생성 실패", details: itemsError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      budget,
      itemsCount: budgetItems.length,
      totalAmount,
    })

  } catch (error) {
    console.error("예산서 엑셀 업로드 오류:", error)
    return NextResponse.json(
      { error: "서버 오류", details: error instanceof Error ? error.message : "알 수 없는 오류" },
      { status: 500 }
    )
  }
}
