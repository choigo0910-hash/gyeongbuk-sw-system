"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  allow_budget_change: boolean
}

const statusLabels: Record<string, string> = {
  draft: "임시저장",
  published: "공개",
  unpublished: "비공개",
  archived: "보관",
}

export default function AdminProgramEditPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // 폼 상태
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("")
  const [applicationOpensAt, setApplicationOpensAt] = useState("")
  const [applicationClosesAt, setApplicationClosesAt] = useState("")
  const [startsAt, setStartsAt] = useState("")
  const [endsAt, setEndsAt] = useState("")
  const [location, setLocation] = useState("")
  const [capacity, setCapacity] = useState<number | null>(null)
  const [allowBudgetChange, setAllowBudgetChange] = useState(false)

  useEffect(() => {
    fetchProgramDetail()
  }, [id])

  const fetchProgramDetail = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .eq("id", id)
        .single()

      if (error) throw error

      const prog = data as Program
      setProgram(prog)

      // 폼 상태 초기화
      setName(prog.name)
      setDescription(prog.description || "")
      setStatus(prog.status)
      setApplicationOpensAt(prog.application_opens_at ? prog.application_opens_at.slice(0, 16) : "")
      setApplicationClosesAt(prog.application_closes_at ? prog.application_closes_at.slice(0, 16) : "")
      setStartsAt(prog.starts_at ? prog.starts_at.slice(0, 16) : "")
      setEndsAt(prog.ends_at ? prog.ends_at.slice(0, 16) : "")
      setLocation(prog.location || "")
      setCapacity(prog.capacity)
      setAllowBudgetChange(prog.allow_budget_change || false)
    } catch (error) {
      console.error("프로그램 상세 조회 실패:", error)
      alert("프로그램을 찾을 수 없습니다.")
      router.push("/admin/programs")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!name || !description) {
      alert("프로그램명과 설명을 입력해주세요.")
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("programs")
        .update({
          name,
          description,
          status,
          application_opens_at: applicationOpensAt ? new Date(applicationOpensAt).toISOString() : null,
          application_closes_at: applicationClosesAt ? new Date(applicationClosesAt).toISOString() : null,
          starts_at: startsAt ? new Date(startsAt).toISOString() : null,
          ends_at: endsAt ? new Date(endsAt).toISOString() : null,
          location: location || null,
          capacity: capacity,
          allow_budget_change: allowBudgetChange,
        })
        .eq("id", id)

      if (error) throw error

      alert("프로그램이 수정되었습니다.")
      router.push("/admin/programs")
    } catch (error) {
      console.error("프로그램 수정 실패:", error)
      alert("프로그램 수정에 실패했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>
  }

  if (!program) {
    return <div className="text-center py-8">프로그램을 찾을 수 없습니다.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">프로그램 편집</h1>
          <p className="text-muted-foreground">{program.name}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/programs">목록으로</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>프로그램 정보 수정</CardTitle>
          <CardDescription>프로그램의 상세 정보를 수정합니다</CardDescription>
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

          <div className="flex items-center space-x-2 pt-4 border-t">
            <Switch
              id="allow_budget_change"
              checked={allowBudgetChange}
              onCheckedChange={setAllowBudgetChange}
            />
            <Label htmlFor="allow_budget_change" className="cursor-pointer">
              예산 변경 신청 허용
            </Label>
            <span className="text-sm text-muted-foreground">
              ({allowBudgetChange ? "허용됨" : "허용되지 않음"})
            </span>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} disabled={submitting} className="flex-1">
              {submitting ? "저장 중..." : "저장"}
            </Button>
            <Button
              variant="outline"
              asChild
              disabled={submitting}
            >
              <Link href="/admin/programs">취소</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
