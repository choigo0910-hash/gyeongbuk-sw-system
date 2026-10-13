"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface Program {
  id: string
  name: string
  description: string | null
  status: string
  application_opens_at: string | null
  application_closes_at: string | null
  starts_at: string | null
  ends_at: string | null
  location: string | null
  capacity: number | null
  current_applicants: number
}

const statusLabels: Record<string, string> = {
  draft: "임시저장",
  published: "공개",
  unpublished: "비공개",
  archived: "보관",
  active: "활성",
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  published: "bg-green-100 text-green-700",
  unpublished: "bg-yellow-100 text-yellow-700",
  archived: "bg-gray-500 text-white",
}

export default function ProgramsListPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("published")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchPrograms()
  }, [])

  const fetchPrograms = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      const { data } = await supabase
        .from("programs")
        .select("*")
        .in("status", ["published", "active"])
        .order("starts_at", { ascending: true })

      setPrograms((data as Program[]) || [])
    } catch (error) {
      console.error("프로그램 목록 조회 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPrograms = programs.filter((program) => {
    const matchesSearch =
      searchQuery === "" ||
      program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (program.description && program.description.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesSearch
  })

  const isApplicationOpen = (program: Program) => {
    if (!program.application_opens_at || !program.application_closes_at) return false
    const now = new Date()
    const opensAt = new Date(program.application_opens_at)
    const closesAt = new Date(program.application_closes_at)
    return now >= opensAt && now <= closesAt
  }

  const isApplicationUpcoming = (program: Program) => {
    if (!program.application_opens_at) return false
    const now = new Date()
    const opensAt = new Date(program.application_opens_at)
    return now < opensAt
  }

  const isApplicationClosed = (program: Program) => {
    if (!program.application_closes_at) return false
    const now = new Date()
    const closesAt = new Date(program.application_closes_at)
    return now > closesAt
  }

  const isProgramFull = (program: Program) => {
    return program.capacity !== null && program.current_applicants >= program.capacity
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">프로그램</h1>
          <p className="text-muted-foreground">참여 가능한 프로그램을 확인하고 신청합니다</p>
        </div>
      </div>

      {/* 검색 */}
      <Card>
        <CardContent className="pt-6">
          <Input
            placeholder="프로그램명 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* 프로그램 목록 */}
      {loading ? (
        <div className="text-center py-8">로딩 중...</div>
      ) : filteredPrograms.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              {searchQuery ? "검색 결과가 없습니다." : "현재 공개된 프로그램이 없습니다."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map((program) => (
            <Card key={program.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="line-clamp-2">{program.name}</CardTitle>
                  <Badge className={statusColors[program.status]}>
                    {statusLabels[program.status]}
                  </Badge>
                </div>
                {program.description && (
                  <CardDescription className="line-clamp-2">
                    {program.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="space-y-2 text-sm">
                  {program.starts_at && program.ends_at && (
                    <div>
                      <span className="text-muted-foreground">프로그램 기간:</span>
                      <p className="font-medium">
                        {new Date(program.starts_at).toLocaleDateString("ko-KR")} - {" "}
                        {new Date(program.ends_at).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                  )}
                  {program.location && (
                    <div>
                      <span className="text-muted-foreground">장소:</span>
                      <p className="font-medium">{program.location}</p>
                    </div>
                  )}
                  {program.capacity && (
                    <div>
                      <span className="text-muted-foreground">정원:</span>
                      <p className="font-medium">
                        {program.current_applicants} / {program.capacity}명
                        {isProgramFull(program) && (
                          <span className="text-red-600 ml-2">(마감)</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {isApplicationOpen(program) && !isProgramFull(program) && (
                    <Button asChild className="w-full">
                      <Link href={`/portal/programs/${program.id}`}>신청하기</Link>
                    </Button>
                  )}
                  {isApplicationUpcoming(program) && (
                    <Button variant="outline" className="w-full" disabled>
                      신청 예정 ({new Date(program.application_opens_at!).toLocaleDateString("ko-KR")} 오픈)
                    </Button>
                  )}
                  {isApplicationClosed(program) && (
                    <Button variant="outline" className="w-full" disabled>
                      신청 마감
                    </Button>
                  )}
                  {isProgramFull(program) && (
                    <Button variant="outline" className="w-full" disabled>
                      정원 마감
                    </Button>
                  )}
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={`/portal/programs/${program.id}`}>상세보기</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 신청 현황 */}
      <Card>
        <CardHeader>
          <CardTitle>내 신청 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/portal/my-applications">신청 내역 보기</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
