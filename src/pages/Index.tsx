import { useState } from 'react';
import { Upload, Search, Clock, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface SearchResult {
  id: string;
  image_url: string;
  short_description: string;
  timestamp: string;
  user_image: string;
}

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchResult[]>([
    {
      id: '1',
      image_url: '/placeholder.svg',
      short_description: 'Beautiful 45ft Catamaran - Perfect for island hopping with spacious deck and modern amenities.',
      timestamp: '2025-06-06T10:30:00Z',
      user_image: '/placeholder.svg'
    },
    {
      id: '2',
      image_url: '/placeholder.svg',
      short_description: 'Classic 38ft Sailing Yacht - Traditional design with excellent performance in coastal waters.',
      timestamp: '2025-06-06T09:15:00Z',
      user_image: '/placeholder.svg'
    }
  ]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
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
      const response = await fetch('https://nodayoby.online:8443/webhook-test/1fe8c34c-f7df-48b7-b477-5fe25debe688', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Webhook response:', result);
        
        // Create new search result entry
        const newResult: SearchResult = {
          id: Date.now().toString(),
          image_url: result.image_url || '/placeholder.svg',
          short_description: result.short_description || `Search completed for uploaded boat image - processing results...`,
          timestamp: new Date().toISOString(),
          user_image: previewUrl || '/placeholder.svg'
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
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
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
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1 w-full">
                <label 
                  htmlFor="file-input" 
                  className="flex items-center justify-center w-full h-32 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors bg-blue-50 hover:bg-blue-100"
                >
                  <div className="text-center">
                    {previewUrl ? (
                      <div className="space-y-2">
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="w-20 h-16 object-cover rounded mx-auto"
                        />
                        <p className="text-sm text-blue-600">Click to change image</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 text-blue-500 mx-auto" />
                        <p className="text-blue-600 font-medium">Upload a photo of your dream boat</p>
                        <p className="text-sm text-blue-400">JPG, PNG up to 10MB</p>
                      </div>
                    )}
                  </div>
                </label>
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              
              <Button 
                onClick={handleSearch}
                disabled={!selectedFile || isLoading}
                size="lg"
                className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8 py-6 text-lg"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    Searching...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Search
                  </div>
                )}
              </Button>
            </div>
          </div>
        </Card>

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
                          src={result.user_image} 
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
                      <p className="text-gray-600 leading-relaxed">{result.short_description}</p>
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
