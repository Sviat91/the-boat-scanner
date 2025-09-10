import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
// Mock components that transitively use import.meta.env
jest.mock('@/components/auth/AuthStatus', () => () => null);
jest.mock('@/components/ThemeToggle', () => () => null);

import Index from '@/pages/Index';

// Mutable auth state for tests
const authState: any = {
  user: { id: 'u1' },
  session: { access_token: 'token' },
  loading: false,
  signInWithGoogle: jest.fn(),
  signOut: jest.fn(),
};

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState,
}));

jest.mock('@/hooks/useCredits', () => ({
  useCredits: () => ({ credits: 3, subscribedUntil: null, hasActiveSubscription: false, loading: false }),
}));

// Favorites helpers used inside HistoryCard
jest.mock('@/lib/favorites', () => ({
  addFavorite: jest.fn(async () => {}),
  removeFavorite: jest.fn(async () => {}),
  isFavorite: jest.fn(async () => false),
}));

const KEY = 'index:lastSearch';

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

test('restores last search results from sessionStorage on Index mount', () => {
  const payload = {
    currentSearchResult: {
      id: '1',
      timestamp: new Date().toISOString(),
      user_image: '/placeholder.svg',
      results: [
        { url: 'https://example.com/boat', user_short_description: 'Nice boat' },
      ],
    },
    notBoatMsg: '',
  };
  sessionStorage.setItem(KEY, JSON.stringify(payload));

  render(<Index />);

  // SearchResults header should be present
  expect(screen.getByText(/Search Results/i)).toBeInTheDocument();
  expect(screen.getByText(/Found 1 match/)).toBeInTheDocument();
});

test('restores notBoatMsg when present without results', () => {
  const payload = {
    currentSearchResult: null,
    notBoatMsg: 'This does not look like a boat.',
  };
  sessionStorage.setItem(KEY, JSON.stringify(payload));

  render(<Index />);

  expect(screen.getByText('This does not look like a boat.')).toBeInTheDocument();
});

test('clears stored last search on sign out', () => {
  const payload = {
    currentSearchResult: {
      id: '2',
      timestamp: new Date().toISOString(),
      user_image: '/placeholder.svg',
      results: [
        { url: 'https://example.com/another', user_short_description: 'Another boat' },
      ],
    },
    notBoatMsg: '',
  };
  sessionStorage.setItem(KEY, JSON.stringify(payload));

  // Mount while signed in
  const { rerender } = render(<Index />);
  expect(sessionStorage.getItem(KEY)).not.toBeNull();

  // Simulate sign out
  authState.user = null;
  authState.session = null;
  rerender(<Index />);

  expect(sessionStorage.getItem(KEY)).toBeNull();
});
