import React from 'react';

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
  user_images_html = "",
  thumbnail,
  title,
  description,
}: Match) => (
  <a
    href={url}
    target="_blank"
    rel="noopener"
    className="block p-4 rounded hover:bg-slate-100 transition"
  >
    <div className="flex gap-4 items-start">
      {thumbnail && (
        <img
          src={thumbnail}
          alt={title || url}
          className="w-20 h-16 object-cover rounded border"
        />
      )}
      <div className="min-w-0">
        <h4 className="font-medium text-blue-700 underline break-words">
          {title ?? url}
        </h4>
        <p className="mt-1 text-sm text-slate-600">
          {description ?? user_short_description}
        </p>
      </div>
    </div>
    <div
      className="mt-2"
      dangerouslySetInnerHTML={{ __html: user_images_html }}
    />
  </a>
);

export default HistoryCard;
