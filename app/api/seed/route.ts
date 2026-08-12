import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Verify connection and profiles table by selecting
    const { data: existingProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'superadmin@pelindo.co.id')

    if (fetchError) {
      return NextResponse.json({
        error: 'Gagal query tabel profiles. Pastikan Anda sudah menjalankan script SQL di Supabase SQL Editor.',
        details: fetchError.message
      }, { status: 500 })
    }

    if (existingProfiles && existingProfiles.length > 0) {
      return NextResponse.json({
        message: 'Akun Superadmin sudah terdaftar di database.',
        email: 'superadmin@pelindo.co.id',
        role: existingProfiles[0].role
      })
    }

    // 2. Sign up the superadmin
    // Email: superadmin@pelindo.co.id, Password: akhlak2025
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'superadmin@pelindo.co.id',
      password: 'akhlak2025',
      options: {
        data: {
          role: 'superadmin',
          full_name: 'Super Admin IT'
        }
      }
    })

    if (signUpError) {
      return NextResponse.json({
        error: 'Gagal melakukan signup Superadmin di Supabase Auth.',
        details: signUpError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Superadmin berhasil dibuat! Silakan login menggunakan email: superadmin@pelindo.co.id dan password: akhlak2025.',
      userId: signUpData.user?.id,
      email: signUpData.user?.email
    })
  } catch (err: any) {
    return NextResponse.json({
      error: 'Terjadi kesalahan internal server.',
      details: err.message
    }, { status: 500 })
  }
}
