import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      aria-label='switch theme'
      className='hover:opacity-80 transition w-16 h-16 flex items-center justify-center bg-transparent border-0 p-0 outline-none shadow-none'
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      <img
        src={
          isDark
            ? '/lovable-uploads/1669533e-2fa5-47bb-b9d8-c68eedbb0012.png'
            : '/lovable-uploads/072d401a-10e2-47be-93cf-e9c0656bffbc.png'
        }
        alt={isDark ? 'lighthouse on - dark theme' : 'lighthouse off - light theme'}
        className='w-10 h-10 object-contain'
      />
    </button>
  );
};

export default ThemeToggle;
