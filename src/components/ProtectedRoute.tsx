import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 dark:from-[#003275] dark:via-[#003275] dark:to-[#003275] flex items-center justify-center'>
        <div className='w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to='/' replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
