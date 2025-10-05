import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { submitReview } from '@/lib/reviews';
import { toast } from '@/hooks/use-toast';

interface ReviewFormProps {
  onSuccess?: (bonusAwarded: boolean, newCredits: number) => void;
}

export function ReviewForm({ onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast({
        title: 'Rating required',
        description: 'Please select a rating before submitting',
        variant: 'destructive',
      });
      return;
    }

    if (reviewText.trim().length < 20) {
      toast({
        title: 'Review too short',
        description: 'Please write at least 20 characters',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitReview(rating, reviewText);

      if (result.success) {
        toast({
          title: 'Thank you!',
          description: result.message,
        });

        if (result.bonus_result?.awarded && onSuccess) {
          onSuccess(true, result.bonus_result.total_credits || 0);
        }

        // Clear form
        setRating(0);
        setReviewText('');
      } else {
        toast({
          title: 'Failed to submit review',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className='p-6'>
      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Rating Stars */}
        <div>
          <label className='block text-sm font-medium mb-2'>
            Your Rating <span className='text-red-500'>*</span>
          </label>
          <div className='flex gap-2'>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type='button'
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className='transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded'
              >
                <Star
                  className={`w-10 h-10 ${
                    star <= (hoverRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className='text-sm text-gray-600 dark:text-gray-400 mt-2'>
              You selected: {rating} star{rating > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Review Text */}
        <div>
          <label htmlFor='review-text' className='block text-sm font-medium mb-2'>
            Your Review <span className='text-red-500'>*</span>
          </label>
          <Textarea
            id='review-text'
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
            placeholder='Tell us about your experience with our boat search service... (minimum 20 characters)'
            rows={6}
            className='resize-none'
            disabled={isSubmitting}
          />
          <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
            {reviewText.length} / 20 characters minimum
          </p>
        </div>

        {/* Bonus Info */}
        <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4'>
          <p className='text-sm text-blue-800 dark:text-blue-200 font-medium'>
            🎁 Leave a review and get <strong>3 free credits</strong> to search more boats!
          </p>
        </div>

        {/* Submit Button */}
        <Button
          type='submit'
          className='w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold'
          disabled={isSubmitting || rating === 0 || reviewText.trim().length < 20}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </form>
    </Card>
  );
}
