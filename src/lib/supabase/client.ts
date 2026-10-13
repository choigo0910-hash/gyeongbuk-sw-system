import { createBrowserClient } from "@supabase/ssr"

/**
 * Create a Supabase client for Client Components
 * This client can be used in Client Components
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
