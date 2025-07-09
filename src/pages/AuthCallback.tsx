
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

interface TokenResponse {
  id_token?: string
  error?: string
}

const AuthCallback = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Processing OAuth callback...')

        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')

        if (code) {
          const body = new URLSearchParams({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID!,
            client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET!,
            redirect_uri: `${window.location.origin}/auth/callback`,
            grant_type: 'authorization_code',
            code,
          })
          const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
          })
          const data: TokenResponse = await res.json()
          if (!res.ok || !data.id_token) {
            console.error('Token exchange failed:', data.error)
            navigate('/')
            return
          }
          const { error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: data.id_token,
          })
          if (error) {
            console.error('Supabase sign in error:', error)
          }
          navigate('/')
          return
        }

        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Error in auth callback:', error)
          navigate('/')
          return
        }

        if (data.session) {
          console.log('OAuth callback successful, user:', data.session.user.email)
          navigate('/')
        } else {
          console.log('No session found in callback, redirecting to home')
          navigate('/')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        navigate('/')
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg">Completing sign in...</p>
      </div>
    </div>
  )
}

export default AuthCallback
