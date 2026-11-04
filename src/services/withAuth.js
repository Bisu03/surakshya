'use client'

import Loading from '@/components/Loading'
import { useAuth } from '@/lib/useAuth'

export function withAuth(Component, requireAuth = true) {
  return function AuthenticatedComponent(props) {
    const { session, status } = useAuth(requireAuth)

    if (status === 'loading') {
      return <div> <Loading /> </div>
    }

    if (requireAuth && status === 'unauthenticated') {
      return null
    }

    return <Component {...props} session={session} />
  }
}

