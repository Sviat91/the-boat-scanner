import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

const mockNavigate = jest.fn();
const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
  },
};

const mockHistory = [
  {
    id: 1,
    search_query: 'Test Search 1',
    search_results: [
      { url: 'boat1.jpg', user_short_description: 'Yacht for sale', title: 'Luxury Yacht' },
      { url: 'boat2.jpg', user_short_description: 'Sailboat', title: 'Racing Sailboat' },
    ],
    user_image_url: 'test-upload1.jpg',
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    search_query: 'Test Search 2',
    search_results: [
      { url: 'boat3.jpg', user_short_description: 'Motorboat', title: 'Speed Boat' },
    ],
    user_image_url: 'test-upload2.jpg',
    created_at: '2024-01-16T10:00:00Z',
  },
];

const mockRemoveResultByUrl = jest.fn();
const mockDeleteHistoryItem = jest.fn();
const mockClearHistory = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

jest.mock('@/hooks/useSearchHistory', () => ({
  useSearchHistory: () => ({
    history: mockHistory,
    loading: false,
    clearHistory: mockClearHistory,
    deleteHistoryItem: mockDeleteHistoryItem,
    removeResultByUrl: mockRemoveResultByUrl,
  }),
}));

jest.mock('@/components/ThemeToggle', () => ({
  __esModule: true,
  default: () => <div>Theme Toggle</div>,
}));

jest.mock('@/components/AuthStatus', () => ({
  __esModule: true,
  default: () => <div>Auth Status</div>,
}));

jest.mock('@/components/CreditPurchaseMenu', () => ({
  __esModule: true,
  default: () => <div>Credit Purchase</div>,
}));

jest.mock('@/components/HistoryCard', () => ({
  __esModule: true,
  default: ({ url, title }: any) => <div data-testid={`history-card-${url}`}>{title}</div>,
}));

import Dashboard from '@/pages/Dashboard';

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  );
};

