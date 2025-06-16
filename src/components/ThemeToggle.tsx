
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
      aria-label="switch theme"
      className="hover:opacity-80 transition"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      <img 
        src={isDark ? "/lovable-uploads/1669533e-2fa5-47bb-b9d8-c68eedbb0012.png" : "/lovable-uploads/ffdcbe46-339e-47bf-9e78-0b5f602f09eb.png"}
        alt={isDark ? "lighthouse on - dark theme" : "lighthouse off - light theme"}
        className="w-10 h-10 object-contain"
      />
    </button>
  );
};

export default ThemeToggle;
