import { Search, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import HistoryCard from '@/components/HistoryCard';
import { SearchResult } from '@/hooks/useImageSearch';

interface SearchResultsProps {
  searchResult: SearchResult;
  formatTimestamp: (timestamp: string) => string;
}

export function SearchResults({ searchResult, formatTimestamp }: SearchResultsProps) {
  return (
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
                src={searchResult.user_image || '/placeholder.svg'}
                alt="Your upload"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">Your photo</p>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-lg">Match Found</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTimestamp(searchResult.timestamp)}
              </span>
            </div>
            <div className="space-y-4">
              {searchResult.results.map((item, idx) => (
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
  );
}