"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

// 화폐 단위
const currencies = [
  { code: "KRW", symbol: "원" },
  { code: "USD", symbol: "$" },
]

// 구매분류 정의
const categories = [
  { code: "office_supplies", name: "사무용품비", budgetCode: "사무관리비, 201-01", contactRequired: false },
  { code: "outsourcing_fee", name: "업무대행수수료", budgetCode: "사무관리비, 201-01", contactRequired: false },
  { code: "booth_operation", name: "부스 운영비", budgetCode: "사무관리비, 201-01", contactRequired: true },
  { code: "books", name: "도서구입비", budgetCode: "사무관리비, 201-01", contactRequired: false },
  { code: "education", name: "위탁교육비", budgetCode: "", contactRequired: false },
  { code: "service_fee", name: "용역비", budgetCode: "", contactRequired: false },
  { code: "rent", name: "임차료", budgetCode: "201-33", contactRequired: true },
  { code: "equipment_rent", name: "장비임차료", budgetCode: "201-33", contactRequired: false },
  { code: "promotion", name: "홍보비", budgetCode: "사무관리비, 201-01", contactRequired: false },
]

// 사무용품비/도서구입비/장비임차료 아이템 타입
type OfficeItemType = {
  id: string
  itemName: string
  quantity: number
  option: string
  link: string
  amount: number
}

// 배송 정보 타입
type ShippingInfo = {
  recipientName: string
  address: string
  contactPhone: string
}

// 위탁교육비 강의 타입
type EducationCourse = {
  courseName: string
  courseLink: string
  accountId: string
  accountPassword: string
}

