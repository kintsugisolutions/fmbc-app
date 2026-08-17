'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { checkPassphrase, makeSessionCookieValue, COOKIE_NAME } from '@/lib/internal-auth'

export async function loginAction(formData: FormData) {
  const passphrase = String(formData.get('passphrase') ?? '')

  if (!(await checkPassphrase(passphrase))) {
    redirect('/internal/login?error=1')
  }

  const token = await makeSessionCookieValue()
  if (!token) {
    // INTERNAL_DASHBOARD_SECRET missing — fail closed rather than let anyone in.
    redirect('/internal/login?error=1')
  }

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })

  redirect('/internal/dashboard')
}

export async function logoutAction() {
  cookies().delete(COOKIE_NAME)
  redirect('/internal/login')
}
