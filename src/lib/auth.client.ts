import { createClient } from "@/lib/supabase/client"
import type { Role } from "@/types"

/**
 * Get current user's roles (client-side only)
 */
export async function getUserRolesClient(): Promise<Role[]> {
  const supabase = createClient()

  // First check if we have a session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return []

  const { data } = await supabase
    .from("user_roles")
    .select("roles(code)")
    .eq("user_id", session.user.id)

  return (data?.map((r: any) => r.roles?.code).filter(Boolean) as Role[]) || []
}

/**
 * Check if user has specific role (client-side only)
 */
export async function hasRoleClient(role: Role): Promise<boolean> {
  const roles = await getUserRolesClient()
  return roles.includes(role)
}

/**
 * Client-side: Get current user
 */
export async function getCurrentUserClient() {
  const supabase = createClient()

  // First check if we have a session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return null

  const [roles, profileResult] = await Promise.all([
    getUserRolesClient(),
    supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .single()
  ])

  return {
    id: session.user.id,
    email: session.user.email,
    roles,
    profile: profileResult.data || null
  }
}
