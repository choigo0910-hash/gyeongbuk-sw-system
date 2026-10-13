import { NextRequest, NextResponse } from "next/server"
import { resend } from "@/lib/resend"

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html } = await request.json()

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, html" },
        { status: 400 }
      )
    }

    // Resend를 통한 이메일 발송
    const { data, error } = await resend.emails.send({
      from: "경북 SW 성장기업지원사업 <noreply@yourdomain.com>",
      to,
      subject,
      html,
    })

    if (error) {
      console.error("Resend error:", error)
      return NextResponse.json(
        { error: "Email sending failed" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Send email API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
