import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { logger } from '@/utils/logger'


interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Wait for Google Identity Services to load
  const waitForGis = () =>
    new Promise<void>((resolve) => {
      if (window.google?.accounts?.id) return resolve()
      const i = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(i)
          resolve()
        }
      }, 50)
    })

  const showOneTapIfAccounts = useCallback(async () => {
    await waitForGis()

    window.google!.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID!,
      callback: async ({ credential }: { credential: string }) => {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: credential,
        })
        if (!error) window.location.reload()
      },
      ux_mode: 'popup',
      auto_select: false,
      itp_support: true,
    })

    window.google!.accounts.id.prompt((notification) => {
      if (notification.isDisplayed()) {
        logger.debug('One Tap displayed')
      } else {
        logger.debug('One Tap not displayed:', notification.getNotDisplayedReason())
      }
    })
  }, [])

  useEffect(() => {
    logger.debug('AuthProvider: Setting up auth with session check + listener pattern')
    
    // First, check current session (handles OAuth redirects)
    const checkSession = async () => {
      try {
        logger.debug('Checking current session...')
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          logger.error('Error getting session:', error)
        } else {
          logger.debug('Current session found:', session?.user?.email || 'none')
          setSession(session)
          setUser(session?.user ?? null)

          // Handle OAuth redirect success - only if we're on the callback page
          if (session?.user && window.location.pathname === '/auth/callback') {
            logger.debug('OAuth callback detected, session established')
            // The AuthCallback component will handle the redirect
          }

          if (!session?.user) await showOneTapIfAccounts()
        }
      } catch (error) {
        logger.error('Error in checkSession:', error)
      } finally {
        setLoading(false)
      }
    }

    // Check session immediately
    checkSession()

    // Then set up listener for future auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.debug('Auth state change event:', event, session?.user?.email || 'none')
      
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Handle specific events
      if (event === 'SIGNED_IN' && session?.user) {
        logger.debug('User signed in via state change:', session.user.email)
        // Don't redirect here - let AuthCallback component handle it
      } else if (event === 'SIGNED_OUT') {
        logger.debug('User signed out')
        // Redirect to home page after sign out
        if (window.location.pathname !== '/') {
          window.location.href = '/'
        }
        await showOneTapIfAccounts()
      }
    })

    return () => {
      logger.debug('Cleaning up auth subscription')
      subscription.unsubscribe()
    }
  }, [showOneTapIfAccounts])

  const signInWithGoogle = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      logger.error('OAuth sign-in error:', error)
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      logger.debug('Starting sign out')
      const { error } = await supabase.auth.signOut()
      if (error) {
        logger.error('Error signing out:', error)
        throw error
      }
      logger.debug('Sign out successful')
    } catch (error) {
      logger.error('signOut error:', error)
    }
  }

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signOut,
  }

  logger.debug('AuthProvider render - user:', user?.email || 'none', 'loading:', loading)

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
