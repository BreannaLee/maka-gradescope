import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function Home() {
  const user = await getSession()
  if (user) {
    if (user.role === 'creator') {
      redirect('/dashboard')
    } else {
      redirect('/editorial')
    }
  }
  redirect('/login')
}
