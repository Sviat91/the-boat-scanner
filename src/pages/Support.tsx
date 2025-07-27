import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ThemeToggle from '@/components/ThemeToggle';
import AuthStatus from '@/components/auth/AuthStatus';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/lib/supabase';

export default function Support() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleSend = async () => {
    if (!user || !message.trim()) return;
    setSending(true);
    try {
      const payload = {
        email: user.email,
        uid: user.id,
        message: message.trim(),
      };
      
      const { data, error } = await supabase.functions.invoke('support-webhook-proxy', {
        body: payload,
      });

      if (error) {
        console.error('Support request error:', error);
        toast.error('Failed to send message');
        return;
      }

      if (data?.success) {
        toast.success('Message sent!');
        setMessage('');
        setSent(true);
      } else {
        toast.error('Failed to send message');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    const isDark = document.documentElement.classList.contains('dark');
    return (
      <main className="flex flex-col items-center justify-center h-screen text-center px-4 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 dark:from-[#003275] dark:via-[#003275] dark:to-[#003275]">
        <p className="text-lg mb-6 text-white dark:text-slate-200">Please sign in to contact support.</p>
        <GoogleSignInButton theme={isDark ? 'filled_black' : 'outline'} />
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 dark:from-[#003275] dark:via-[#003275] dark:to-[#003275]">
      <div className="fixed top-4 left-4 z-20">
        <ThemeToggle />
      </div>
      <div className="fixed top-4 right-4 z-20 flex items-center gap-3">
        <Button
          onClick={() => navigate('/')}
          variant="outline"
          size="sm"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Search
        </Button>
        <AuthStatus />
      </div>
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="bg-white dark:bg-zinc-900 shadow-xl rounded-2xl p-8 max-w-xl w-full">
          {sent ? (
            <>
              <h2 className="text-xl font-semibold mb-4 text-center">Message sent!</h2>
              <p className="text-center mb-6">
                Your request has been delivered. We aim to reply within&nbsp;
                <strong>72&nbsp;hours</strong>.
              </p>
              <div className="flex justify-center">
                <Button
                  className="bg-yellow-400 hover:bg-yellow-500 text-gray-900"
                  onClick={() => navigate('/')}
                >
                  Back to search
                </Button>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold mb-4 text-center text-gray-800 dark:text-gray-200">Contact Support</h1>
              <Textarea
                minLength={140}
                maxLength={2000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mb-4"
                placeholder="How can we help you?"
              />
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    setMessage('');
                    navigate('/');
                  }}
                  disabled={sending}
                  className="bg-yellow-400 hover:bg-yellow-500 text-gray-900"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || message.trim() === ''}
                  className="bg-yellow-400 hover:bg-yellow-500 text-gray-900"
                >
                  Send
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
