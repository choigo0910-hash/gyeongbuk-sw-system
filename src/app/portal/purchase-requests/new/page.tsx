"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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

export default function NewPurchaseRequestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

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
  const [quoteFile, setQuoteFile] = useState<File | null>(null)
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([])

  // 위탁교육비 필드
  const [educationPlanFile, setEducationPlanFile] = useState<File | null>(null)
  const [educationCourses, setEducationCourses] = useState<EducationCourse[]>([
    { courseName: "", courseLink: "", accountId: "", accountPassword: "" }
  ])
  const [educationAgree, setEducationAgree] = useState(false)

  // 용역비 필드
  const [serviceAmountRange, setServiceAmountRange] = useState("")
  const [serviceCompanyName, setServiceCompanyName] = useState("")
  const [serviceContactEmail, setServiceContactEmail] = useState("")
  const [serviceContactPhone, setServiceContactPhone] = useState("")
  const [serviceFiles, setServiceFiles] = useState<File[]>([])

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

    if (!confirm("결제 및 구매 요청을 제출하시겠습니까?")) return

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
        .insert({
          company_id: companyId,
          requester_id: user.id,
          item_name: itemName,
          quantity: 1,
          unit_price: totalAmount || null,
          requested_amount: totalAmount,
          vendor: vendor,
          category: currentCategory?.name || category,
          purpose: detailInfo || reason,
          status: "submitted",
        })

      if (error) throw error

      alert("결제 및 구매 요청이 제출되었습니다.")
      router.push("/portal/purchase-requests")
    } catch (error) {
      console.error("제출 실패:", error)
      alert("제출에 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }

  // 현재 카테고리에 따른 설명 렌더링
  const renderCategoryDescription = () => {
    if (!currentCategory) return null

    switch (category) {
      case "office_supplies":
        return (
          <Alert className="mb-4">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2 text-sm">
                <p>본 사업은 SW기업 지원을 위한 사업이므로 목적과 맞지 않은 요청사항은 반려될 수 있습니다.</p>
                <p>물품을 받고 나서 반드시 사진을 찍어 증빙서에 사진을 넣어 올려주세요.</p>
                <Button variant="link" className="p-0 h-auto text-sm" asChild>
                  <a href="/docs/proof-template.xlsx" target="_blank" rel="noopener noreferrer">
                    증빙서 양식 다운로드 →
                  </a>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )

      case "outsourcing_fee":
        return (
          <Alert className="mb-4">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2 text-sm">
                <p>출원 및 게재 프로세스는 팀에서 진행하며, 결제 단계에서 결제 요청을 해주세요.</p>
              </div>
            </AlertDescription>
          </Alert>
        )

      case "books":
        return (
          <Alert className="mb-4">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2 text-sm">
                <p>본 사업은 SW기업 지원을 위한 사업이므로 목적과 맞지 않은 요청사항은 반려될 수 있습니다.</p>
                <p>도서를 받고 나서 반드시 사진을 찍어 증빙서에 사진을 넣어 올려주세요.</p>
                <Button variant="link" className="p-0 h-auto text-sm" asChild>
                  <a href="/docs/proof-template.xlsx" target="_blank" rel="noopener noreferrer">
                    증빙서 양식 다운로드 →
                  </a>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )

      case "education":
        return (
          <Alert className="mb-4">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2 text-sm">
                <p>여러 건을 수강하더라도 각각 자료 제출이 필요합니다.</p>
                <p>계정 비밀번호는 반드시 평소에 사용하지 않는 비밀번호로 변경 후 작성해주세요.</p>
              </div>
            </AlertDescription>
          </Alert>
        )

      case "service_fee":
        return (
          <Alert className="mb-4">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2 text-sm">
                <p>용역비는 포스텍 구매팀에서 진행하며, 계약 진행은 1-2주 정도 소요될 수 있습니다.</p>
                <p>선금 지급은 불가능하니 이 점 참고하여 계획을 수립해주세요.</p>
                <Button variant="link" className="p-0 h-auto text-sm" asChild>
                  <a href="/docs/service-request-form.docx" target="_blank" rel="noopener noreferrer">
                    연구 용역비 신청서류 다운로드 →
                  </a>
                </Button>
                <p className="text-xs text-gray-600">용역은 부가세 포함 2,000만원 이내로 집행 가능하며, 금액에 따라 제출 서류가 다릅니다.</p>
              </div>
            </AlertDescription>
          </Alert>
        )

      case "promotion":
        return (
          <Alert className="mb-4">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2 text-sm">
                <p>온라인 마케팅 직접 집행은 별도 신청 없이 증빙자료 제출 후 환급됩니다.</p>
                <p>온라인 마케팅 업체 사용 시 연구용역비(207-01)로 신청해주세요.</p>
                <p>장바구니에 결제 요청 건을 추가한 후 계정 정보를 전달해주세요. (사전에 기본 배송지 등록 필수)</p>
              </div>
            </AlertDescription>
          </Alert>
        )

      default:
        return null
    }
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
                          value={item.itemName || ""}
                          onChange={(e) => updateOfficeItem(item.id, "itemName", e.target.value)}
                          placeholder={category === "books" ? "도서명 입력" : category === "equipment_rent" ? "장비명 입력" : "물품명 입력"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>개수 *</Label>
                        <Input
                          type="number"
                          value={item.quantity || 1}
                          onChange={(e) => updateOfficeItem(item.id, "quantity", Number(e.target.value))}
                          min={1}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>옵션</Label>
                        <Input
                          value={item.option || ""}
                          onChange={(e) => updateOfficeItem(item.id, "option", e.target.value)}
                          placeholder="옵션 입력"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>링크</Label>
                        <Input
                          value={item.link || ""}
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
                    value={shippingInfo.recipientName || ""}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, recipientName: e.target.value })}
                    placeholder="받는 사람 이름"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>주소 *</Label>
                  <Input
                    value={shippingInfo.address || ""}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                    placeholder="배송지 주소"
                  />
                </div>
                <div className="space-y-2 col-span-3">
                  <Label>연락처 *</Label>
                  <Input
                    value={shippingInfo.contactPhone || ""}
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
                value={reason || ""}
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
                value={companyName || ""}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="업체명 입력"
              />
            </div>

            <div className="space-y-2">
              <Label>업체 담당자 *</Label>
              <Input
                value={companyContact || ""}
                onChange={(e) => setCompanyContact(e.target.value)}
                placeholder="담당자명/연락처 입력"
              />
            </div>

            <div className="space-y-2">
              <Label>견적서 파일 *</Label>
              <Input
                type="file"
                onChange={(e) => setQuoteFile(e.target.files?.[0] || null)}
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </div>

            <div className="space-y-2">
              <Label>추가 증빙파일 (특허/상표권 명세서, 논문 파일 등)</Label>
              <Input
                type="file"
                multiple
                onChange={(e) => setAdditionalFiles(Array.from(e.target.files || []))}
                accept=".pdf,.doc,.docx,.hwp"
              />
            </div>

            <div className="space-y-2">
              <Label>필요한 사유 *</Label>
              <Textarea
                value={reason || ""}
                onChange={(e) => setReason(e.target.value)}
                placeholder="업무 대행이 필요한 사유를 설명하세요"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>총 금액 ({currencies.find((c) => c.code === currency)?.symbol}) *</Label>
              <CurrencyInput
                value={totalAmount}
                onChange={(value) => setTotalAmount(value ?? 0)}
                min={0}
                placeholder="총 금액 입력"
              />
            </div>
          </div>
        )

      case "education":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>학습 계획서 (수강 계획서) *</Label>
              <Input
                type="file"
                onChange={(e) => setEducationPlanFile(e.target.files?.[0] || null)}
                accept=".pdf,.doc,.docx"
              />
            </div>

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
                          value={course.courseName || ""}
                          onChange={(e) => updateEducationCourse(index, "courseName", e.target.value)}
                          placeholder="강의명 입력"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>강의 링크 *</Label>
                        <Input
                          value={course.courseLink || ""}
                          onChange={(e) => updateEducationCourse(index, "courseLink", e.target.value)}
                          placeholder="강의 URL 입력"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>계정 아이디 *</Label>
                        <Input
                          value={course.accountId || ""}
                          onChange={(e) => updateEducationCourse(index, "accountId", e.target.value)}
                          placeholder="계정 아이디 입력"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>계정 비밀번호 *</Label>
                        <Input
                          type="text"
                          value={course.accountPassword || ""}
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

            <div className="space-y-2">
              <Label>총 금액 ({currencies.find((c) => c.code === currency)?.symbol}) *</Label>
              <CurrencyInput
                value={totalAmount}
                onChange={(value) => setTotalAmount(value ?? 0)}
                min={0}
                placeholder="총 금액 입력"
              />
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

            {/* 제출 서류 안내 */}
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-sm space-y-2">
                <p className="font-medium">공통 제출 서류:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>사업자등록증</li>
                  <li>통장사본</li>
                  <li>공급업체윤리준수 서약서</li>
                  <li>담당자 이메일, 연락처</li>
                </ul>
                {serviceAmountRange === "under50" && (
                  <p className="font-medium mt-2">50만원 이하: 견적서</p>
                )}
                {(serviceAmountRange === "50to300" || serviceAmountRange === "under50") && (
                  <p className="font-medium mt-2">50만원 초과 300만원 미만: 견적서</p>
                )}
                {serviceAmountRange === "over300" && (
                  <p className="font-medium mt-2">300만원 초과: 견적서, 과업지시서(한글파일), 수의계약요청사유서(한글파일)</p>
                )}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>공급업체명 *</Label>
              <Input
                value={serviceCompanyName || ""}
                onChange={(e) => setServiceCompanyName(e.target.value)}
                placeholder="공급업체명 입력"
              />
            </div>

            <div className="space-y-2">
              <Label>담당자 이메일 *</Label>
              <Input
                type="email"
                value={serviceContactEmail || ""}
                onChange={(e) => setServiceContactEmail(e.target.value)}
                placeholder="담당자 이메일 입력"
              />
            </div>

            <div className="space-y-2">
              <Label>담당자 연락처 *</Label>
              <Input
                value={serviceContactPhone || ""}
                onChange={(e) => setServiceContactPhone(e.target.value)}
                placeholder="담당자 연락처 입력"
              />
            </div>

            <div className="space-y-2">
              <Label>제출 서류 파일 *</Label>
              <Input
                type="file"
                multiple
                onChange={(e) => setServiceFiles(Array.from(e.target.files || []))}
                accept=".pdf,.doc,.docx,.hwp"
              />
            </div>

            <div className="space-y-2">
              <Label>총 금액 ({currencies.find((c) => c.code === currency)?.symbol}) *</Label>
              <CurrencyInput
                value={totalAmount}
                onChange={(value) => setTotalAmount(value ?? 0)}
                min={0}
                placeholder="총 금액 입력"
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
                value={promotionName || ""}
                onChange={(e) => setPromotionName(e.target.value)}
                placeholder="홍보/마케팅 요청명 입력"
              />
            </div>

            <div className="space-y-2">
              <Label>사이트 URL *</Label>
              <Input
                value={promotionSiteUrl || ""}
                onChange={(e) => setPromotionSiteUrl(e.target.value)}
                placeholder="마케팅 사이트 URL 입력"
              />
            </div>

            <div className="space-y-2">
              <Label>계정 아이디 *</Label>
              <Input
                value={promotionAccountId || ""}
                onChange={(e) => setPromotionAccountId(e.target.value)}
                placeholder="계정 아이디 입력"
              />
            </div>

            <div className="space-y-2">
              <Label>계정 비밀번호 *</Label>
              <Input
                type="text"
                value={promotionAccountPassword || ""}
                onChange={(e) => setPromotionAccountPassword(e.target.value)}
                placeholder="비밀번호 입력"
              />
              <p className="text-xs text-amber-600">
                주의: 반드시 평소에 사용하지 않는 비밀번호로 변경 후 작성해주세요
              </p>
            </div>

            <div className="space-y-2">
              <Label>총 금액 ({currencies.find((c) => c.code === currency)?.symbol}) *</Label>
              <CurrencyInput
                value={totalAmount}
                onChange={(value) => setTotalAmount(value ?? 0)}
                min={0}
                placeholder="총 금액 입력"
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">결제 및 구매 요청 작성</h1>
          <p className="text-muted-foreground">새로운 결제 및 구매 요청을 작성합니다</p>
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

          {/* 총 금액 - 자동 계산 표시 */}
          {category && !isContactOnly && (
            <div className="space-y-2">
              <Label>총 금액</Label>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalAmount, { showSymbol: false })}
                <span className="text-lg font-normal text-gray-600 ml-1">원</span>
              </div>
            </div>
          )}

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
                <p className="font-medium text-foreground mt-3">
                  choigo@postech.ac.kr
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 카테고리별 필드 */}
      {category && !isContactOnly && (
        <>
          {renderCategoryDescription()}

          <Card>
            <CardHeader>
              <CardTitle>{currentCategory?.name} 상세 정보</CardTitle>
            </CardHeader>
            <CardContent>
              {renderCategoryFields()}
            </CardContent>
          </Card>
        </>
      )}

      {/* 제출 버튼 */}
      {category && !isContactOnly && (
        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={loading} className="flex-1">
            {loading ? "제출 중..." : "제출"}
          </Button>
        </div>
      )}
    </div>
  )
}
