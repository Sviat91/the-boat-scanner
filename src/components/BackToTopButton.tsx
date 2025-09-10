import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BackToTopButtonProps {
  threshold?: number; // Y offset before showing; defaults to 600
}

export default function BackToTopButton({ threshold = 600 }: BackToTopButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible((window?.scrollY || 0) > threshold);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  if (!visible) return null;

  const scrollTop = () => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <Button
      aria-label='Back to top'
      onClick={scrollTop}
      variant='outline'
      size='sm'
      className='fixed bottom-6 right-6 z-50 bg-white/10 border-white/20 text-white hover:bg-white/20 shadow-lg'
    >
      <ArrowUp className='w-4 h-4 mr-1' />
      Back to Top
    </Button>
  );
}
