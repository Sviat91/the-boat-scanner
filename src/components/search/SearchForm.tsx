import { useState } from 'react';
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import { User, Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import UploadBox from '@/components/UploadBox';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import CreditPurchaseMenu from '@/components/CreditPurchaseMenu';
import { NotBoatMessage } from './NotBoatMessage';

interface SearchFormProps {
  user: User | null;
  session: Session | null;
  credits: number | null;
  subscribedUntil: Date | null;
  hasActiveSubscription: boolean;
  isLoading: boolean;
  notBoatMessage: string;
  onSearch: (file: File, previewUrl: string | null) => void;
}

export function SearchForm({
  user,
  session,
  credits,
  subscribedUntil,
  hasActiveSubscription,
  isLoading,
  notBoatMessage,
  onSearch
}: SearchFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    console.log('File selected:', file.name);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleSearchClick = () => {
    if (!selectedFile) {
      toast({
        title: "No image selected",
        description: "Please select an image to search for your dream boat.",
        variant: "destructive"
      });
      return;
    }

    onSearch(selectedFile, previewUrl);
    
    // Reset form after search
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  if (!session) {
    return (
      <div className="flex flex-col gap-4">
        {!user && (
          <p className="text-center text-slate-700 dark:text-slate-200 max-w-xl mx-auto mb-6 leading-relaxed">
            <span className="block font-semibold mb-1">Welcome aboard!</span>
            To keep the service spam-free we ask you to sign in first. Connect with Google—takes seconds—
            and get your first <span className="font-semibold">3 searches free</span>.
          </p>
        )}
        <GoogleSignInButton theme="filled_blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <UploadBox onFileSelected={handleFileSelect} previewUrl={previewUrl} />

        <NotBoatMessage message={notBoatMessage} />

        <div className="text-center">
          {hasActiveSubscription || (credits ?? 0) > 0 ? (
            <Button
              onClick={handleSearchClick}
              disabled={!selectedFile || isLoading || (!hasActiveSubscription && credits === null)}
              size="lg"
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8 py-6 text-lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Searching...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Search by image
                </div>
              )}
            </Button>
          ) : (
            <CreditPurchaseMenu
              buttonClassName="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8 py-6 text-lg"
            />
          )}
          {(hasActiveSubscription || credits !== null) && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
              {hasActiveSubscription
                ? `Unlimited searches active until ${subscribedUntil ? format(subscribedUntil, 'dd/MM/yyyy') : ''}`
                : credits && credits > 0
                  ? `You have ${credits} credits left.`
                  : 'You have 0 credits left.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}