import { createClient as createBrowserClient } from "@/lib/supabase/client"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { Role } from "@/types"

/**
 * Get current user's roles (client-side)
 */
export async function getUserRolesClient(): Promise<Role[]> {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data } = await supabase
    .from("user_roles")
    .select("roles(code)")
    .eq("user_id", user.id)

  return (data?.map((r: any) => r.roles?.code).filter(Boolean) as Role[]) || []
}

/**
 * Get current user's roles (server-side)
 */
export async function getUserRolesServer(): Promise<Role[]> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data } = await supabase
    .from("user_roles")
    .select("roles(code)")
    .eq("user_id", user.id)

  return (data?.map((r: any) => r.roles?.code).filter(Boolean) as Role[]) || []
}

/**
 * Check if user has specific role (client-side)
 */
export async function hasRole(role: Role): Promise<boolean> {
  const roles = await getUserRolesClient()
  return roles.includes(role)
}

/**
 * Check if user is company user
 */
export async function isCompanyUser(): Promise<boolean> {
  return await hasRole(Role.COMPANY_USER)
}

/**
 * Check if user is admin or super admin
 */
export async function isAdmin(): Promise<boolean> {
  const roles = await getUserRolesServer()
  return roles.includes(Role.ADMIN) || roles.includes(Role.SUPER_ADMIN)
}

/**
 * Check if user is super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  const roles = await getUserRolesServer()
  return roles.includes(Role.SUPER_ADMIN)
}

/**
 * Get user's company IDs (for company users)
 */
export async function getUserCompanyIds(): Promise<string[]> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data } = await supabase
    .from("user_companies")
    .select("company_id")
    .eq("user_id", user.id)

  return (data?.map((c: any) => c.company_id) as string[]) || []
}

/**
 * Require authentication - throw if not authenticated
 */
export async function requireAuth() {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Authentication required")
  }

  return user
}

/**
 * Require specific role - throw if user doesn't have role
 */
export async function requireRole(role: Role) {
  await requireAuth()
  const roles = await getUserRolesServer()

  if (!roles.includes(role)) {
    throw new Error(`Role ${role} required`)
  }
}

/**
 * Require admin role - throw if not admin or super admin
 */
export async function requireAdmin() {
  await requireAuth()

  const hasAdminRole = await isAdmin()
  if (!hasAdminRole) {
    throw new Error("Admin role required")
  }
}

/**
 * Get user's primary company (for company users)
 */
export async function getPrimaryCompany(): Promise<{ id: string; name: string } | null> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from("user_companies")
    .select("company_id, companies(id, name)")
    .eq("user_id", user.id)
    .eq("is_primary", true)
    .single()

  return data as any
}

/**
 * Get current user profile
 */
export async function getUserProfile() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single()

  return data
}

/**
 * Get current user with roles and profile
 */
export async function getCurrentUser() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [roles, profileResult] = await Promise.all([
    getUserRolesServer(),
    supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()
  ])

  return {
    id: user.id,
    email: user.email,
    roles,
    profile: profileResult.data || null
  }
}

/**
 * Check if user can access company data
 * (company users can only access their own company's data)
 */
export async function canAccessCompany(companyId: string): Promise<boolean> {
  const roles = await getUserRolesServer()

  // Admins and super admins can access all companies
  if (roles.includes(Role.ADMIN) || roles.includes(Role.SUPER_ADMIN)) {
    return true
  }

  // Company users can only access their own companies
  const userCompanyIds = await getUserCompanyIds()
  return userCompanyIds.includes(companyId)
}

/**
 * Require company access - throw if user cannot access the company
 */
export async function requireCompanyAccess(companyId: string) {
  const canAccess = await canAccessCompany(companyId)
  if (!canAccess) {
    throw new Error("Access denied to this company")
  }
}

/**
 * Client-side: Get current user
 */
export async function getCurrentUserClient() {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [roles, profileResult] = await Promise.all([
    getUserRolesClient(),
    supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()
  ])

  return {
    id: user.id,
    email: user.email,
    roles,
    profile: profileResult.data || null
  }
}
