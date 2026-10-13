/**
 * 엑셀 파일 처리 유틸리티
 */

import * as XLSX from 'xlsx'

/**
 * 엑셀 템플릿 데이터 생성
 */
export function generateBudgetTemplate() {
  const worksheetData = [
    // 헤더
    ['카테고리', '세목', '품목', '상세 내용', '수량', '단가(원)', '금액(원)'],
    // 예시 데이터
    ['물품비', '사무용품', '노트북', '개발용 노트북', 1, 2000000, 2000000],
    ['물품비', '사무용품', '모니터', '27인치 모니터', 2, 300000, 600000],
    ['교육비', '직원교육', '개발자 교육', 'React 교육과정', 5, 150000, 750000],
    ['', '', '', '', '', '합계', '=SUM(G2:G4)'],
  ]

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  // 컬럼 너비 설정
  worksheet['!cols'] = [
    { wch: 12 }, // 카테고리
    { wch: 15 }, // 세목
    { wch: 12 }, // 품목
    { wch: 20 }, // 상세 내용
    { wch: 8 },  // 수량
    { wch: 12 }, // 단가
    { wch: 12 }, // 금액
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '예산서')

  return workbook
}

/**
 * 엑셀 파일 파싱
 */
export function parseBudgetExcel(buffer: ArrayBuffer) {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

  // 헤더 확인 (첫 번째 행)
  if (!data || data.length < 2) {
    throw new Error('엑셀 파일에 데이터가 없습니다.')
  }

  const headers = data[0] as string[]
  const requiredColumns = ['카테고리', '세목', '금액(원)']

  for (const col of requiredColumns) {
    if (!headers.includes(col)) {
      throw new Error(`필수 컬럼이 없습니다: ${col}`)
    }
  }

  // 데이터 행 파싱 (헤더 제외)
  const items = data.slice(1).map((row, index) => {
    const item: any = {}

    headers.forEach((header, colIndex) => {
      item[header] = row[colIndex]
    })

    // 빈 행은 건너뜀
    if (!item['카테고리'] && !item['세목']) {
      return null
    }

    // 합계 행은 건너뜀
    if (item['카테고리']?.includes('합계')) {
      return null
    }

    return {
      category: item['카테고리'] || '',
      detail: item['세목'] || '',
      item: item['품목'] || null,
      description: item['상세 내용'] || null,
      quantity: item['수량'] ? Number(item['수량']) : null,
      unit_price: item['단가(원)'] ? Number(item['단가(원)']) : null,
      amount: item['금액(원)'] ? Number(item['금액(원)']) : 0,
      sort_order: index + 1,
    }
  }).filter(Boolean)

  return items
}

/**
 * 예산서 엑셀 다운로드
 */
export function downloadBudgetTemplate() {
  const workbook = generateBudgetTemplate()
  XLSX.writeFile(workbook, '예산서_템플릿.xlsx')
}

/**
 * 예산서 엑셀 내보내기
 */
export function exportBudgetToExcel(budget: any, items: any[]) {
  const worksheetData = [
    ['예산서 정보'],
    ['연도', budget.fiscal_year],
    ['총액', budget.total_amount],
    ['상태', budget.status],
    [],
    ['예산 항목'],
    ['카테고리', '세목', '품목', '상세 내용', '수량', '단가(원)', '금액(원)'],
    ...items.map(item => [
      item.category,
      item.detail,
      item.item || '',
      item.description || '',
      item.quantity || '',
      item.unit_price || '',
      item.amount,
    ]),
  ]

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '예산서')

  XLSX.writeFile(workbook, `예산서_${budget.fiscal_year}년.xlsx`)
}
