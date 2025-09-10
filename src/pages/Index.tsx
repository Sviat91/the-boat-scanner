import { useState } from 'react';
import { Card } from '@/components/ui/card';
import ThemeToggle from '@/components/ThemeToggle';
import AuthStatus from '@/components/auth/AuthStatus';
import { useAuth } from '@/contexts/AuthContext';
import Footer from '@/components/Footer';
import { useCredits } from '@/hooks/useCredits';
import { useImageSearch } from '@/hooks/useImageSearch';
import { SearchForm } from '@/components/search/SearchForm';
import { SearchResults } from '@/components/search/SearchResults';
import { SearchHistory } from '@/components/search/SearchHistory';
import { logger } from '@/utils/logger';
import BackToTopButton from '@/components/BackToTopButton';

const Index = () => {
  logger.debug('Index component is rendering');

  // Auth and credits
  const { user, session } = useAuth();
  const { credits, subscribedUntil, hasActiveSubscription } = useCredits(session);

  // Local credits state for immediate UI updates
  const [localCredits, setLocalCredits] = useState<number | null>(null);

  // Use local credits if available, otherwise use credits from hook
  const displayCredits = localCredits !== null ? localCredits : credits;

  // Update local credits when server credits change
  if (localCredits === null && credits !== null) {
    setLocalCredits(credits);
  }

  // Image search functionality
  const { isLoading, currentSearchResult, notBoatMsg, searchHistory, handleSearch } =
    useImageSearch({
      user,
      credits: displayCredits,
      hasActiveSubscription,
      updateCredits: setLocalCredits,
    });

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  logger.debug('About to render UI');

  return (
    <div className='min-h-screen relative flex flex-col bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 dark:from-[#003275] dark:via-[#003275] dark:to-[#003275]'>
      {/* Top icons (scroll with page) */}
      <div className='absolute top-4 left-4 z-50'>
        <ThemeToggle />
      </div>
      <div className='absolute top-4 right-4 z-50'>
        <AuthStatus />
      </div>
      {/* Left boat decoration */}
      <div className='absolute top-16 left-16 opacity-80 z-10 hidden lg:block'>
        <img
          src='/lovable-uploads/04e94025-fed8-4819-9182-3afea6491646.png'
          alt='Decorative boat'
          className='w-32 h-24 object-contain drop-shadow-lg'
        />
      </div>

      {/* Right boat decoration */}
      <div className='absolute top-16 right-16 opacity-80 z-10 hidden lg:block'>
        <img
          src='/lovable-uploads/5a5ece6a-1752-4664-ade8-be42ddecbe0d.png'
          alt='Decorative boat'
          className='w-32 h-24 object-contain drop-shadow-lg'
        />
      </div>

      <div className='container mx-auto px-4 py-8 flex-grow'>
        {/* Header */}
        <div className='text-center mb-12 relative'>
          <h1 className='text-5xl font-bold text-white dark:text-slate-200 mb-4'>
            The Boat Scanner
          </h1>
          <p className='text-xl text-blue-100 dark:text-slate-300 max-w-2xl mx-auto'>
            Advanced image-based search for yacht &amp; boat listings. We monitor 600+ public groups
            and instantly surface matching ads with direct links to each post.
          </p>
        </div>

        {/* Search Section */}
        <Card className='max-w-4xl mx-auto mb-12 p-8 bg-white/95 dark:bg-black/90 backdrop-blur-sm border-0 shadow-2xl'>
          <SearchForm
            user={user}
            session={session}
            credits={displayCredits}
            subscribedUntil={subscribedUntil}
            hasActiveSubscription={hasActiveSubscription}
            isLoading={isLoading}
            notBoatMessage={notBoatMsg}
            onSearch={handleSearch}
          />
        </Card>

        {/* Current Search Results */}
        {currentSearchResult && (
          <SearchResults searchResult={currentSearchResult} formatTimestamp={formatTimestamp} />
        )}

        {/* Search History - Only show for non-authenticated users */}
        {!user && <SearchHistory searchHistory={searchHistory} formatTimestamp={formatTimestamp} />}
      </div>
      <Footer />
      <BackToTopButton />
    </div>
  );
};

export default Index;
