import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Storage 버킷은 private이므로 파일은 서명된 URL로만 접근 가능.
 *
 * DB에는 절대 URL 대신 "{버킷}/{경로}" 형식으로 저장한다.
 * (과거 public 버킷 시절 저장된 절대 URL도 정규화해서 처리)
 *
 * 예: "company-documents/1728800000000_abc.pdf"
 *     "https://xxx.supabase.co/storage/v1/object/public/company-documents/1728800000000_abc.pdf"
 */
export async function getSignedFileUrl(
  supabase: SupabaseClient,
  fileUrl: string,
  expiresIn = 3600
): Promise<string | null> {
  let value = fileUrl

  // 과거 절대 URL → 경로로 정규화
  if (value.startsWith("http")) {
    value = value.replace(
      /^https?:\/\/[^/]+\/storage\/v1\/object\/(?:public|authenticated)\//,
      ""
    )
  }

  const slashIndex = value.indexOf("/")
  if (slashIndex <= 0) return null

  const bucket = value.slice(0, slashIndex)
  const path = value.slice(slashIndex + 1)

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn)
  if (error) {
    console.error("서명된 URL 생성 실패:", error)
    return null
  }
  return data?.signedUrl ?? null
}
