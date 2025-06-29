import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ThemeToggle from '@/components/ThemeToggle';
import AuthStatus from '@/components/auth/AuthStatus';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

const webhookUrl = 'https://nodayoby.online:8443/webhook-test/e8e4c6fc-5036-45ca-a471-7844605d74d6';

export default function Support() {
  const { user, signInWithGoogle } = useAuth();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!user || !message.trim()) return;
    setSending(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-secret-token': import.meta.env.VITE_SUPPORT_TOKEN as string,
      };
      const payload = {
        email: user.email,
        uid: user.id,
        message: message.trim(),
      };
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('Message sent!');
        setMessage('');
      } else {
        toast.error('Failed to send message');
      }
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <main className="flex flex-col items-center justify-center h-screen text-center px-4 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 dark:from-[#003275] dark:via-[#003275] dark:to-[#003275]">
        <p className="text-lg mb-6 text-white dark:text-slate-200">Please sign in to contact support.</p>
        <Button onClick={signInWithGoogle} className="bg-yellow-400 hover:bg-yellow-500 text-gray-900">
          Sign in with Google
        </Button>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 dark:from-[#003275] dark:via-[#003275] dark:to-[#003275]">
      <div className="fixed top-4 left-4 z-20">
        <ThemeToggle />
      </div>
      <div className="fixed top-4 right-4 z-20">
        <AuthStatus />
      </div>
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="bg-white dark:bg-zinc-900 shadow-xl rounded-2xl p-8 max-w-xl w-full">
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
              onClick={() => setMessage('')}
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
        </div>
      </main>
      <Footer />
    </div>
  );
}
