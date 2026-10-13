import { Resend } from "resend"

let resendInstance: Resend | null = null

export function getResend(): Resend | null {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY
    if (apiKey) {
      resendInstance = new Resend(apiKey)
    }
  }
  return resendInstance
}

// 레거시 호환성
export const resend = {
  emails: {
    send: async (params: { from: string; to: string[] | string; subject: string; html: string }) => {
      const client = getResend()
      if (!client) {
        console.error("Resend API key not configured")
        return { data: null, error: { message: "Resend API key not configured" } }
      }
      return client.emails.send(params)
    }
  }
}
