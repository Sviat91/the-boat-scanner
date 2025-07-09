import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const google: any

const GoogleSignInButton = () => {
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
    let observer: MutationObserver | null = null
    let intervalId: number | null = null
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
        theme: isDark ? 'outline' : 'filled_blue',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
      })
      const applyFixes = () => {
        const targets = buttonRef.current?.querySelectorAll('[id*="google"], iframe')
        targets.forEach((el) => {
          const element = el as HTMLElement
          element.style.setProperty('background', 'transparent', 'important')
          element.style.setProperty('background-color', 'transparent', 'important')
          element.style.setProperty('color-scheme', 'light', 'important')
        })
      }

      applyFixes()
      observer = new MutationObserver(applyFixes)
      observer.observe(buttonRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
      })

      intervalId = window.setInterval(applyFixes, 100)
    })()
    return () => {
      cancelled = true
      observer?.disconnect()
      if (intervalId) clearInterval(intervalId)
    }
  }, [])

  return <div ref={buttonRef} data-gsi-button />
}

export default GoogleSignInButton
