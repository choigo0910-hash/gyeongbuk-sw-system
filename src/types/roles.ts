/**
 * User roles for gyeongbuk-sw-system
 */

export enum Role {
  COMPANY_USER = "company_user",
  COMPANY_ADMIN = "company_admin",
  INDIVIDUAL_USER = "individual_user",
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
  STAFF = "staff",
}

export const roleLabels: Record<Role, string> = {
  [Role.COMPANY_USER]: "기업 사용자",
  [Role.COMPANY_ADMIN]: "기업 관리자",
  [Role.INDIVIDUAL_USER]: "개인 참가자",
  [Role.ADMIN]: "운영 관리자",
  [Role.SUPER_ADMIN]: "최고 관리자",
  [Role.STAFF]: "스태프",
}

export type UserRole = {
  id: string
  user_id: string
  role_code: Role
  created_at: string
}

export type UserWithRoles = {
  id: string
  email: string
  roles: Role[]
  company_id?: string
}
