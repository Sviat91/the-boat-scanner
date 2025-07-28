import { useState } from 'react'
import { User, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import SignInButton from '@/components/auth/SignInButton'
import { useNavigate } from 'react-router-dom'
import { logger } from '@/utils/logger'

const AuthStatus = () => {
  const { user, loading, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  logger.debug('AuthStatus render - user:', user?.email, 'loading:', loading)

  if (loading) {
    return (
      <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
    )
  }

  if (!user) {
    logger.debug('No user, showing SignInButton')
    return <SignInButton />
  }

  logger.debug('User found, showing avatar and dropdown for:', user.email)

  const handleSignOut = async () => {
    try {
      await signOut()
      setIsOpen(false)
      navigate('/')
    } catch (error) {
      logger.error('Error signing out:', error)
    }
  }

  const goToDashboard = () => {
    navigate('/dashboard')
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center p-1 rounded-full hover:bg-white/10 transition-colors shadow-lg"
        title={`Signed in as ${user.user_metadata?.full_name || user.email}`}
      >
        <Avatar className="w-10 h-10 border-2 border-white/20">
          <AvatarImage
            src={user.user_metadata?.avatar_url}
            alt={user.user_metadata?.full_name || user.email}
          />
          <AvatarFallback className="bg-blue-500 text-white text-sm">
            {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-12 z-20 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage 
                    src={user.user_metadata?.avatar_url} 
                    alt={user.user_metadata?.full_name || user.email} 
                  />
                  <AvatarFallback className="bg-blue-500 text-white">
                    {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {user.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={goToDashboard}
              className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors"
            >
              <User className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default AuthStatus
