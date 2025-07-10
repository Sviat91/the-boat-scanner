import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'


interface GoogleSignInButtonProps {
  theme: 'filled_blue' | 'filled_black' | 'outline'
}

const GoogleSignInButton = ({ theme }: GoogleSignInButtonProps) => {
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
    let cancelled = false
    ;(async () => {
      await waitForGis()
      if (cancelled || !buttonRef.current) return
      window.google!.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID!,
        callback: handleGoogleToken,
        ux_mode: 'popup',
        auto_select: false,
      })
      buttonRef.current.innerHTML = ''
      const buttonWidth =
        window.innerWidth <= 480
          ? 280
          : window.innerWidth <= 768
            ? 320
            : 400
      window.google!.accounts.id.renderButton(buttonRef.current, {
        theme,
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: buttonWidth,
      })
    })()
    return () => {
      cancelled = true
    }
  }, [theme])

  return <div ref={buttonRef} className="google-signin-main flex justify-center" />
}

export default GoogleSignInButton
