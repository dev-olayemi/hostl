import { Metadata } from 'next'
import SignupForm from '@/components/auth/SignupForm'

export const metadata: Metadata = { title: 'Create your Hostl ID' }

export default function SignupPage() {
  return <SignupForm />
}
