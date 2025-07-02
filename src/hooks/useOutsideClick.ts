import { useEffect } from 'react'

function useOutsideClick<T extends HTMLElement>(
  ref: React.RefObject<T>,
  handler: () => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return

    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return
      handler()
    }

    const escListener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handler()
    }

    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    document.addEventListener('keydown', escListener)

    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
      document.removeEventListener('keydown', escListener)
    }
  }, [ref, handler, enabled])
}

export default useOutsideClick
