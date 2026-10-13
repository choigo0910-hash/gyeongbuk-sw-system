"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { getCurrentUserClient } from "@/lib/auth.client"
import { Role } from "@/types"
import { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string
  avatar_url?: string
}

interface AuthUser {
  id: string
  email: string | null
  roles: Role[]
  profile: UserProfile | null
}

interface UserContextType {
  user: AuthUser | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  logout: () => Promise<void>
  hasRole: (role: Role) => boolean
  isAdmin: () => boolean
  isSuperAdmin: () => boolean
  isCompanyUser: () => boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    setLoading(true)
    setError(null)

    try {
      const userData = await getCurrentUserClient()
      setUser(userData ? {
        ...userData,
        email: userData.email || null,
      } as AuthUser : null)
    } catch (err) {
      console.error("Failed to fetch user:", err)
      setError("사용자 정보를 가져오지 못했습니다.")
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    router.push("/login")
  }

  useEffect(() => {
    // Set up auth state listener
    const supabase = createClient()

    let mounted = true

    // Get initial session and user data
    const initializeAuth = async () => {
      try {
        // First get the session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Session error:", sessionError)
          if (mounted) {
            setError("세션을 가져오지 못했습니다.")
            setLoading(false)
          }
          return
        }

        if (session?.user) {
          console.log("Initial session found for:", session.user.email)
          await refresh()
        } else {
          console.log("No initial session found")
          if (mounted) {
            setUser(null)
            setLoading(false)
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err)
        if (mounted) {
          setError("인증 초기화에 실패했습니다.")
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Then listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email)

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          await refresh()
        } else if (event === "SIGNED_OUT") {
          if (mounted) {
            setUser(null)
            setLoading(false)
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const hasRole = (role: Role): boolean => {
    return user?.roles.includes(role) ?? false
  }

  const isAdmin = (): boolean => {
    return hasRole("admin" as Role) || hasRole("super_admin" as Role)
  }

  const isSuperAdmin = (): boolean => {
    return hasRole("super_admin" as Role)
  }

  const isCompanyUser = (): boolean => {
    return hasRole("company_user" as Role)
  }

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        error,
        refresh,
        logout,
        hasRole,
        isAdmin,
        isSuperAdmin,
        isCompanyUser,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
