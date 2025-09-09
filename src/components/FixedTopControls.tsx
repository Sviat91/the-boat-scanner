import ThemeToggle from '@/components/ThemeToggle';
import AuthStatus from '@/components/auth/AuthStatus';

export default function FixedTopControls() {
  return (
    <>
      <div className='fixed top-4 left-4 z-50'>
        <ThemeToggle />
      </div>
      <div className='fixed top-4 right-4 z-50'>
        <AuthStatus />
      </div>
    </>
  );
}

