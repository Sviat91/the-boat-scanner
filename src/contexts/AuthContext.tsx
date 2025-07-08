import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const google: any

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

  useEffect(() => {
    console.log('AuthProvider: Setting up auth with session check + listener pattern')
    
    // First, check current session (handles OAuth redirects)
    const checkSession = async () => {
      try {
        console.log('Checking current session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
        } else {
          console.log('Current session found:', session?.user?.email || 'none')
          setSession(session)
          setUser(session?.user ?? null)
          
          // Handle OAuth redirect success - only if we're on the callback page
          if (session?.user && window.location.pathname === '/auth/callback') {
            console.log('OAuth callback detected, session established')
            // The AuthCallback component will handle the redirect
          }
        }
      } catch (error) {
        console.error('Error in checkSession:', error)
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
      console.log('Auth state change event:', event, session?.user?.email || 'none')
      
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Handle specific events
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in via state change:', session.user.email)
        // Don't redirect here - let AuthCallback component handle it
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out')
        // Redirect to home page after sign out
        if (window.location.pathname !== '/') {
          window.location.href = '/'
        }
      }
    })

    return () => {
      console.log('Cleaning up auth subscription')
      subscription.unsubscribe()
    }
  }, []) // Empty dependency array to prevent loops

  const signInWithGoogle = async () => {
    setLoading(true)
    google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID!,
      callback: async ({ credential }) => {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: credential,
        })
        if (!error) window.location.reload()
        setLoading(false)
      },
      ux_mode: 'popup',
      auto_select: false,
      itp_support: true,
      auto_prompt: false,
    })
    google.accounts.id.prompt()
  }

  const signOut = async () => {
    try {
      console.log('Starting sign out')
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
        throw error
      }
      console.log('Sign out successful')
    } catch (error) {
      console.error('signOut error:', error)
    }
  }

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signOut,
  }

  console.log('AuthProvider render - user:', user?.email || 'none', 'loading:', loading)

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
