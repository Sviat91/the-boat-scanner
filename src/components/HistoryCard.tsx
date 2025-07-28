import React from 'react';
import { sanitizeHtml } from '@/utils/sanitizeHtml';

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
}: Match) => (
  <a
    href={url}
    target='_blank'
    rel='noopener'
    className='block p-4 rounded hover:border-blue-400 hover:bg-blue-50 dark:hover:border-blue-400 dark:hover:bg-blue-900/20 transition-colors'
  >
    <div className='flex gap-4 items-start'>
      {thumbnail && (
        <img src={thumbnail} alt={title || url} className='w-20 h-16 object-cover rounded border' />
      )}
      <div className='min-w-0'>
        <h4 className='font-medium text-blue-700 dark:text-blue-300 underline break-words'>
          {title ?? url}
        </h4>
        <p className='mt-1 text-sm text-slate-600 dark:text-slate-300'>
          {description ?? user_short_description}
        </p>
      </div>
    </div>
    <div className='mt-2' dangerouslySetInnerHTML={{ __html: sanitizeHtml(user_images_html) }} />
  </a>
);

export default HistoryCard;
