# 파일 관리 규칙

## 문서 정보

| 항목 | 내용 |
|------|------|
| 문서 버전 | 1.0 |
| 작성일 | 2026-07-11 |
| 최종 수정일 | 2026-07-11 |

## 설계 원칙

1. **Private First:** 기본적으로 private 버킷 사용
2. **Signed URL:** 다운로드는 Signed URL로
3. **권한 검증:** 모든 접근은 권한 검증
4. **명명 규칙:** 체계적인 파일명 관리
5. **이중 저장:** 원본명과 시스템명 모두 보관

---

## 1. Storage 구조

### 1.1 버킷 구조

```
gyeongbuk-sw-system/
├─ private/                    # Private 버킷
│  ├─ documents/               # 증빙자료
│  │  ├─ {user_id}/
│  │  │  ├─ proof-documents/
│  │  │  └─ refund-documents/
│  ├─ certificates/            # 확인서 PDF
│  │  └─ {program_id}/
│  ├─ program-attachments/     # 프로그램 신청 첨부파일
│  │  └─ {application_id}/
│  └─ temp/                    # 임시 업로드
└─ public/                     # Public 버킷 (선택)
   └─ logos/                   # 기업 로고 등
```

### 1.2 버킷 생성

```sql
-- Private 버킷
INSERT INTO storage.buckets (id, name, public)
VALUES ('private', 'private', false);

-- Public 버킷 (필요시)
INSERT INTO storage.buckets (id, name, public)
VALUES ('public', 'public', true);
```

---

## 2. 파일 업로드

### 2.1 업로드 절차

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ 파일 선택    │─────▶│ 임시 업로드 │─────▶│ DB 기록     │
│ (클라이언트) │      │ (temp/)     │      │ (files)     │
└─────────────┘      └─────────────┘      └──────┬──────┘
                                                   │
                                                   ▼
                                            ┌─────────────┐
                                            │ 최종 저장소  │
                                            │ 이동        │
                                            │ (documents/)│
                                            └─────────────┘
```

### 2.2 클라이언트 업로드

```typescript
// lib/supabase/client.ts
const supabase = createClient()

async function uploadFile(file: File, userId: string) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random()}.${fileExt}`
  const filePath = `${userId}/temp/${fileName}`

  const { data, error } = await supabase.storage
    .from('private')
    .upload(filePath, file)

  if (error) throw error

  return { path: data.path, originalName: file.name }
}
```

### 2.3 서버사이드 이동

임시 위치에서 최종 위치로 이동:

```typescript
async function moveToFinalLocation(
  tempPath: string,
  finalPath: string,
  systemFileName: string
) {
  // 파일 복사
  const { data: copy } = await supabase.storage
    .from('private')
    .copy(tempPath, finalPath)

  // 원본 삭제
  await supabase.storage
    .from('private')
    .remove([tempPath])

  return copy.path
}
```

---

## 3. 파일명 규칙

### 3.1 시스템 파일명 형식

**환급신청 증빙파일:**
```
{세목},{YYMMDD},[성장기업지원]{사용내용},{환급대상자명(기업명)},{구매처}.{확장자}
```

**예시:**
```
SaaS구독료,260711,[성장기업지원]Adobe구독,김철수(ABC테크),Adobe.kr.pdf
```

### 3.2 문자 치환

| 원본 문자 | 치환 문자 |
|----------|----------|
| `/` `` `\`` | `_` |
| `:` | `-` |
| `*` `?` `"` `<` `>` `\|` | (제거) |
| 공백 (연속) | `_` (하나) |
| 선행/후행 공백 | (제거) |

### 3.3 파일명 생성 함수

```typescript
function generateSystemFileName(params: {
  category: string
  paymentDate: Date
  purpose: string
  recipientName: string
  companyName?: string
  vendor: string
  extension: string
}): string {
  const yy = String(params.paymentDate.getFullYear()).slice(-2)
  const mm = String(params.paymentDate.getMonth() + 1).padStart(2, '0')
  const dd = String(params.paymentDate.getDate()).padStart(2, '0')

  const category = sanitizeFilename(params.category)
  const purpose = sanitizeFilename(params.purpose)
  const recipient = sanitizeFilename(params.recipientName)
  const company = params.companyName ? `(${sanitizeFilename(params.companyName)})` : ''
  const vendor = sanitizeFilename(params.vendor)
  const ext = params.extension.replace('.', '')

  return `${category},${yy}${mm}${dd},[성장기업지원]${purpose},${recipient}${company},${vendor}.${ext}`
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[\/\\:*?"<>|]/g, '')
    .replace(/\s+/g, '_')
    .trim()
}
```

### 3.4 파일명 중복 방지

```typescript
async function ensureUniqueFileName(bucket: string, path: string): Promise<string> {
  const { data: existing } = await supabase.storage
    .from(bucket)
    .list(path.split('/').slice(0, -1).join('/'))

  const baseName = path.substring(0, path.lastIndexOf('.'))
  const ext = path.substring(path.lastIndexOf('.'))

  let counter = 1
  let uniquePath = path

  while (existing?.some(f => f.name === uniquePath.split('/').pop())) {
    uniquePath = `${baseName}_${counter}${ext}`
    counter++
  }

  return uniquePath
}
```

---

## 4. 파일 다운로드

### 4.1 Signed URL 생성

```typescript
async function getDownloadUrl(
  filePath: string,
  expiresIn: number = 60
): Promise<string> {
  const { data, error } = await supabase.storage
    .from('private')
    .createSignedUrl(filePath, expiresIn)

  if (error) throw error

  return data.signedUrl
}
```

