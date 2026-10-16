import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    title: "예산관리",
    description: "사업별 예산서를 작성하고 관리자 검토·승인까지 한 흐름으로 관리합니다.",
  },
  {
    title: "구매요청",
    description: "장비·클라우드 등 구매를 신청하고 증빙 서류를 함께 제출·검토받습니다.",
  },
  {
    title: "환급신청",
    description: "사용자 비용 환급을 신청하고 처리 현황을 실시간으로 확인합니다.",
  },
  {
    title: "프로그램·확인서",
    description: "교육·멘토링 프로그램에 참가 신청하고 수료 확인서를 온라인으로 발급받습니다.",
  },
]

const audiences = [
  {
    role: "기업 대표자",
    description: "기업 등록과 팀원 가입 승인, 우리 기업의 예산·구매·환급 전체 현황을 관리합니다.",
  },
  {
    role: "팀원",
    description: "예산 편성, 구매요청, 환급신청을 작성하고 참가 프로그램 확인서를 발급받습니다.",
  },
  {
    role: "관리자",
    description: "가입 승인, 예산·구매·환급 검토, 프로그램 운영과 참가자 관리를 수행합니다.",
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* 헤더 */}
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm font-bold text-white">
              경
            </span>
            경북 SW 통합관리시스템
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">로그인</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">회원가입</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* 히어로 */}
      <section className="mx-auto max-w-5xl px-6 pb-20 pt-24 text-center">
        <span className="inline-block rounded-full border border-primary-200 bg-primary-50 px-4 py-1 text-sm font-medium text-primary-600">
          경북 SW 성장기업육성지원사업
        </span>
        <h1 className="mx-auto mt-6 max-w-2xl text-4xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-5xl">
          성장기업의 예산·구매·환급,
          <br />
          하나의 시스템으로 관리합니다
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-600">
          기업 등록부터 예산 편성, 구매요청과 환급신청, 프로그램 참가와 확인서 발급까지 —
          지원사업 운영에 필요한 모든 절차를 온라인으로 처리합니다.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/login">로그인</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/signup">기업 등록하기</Link>
          </Button>
        </div>
      </section>

      {/* 주요 기능 */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <h2 className="text-center text-2xl font-bold tracking-tight text-zinc-900">주요 기능</h2>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <Card key={f.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary" />
                  {f.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">{f.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 이용 대상 */}
      <section className="border-t bg-white">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-center text-2xl font-bold tracking-tight text-zinc-900">이용 대상</h2>
          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {audiences.map((a) => (
              <div key={a.role} className="rounded-xl border bg-zinc-50 p-6">
                <p className="font-semibold text-primary-600">{a.role}</p>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">{a.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="border-t bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-6 py-8 text-sm text-zinc-500 sm:flex-row">
          <p>경북 SW 성장기업육성지원사업 통합 관리 시스템</p>
          <p>© 2026 Gyeongbuk SW System</p>
        </div>
      </footer>
    </div>
  )
}
