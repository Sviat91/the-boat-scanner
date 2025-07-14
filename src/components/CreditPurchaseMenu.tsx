import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import useOutsideClick from '@/hooks/useOutsideClick'
import { buildLsUrl } from '@/lib/ls-constants'

interface CreditPurchaseMenuProps {
  buttonClassName?: string
}

const CreditPurchaseMenu = ({ buttonClassName = '' }: CreditPurchaseMenuProps) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useOutsideClick(containerRef, () => setOpen(false), open)

  useEffect(() => {
    if (!open) return
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [open])

  const openUrl = async (kind: 'pack3' | 'pack12' | 'unlimited') => {
    // Open a blank window synchronously so mobile browsers treat it as a
    // user-initiated popup. This avoids popup blocking when the URL is
    // resolved asynchronously.
    const newWindow = window.open('', '_blank')
    if (!newWindow) return
    const url = await buildLsUrl(kind)
    newWindow.location.href = url
  }

  return (
    <div ref={containerRef} className="w-full">
      {!open ? (
        <Button size="lg" className={buttonClassName} onClick={() => setOpen(true)}>
          Buy credits
        </Button>
      ) : (
        <div className="flex flex-wrap justify-center w-full gap-3 animate-in fade-in duration-150">
          <Button
            size="lg"
            className={`${buttonClassName.replace('w-full', '').trim()} flex-1 basis-1/2 sm:basis-1/3`}
            onClick={() => openUrl('pack3')}
          >
            $5 — 5 credits
          </Button>
          <Button
            size="lg"
            className={`${buttonClassName.replace('w-full', '').trim()} flex-1 basis-1/2 sm:basis-1/3`}
            onClick={() => openUrl('pack12')}
          >
            $15 — 20 credits
          </Button>
          <Button
            size="lg"
            className={`${buttonClassName.replace('w-full', '').trim()} flex-1 basis-1/2 sm:basis-1/3`}
            onClick={() => openUrl('unlimited')}
          >
            $30 — Unlimited month
          </Button>
        </div>
      )}
    </div>
  )
}

export default CreditPurchaseMenu
