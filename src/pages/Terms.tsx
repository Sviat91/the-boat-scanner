import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import tos from '@/assets/terms_of_service.md?raw';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import AuthStatus from '@/components/auth/AuthStatus';
import Footer from '@/components/Footer';

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className='min-h-screen flex flex-col bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 dark:from-[#003275] dark:via-[#003275] dark:to-[#003275]'>
      <div className='absolute top-4 left-4 z-50'>
        <ThemeToggle />
      </div>
      <div className='absolute top-4 right-4 z-50 flex items-center gap-3'>
        <Button
          onClick={() => navigate('/')}
          variant='outline'
          size='sm'
          className='bg-white/10 border-white/20 text-white hover:bg-white/20'
        >
          <ArrowLeft className='w-4 h-4 mr-1' />
          Back to Search
        </Button>
        <AuthStatus />
      </div>
      <main className='flex-grow flex justify-center px-4 py-20'>
        <div className='prose dark:prose-invert max-w-prose bg-white dark:bg-zinc-900 shadow-xl rounded-2xl p-8'>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{tos}</ReactMarkdown>
        </div>
      </main>
      <Footer />
    </div>
  );
}