export default function EditPurchaseRequestPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // 공통 필드
  const [category, setCategory] = useState("")
  const [currency, setCurrency] = useState("KRW")
  const [totalAmount, setTotalAmount] = useState(0)

  // 사무용품비/도서구입비/장비임차료 필드
  const [officeItems, setOfficeItems] = useState<OfficeItemType[]>([
    { id: "1", itemName: "", quantity: 1, option: "", link: "", amount: 0 }
  ])
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    recipientName: "",
    address: "",
    contactPhone: "",
  })
  const [reason, setReason] = useState("")

  // 업무대행수수료 필드
  const [outsourcingType, setOutsourcingType] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [companyContact, setCompanyContact] = useState("")

  // 위탁교육비 필드
  const [educationCourses, setEducationCourses] = useState<EducationCourse[]>([
    { courseName: "", courseLink: "", accountId: "", accountPassword: "" }
  ])
  const [educationAgree, setEducationAgree] = useState(false)

  // 용역비 필드
  const [serviceAmountRange, setServiceAmountRange] = useState("")
  const [serviceCompanyName, setServiceCompanyName] = useState("")
  const [serviceContactEmail, setServiceContactEmail] = useState("")
  const [serviceContactPhone, setServiceContactPhone] = useState("")

  // 홍보비 필드
  const [promotionName, setPromotionName] = useState("")
  const [promotionSiteUrl, setPromotionSiteUrl] = useState("")
  const [promotionAccountId, setPromotionAccountId] = useState("")
  const [promotionAccountPassword, setPromotionAccountPassword] = useState("")

  // 현재 선택된 카테고리 정보
  const currentCategory = categories.find((c) => c.code === category)
  const isContactOnly = currentCategory?.contactRequired || false

  // 사무용품비/도서구입비/장비임차료일 때 금액 합계 자동 계산
  useEffect(() => {
    if (category === "office_supplies" || category === "books" || category === "equipment_rent") {
      const sum = officeItems.reduce((total, item) => total + item.amount, 0)
      setTotalAmount(sum)
    }
  }, [officeItems, category])

  // 기존 데이터 로드
  useEffect(() => {
    fetchRequestData()
  }, [id])

  const fetchRequestData = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("purchase_requests")
        .select("*")
        .eq("id", id)
        .single()

      if (error) throw error

      // 상태 확인 (제출됨, 임시저장, 반려 수정 가능)
      if (data.status !== "draft" && data.status !== "submitted" && data.status !== "rejected") {
        alert("수정 가능한 상태가 아닙니다.")
        router.push(`/portal/purchase-requests/${id}`)
        return
      }

      // 반려 상태인 경우 안내 메시지
      const isRejected = data.status === "rejected"

      // purpose JSON 파싱하여 각 필드에 값 설정
      if (data.purpose) {
        try {
          const parsed = JSON.parse(data.purpose)
          if (parsed.officeItems) setOfficeItems(parsed.officeItems)
          if (parsed.shippingInfo) setShippingInfo(parsed.shippingInfo)
          if (parsed.reason) setReason(parsed.reason)
          if (parsed.outsourcingType) setOutsourcingType(parsed.outsourcingType)
          if (parsed.companyName) setCompanyName(parsed.companyName)
          if (parsed.companyContact) setCompanyContact(parsed.companyContact)
          if (parsed.educationCourses) setEducationCourses(parsed.educationCourses)
          if (parsed.educationAgree) setEducationAgree(parsed.educationAgree)
          if (parsed.serviceAmountRange) setServiceAmountRange(parsed.serviceAmountRange)
          if (parsed.serviceCompanyName) setServiceCompanyName(parsed.serviceCompanyName)
          if (parsed.serviceContactEmail) setServiceContactEmail(parsed.serviceContactEmail)
          if (parsed.serviceContactPhone) setServiceContactPhone(parsed.serviceContactPhone)
          if (parsed.promotionName) setPromotionName(parsed.promotionName)
          if (parsed.promotionSiteUrl) setPromotionSiteUrl(parsed.promotionSiteUrl)
          if (parsed.promotionAccountId) setPromotionAccountId(parsed.promotionAccountId)
          if (parsed.promotionAccountPassword) setPromotionAccountPassword(parsed.promotionAccountPassword)
        } catch {
          // JSON 파싱 실패 시 원본 텍스트를 reason에 설정
          setReason(data.purpose)
        }
      }

      // 카테고리 코드 찾기
      const categoryCode = categories.find((c) => c.name === data.category)?.code || ""
      setCategory(categoryCode)
      setTotalAmount(data.requested_amount)

    } catch (error) {
      console.error("데이터 로드 실패:", error)
      alert("데이터 로드에 실패했습니다.")
      router.push("/portal/purchase-requests")
    } finally {
      setInitialLoading(false)
    }
  }

  // 사무용품 항목 추가
  const addOfficeItem = () => {
    setOfficeItems([
      ...officeItems,
      { id: Date.now().toString(), itemName: "", quantity: 1, option: "", link: "", amount: 0 }
    ])
  }

  // 사무용품 항목 삭제
  const removeOfficeItem = (id: string) => {
    if (officeItems.length > 1) {
      setOfficeItems(officeItems.filter((item) => item.id !== id))
    }
  }

  // 사무용품 항목 변경
  const updateOfficeItem = (id: string, field: keyof OfficeItemType, value: any) => {
    setOfficeItems(officeItems.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  // 위탁교육 강의 추가
  const addEducationCourse = () => {
    setEducationCourses([
      ...educationCourses,
      { courseName: "", courseLink: "", accountId: "", accountPassword: "" }
    ])
  }

  // 위탁교육 강의 삭제
  const removeEducationCourse = (index: number) => {
    if (educationCourses.length > 1) {
      setEducationCourses(educationCourses.filter((_, i) => i !== index))
    }
  }

  // 위탁교육 강의 변경
  const updateEducationCourse = (index: number, field: keyof EducationCourse, value: string) => {
    setEducationCourses(educationCourses.map((course, i) =>
      i === index ? { ...course, [field]: value } : course
    ))
  }

  // 제출 처리
  const handleSubmit = async () => {
    if (!category) {
      alert("구매분류를 선택해주세요.")
      return
    }

    if (isContactOnly) {
      alert("이 항목은 담당자에게 직접 문의해주세요.")
      return
    }

    if (!confirm("수정한 내용을 저장하고 재제출하시겠습니까?")) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      // 회사 ID 가져오기
      const { data: companies } = await supabase
        .from("user_companies")
        .select("company_id")
        .eq("user_id", user.id)
        .limit(1)

      const companyId = companies?.[0]?.company_id || ""

      if (!companyId) {
        alert("기업 정보를 찾을 수 없습니다.")
        return
      }

      // 카테고리별 아이템 이름 생성
      let itemName = ""
      let vendor = ""
      let detailInfo = ""

      switch (category) {
        case "office_supplies":
        case "books":
        case "equipment_rent":
          itemName = officeItems.map((i) => i.itemName).join(", ")
          vendor = shippingInfo.recipientName
          detailInfo = JSON.stringify({ officeItems, shippingInfo, reason })
          break
        case "outsourcing_fee":
          itemName = `${outsourcingType} - ${companyName}`
          vendor = companyName
          detailInfo = JSON.stringify({
            outsourcingType,
            companyName,
            companyContact,
            reason,
          })
          break
        case "education":
          itemName = educationCourses.map((c) => c.courseName).join(", ")
          vendor = "교육 플랫폼"
          detailInfo = JSON.stringify({ educationCourses, educationAgree })
          break
        case "service_fee":
          itemName = "용역비"
          vendor = serviceCompanyName
          detailInfo = JSON.stringify({
            serviceAmountRange,
            serviceCompanyName,
            serviceContactEmail,
            serviceContactPhone,
          })
          break
        case "promotion":
          itemName = promotionName
          vendor = promotionSiteUrl
          detailInfo = JSON.stringify({
            promotionName,
            promotionSiteUrl,
            promotionAccountId,
          })
          break
      }

      const { error } = await supabase
        .from("purchase_requests")
        .update({
          item_name: itemName,
          quantity: 1,
          unit_price: totalAmount || null,
          requested_amount: totalAmount,
          vendor: vendor,
          category: currentCategory?.name || category,
          purpose: detailInfo || reason,
          status: "submitted", // 재제출 시 상태를 제출됨으로 변경
          rejection_reason: null, // 반려 사유 초기화
          reviewed_by: null,
          reviewed_at: null,
        })
        .eq("id", id)

      if (error) throw error

      alert("재제출되었습니다.")
      router.push(`/portal/purchase-requests/${id}`)
    } catch (error) {
      console.error("재제출 실패:", error)
      alert("재제출에 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return <div className="text-center py-8">로딩 중...</div>
  }

  // 카테고리별 필드 렌더링
  const renderCategoryFields = () => {
    if (!currentCategory) return null

    switch (category) {
      case "office_supplies":
      case "books":
      case "equipment_rent":
        return (
          <div className="space-y-4">
            {/* 물품/도서/장비 목록 */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>
                  {category === "books" ? "도서" : category === "equipment_rent" ? "장비" : "물품"} 목록
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={addOfficeItem}>
                  + 항목 추가
                </Button>
              </div>

              {officeItems.map((item, index) => (
                <Card key={item.id} className="p-4">
                  <div className="grid grid-cols-[1fr_auto] gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>
                          {category === "books" ? "도서명" : category === "equipment_rent" ? "장비명" : "물품명"} *
                        </Label>
                        <Input
                          value={item.itemName}
                          onChange={(e) => updateOfficeItem(item.id, "itemName", e.target.value)}
                          placeholder={category === "books" ? "도서명 입력" : category === "equipment_rent" ? "장비명 입력" : "물품명 입력"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>개수 *</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateOfficeItem(item.id, "quantity", Number(e.target.value))}
                          min={1}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>옵션</Label>
                        <Input
                          value={item.option}
                          onChange={(e) => updateOfficeItem(item.id, "option", e.target.value)}
                          placeholder="옵션 입력"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>링크</Label>
                        <Input
                          value={item.link}
                          onChange={(e) => updateOfficeItem(item.id, "link", e.target.value)}
                          placeholder="구매 링크 입력"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>금액 ({currencies.find((c) => c.code === currency)?.symbol}) *</Label>
                        <CurrencyInput
                          value={item.amount}
                          onChange={(value) => updateOfficeItem(item.id, "amount", value ?? 0)}
                          min={0}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {officeItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOfficeItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        삭제
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* 배송 받는 사람 정보 */}
            <div className="space-y-3">
              <Label>배송 받는 사람 정보 *</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>이름 *</Label>
                  <Input
                    value={shippingInfo.recipientName}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, recipientName: e.target.value })}
                    placeholder="받는 사람 이름"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>주소 *</Label>
                  <Input
                    value={shippingInfo.address}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                    placeholder="배송지 주소"
                  />
                </div>
                <div className="space-y-2 col-span-3">
                  <Label>연락처 *</Label>
                  <Input
                    value={shippingInfo.contactPhone}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, contactPhone: e.target.value })}
                    placeholder="연락처 (010-0000-0000)"
                  />
                </div>
              </div>
            </div>

            {/* 필요한 사유 */}
            <div className="space-y-2">
              <Label>필요한 사유 *</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="구매가 필요한 사유를 설명하세요"
                rows={3}
              />
            </div>
          </div>
        )

      case "outsourcing_fee":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>구분 *</Label>
              <Select value={outsourcingType} onValueChange={setOutsourcingType}>
                <SelectTrigger>
                  <SelectValue placeholder="구분 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patent">특허/상표권출원</SelectItem>
                  <SelectItem value="paper">논문 게재</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>업체명 *</Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="업체명 입력"
              />
            </div>

            <div className="space-y-2">
              <Label>업체 담당자 *</Label>
              <Input
                value={companyContact}
                onChange={(e) => setCompanyContact(e.target.value)}
                placeholder="담당자명/연락처 입력"
              />
            </div>

            <div className="space-y-2">
              <Label>필요한 사유 *</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="업무 대행이 필요한 사유를 설명하세요"
                rows={3}
              />
            </div>
          </div>
        )

      case "education":
        return (
          <div className="space-y-4">
            {/* 강의 목록 */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>강의 정보 *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addEducationCourse}>
                  + 강의 추가
                </Button>
              </div>

              {educationCourses.map((course, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-[1fr_auto] gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>강의명 *</Label>
                        <Input
                          value={course.courseName}
                          onChange={(e) => updateEducationCourse(index, "courseName", e.target.value)}
                          placeholder="강의명 입력"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>강의 링크 *</Label>
                        <Input
                          value={course.courseLink}
                          onChange={(e) => updateEducationCourse(index, "courseLink", e.target.value)}
                          placeholder="강의 URL 입력"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>계정 아이디 *</Label>
                        <Input
                          value={course.accountId}
                          onChange={(e) => updateEducationCourse(index, "accountId", e.target.value)}
                          placeholder="계정 아이디 입력"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>계정 비밀번호 *</Label>
                        <Input
                          type="text"
                          value={course.accountPassword}
                          onChange={(e) => updateEducationCourse(index, "accountPassword", e.target.value)}
                          placeholder="비밀번호 입력"
                        />
                        <p className="text-xs text-amber-600">
                          주의: 반드시 평소에 사용하지 않는 비밀번호로 변경 후 작성해주세요
                        </p>
                      </div>
                    </div>

                    {educationCourses.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEducationCourse(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        삭제
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* 동의 체크박스 */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="education-agree"
                checked={educationAgree}
                onCheckedChange={(checked) => setEducationAgree(checked as boolean)}
              />
              <Label htmlFor="education-agree" className="text-sm cursor-pointer">
                저는 본 교육을 열심히 수강하여 협약 기간 내 교육 수료증 및 이수 확인서를 제출할 것입니다.
              </Label>
            </div>
          </div>
        )

      case "service_fee":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>금액 범위 *</Label>
              <Select value={serviceAmountRange} onValueChange={setServiceAmountRange}>
                <SelectTrigger>
                  <SelectValue placeholder="금액 범위 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under50">50만원 이하</SelectItem>
                  <SelectItem value="50to300">50만원 초과 300만원 미만</SelectItem>
                  <SelectItem value="over300">300만원 초과</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>공급업체명 *</Label>
              <Input
                value={serviceCompanyName}
                onChange={(e) => setServiceCompanyName(e.target.value)}
                placeholder="공급업체명 입력"
              />
            </div>

            <div className="space-y-2">
              <Label>담당자 이메일 *</Label>
              <Input
                type="email"
                value={serviceContactEmail}
                onChange={(e) => setServiceContactEmail(e.target.value)}
                placeholder="담당자 이메일 입력"
              />
            </div>

            <div className="space-y-2">
              <Label>담당자 연락처 *</Label>
              <Input
                value={serviceContactPhone}
                onChange={(e) => setServiceContactPhone(e.target.value)}
                placeholder="담당자 연락처 입력"
              />
            </div>
          </div>
        )

      case "promotion":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>구매요청명 *</Label>
              <Input
                value={promotionName}
                onChange={(e) => setPromotionName(e.target.value)}
                placeholder="홍보/마케팅 요청명 입력"
              />
            </div>

            <div className="space-y-2">
              <Label>사이트 URL *</Label>
              <Input
                value={promotionSiteUrl}
                onChange={(e) => setPromotionSiteUrl(e.target.value)}
                placeholder="마케팅 사이트 URL 입력"
              />
            </div>

            <div className="space-y-2">
              <Label>계정 아이디 *</Label>
              <Input
                value={promotionAccountId}
                onChange={(e) => setPromotionAccountId(e.target.value)}
                placeholder="계정 아이디 입력"
              />
            </div>

            <div className="space-y-2">
              <Label>계정 비밀번호 *</Label>
              <Input
                type="text"
                value={promotionAccountPassword}
                onChange={(e) => setPromotionAccountPassword(e.target.value)}
                placeholder="비밀번호 입력"
              />
              <p className="text-xs text-amber-600">
                주의: 반드시 평소에 사용하지 않는 비밀번호로 변경 후 작성해주세요
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* 반려 상태 안내 배너 */}
      <Alert className="bg-amber-50 border-amber-200">
        <AlertDescription className="text-sm">
          <p className="font-medium text-amber-700">반려된 요청을 수정하고 재제출합니다.</p>
          <p className="text-amber-600 mt-1">반려 사유를 확인하고 내용을 수정한 후 재제출해주세요.</p>
        </AlertDescription>
      </Alert>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">결제 및 구매 요청 수정</h1>
          <p className="text-muted-foreground">기존 요청 내용을 수정하고 재제출합니다</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          취소
        </Button>
      </div>

      {/* 기본 정보 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 구매분류 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">구매분류 *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="구매분류 선택" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.code} value={cat.code}>
                      {cat.name}
                      {cat.budgetCode && ` (${cat.budgetCode})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">화폐단위 *</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 총 금액 */}
          <div className="space-y-2">
            <Label htmlFor="totalAmount">
              총 금액 ({currencies.find((c) => c.code === currency)?.symbol}) *
            </Label>
            {category === "office_supplies" || category === "books" || category === "equipment_rent" ? (
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalAmount, { showSymbol: false })}
                <span className="text-lg font-normal text-gray-600 ml-1">원</span>
                <span className="text-sm text-gray-500 ml-2">(물품 금액 합계)</span>
              </div>
            ) : (
              <CurrencyInput
                id="totalAmount"
                value={totalAmount}
                onChange={(value) => setTotalAmount(value ?? 0)}
                min={0}
                placeholder="총 금액 입력"
              />
            )}
          </div>

          {/* 예산 코드 표시 */}
          {currentCategory?.budgetCode && (
            <div className="text-sm text-muted-foreground">
              예산 코드: {currentCategory.budgetCode}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 연락처만 있는 경우 */}
      {isContactOnly && currentCategory && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <InfoIcon className="h-12 w-12 mx-auto text-amber-600" />
              <div>
                <h3 className="font-semibold text-lg">{currentCategory.name}</h3>
                <p className="text-muted-foreground mt-2">
                  이 항목은 담당자에게 직접 문의해주세요.
                </p>
              </div>
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  이 항목은 담당자에게 직접 문의해주세요.
                </p>
                <p className="font-medium text-foreground">
                  choigo@postech.ac.kr
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 카테고리별 필드 */}
      {category && !isContactOnly && (
        <Card>
          <CardHeader>
            <CardTitle>{currentCategory?.name} 상세 정보</CardTitle>
          </CardHeader>
          <CardContent>
            {renderCategoryFields()}
          </CardContent>
        </Card>
      )}

      {/* 제출 버튼 */}
      {category && !isContactOnly && (
        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={loading} className="flex-1">
            {loading ? "재제출 중..." : "재제출"}
          </Button>
        </div>
      )}
    </div>
  )
}
