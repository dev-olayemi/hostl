import { Metadata } from 'next'
import LoginForm from '@/components/auth/LoginForm'

export const metadata: Metadata = { title: 'Sign in to Hostl' }

export default function LoginPage() {
  return <LoginForm />
}
