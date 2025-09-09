import { PropsWithChildren, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

type FixedAtProps = PropsWithChildren<{
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
  zIndex?: number;
  offset?: number; // tailwind spacing unit in px; default 16 (~top-4/right-4)
}>;

// Renders children into document.body, positioned fixed at a corner.
export default function FixedAt({
  position,
  className = '',
  zIndex = 50,
  offset = 16,
  children,
}: FixedAtProps) {
  const mountNode = typeof document !== 'undefined' ? document.body : null;
  const el = useMemo(
    () => (typeof document !== 'undefined' ? document.createElement('div') : null),
    []
  );

  useEffect(() => {
    if (!mountNode || !el) return;
    mountNode.appendChild(el);
    return () => {
      try {
        mountNode.removeChild(el);
      } catch {
        // ignore
      }
    };
  }, [mountNode, el]);

  if (!mountNode || !el) return null;

  const base = `fixed`;
  const pos =
    position === 'top-left'
      ? { top: offset, left: offset }
      : position === 'top-right'
        ? { top: offset, right: offset }
        : position === 'bottom-left'
          ? { bottom: offset, left: offset }
          : { bottom: offset, right: offset };

  const style: React.CSSProperties = { position: 'fixed', zIndex, ...pos };

  return createPortal(
    <div className={`${base} ${className}`.trim()} style={style}>
      {children}
    </div>,
    el
  );
}
