
import { useState } from 'react';
import { Search, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import UploadBox from '@/components/UploadBox';

interface Match {
  url: string;
  user_short_description: string;
}

interface SearchResult {
  id: string;
  timestamp: string;
  user_image: string;
  results: Match[];
}

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchResult[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [notBoatMsg, setNotBoatMsg] = useState<string>('');

  const handleFileSelect = (file: File) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
      {/* Floating boat decoration */}
      <div className="absolute top-20 right-10 opacity-80 transform rotate-12 z-10">
        <img 
          src="/lovable-uploads/9397a53b-7429-43eb-a797-6bf9d772a4e4.png" 
          alt="Decorative boat" 
          className="w-32 h-24 object-contain drop-shadow-lg"
        />
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Dream Boat Finder
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Upload a photo of your dream boat and discover similar vessels for sale
          </p>
        </div>

        {/* Search Section */}
        <Card className="max-w-4xl mx-auto mb-12 p-8 bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <div className="space-y-6">
            {/* Upload Area */}
            <div className="flex flex-col gap-4">
              <UploadBox onFileSelected={handleFileSelect} previewUrl={previewUrl} />
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

        {/* Not Boat Warning */}
        {notBoatMsg && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="rounded bg-red-50 border border-red-300 p-4 text-red-800">
              {notBoatMsg}
            </div>
          </div>
        )}

        {/* Current Results */}
        {matches.length > 0 && (
          <div className="max-w-4xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Search Results</h2>
            <Card className="p-6 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <div className="space-y-4">
                {matches.map(({ url, user_short_description }) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener"
                    className="block p-4 rounded hover:bg-slate-100 transition"
                  >
                    <h4 className="font-medium text-blue-700 underline break-all">{url}</h4>
                    <p className="mt-1 text-sm text-slate-600">{user_short_description}</p>
                  </a>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6" />
              Search History
            </h2>
            
            <div className="space-y-4">
              {searchHistory.map((result) => (
                <Card key={result.id} className="p-6 bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex gap-6">
                    {/* User uploaded image */}
                    <div className="flex-shrink-0">
                      <div className="w-24 h-20 bg-gray-100 rounded-lg overflow-hidden border-2 border-blue-200">
                        <img 
                          src={result.user_image || '/placeholder.svg'} 
                          alt="Your upload"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs text-gray-500 text-center mt-1">Your photo</p>
                    </div>
                    {/* Arrow */}
                    <div className="flex items-center text-blue-400">
                      <div className="w-8 h-0.5 bg-blue-400"></div>
                      <div className="w-0 h-0 border-l-4 border-l-blue-400 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                    </div>
                    {/* Result content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-800 text-lg">Match Found</h3>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(result.timestamp)}
                        </span>
                      </div>
                      <div className="space-y-4">
                        {result.results.map((item, idx) => (
                          <div key={idx} className="border-b last:border-b-0 pb-3 last:pb-0">
                            <a 
                              href={item.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="block p-4 rounded hover:bg-slate-100 transition"
                            >
                              <h4 className="font-medium text-blue-700 underline break-all">{item.url}</h4>
                              <p className="mt-1 text-sm text-slate-600">{item.user_short_description}</p>
                            </a>
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
