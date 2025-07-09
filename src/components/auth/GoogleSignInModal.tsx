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
      const finish = () => {
        clearTimeout(timeoutId)
        resolve()
      }
      const timeoutId = window.setTimeout(finish, 10000)
      if (existing) {
        existing.addEventListener('load', finish)
        existing.addEventListener('error', finish)
      } else {
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = finish
        script.onerror = finish
        document.head.appendChild(script)
      }
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
    let modal: HTMLElement | null = null
    const stopTouch = (e: TouchEvent) => e.stopPropagation()
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
      const applyFixes = () => {
        modal = buttonRef.current?.closest('.modal-content') as HTMLElement | null
        if (!modal) return
        const targets = modal.querySelectorAll('[id*="google"], iframe')
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
      if (modal) {
        modal.addEventListener('touchstart', stopTouch)
        modal.addEventListener('touchmove', stopTouch)
      }
    })()
    return () => {
      cancelled = true
      observer?.disconnect()
      if (intervalId) clearInterval(intervalId)
      if (modal) {
        modal.removeEventListener('touchstart', stopTouch)
        modal.removeEventListener('touchmove', stopTouch)
      }
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const timeout = window.setTimeout(() => onOpenChange(false), 30000)
    return () => {
      clearTimeout(timeout)
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
