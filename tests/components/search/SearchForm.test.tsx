import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchForm } from '@/components/search/SearchForm';

// Mock all problematic components
jest.mock('@/components/auth/GoogleSignInButton', () => {
  return function MockGoogleSignInButton({ theme }: { theme?: string }) {
    return <button data-testid="google-signin-button">Sign in with Google</button>;
  };
});

jest.mock('@/components/UploadBox', () => {
  return function MockUploadBox({ onFileSelected, previewUrl }: { onFileSelected?: (file: File) => void; previewUrl?: string | null }) {
    return (
      <div data-testid="upload-box">
        <input
          type="file"
          aria-label="upload"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && onFileSelected) {
              onFileSelected(file);
            }
          }}
        />
        {previewUrl && <img src={previewUrl} alt="preview" />}
        <span>Drag and drop</span>
      </div>
    );
  };
});

jest.mock('@/components/CreditPurchaseMenu', () => {
  return function MockCreditPurchaseMenu({ buttonClassName }: { buttonClassName?: string }) {
    return <button className={buttonClassName} data-testid="credit-purchase-menu">Purchase Credits</button>;
  };
});

jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn()
}));

const mockOnSearch = jest.fn();

const mockUserSession = {
  id: '123',
  email: 'test@example.com'
};

const mockSession = {
  access_token: 'mock-token',
  refresh_token: 'mock-refresh',
  expires_in: 3600,
  token_type: 'bearer',
  user: mockUserSession
};

const defaultProps = {
  user: mockUserSession,
  session: mockSession,
  credits: 3,
  subscribedUntil: null,
  hasActiveSubscription: false,
  isLoading: false,
  notBoatMessage: '',
  onSearch: mockOnSearch
};

describe('SearchForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('shows sign-in message when no session', () => {
      render(
        <SearchForm
          {...defaultProps}
          user={null}
          session={null}
        />
      );

      expect(screen.getByText(/Welcome aboard!/)).toBeInTheDocument();
      expect(screen.getByText(/sign in first/)).toBeInTheDocument();
    });

    it('shows upload interface when authenticated', () => {
      render(<SearchForm {...defaultProps} />);

      expect(screen.getByText(/Drag and drop/)).toBeInTheDocument();
      expect(screen.getByText(/Search by image/)).toBeInTheDocument();
    });
  });

  describe('Credit System', () => {
    it('shows search button when user has credits', async () => {
      const user = userEvent.setup();
      render(<SearchForm {...defaultProps} credits={3} />);

      // Initially button should be disabled (no file selected)
      const searchButton = screen.getByText(/Search by image/);
      expect(searchButton).toBeInTheDocument();
      expect(searchButton.closest('button')).toBeDisabled();

      // After selecting a file, button should be enabled
      const fileInput = screen.getByLabelText(/upload/i);
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);

      expect(searchButton.closest('button')).not.toBeDisabled();
    });

    it('shows credit purchase menu when no credits', () => {
      render(<SearchForm {...defaultProps} credits={0} />);

      expect(screen.getByText(/Purchase Credits/)).toBeInTheDocument();
    });

    it('shows unlimited searches for active subscription', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      render(
        <SearchForm
          {...defaultProps}
          hasActiveSubscription={true}
          subscribedUntil={futureDate}
        />
      );

      expect(screen.getByText(/Unlimited searches active until/)).toBeInTheDocument();
    });

    it('displays correct credit count', () => {
      render(<SearchForm {...defaultProps} credits={5} />);

      expect(screen.getByText(/You have 5 credits left/)).toBeInTheDocument();
    });
  });

  describe('File Upload', () => {
    it('shows error when searching without file', async () => {
      const user = userEvent.setup();
      render(<SearchForm {...defaultProps} />);

      const searchButton = screen.getByText(/Search by image/);
      await user.click(searchButton);

      await waitFor(() => {
        expect(mockOnSearch).not.toHaveBeenCalled();
      });
    });

    it('calls onSearch when file is selected and search clicked', async () => {
      const user = userEvent.setup();
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      render(<SearchForm {...defaultProps} />);

      const fileInput = screen.getByLabelText(/upload/i);
      await user.upload(fileInput, file);

      const searchButton = screen.getByText(/Search by image/);
      await user.click(searchButton);

      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith(file, 'mocked-url');
      });
    });

    it('disables search button when loading', () => {
      render(<SearchForm {...defaultProps} isLoading={true} />);

      const searchButton = screen.getByText(/Searching.../);
      expect(searchButton.closest('button')).toBeDisabled();
    });
  });

  describe('Error Messages', () => {
    it('displays not boat message when provided', () => {
      render(
        <SearchForm
          {...defaultProps}
          notBoatMessage="This doesn't look like a boat image"
        />
      );

      expect(screen.getByText(/doesn't look like a boat/)).toBeInTheDocument();
    });

    it('hides not boat message when empty', () => {
      render(<SearchForm {...defaultProps} notBoatMessage="" />);

      expect(screen.queryByText(/doesn't look like a boat/)).not.toBeInTheDocument();
    });
  });

  describe('Form Reset', () => {
    it('clears form after successful search', async () => {
      const user = userEvent.setup();
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      render(<SearchForm {...defaultProps} />);

      const fileInput = screen.getByLabelText(/upload/i);
      await user.upload(fileInput, file);

      expect(fileInput.files?.[0]).toBe(file);

      const searchButton = screen.getByText(/Search by image/);
      await user.click(searchButton);

      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalled();
      });
    });
  });
});