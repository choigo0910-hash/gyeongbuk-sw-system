"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  published: "bg-green-100 text-green-700",
  unpublished: "bg-yellow-100 text-yellow-700",
  archived: "bg-gray-500 text-white",
}

export default function AdminProgramsPage() {
  const router = useRouter()
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // 프로그램 생성 폼
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("draft")
  const [applicationOpensAt, setApplicationOpensAt] = useState("")
  const [applicationClosesAt, setApplicationClosesAt] = useState("")
  const [startsAt, setStartsAt] = useState("")
  const [endsAt, setEndsAt] = useState("")
  const [location, setLocation] = useState("")
  const [capacity, setCapacity] = useState<number | null>(null)

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
        .order("starts_at", { ascending: false })

      setPrograms((data as Program[]) || [])
    } catch (error) {
      console.error("프로그램 목록 조회 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProgram = async () => {
    if (!name || !description) {
      alert("프로그램명과 설명을 입력해주세요.")
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("programs")
        .insert({
          name,
          description,
          status,
          application_opens_at: applicationOpensAt ? new Date(applicationOpensAt).toISOString() : null,
          application_closes_at: applicationClosesAt ? new Date(applicationClosesAt).toISOString() : null,
          starts_at: startsAt ? new Date(startsAt).toISOString() : null,
          ends_at: endsAt ? new Date(endsAt).toISOString() : null,
          location: location || null,
          capacity: capacity,
        })

      if (error) throw error

      alert("프로그램이 생성되었습니다.")
      setShowCreateForm(false)
      // 폼 초기화
      setName("")
      setDescription("")
      setStatus("draft")
      setApplicationOpensAt("")
      setApplicationClosesAt("")
      setStartsAt("")
      setEndsAt("")
      setLocation("")
      setCapacity(null)
      fetchPrograms()
    } catch (error) {
      console.error("프로그램 생성 실패:", error)
      alert("프로그램 생성에 실패했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">프로그램 관리</h1>
          <p className="text-muted-foreground">프로그램을 생성하고 관리합니다</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? "취소" : "+ 새 프로그램"}
        </Button>
      </div>

      {/* 프로그램 생성 폼 */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>새 프로그램</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">프로그램명 *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="프로그램명 입력"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명 *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="프로그램 설명 입력"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">상태</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">임시저장</SelectItem>
                    <SelectItem value="published">공개</SelectItem>
                    <SelectItem value="unpublished">비공개</SelectItem>
                    <SelectItem value="archived">보관</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">정원</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={capacity || ""}
                  onChange={(e) => setCapacity(e.target.value ? Number(e.target.value) : null)}
                  min={1}
                  placeholder="정원 입력"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="applicationOpensAt">신청 시작일</Label>
                <Input
                  id="applicationOpensAt"
                  type="datetime-local"
                  value={applicationOpensAt}
                  onChange={(e) => setApplicationOpensAt(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="applicationClosesAt">신청 종료일</Label>
                <Input
                  id="applicationClosesAt"
                  type="datetime-local"
                  value={applicationClosesAt}
                  onChange={(e) => setApplicationClosesAt(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startsAt">프로그램 시작일</Label>
                <Input
                  id="startsAt"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endsAt">프로그램 종료일</Label>
                <Input
                  id="endsAt"
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">장소</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="장소 입력"
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleCreateProgram} disabled={submitting} className="flex-1">
                {submitting ? "생성 중..." : "생성"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                disabled={submitting}
              >
                취소
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 프로그램 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>프로그램 목록</CardTitle>
          <CardDescription>
            총 {programs.length}개
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : programs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">프로그램이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {programs.map((program) => (
                <div
                  key={program.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{program.name}</span>
                        <Badge className={statusColors[program.status]}>
                          {statusLabels[program.status] || program.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {program.starts_at && program.ends_at && (
                          <p>
                            프로그램 기간:{" "}
                            {new Date(program.starts_at).toLocaleDateString("ko-KR")} - {" "}
                            {new Date(program.ends_at).toLocaleDateString("ko-KR")}
                          </p>
                        )}
                        {program.location && (
                          <p>장소: {program.location}</p>
                        )}
                        <p>
                          신청: {program.current_applicants}
                          {program.capacity && ` / ${program.capacity}`}명
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/programs/${program.id}`}>참가자</Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/programs/${program.id}/edit`}>편집</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
