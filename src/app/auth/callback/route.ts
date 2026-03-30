import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/home'

  // Use the configured site URL in production to avoid origin mismatches
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, role')
          .eq('id', user.id)
          .maybeSingle()

        // If no name is set, redirect to onboarding
        if (!profile || !profile.name) {
          return NextResponse.redirect(`${siteUrl}/onboarding`)
        }
      }

      return NextResponse.redirect(`${siteUrl}${next}`)
    }
  }

  // return the user to the login page with an error
  return NextResponse.redirect(`${siteUrl}/login?error=Invalid_or_expired_login_link`)
}