### 4.2 권한 검증

다운로드 전 파일 접근 권한 확인:

```typescript
async function canAccessFile(userId: string, fileId: string): Promise<boolean> {
  // DB에서 파일 정보 조회
  const { data: file } = await supabase
    .from('files')
    .select('*, proof_documents(*), refund_applications(*)')
    .eq('id', fileId)
    .single()

  if (!file) return false

  // 기업 사용자: 자사 파일만
  const { data: userRole } = await getUserRole(userId)
  if (userRole === 'company_user') {
    // 파일이 속한 기업 확인
    const companyIds = await getUserCompanyIds(userId)
    return companyIds.includes(file.company_id)
  }

  // 관리자: 담당 사업 파일
  if (userRole === 'admin') {
    const programIds = await getAdminProgramIds(userId)
    return programIds.includes(file.program_id)
  }

  // Super Admin: 전체
  return userRole === 'super_admin'
}
```

### 4.3 다운로드 API 라우트

```typescript
// app/api/files/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 권한 확인
  const canAccess = await canAccessFile(user.id, params.id)
  if (!canAccess) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 파일 정보 조회
  const { data: file } = await supabase
    .from('files')
    .select('file_path, original_file_name')
    .eq('id', params.id)
    .single()

  // Signed URL 생성
  const url = await getDownloadUrl(file.file_path, 3600) // 1시간

  // 리다이렉트
  return Response.redirect(url)
}
```

---

## 5. 파일 DB 기록

### 5.1 파일 테이블

```sql
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_file_name TEXT NOT NULL,
  system_file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  bucket_name TEXT NOT NULL DEFAULT 'private',
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 연결 테이블

**proof_documents (구매요청 증빙):**
```sql
CREATE TABLE proof_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_request_id UUID REFERENCES purchase_requests(id) NOT NULL,
  file_id UUID REFERENCES files(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT
);
```

---

## 6. RLS 정책

### 6.1 Storage RLS

```sql
-- 업로드: 인증된 사용자만
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'private'
  AND auth.role() = 'authenticated'
);

-- 다운로드: 소유자만 (기본 정책)
CREATE POLICY "Users can download own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'private'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 관리자는 전체 접근 가능 (별도 API 라우트에서 처리)
```

### 6.2 Files 테이블 RLS

```sql
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- 본인 업로드 파일만 조회
CREATE POLICY "Users can view own uploaded files"
ON files FOR SELECT
USING (uploaded_by = auth.uid());
```

---

## 7. 파일 크기 및 형식 제한

### 7.1 제한 설정

```env
NEXT_PUBLIC_MAX_FILE_SIZE=10485760        # 10MB
NEXT_PUBLIC_ALLOWED_FILE_EXTENSIONS=.pdf,.jpg,.jpeg,.png,.hwp,.hwpx,.xlsx,.xls
```

### 7.2 검증

```typescript
const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_EXTS = ['.pdf', '.jpg', '.jpeg', '.png', '.hwp', '.hwpx', '.xlsx', '.xls']

function validateFile(file: File): { valid: boolean; error?: string } {
  // 크기 확인
  if (file.size > MAX_SIZE) {
    return { valid: false, error: '파일 크기는 10MB 이하여야 합니다' }
  }

  // 확장자 확인
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!ALLOWED_EXTS.includes(ext)) {
    return { valid: false, error: '허용되지 않는 파일 형식입니다' }
  }

  return { valid: true }
}
```

---

## 8. PDF 생성 (확인서)

### 8.1 PDF 생성 라이브러리

```typescript
import { PDFDocument, rgb } from 'pdf-lib'

async function generateCertificate(cert: Certificate): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842]) // A4

  const { width, height } = page.getSize()

  // 텍스트 추가
  page.drawText(cert.participant_name, {
    x: 200,
    y: height - 200,
    size: 20,
    color: rgb(0, 0, 0),
  })

  // ...

  return await pdfDoc.save()
}
```

### 8.2 PDF 저장

```typescript
async function saveCertificatePDF(
  applicationId: string,
  pdfBytes: Uint8Array
): Promise<string> {
  const fileName = `certificate-${applicationId}-${Date.now()}.pdf`
  const path = `certificates/${applicationId}/${fileName}`

  const { data, error } = await supabase.storage
    .from('private')
    .upload(path, pdfBytes, {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (error) throw error

  return data.path
}
```

---

## 9. 파일 삭제

### 9.1 Soft Delete

물리 삭제는 지양, deleted_at 표시:

```typescript
async function softDeleteFile(fileId: string) {
  await supabase
    .from('files')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', fileId)
}
```

### 9.2 실제 삭제 (관리자)

```typescript
async function hardDeleteFile(fileId: string, filePath: string) {
  // Storage에서 삭제
  await supabase.storage.from('private').remove([filePath])

  // DB에서 삭제
  await supabase.from('files').delete().eq('id', fileId)
}
```

---

## 10. 보안 체크리스트

### 업로드 시
- [ ] 파일 크기 확인
- [ ] 파일 형식 확인
- [ ] MIME 타입 검증
- [ ] 바이러스 스캔 (선택)

### 다운로드 시
- [ ] 사용자 인증
- [ ] 파일 접근 권한 확인
- [ ] Signed URL 유효기간 설정

### 저장 시
- [ ] Private 버킷 사용
- [ ] 원본명과 시스템명 모두 보관
- [ ] RLS 정책 적용

---

## 참고 문서

- [06-database-conceptual-design.md](./06-database-conceptual-design.md) - DB 설계
- [07-security-rules.md](./07-security-rules.md) - 보안 규칙
