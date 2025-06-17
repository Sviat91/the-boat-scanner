
import { useState } from 'react';
import { Search, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import UploadBox from '@/components/UploadBox';
import HistoryCard, { Match } from '@/components/HistoryCard';
import ThemeToggle from '@/components/ThemeToggle';

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
  const [, setMatches] = useState<Match[]>([]);
  const [notBoatMsg, setNotBoatMsg] = useState<string>('');

  const handleFileSelect = (file: File) => {
    console.log('File selected:', file.name);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleSearch = async () => {
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
      // Create FormData for file upload to n8n webhook
      const formData = new FormData();
      formData.append('photo', selectedFile);
      
      console.log('Sending image to n8n webhook...');

      // Send to n8n webhook
      const webhookUrl = "https://nodayoby.online:8443/webhook/a904454d-bc76-4a49-a6ec-9f8d559e2863";
      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'x-secret-token': 'b9c7fcaf1e2d48aba3f23e1d4c6a9e0b'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Webhook response:', data);
        
        // ---- case A: { not_boat: "…" } ---------------------------------
        if ("not_boat" in data || ("body" in data && data.body?.[0]?.not_boat)) {
          const msg = data.not_boat ?? data.body[0].not_boat;
          setMatches([]);
          setNotBoatMsg(msg);
          toast({
            title: "Image processed",
            description: "Please check the message below.",
            variant: "destructive"
          });
          return;
        }

        // ---- case B: array or { body: [...] } ------------------------
        const items: Match[] =
              Array.isArray(data) ? data
            : Array.isArray(data.body) ? data.body
            : [];

        setNotBoatMsg("");
        setMatches(items);

        const newResult: SearchResult = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          user_image: previewUrl || '/placeholder.svg',
          results: items.length > 0 ? items : [{ 
            url: '', 
            user_short_description: 'No results found.'
          }]
        };
        
        setSearchHistory(prev => [newResult, ...prev]);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 dark:from-[#003275] dark:via-[#003275] dark:to-[#003275]">
      {/* Left boat decoration */}
      <div className="absolute top-20 left-10 opacity-80 z-10">
        <img 
          src="/lovable-uploads/04e94025-fed8-4819-9182-3afea6491646.png" 
          alt="Decorative boat" 
          className="w-38 h-29 object-contain drop-shadow-lg"
        />
      </div>
      
      {/* Right boat decoration */}
      <div className="absolute top-20 right-10 opacity-80 z-10">
        <img 
          src="/lovable-uploads/5a5ece6a-1752-4664-ade8-be42ddecbe0d.png" 
          alt="Decorative boat" 
          className="w-38 h-29 object-contain drop-shadow-lg"
        />
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12 relative">
          <div className="fixed top-4 right-4 z-20 bg-white/90 dark:bg-black/90 backdrop-blur-md p-2 rounded-lg shadow-lg">
            <ThemeToggle />
          </div>
          <h1 className="text-5xl font-bold text-white dark:text-slate-200 mb-4">
            The Boat Scanner
          </h1>
          <p className="text-xl text-blue-100 dark:text-slate-300 max-w-2xl mx-auto">
            Advanced photo-based yacht &amp; boat classifieds search.
            We scan 600+ Facebook groups and 100+ dedicated marketplaces
            and give you instant matches with direct links to each source.
          </p>
        </div>

        {/* Search Section */}
        <Card className="max-w-4xl mx-auto mb-12 p-8 bg-white/95 dark:bg-black/90 backdrop-blur-sm border-0 shadow-2xl">
          <div className="space-y-6">
            {/* Upload Area */}
            <div className="flex flex-col gap-4">
              <UploadBox onFileSelected={handleFileSelect} previewUrl={previewUrl} />
              
              {/* Not Boat Error Message */}
              {notBoatMsg && (
                <div className="rounded bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 p-4 text-red-800 dark:text-red-200">
                  {notBoatMsg}
                </div>
              )}
              
              <Button 
                onClick={handleSearch}
                disabled={!selectedFile || isLoading}
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
            </div>
          </div>
        </Card>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white dark:text-slate-200 mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6" />
              Search History
            </h2>
            
            <div className="space-y-4">
              {searchHistory.map((result) => (
                <Card key={result.id} className="p-6 bg-white/90 dark:bg-black/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
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
                    {/* Arrow */}
                    <div className="flex items-center text-blue-400 dark:text-blue-300">
                      <div className="w-8 h-0.5 bg-blue-400 dark:bg-blue-300"></div>
                      <div className="w-0 h-0 border-l-4 border-l-blue-400 dark:border-l-blue-300 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                    </div>
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
    </div>
  );
};

export default Index;
