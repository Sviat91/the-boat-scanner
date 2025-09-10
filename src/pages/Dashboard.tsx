import { ArrowLeft, Clock, Search, Star, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import CreditPurchaseMenu from '@/components/CreditPurchaseMenu';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useAuth } from '@/contexts/AuthContext';
import AuthStatus from '@/components/auth/AuthStatus';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import HistoryCard, { Match } from '@/components/HistoryCard';
import ThemeToggle from '@/components/ThemeToggle';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { clearFavorites, Favorite, listFavorites } from '@/lib/favorites';
import { hasActiveSubscription } from '@/lib/subscription';
import { logger } from '@/utils/logger';
import BackToTopButton from '@/components/BackToTopButton';

const CreditsCard = () => {
  const [credits, setCredits] = useState<{
    free_credits: number;
    paid_credits: number;
  }>({ free_credits: 0, paid_credits: 0 });
  const [subscribedUntil, setSubscribedUntil] = useState<Date | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(true);

  useEffect(() => {
    const fetchCredits = async () => {
      const { data, error } = await supabase.rpc('get_credits');
      if (error) {
        logger.error('Error fetching credits:', error);
        setCredits({ free_credits: 0, paid_credits: 0 });
      } else {
        const row = Array.isArray(data) ? data[0] : data;
        setCredits(row ?? { free_credits: 0, paid_credits: 0 });
        setSubscribedUntil(row?.subscribed_until ? new Date(row.subscribed_until) : null);
      }
      setLoadingCredits(false);
    };
    fetchCredits();
  }, []);

  const total = credits.free_credits + credits.paid_credits;
  const subscriptionActive = hasActiveSubscription(subscribedUntil);

  return (
    <Card className='w-full rounded-xl p-6 bg-white/95 dark:bg-black/90 backdrop-blur-sm border-0 shadow-2xl'>
      <h2 className='text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4'>
        Your available search credits (1 credit = 1 search)
      </h2>
      {loadingCredits ? (
        <div className='flex justify-center py-4'>
          <div className='w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
        </div>
      ) : (
        <div className='space-y-1 text-gray-800 dark:text-gray-200 mb-4'>
          {subscriptionActive ? (
            <>
              <p>
                Unlimited searches active until{' '}
                {subscribedUntil ? format(subscribedUntil, 'dd/MM/yyyy') : ''}
              </p>
              {total > 0 && (
                <p>
                  {`Stored credit${total === 1 ? '' : 's'}: ${total} (not consumed while subscription is active)`}
                </p>
              )}
            </>
          ) : credits && credits.free_credits > 0 && credits.paid_credits > 0 ? (
            <>
              <p>Free credits: {credits.free_credits}</p>
              <p>Paid credits: {credits.paid_credits}</p>
            </>
          ) : (
            <p>Available credits: {total}</p>
          )}
        </div>
      )}
      <CreditPurchaseMenu buttonClassName='w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8 py-6 text-lg' />
    </Card>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { history, loading, clearHistory, deleteHistoryItem } = useSearchHistory();
  const navigate = useNavigate();

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className='min-h-screen relative bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 dark:from-[#003275] dark:via-[#003275] dark:to-[#003275]'>
      {/* Top Navigation */}
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

      <div className='mx-auto max-w-[600px] px-4 py-8 pt-20 space-y-6'>
        {/* Profile Card */}
        <Card className='w-full rounded-xl p-6 bg-white/95 dark:bg-black/90 backdrop-blur-sm border-0 shadow-2xl'>
          <h1 className='text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4'>Dashboard</h1>
          <div className='flex items-center gap-4 mb-4'>
            <Avatar className='w-16 h-16'>
              <AvatarImage
                src={user?.user_metadata?.avatar_url}
                alt={user?.user_metadata?.full_name}
              />
              <AvatarFallback className='bg-blue-500 text-white text-xl'>
                {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className='flex-1'>
              <h2 className='text-2xl font-semibold text-gray-800 dark:text-gray-200'>
                {user?.user_metadata?.full_name || 'User'}
              </h2>
              <p className='text-gray-600 dark:text-gray-400'>{user?.email}</p>
              <div className='flex items-center gap-2 mt-1 text-sm text-green-600 dark:text-green-400'>
                <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                Signed in with Google
              </div>
            </div>
          </div>
        </Card>

        <CreditsCard />

        {/* Search History */}
        <Card className='w-full rounded-xl bg-white/95 dark:bg-black/90 backdrop-blur-sm border-0 shadow-2xl'>
          <Accordion type='single' collapsible className='w-full'>
            <AccordionItem value='search-history' className='border-none'>
              <AccordionTrigger className='px-6 py-4 hover:no-underline'>
                <div className='flex items-center gap-2 text-xl font-semibold text-gray-800 dark:text-gray-200'>
                  <Search className='w-6 h-6' />
                  Search History ({history.length})
                </div>
              </AccordionTrigger>
              <AccordionContent className='px-6 pb-6'>
                {loading ? (
                  <div className='flex justify-center py-8'>
                    <div className='w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
                  </div>
                ) : history.length === 0 ? (
                  <div className='text-center py-12 text-gray-500 dark:text-gray-400'>
                    <Search className='w-16 h-16 mx-auto mb-4 opacity-50' />
                    <h3 className='text-lg font-medium mb-2'>No search history yet</h3>
                    <p className='text-sm mb-4'>
                      Your searches will appear here after you perform them
                    </p>
                    <Button
                      onClick={() => navigate('/')}
                      className='bg-blue-500 hover:bg-blue-600 text-white'
                    >
                      Start Searching
                    </Button>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    <div className='flex justify-between items-center'>
                      <p className='text-sm text-gray-600 dark:text-gray-400'>
                        {history.length} search{history.length !== 1 ? 'es' : ''}
                      </p>
                      <Button
                        onClick={clearHistory}
                        variant='outline'
                        size='sm'
                        className='text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20'
                      >
                        <Trash2 className='w-4 h-4 mr-1' />
                        Clear All
                      </Button>
                    </div>

                    {history.map(item => (
                      <Card
                        key={item.id}
                        className='p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow'
                      >
                        <div className='flex gap-4'>
                          {/* User uploaded image */}
                          <div className='flex-shrink-0'>
                            <div className='w-20 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border-2 border-blue-200 dark:border-blue-700'>
                              <img
                                src={item.user_image_url || '/placeholder.svg'}
                                alt='Your upload'
                                className='w-full h-full object-cover'
                              />
                            </div>
                            <p className='text-xs text-gray-500 dark:text-gray-400 text-center mt-1'>
                              Your photo
                            </p>
                          </div>

                          {/* arrow removed to avoid stray line */}

                          {/* Result content */}
                          <div className='flex-1 min-w-0'>
                            <div className='flex justify-between items-start mb-2'>
                              <h3 className='font-medium text-gray-800 dark:text-gray-200'>
                                Search Result
                              </h3>
                              <div className='flex items-center gap-2'>
                                <span className='text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1'>
                                  <Clock className='w-3 h-3' />
                                  {formatTimestamp(item.created_at)}
                                </span>
                                <Button
                                  onClick={() => deleteHistoryItem(item.id)}
                                  variant='ghost'
                                  size='sm'
                                  className='h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20'
                                >
                                  <Trash2 className='w-3 h-3' />
                                </Button>
                              </div>
                            </div>

                            <div className='space-y-3'>
                              {Array.isArray(item.search_results) ? (
                                item.search_results.map((result: Match, idx: number) => (
                                  <div
                                    key={idx}
                                    className='border-b dark:border-gray-600 last:border-b-0 pb-2 last:pb-0'
                                  >
                                    <HistoryCard {...result} />
                                  </div>
                                ))
                              ) : (
                                <div className='text-sm text-gray-600 dark:text-gray-400 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800'>
                                  {item.search_results?.not_boat || 'No results found'}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      </div>
      {/* Favorites (collapsible) */}
      <div className='mx-auto max-w-[600px] px-4 pb-12'>
        <Card className='w-full rounded-xl bg-white/95 dark:bg-black/90 backdrop-blur-sm border-0 shadow-2xl'>
          <Accordion type='single' collapsible className='w-full'>
            <AccordionItem value='favorites' className='border-none'>
              <AccordionTrigger className='px-6 py-4 hover:no-underline'>
                <div className='flex items-center gap-2 text-xl font-semibold text-gray-800 dark:text-gray-200'>
                  <Star className='w-6 h-6' /> Favorites (<FavoritesCount />)
                </div>
              </AccordionTrigger>
              <AccordionContent className='px-6 pb-6'>
                <FavoritesList />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      </div>
      <BackToTopButton />
    </div>
  );
};

export default Dashboard;

const FavoritesList = () => {
  const [items, setItems] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchAll = async () => {
    setLoading(true);
    try {
      setItems(await listFavorites());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAll();
    const onChange = () => fetchAll();
    window.addEventListener('favorites:changed', onChange);
    return () => window.removeEventListener('favorites:changed', onChange);
  }, []);
  if (loading) return <div className='text-sm text-gray-500'>Loading…</div>;
  if (!items.length) return <div className='text-sm text-gray-500'>No favorites yet</div>;
  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <p className='text-sm text-gray-600 dark:text-gray-400'>
          {items.length} favorite{items.length !== 1 ? 's' : ''}
        </p>
        <Button
          onClick={async () => {
            await clearFavorites();
            window.dispatchEvent(new Event('favorites:changed'));
          }}
          variant='outline'
          size='sm'
          className='text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20'
        >
          <Trash2 className='w-4 h-4 mr-1' />
          Clear All
        </Button>
      </div>
      {items.map(f => (
        <Card
          key={f.id}
          className='p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow'
        >
          <HistoryCard
            url={f.url}
            title={f.title}
            description={f.description}
            thumbnail={f.thumbnail}
            user_short_description=''
          />
        </Card>
      ))}
    </div>
  );
};

// Lightweight counter used in the accordion header
const FavoritesCount = () => {
  const [n, setN] = useState(0);
  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      try {
        const arr = await listFavorites();
        if (mounted) setN(arr.length);
      } catch (_e) {
        void 0;
      }
    };
    refresh();
    const onChange = () => refresh();
    window.addEventListener('favorites:changed', onChange);
    return () => {
      mounted = false;
      window.removeEventListener('favorites:changed', onChange);
    };
  }, []);
  return <>{n}</>;
};
