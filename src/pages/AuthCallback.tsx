
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

const AuthCallback = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Processing OAuth callback...')
        
        // Get the session from the URL hash/params
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
