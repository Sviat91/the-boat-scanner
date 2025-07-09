import { useEffect, useRef } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const google: any

interface GoogleSignInModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const GoogleSignInModal = ({ open, onOpenChange }: GoogleSignInModalProps) => {
  const buttonRef = useRef<HTMLDivElement>(null)

  const waitForGis = () =>
    new Promise<void>((resolve) => {
      if (window.google?.accounts?.id) return resolve()
      const existing = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      ) as HTMLScriptElement | null
      if (existing) {
        existing.addEventListener('load', () => resolve())
        return
      }
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      document.head.appendChild(script)
    })

  const handleGoogleToken = async ({ credential }: { credential: string }) => {
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: credential,
    })
    if (!error) window.location.reload()
  }

  useEffect(() => {
    if (!open) return
    let cancelled = false
    ;(async () => {
      await waitForGis()
      if (cancelled || !buttonRef.current) return
      google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID!,
        callback: handleGoogleToken,
        ux_mode: 'popup',
        auto_select: false,
      })
      buttonRef.current.innerHTML = ''
      const isDark = document.documentElement.classList.contains('dark')
      google.accounts.id.renderButton(buttonRef.current, {
        theme: isDark ? 'filled_black' : 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        width: 300,
      })
    })()
    return () => {
      cancelled = true
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div ref={buttonRef} className="google-signin-container"></div>
      </DialogContent>
    </Dialog>
  )
}

export default GoogleSignInModal
