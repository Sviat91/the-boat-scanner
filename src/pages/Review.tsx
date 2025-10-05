import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ReviewForm } from '@/components/review/ReviewForm';
import { useAuth } from '@/contexts/AuthContext';
import { getUserReview, hasUserReviewed, type Review as ReviewType } from '@/lib/reviews';
import ThemeToggle from '@/components/ThemeToggle';
import AuthStatus from '@/components/auth/AuthStatus';
import Footer from '@/components/Footer';

export default function Review() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hasReviewed, setHasReviewed] = useState(false);
  const [userReview, setUserReview] = useState<ReviewType | null>(null);
  const [loading, setLoading] = useState(true);
  const [bonusCreditsAwarded, setBonusCreditsAwarded] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    checkReviewStatus();
  }, [user, navigate]);

  const checkReviewStatus = async () => {
    setLoading(true);
    const reviewed = await hasUserReviewed();
    setHasReviewed(reviewed);

    if (reviewed) {
      const review = await getUserReview();
      setUserReview(review);
    }

    setLoading(false);
  };

  const handleReviewSuccess = (bonusAwarded: boolean, newCredits: number) => {
    if (bonusAwarded) {
      setBonusCreditsAwarded(newCredits);
    }
    setHasReviewed(true);
    // Reload to show success message
    setTimeout(() => {
      checkReviewStatus();
    }, 1000);
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 dark:from-[#003275] dark:via-[#003275] dark:to-[#003275] flex items-center justify-center'>
        <div className='text-white text-lg'>Loading...</div>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex flex-col bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 dark:from-[#003275] dark:via-[#003275] dark:to-[#003275]'>
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

      {/* Main Content */}
      <main className='flex-grow container mx-auto px-4 py-20'>
        <div className='max-w-2xl mx-auto'>
          {/* Header */}
          <div className='text-center mb-8'>
            <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-white dark:bg-gray-800 mb-4'>
              <MessageSquare className='w-8 h-8 text-blue-600 dark:text-blue-400' />
            </div>
            <h1 className='text-4xl font-bold text-white mb-2'>Share Your Feedback</h1>
            <p className='text-white/90 text-lg'>
              Help us improve and get <strong>3 free credits</strong>!
            </p>
          </div>

          {/* Content */}
          {hasReviewed && userReview ? (
            <Card className='p-8 text-center'>
              <CheckCircle className='w-16 h-16 text-green-500 mx-auto mb-4' />
              <h2 className='text-2xl font-bold mb-2'>Thank You!</h2>
              <p className='text-gray-600 dark:text-gray-400 mb-6'>
                You have already submitted a review. We appreciate your feedback!
              </p>

              {userReview.bonus_credits_awarded && (
                <div className='bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6'>
                  <p className='text-sm text-green-800 dark:text-green-200 font-medium'>
                    ✓ You received 3 bonus credits for your review
                  </p>
                </div>
              )}

              <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6'>
                <div className='flex items-center justify-center gap-1 mb-2'>
                  {[1, 2, 3, 4, 5].map(star => (
                    <div
                      key={star}
                      className={`text-2xl ${
                        star <= userReview.rating
                          ? 'text-yellow-400'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    >
                      ★
                    </div>
                  ))}
                </div>
                <p className='text-sm text-gray-700 dark:text-gray-300 italic'>
                  "{userReview.review_text}"
                </p>
              </div>

              <Button onClick={() => navigate('/')} className='w-full'>
                Continue Searching
              </Button>
            </Card>
          ) : (
            <>
              {bonusCreditsAwarded > 0 && (
                <Card className='p-6 mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'>
                  <div className='text-center'>
                    <CheckCircle className='w-12 h-12 text-green-500 mx-auto mb-3' />
                    <h3 className='text-xl font-bold text-green-800 dark:text-green-200 mb-2'>
                      Bonus Credits Added!
                    </h3>
                    <p className='text-green-700 dark:text-green-300'>
                      Your account now has <strong>{bonusCreditsAwarded} total credits</strong>
                    </p>
                  </div>
                </Card>
              )}

              <ReviewForm onSuccess={handleReviewSuccess} />

              {/* Additional Info */}
              <Card className='mt-6 p-4 bg-white/80 dark:bg-gray-800/80'>
                <p className='text-sm text-gray-600 dark:text-gray-400 text-center'>
                  Your feedback helps us improve our service. This is a one-time bonus offer.
                </p>
              </Card>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