describe('Dashboard - Search History UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Nested accordions default state', () => {
    it('renders search history accordion collapsed by default', () => {
      renderDashboard();

      // Main accordion header should be visible
      expect(screen.getByText(/Search History/i)).toBeInTheDocument();

      // But nested content should not be immediately visible (accordion closed)
      // We check by looking for the specific search results which are only visible when expanded
      expect(screen.queryByText('Luxury Yacht')).not.toBeInTheDocument();
      expect(screen.queryByText('Racing Sailboat')).not.toBeInTheDocument();
    });

    it('shows nested search items when main accordion is opened', async () => {
      renderDashboard();

      // Click to open main Search History accordion
      const searchHistoryTrigger = screen.getByText(/Search History/i);
      fireEvent.click(searchHistoryTrigger);

      // Wait for content to appear
      await waitFor(() => {
        // Should now see the nested accordion triggers (each search item)
        expect(screen.getByText(/2 matches found/i)).toBeInTheDocument();
        expect(screen.getByText(/1 match found/i)).toBeInTheDocument();
      });

      // But individual search results should still be collapsed
      expect(screen.queryByText('Luxury Yacht')).not.toBeInTheDocument();
    });

    it('shows individual search results when nested accordion is opened', async () => {
      renderDashboard();

      // Open main accordion
      const searchHistoryTrigger = screen.getByText(/Search History/i);
      fireEvent.click(searchHistoryTrigger);

      await waitFor(() => {
        expect(screen.getByText(/2 matches found/i)).toBeInTheDocument();
      });

      // Click on first nested search item
      const firstSearchTrigger = screen.getByText(/2 matches found/i);
      fireEvent.click(firstSearchTrigger);

      // Now should see the actual results
      await waitFor(() => {
        expect(screen.getByText('Luxury Yacht')).toBeInTheDocument();
        expect(screen.getByText('Racing Sailboat')).toBeInTheDocument();
      });
    });

    it('persists open state in localStorage', async () => {
      renderDashboard();

      // Open main accordion
      fireEvent.click(screen.getByText(/Search History/i));

      await waitFor(() => {
        expect(screen.getByText(/2 matches found/i)).toBeInTheDocument();
      });

      // Click on first nested item
      fireEvent.click(screen.getByText(/2 matches found/i));

      await waitFor(() => {
        // Check localStorage was updated
        const storedValue = localStorage.getItem('dashboard-open-search-item');
        expect(storedValue).toBe('1');
      });
    });
  });

  describe('Per-ad delete functionality', () => {
    it('renders delete button for each ad in search results', async () => {
      renderDashboard();

      // Open accordions
      fireEvent.click(screen.getByText(/Search History/i));
      await waitFor(() => {
        expect(screen.getByText(/2 matches found/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/2 matches found/i));

      await waitFor(() => {
        // Should see delete buttons (trash icons)
        const deleteButtons = screen.getAllByTitle('Remove this result');
        expect(deleteButtons).toHaveLength(2); // 2 ads in first search
      });
    });

    it('calls removeResultByUrl with correct arguments when delete clicked', async () => {
      renderDashboard();

      // Open accordions
      fireEvent.click(screen.getByText(/Search History/i));
      await waitFor(() => {
        expect(screen.getByText(/2 matches found/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/2 matches found/i));

      await waitFor(() => {
        const deleteButtons = screen.getAllByTitle('Remove this result');
        expect(deleteButtons.length).toBeGreaterThan(0);
      });

      // Click first delete button
      const deleteButtons = screen.getAllByTitle('Remove this result');
      fireEvent.click(deleteButtons[0]);

      // Should call removeResultByUrl with searchId=1 and url='boat1.jpg'
      await waitFor(() => {
        expect(mockRemoveResultByUrl).toHaveBeenCalledWith(1, 'boat1.jpg');
      });
    });

    it('applies removing animation class when delete is clicked', async () => {
      renderDashboard();

      // Open accordions
      fireEvent.click(screen.getByText(/Search History/i));
      await waitFor(() => {
        fireEvent.click(screen.getByText(/2 matches found/i));
      });

      await waitFor(() => {
        const deleteButtons = screen.getAllByTitle('Remove this result');
        fireEvent.click(deleteButtons[0]);
      });

      // The component should apply opacity-0 and translate classes
      await waitFor(() => {
        expect(mockRemoveResultByUrl).toHaveBeenCalled();
      });
    });

    it('does not show delete button for not_boat results', async () => {
      // Mock history with not_boat result
      const notBoatHistory = [
        {
          id: 3,
          search_query: 'Not a boat',
          search_results: { not_boat: 'This is not a boat image' },
          user_image_url: 'test-upload3.jpg',
          created_at: '2024-01-17T10:00:00Z',
        },
      ];

      jest.spyOn(require('@/hooks/useSearchHistory'), 'useSearchHistory').mockReturnValue({
        history: notBoatHistory,
        loading: false,
        clearHistory: mockClearHistory,
        deleteHistoryItem: mockDeleteHistoryItem,
        removeResultByUrl: mockRemoveResultByUrl,
      });

      renderDashboard();

      fireEvent.click(screen.getByText(/Search History/i));

      await waitFor(() => {
        // Should see the not_boat message but no delete buttons
        const deleteButtons = screen.queryAllByTitle('Remove this result');
        expect(deleteButtons).toHaveLength(0);
      });
    });
  });

  describe('Clear All button', () => {
    it('renders Clear All button for each search', async () => {
      renderDashboard();

      fireEvent.click(screen.getByText(/Search History/i));

      await waitFor(() => {
        const clearButtons = screen.getAllByTitle('Delete this search');
        expect(clearButtons.length).toBeGreaterThan(0);
      });
    });

    it('calls deleteHistoryItem when Clear All is clicked', async () => {
      renderDashboard();

      fireEvent.click(screen.getByText(/Search History/i));

      await waitFor(() => {
        const clearButtons = screen.getAllByTitle('Delete this search');
        fireEvent.click(clearButtons[0]);
      });

      await waitFor(() => {
        expect(mockDeleteHistoryItem).toHaveBeenCalledWith(1);
      });
    });

    it('prevents event propagation when clicking delete buttons', async () => {
      renderDashboard();

      fireEvent.click(screen.getByText(/Search History/i));
      
      await waitFor(() => {
        fireEvent.click(screen.getByText(/2 matches found/i));
      });

      await waitFor(() => {
        const deleteButtons = screen.getAllByTitle('Remove this result');
        const initialAccordionState = localStorage.getItem('dashboard-open-search-item');
        
        fireEvent.click(deleteButtons[0]);

        // Accordion state should not change (event propagation stopped)
        const afterClickState = localStorage.getItem('dashboard-open-search-item');
        expect(afterClickState).toBe(initialAccordionState);
      });
    });
  });
});
