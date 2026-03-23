import { createBrowserClient } from '@supabase/ssr'
import type { LockFunc } from '@supabase/auth-js'

let client: ReturnType<typeof createBrowserClient> | undefined
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sessionPromise: Promise<any> | null = null
const DEFAULT_TIMEOUT_MS = 15000
const noOpLock: LockFunc = async (_name, _acquireTimeout, fn) => fn()

function isTimeoutError(error: unknown) {
  return error instanceof Error && error.message.includes('timed out')
}

export function withTimeout<T>(
  promise: PromiseLike<T>,
  label: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    Promise.resolve(promise)
      .then((result) => {
        clearTimeout(timeoutId)
        resolve(result)
      })
      .catch((error) => {
        clearTimeout(timeoutId)
        reject(error)
      })
  })
}

export function resetClient() {
  client = undefined
  sessionPromise = null
}

export function createClient() {
  if (client) return client
  
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        lock: noOpLock,
      },
    }
  )
  
  return client
}

export async function runSupabaseOperation<T>(
  label: string,
  operation: (supabase: ReturnType<typeof createBrowserClient>) => PromiseLike<T>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const attempt = () => withTimeout(operation(createClient()), label, timeoutMs)

  try {
    return await attempt()
  } catch (error) {
    if (!isTimeoutError(error)) throw error

    console.warn(`${label} timed out. Recreating Supabase browser client and retrying once.`)
    resetClient()
    return attempt()
  }
}

export function getSharedSession() {
  if (sessionPromise) return sessionPromise
  
  sessionPromise = runSupabaseOperation(
    'Supabase session request',
    (supabase) => supabase.auth.getSession()
  ).finally(() => {
    sessionPromise = null
  })
  
  return sessionPromise
}
