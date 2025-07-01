
import { useEffect, useState } from 'react';
import { Search, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import UploadBox from '@/components/UploadBox';
import HistoryCard, { Match } from '@/components/HistoryCard';
import ThemeToggle from '@/components/ThemeToggle';
import AuthStatus from '@/components/auth/AuthStatus';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { openBuyModal } from '@/lib/openBuyModal';
import Footer from '@/components/Footer';

const openModal = (title: string, description: string) => {
  toast({ title, description, variant: 'destructive' });
};

interface SearchResult {
  id: string;
  timestamp: string;
  user_image: string;
  results: Match[];
}

const Index = () => {
  console.log('Index component is rendering');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchResult[]>([]);
  const [currentSearchResult, setCurrentSearchResult] = useState<SearchResult | null>(null);
  const [, setMatches] = useState<Match[]>([]);
  const [notBoatMsg, setNotBoatMsg] = useState<string>('');

  // Track credit balance
  const [credits, setCredits] = useState<number | null>(null);

  // Auth and search history hooks
  const { user, signInWithGoogle, session } = useAuth();
  const { saveSearchWithImage } = useSearchHistory();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  // Fetch credits whenever a session is available
  useEffect(() => {
    if (!session) {
      setCredits(null);
      return;
    }

    let isMounted = true;

    (async () => {
      const { data, error } = await supabase.rpc('get_credits');
      if (!isMounted) return;
      if (error) {
        console.error(error);
        setCredits(0);
      } else {
        const row = Array.isArray(data) ? data[0] : data;
        const total = (row?.free_credits ?? 0) + (row?.paid_credits ?? 0);
        setCredits(total);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [session]);

  const handleFileSelect = (file: File) => {
    console.log('File selected:', file.name);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleSearch = async () => {
    if (credits === 0) {
      toast({
        title: 'No credits remaining',
        description: 'Please purchase more credits to continue searching.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: "No image selected",
        description: "Please select an image to search for your dream boat.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: ok, error } = await supabase.rpc('consume_credit');
      if (error || ok === false) {
        openModal('Out of credits', 'Buy credits to continue');
        setIsLoading(false);
        return;
      }

      // Create FormData for file upload to n8n webhook
      const formData = new FormData();
      formData.append('photo', selectedFile);
      
      console.log('Sending image to n8n webhook...');

      // Send to n8n webhook
      const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL as string;
      const secretToken = import.meta.env.VITE_N8N_SECRET_TOKEN as string;
      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'x-secret-token': secretToken
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Webhook response:', data);
        
        // ---- case A: Handle array format with not_boat message ----
        if (Array.isArray(data) && data.length > 0 && data[0]?.not_boat) {
          const msg = data[0].not_boat;
          setMatches([]);
          setCurrentSearchResult(null);
          setNotBoatMsg(msg);
          
          // Save to search history if user is authenticated
          if (user && selectedFile) {
            console.log('Saving search to history - not_boat case');
            await saveSearchWithImage('Image Search', { not_boat: msg }, selectedFile);
          }
          
          setCredits(c => (typeof c === 'number' ? c - 1 : c));
          await supabase.rpc('decrement_credits');
          toast({
            title: "Image processed",
            description: "Please check the message below.",
            variant: "destructive"
          });
          return;
        }
        
        // ---- case B: Handle other not_boat formats ----
        if ("not_boat" in data || ("body" in data && data.body?.[0]?.not_boat)) {
          const msg = data.not_boat ?? data.body[0].not_boat;
          setMatches([]);
          setCurrentSearchResult(null);
          setNotBoatMsg(msg);
          
          // Save to search history if user is authenticated
          if (user && selectedFile) {
            console.log('Saving search to history - not_boat case');
            await saveSearchWithImage('Image Search', { not_boat: msg }, selectedFile);
          }
          
          setCredits(c => (typeof c === 'number' ? c - 1 : c));
          await supabase.rpc('decrement_credits');
          toast({
            title: "Image processed",
            description: "Please check the message below.",
            variant: "destructive"
          });
          return;
        }

        // ---- case C: array or { body: [...] } ------------------------
        const items: Match[] =
              Array.isArray(data) ? data
            : Array.isArray(data.body) ? data.body
            : [];

        setNotBoatMsg("");
        setMatches(items);

        // Save to search history if user is authenticated
        if (user && selectedFile) {
          console.log('Saving search to history - success case', items);
          await saveSearchWithImage('Image Search', items, selectedFile);
        }

        const newResult: SearchResult = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          user_image: previewUrl || '/placeholder.svg',
          results: items.length > 0 ? items : [{
            url: '',
            user_short_description: 'No results found.'
          }]
        };

        setCurrentSearchResult(newResult);

        // Only add to local state if user is not authenticated (for temporary display)
        if (!user) {
          setSearchHistory(prev => [newResult, ...prev]);
        }
        
        setCredits(c => (typeof c === 'number' ? c - 1 : c));
        await supabase.rpc('decrement_credits');
        toast({
          title: "Search completed!",
          description: "Your image has been processed successfully.",
        });
      } else {
        throw new Error(`Webhook request failed with status: ${response.status}`);
      }
      
      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      
    } catch (error) {
      console.error('Error sending to webhook:', error);
      toast({
        title: "Search failed",
        description: "Unable to process your image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  console.log('About to render UI');

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 dark:from-[#003275] dark:via-[#003275] dark:to-[#003275]">
      {/* Left boat decoration */}
      <div className="absolute top-16 left-16 opacity-80 z-10 hidden lg:block">
        <img 
          src="/lovable-uploads/04e94025-fed8-4819-9182-3afea6491646.png" 
          alt="Decorative boat" 
          className="w-32 h-24 object-contain drop-shadow-lg"
        />
      </div>
      
      {/* Right boat decoration */}
      <div className="absolute top-16 right-16 opacity-80 z-10 hidden lg:block">
        <img 
          src="/lovable-uploads/5a5ece6a-1752-4664-ade8-be42ddecbe0d.png" 
          alt="Decorative boat" 
          className="w-32 h-24 object-contain drop-shadow-lg"
        />
      </div>
      
      <div className="container mx-auto px-4 py-8 flex-grow">
        {/* Header */}
        <div className="text-center mb-12 relative">
          {/* Theme toggle - top left */}
          <div className="absolute top-4 left-4 z-20">
            <ThemeToggle />
          </div>
          
          {/* Auth button - top right */}
          <div className="absolute top-4 right-4 z-20">
            <AuthStatus />
          </div>
          
          <h1 className="text-5xl font-bold text-white dark:text-slate-200 mb-4">
            The Boat Scanner
          </h1>
          <p className="text-xl text-blue-100 dark:text-slate-300 max-w-2xl mx-auto">
            Advanced image-based search for yacht &amp; boat listings.
            We monitor 600+ public Facebook groups and instantly surface matching ads
            with direct links to each post.
          </p>
        </div>

        {/* Search Section */}
        <Card className="max-w-4xl mx-auto mb-12 p-8 bg-white/95 dark:bg-black/90 backdrop-blur-sm border-0 shadow-2xl">
          <div className="space-y-6">
            {session ? (
              <div className="flex flex-col gap-4">
                <UploadBox onFileSelected={handleFileSelect} previewUrl={previewUrl} />

                {/* Not Boat Error Message */}
                {notBoatMsg && (
                  <div className="rounded bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 p-4 text-red-800 dark:text-red-200">
                    {notBoatMsg}
                  </div>
                )}

                <div className="text-center">
                  <Button
                    onClick={credits === 0 ? openBuyModal : handleSearch}
                    disabled={credits !== 0 && (!selectedFile || isLoading || credits === null)}
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
                        {credits === 0 ? 'Buy credits' : 'Search by image'}
                      </div>
                    )}
                  </Button>
                  {credits !== null && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
                      {credits > 0
                        ? `You have ${credits} credits left.`
                        : 'You have 0 credits left.'}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {!user && (
                  <p className="text-center text-slate-700 dark:text-slate-200 max-w-xl mx-auto mb-6 leading-relaxed">
                    <span className="block font-semibold mb-1">Welcome aboard!</span>
                    To keep the service spam-free we ask you to sign in first. Connect with Google—takes seconds—
                    and get your first <span className="font-semibold">3 searches free</span>.
                  </p>
                )}
                <Button
                  onClick={handleSignIn}
                  size="lg"
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8 py-6 text-lg"
                >
                  Sign in to continue
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Current Search Results */}
        {currentSearchResult && (
          <div className="max-w-4xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-white dark:text-slate-200 mb-6 flex items-center gap-2">
              <Search className="w-6 h-6" />
              Search Results
            </h2>

            <Card className="p-6 bg-white/90 dark:bg-black/80 backdrop-blur-sm border-0 shadow-lg">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-24 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border-2 border-blue-200 dark:border-blue-700">
                    <img
                      src={currentSearchResult.user_image || '/placeholder.svg'}
                      alt="Your upload"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">Your photo</p>
                </div>
                {/* arrow connecting image to results removed to eliminate stray line */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-lg">Match Found</h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(currentSearchResult.timestamp)}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {currentSearchResult.results.map((item, idx) => (
                      <div
                        key={idx}
                        className="border-b dark:border-gray-700 last:border-b-0 pb-3 last:pb-0"
                      >
                        <HistoryCard {...item} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Search History - Only show for non-authenticated users */}
        {!user && searchHistory.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white dark:text-slate-200 mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6" />
              Recent Searches
            </h2>
            
            <div className="space-y-4">
              {searchHistory.map((result) => (
                <Card key={result.id} className="p-6 bg-white/90 dark:bg-black/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                  {/* ... keep existing code (search history display) */}
                  <div className="flex gap-6">
                    {/* User uploaded image */}
                    <div className="flex-shrink-0">
                      <div className="w-24 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border-2 border-blue-200 dark:border-blue-700">
                        <img 
                          src={result.user_image || '/placeholder.svg'} 
                          alt="Your upload"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">Your photo</p>
                    </div>
                    {/* arrow removed to avoid stray line */}
                    {/* Result content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-lg">Match Found</h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(result.timestamp)}
                        </span>
                      </div>
                      <div className="space-y-4">
                        {result.results.map((item, idx) => (
                          <div
                            key={idx}
                            className="border-b dark:border-gray-700 last:border-b-0 pb-3 last:pb-0"
                          >
                            <HistoryCard {...item} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

      </div>
      <Footer />
    </div>
);
};

export default Index;
