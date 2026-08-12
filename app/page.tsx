import { redirect } from 'next/navigation'

export default function RootPage() {
  // Middleware handles the redirection logic, but as a fallback,
  // we redirect to the login page.
  redirect('/login')
}
