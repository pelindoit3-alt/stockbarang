import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UserManagementClient from './user-management-client'

export default async function UsersPage() {
  const supabase = await createClient()

  // 1. Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Fetch all user profiles sorted by creation date
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-sm font-semibold">
        <h3 className="font-bold text-lg mb-1">Gagal Memuat Daftar Pengguna</h3>
        <p className="text-xs font-normal mb-3">Pastikan Anda sudah mengeksekusi script SQL schema.sql di Supabase SQL Editor.</p>
        <code className="text-xs p-2 bg-slate-900 text-slate-100 rounded-md block overflow-auto max-w-full">
          {error.message}
        </code>
      </div>
    )
  }

  // Cast profiles as Profile[]
  const typedProfiles = (profiles || []).map(p => ({
    id: p.id,
    email: p.email,
    role: p.role,
    full_name: p.full_name,
    created_at: p.created_at
  }))

  return (
    <UserManagementClient 
      initialProfiles={typedProfiles} 
      currentUserId={user.id} 
    />
  )
}
