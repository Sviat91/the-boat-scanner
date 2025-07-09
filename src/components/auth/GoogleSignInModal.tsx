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
    new Promise<void>((resolve, reject) => {
      if (window.google?.accounts?.id) return resolve()
      const existing = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      ) as HTMLScriptElement | null
      const timeout = window.setTimeout(() => reject(new Error('timeout')), 10000)
      const handleLoad = () => {
        clearTimeout(timeout)
        resolve()
      }
      const handleError = () => {
        clearTimeout(timeout)
        reject(new Error('failed'))
      }
      if (existing) {
        existing.addEventListener('load', handleLoad)
        existing.addEventListener('error', handleError)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = handleLoad
      script.onerror = handleError
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
    let observer: MutationObserver | null = null
    let intervalId: number | null = null
    let removeTouch: (() => void) | null = null
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('keydown', handleKey)
    ;(async () => {
      try {
        await waitForGis()
      } catch {
        if (!cancelled) onOpenChange(false)
        return
      }
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
      const applyFixes = () => {
        const modal = buttonRef.current?.closest('.modal-content') as HTMLElement | null
        if (!modal) return
        const targets = modal.querySelectorAll('[id*="google"], iframe')
        targets.forEach((el) => {
          const element = el as HTMLElement
          element.style.setProperty('background', 'transparent', 'important')
          element.style.setProperty('background-color', 'transparent', 'important')
          element.style.setProperty('color-scheme', 'light', 'important')
        })
        if (!removeTouch) {
          const stop = (e: Event) => e.stopPropagation()
          modal.addEventListener('touchstart', stop)
          modal.addEventListener('touchmove', stop)
          modal.addEventListener('touchend', stop)
          removeTouch = () => {
            modal.removeEventListener('touchstart', stop)
            modal.removeEventListener('touchmove', stop)
            modal.removeEventListener('touchend', stop)
          }
        }
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
      removeTouch?.()
      document.removeEventListener('keydown', handleKey)
    }
  }, [open, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="modal-content flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div ref={buttonRef}></div>
      </DialogContent>
    </Dialog>
  )
}

export default GoogleSignInModal
