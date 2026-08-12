'use server'

import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function createUser(formData: {
  email: string
  fullName: string
  role: 'admin' | 'staff'
  password: string
}) {
  const { email, fullName, role, password } = formData

  if (!email || !fullName || !role || !password) {
    return { error: 'Semua kolom input wajib diisi.' }
  }

  try {
    // 1. Verify that the caller is authenticated and is a superadmin
    const supabaseServer = await createServerClient()
    const { data: { user: currentUser } } = await supabaseServer.auth.getUser()

    if (!currentUser) {
      return { error: 'Sesi habis, silakan login kembali.' }
    }

    const { data: profile, error: profileErr } = await supabaseServer
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    if (profileErr || profile?.role !== 'superadmin') {
      return { error: 'Akses ditolak: Hanya Superadmin yang diizinkan untuk menambah user baru.' }
    }

    // 2. Instantiate an independent Supabase client with persistSession: false.
    // This allows us to call signUp on the server without overwriting the superadmin's cookie session.
    const supabaseAuth = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      }
    )

    // 3. Trigger sign up for the new account
    const { data, error } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          full_name: fullName
        }
      }
    })

    if (error) {
      return { error: error.message }
    }

    return { success: true, user: data.user }
  } catch (err: any) {
    return { error: 'Terjadi kesalahan sistem: ' + err.message }
  }
}

export async function deleteUser(targetUserId: string) {
  if (!targetUserId) {
    return { error: 'ID user tidak valid.' }
  }

  try {
    // 1. Verify caller's session
    const supabaseServer = await createServerClient()
    const { data: { user: currentUser } } = await supabaseServer.auth.getUser()

    if (!currentUser) {
      return { error: 'Sesi habis, silakan login kembali.' }
    }

    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    if (profile?.role !== 'superadmin') {
      return { error: 'Akses ditolak: Hanya Superadmin yang diizinkan untuk menghapus user.' }
    }

    // 2. Call the database function via RPC to bypass lack of admin auth key on client
    const { error } = await supabaseServer.rpc('delete_user_by_admin', {
      target_user_id: targetUserId
    })

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    return { error: 'Terjadi kesalahan sistem: ' + err.message }
  }
}
