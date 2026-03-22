import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | undefined
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sessionPromise: Promise<any> | null = null

export function createClient() {
  if (client) return client
  
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  return client
}

export function getSharedSession() {
  const supabase = createClient()
  if (sessionPromise) return sessionPromise
  
  sessionPromise = supabase.auth.getSession()
  
  // Clear the cached promise shortly after to allow fresh fetches later
  setTimeout(() => {
    sessionPromise = null
  }, 1000)
  
  return sessionPromise
}
