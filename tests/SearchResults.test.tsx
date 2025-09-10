import React from 'react';
import { render, screen } from '@testing-library/react';
import { SearchResults } from '@/components/search/SearchResults';
import { Match } from '@/components/HistoryCard';

const fmt = (ts: string) => ts;

function makeResult(count: number, userImage = '/user.png') {
  const results: Match[] = Array.from({ length: count }, (_, i) => ({
    url: `https://example.com/${i}`,
    user_short_description: `desc ${i}`,
  }));
  return {
    id: '1',
    timestamp: new Date().toISOString(),
    user_image: userImage,
    results,
  };
}

describe('SearchResults', () => {
  it('shows exact count and per-item user images (happy path)', () => {
    render(<SearchResults searchResult={makeResult(3)} formatTimestamp={fmt} />);
    expect(screen.getByText('Found 3 matches')).toBeInTheDocument();
    const imgs = screen.getAllByAltText('Your upload');
    expect(imgs.length).toBeGreaterThanOrEqual(3);
  });

  it('pluralizes correctly for a single result', () => {
    render(<SearchResults searchResult={makeResult(1)} formatTimestamp={fmt} />);
    expect(screen.getByText('Found 1 match')).toBeInTheDocument();
  });

  it('shows 0 matches when items have empty url', () => {
    const result = makeResult(0);
    result.results = [{ url: '', user_short_description: 'No results found.' }];
    render(<SearchResults searchResult={result} formatTimestamp={fmt} />);
    expect(screen.getByText('Found 0 matches')).toBeInTheDocument();
  });
});

