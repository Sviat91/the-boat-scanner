import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, MessageSquare, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { markModalAsShown, shouldShowReviewModal } from '@/lib/reviews';

interface ReviewBonusModalProps {
  freeCredits: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export function ReviewBonusModal({
  freeCredits,
  isOpen: controlledIsOpen,
  onClose,
}: ReviewBonusModalProps) {
  const navigate = useNavigate();
  const [internalOpen, setInternalOpen] = useState(false);
  const [showDelay, setShowDelay] = useState(true);

  // Use controlled open state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen;
  const setIsOpen =
    controlledIsOpen !== undefined && onClose ? onClose : () => setInternalOpen(false);

  useEffect(() => {
    // Only check if using internal state management
    if (controlledIsOpen === undefined) {
      checkAndShowModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freeCredits, controlledIsOpen]);

  const checkAndShowModal = async () => {
    // Wait 2 seconds before showing modal
    await new Promise(resolve => setTimeout(resolve, 2000));
    setShowDelay(false);

    const shouldShow = await shouldShowReviewModal(freeCredits);
    if (shouldShow) {
      setInternalOpen(true);
    }
  };

  const handleLeaveReview = async () => {
    await markModalAsShown();
    setIsOpen();
    navigate('/review');
  };

  const handleMaybeLater = async () => {
    await markModalAsShown();
    setIsOpen();
  };

  if (showDelay && controlledIsOpen === undefined) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && setIsOpen()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-xl'>
            <Gift className='w-6 h-6 text-yellow-500' />
            Get 3 Free Credits!
          </DialogTitle>
          <DialogDescription className='text-base pt-2'>
            You're running low on credits. Share your feedback and receive{' '}
            <strong>3 bonus credits</strong> to continue searching for your dream boat!
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {/* Visual representation */}
          <div className='bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800'>
            <div className='flex items-center gap-3'>
              <div className='flex-shrink-0'>
                <MessageSquare className='w-8 h-8 text-yellow-600 dark:text-yellow-400' />
              </div>
              <div>
                <p className='font-medium text-gray-900 dark:text-gray-100'>One-time bonus offer</p>
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  Leave a review and instantly get 3 more searches
                </p>
              </div>
            </div>
          </div>

          {/* Current status */}
          <div className='flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-3'>
            <span className='text-sm text-gray-600 dark:text-gray-400'>Current free credits:</span>
            <span className='font-bold text-lg text-orange-600 dark:text-orange-400'>
              {freeCredits}
            </span>
          </div>

          <div className='flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3'>
            <span className='text-sm text-gray-600 dark:text-gray-400'>After review:</span>
            <span className='font-bold text-lg text-green-600 dark:text-green-400'>
              {freeCredits + 3}
            </span>
          </div>
        </div>

        <div className='flex flex-col gap-2'>
          <Button onClick={handleLeaveReview} className='w-full' size='lg'>
            <MessageSquare className='w-4 h-4 mr-2' />
            Leave Review & Get Credits
          </Button>
          <Button onClick={handleMaybeLater} variant='outline' className='w-full'>
            Maybe Later
          </Button>
        </div>

        <button
          onClick={handleMaybeLater}
          className='absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none'
        >
          <X className='h-4 w-4' />
          <span className='sr-only'>Close</span>
        </button>
      </DialogContent>
    </Dialog>
  );
}
