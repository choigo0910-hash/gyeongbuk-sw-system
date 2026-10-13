"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function TestPage() {
  const [companies, setCompanies] = useState<any[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    const test = async () => {
      try {
        const supabase = createClient()
        console.log("Fetching companies...")
        const { data, error } = await supabase
          .from("companies")
          .select("id, name, registration_number, ceo_name")
          .limit(5)

        console.log("Data:", data)
        console.log("Error:", error)

        if (error) {
          setError(JSON.stringify(error))
        } else {
          setCompanies(data || [])
        }
      } catch (e: any) {
        setError(e.message)
        console.error("Catch error:", e)
      }
    }
    test()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">기업 목록 테스트</h1>
      {error && (
        <div className="bg-red-50 p-4 mb-4 rounded">
          <p className="text-red-600 font-bold">에러:</p>
          <pre className="text-sm">{error}</pre>
        </div>
      )}
      <div className="bg-white border rounded p-4">
        <p className="mb-2 font-bold">결과 ({companies.length}개):</p>
        {companies.map((c) => (
          <div key={c.id} className="p-2 border-b">
            {c.name} - {c.registration_number || "-"} - {c.ceo_name || "-"}
          </div>
        ))}
      </div>
    </div>
  )
}
