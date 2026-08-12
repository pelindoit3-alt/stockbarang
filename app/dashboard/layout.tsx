import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayoutClient from '@/components/dashboard-layout-client'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // 1. Get the authenticated user
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // 2. Query the user's public profile role and name
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email, role, full_name')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    // Session is valid but profile is missing (e.g. table cleared). Force sign out.
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <DashboardLayoutClient profile={profile}>
      {children}
    </DashboardLayoutClient>
  )
}
