import React, { useEffect, useState } from 'react';
import { sanitizeHtml } from '@/utils/sanitizeHtml';
import { Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { addFavorite, isFavorite, removeFavorite } from '@/lib/favorites';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface Match {
  url: string;
  user_short_description: string;
  user_images_html?: string;
  thumbnail?: string;
  title?: string;
  description?: string;
}

const HistoryCard = ({
  url,
  user_short_description,
  user_images_html = '',
  thumbnail,
  title,
  description,
}: Match) => {
  const { user } = useAuth();
  const [fav, setFav] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (user && url) {
        try {
          const v = await isFavorite(url);
          if (mounted) setFav(v);
        } catch (_e) {
          void 0;
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user, url]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !url) return;
    try {
      if (fav) {
        await removeFavorite(url);
        window.dispatchEvent(new CustomEvent('favorites:removed', { detail: { url } }));
      } else {
        await addFavorite(url, {
          title,
          description,
          thumbnail,
          source_json: { user_images_html, user_short_description },
        });
      }
      setFav(!fav);
      window.dispatchEvent(new Event('favorites:changed'));
    } catch (_e) {
      void 0;
    }
  };

  return (
    <a
      href={url}
      target='_blank'
      rel='noopener'
      className='block p-4 rounded hover:border-blue-400 hover:bg-blue-50 dark:hover:border-blue-400 dark:hover:bg-blue-900/20 transition-colors'
    >
      <div className='flex gap-4 items-start'>
        {thumbnail && (
          <img
            src={thumbnail}
            alt={title || url}
            className='w-20 h-16 object-cover rounded border'
          />
        )}
        <div className='min-w-0 flex-1'>
          <div className='flex items-start justify-between gap-3'>
            <h4 className='font-medium text-blue-700 dark:text-blue-300 underline break-all whitespace-normal'>
              {title ?? url}
            </h4>
            {user && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type='button'
                    aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
                    onClick={toggle}
                    className='text-yellow-500 hover:text-yellow-600 disabled:opacity-50'
                  >
                    <Star className={`w-5 h-5 ${fav ? 'fill-yellow-500' : ''}`} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {fav ? 'Remove from favorites' : 'Add to favorites'}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <p className='mt-1 text-sm text-slate-600 dark:text-slate-300'>
            {description ?? user_short_description}
          </p>
        </div>
      </div>
      <div className='mt-2' dangerouslySetInnerHTML={{ __html: sanitizeHtml(user_images_html) }} />
    </a>
  );
};

export default HistoryCard;
