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

  const openUrl = (url: string) => {
    window.open(url, '_blank')
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
            onClick={async () => openUrl(await buildLsUrl('pack3'))}
          >
            $5 — 3 credits
          </Button>
          <Button
            size="lg"
            className={`${buttonClassName.replace('w-full', '').trim()} flex-1 basis-1/2 sm:basis-1/3`}
            onClick={async () => openUrl(await buildLsUrl('pack12'))}
          >
            $15 — 12 credits
          </Button>
          <Button
            size="lg"
            className={`${buttonClassName.replace('w-full', '').trim()} flex-1 basis-1/2 sm:basis-1/3`}
            onClick={async () => openUrl(await buildLsUrl('unlimited'))}
          >
            $30 — Unlimited month
          </Button>
        </div>
      )}
    </div>
  )
}

export default CreditPurchaseMenu
