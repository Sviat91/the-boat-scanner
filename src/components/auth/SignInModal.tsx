import { useEffect, useRef } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const google: any

interface SignInModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SignInModal = ({ open, onOpenChange }: SignInModalProps) => {
  const { signInWithGoogleToken } = useAuth()
  const buttonRef = useRef<HTMLDivElement>(null)

  // Load GIS script if not already loaded
  useEffect(() => {
    if (!open) return
    if (window.google?.accounts?.id) return
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  }, [open])

  // Initialize GIS and render button when modal opens
  useEffect(() => {
    if (!open) return
    const initialize = () => {
      if (!window.google?.accounts?.id) return false
      google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID!,
        callback: async ({ credential }: { credential: string }) => {
          await signInWithGoogleToken(credential)
          onOpenChange(false)
        },
        ux_mode: 'popup',
        auto_select: false,
      })
      if (buttonRef.current) {
        buttonRef.current.innerHTML = ''
        google.accounts.id.renderButton(buttonRef.current, { theme: 'outline', size: 'large' })
      }
      return true
    }

    if (!initialize()) {
      const i = setInterval(() => {
        if (initialize()) clearInterval(i)
      }, 50)
      return () => clearInterval(i)
    }
  }, [open, onOpenChange, signInWithGoogleToken])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <div ref={buttonRef} className="flex justify-center" />
      </DialogContent>
    </Dialog>
  )
}

export default SignInModal
