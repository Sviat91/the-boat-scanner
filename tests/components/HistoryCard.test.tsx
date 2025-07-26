import { render, screen } from '@testing-library/react';
import HistoryCard from '@/components/HistoryCard';

const mockSanitizeHtml = jest.fn();

jest.mock('@/utils/sanitizeHtml', () => ({
  sanitizeHtml: (...args: any[]) => mockSanitizeHtml(...args)
}));

const defaultProps = {
  url: 'https://example.com/boat-listing',
  user_short_description: 'Beautiful yacht for sale',
  user_images_html: '<img src="boat.jpg" alt="boat" />',
  thumbnail: 'https://example.com/thumb.jpg',
  title: 'Luxury Yacht',
  description: 'A stunning 50-foot yacht with all amenities'
};

describe('HistoryCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSanitizeHtml.mockImplementation(html => html); // Pass through by default
  });

  describe('Basic Rendering', () => {
    it('renders with all props provided', () => {
      render(<HistoryCard {...defaultProps} />);

      expect(screen.getByText('Luxury Yacht')).toBeInTheDocument();
      expect(screen.getByText('A stunning 50-foot yacht with all amenities')).toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'Luxury Yacht' })).toBeInTheDocument();
    });

    it('renders as a clickable link', () => {
      render(<HistoryCard {...defaultProps} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://example.com/boat-listing');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener');
    });

    it('shows thumbnail when provided', () => {
      render(<HistoryCard {...defaultProps} />);

      const thumbnail = screen.getByRole('img', { name: 'Luxury Yacht' });
      expect(thumbnail).toHaveAttribute('src', 'https://example.com/thumb.jpg');
      expect(thumbnail).toHaveClass('w-20', 'h-16', 'object-cover');
    });
  });

  describe('Fallback Behavior', () => {
    it('uses URL as title when title is not provided', () => {
      render(<HistoryCard {...defaultProps} title={undefined} />);

      expect(screen.getByText('https://example.com/boat-listing')).toBeInTheDocument();
    });

    it('uses user_short_description when description is not provided', () => {
      render(<HistoryCard {...defaultProps} description={undefined} />);

      expect(screen.getByText('Beautiful yacht for sale')).toBeInTheDocument();
    });

    it('handles missing thumbnail gracefully', () => {
      mockSanitizeHtml.mockReturnValue(''); // No images in sanitized content
      
      render(<HistoryCard {...defaultProps} thumbnail={undefined} user_images_html="" />);

      // Should not render thumbnail img when not provided
      const images = screen.queryAllByRole('img');
      expect(images).toHaveLength(0);
    });

    it('handles empty user_images_html', () => {
      render(<HistoryCard {...defaultProps} user_images_html="" />);

      expect(mockSanitizeHtml).toHaveBeenCalledWith("");
    });

    it('handles undefined user_images_html', () => {
      render(<HistoryCard {...defaultProps} user_images_html={undefined} />);

      expect(mockSanitizeHtml).toHaveBeenCalledWith("");
    });
  });

  describe('XSS Protection Integration', () => {
    it('calls sanitizeHtml for user_images_html content', () => {
      const maliciousHtml = '<script>alert("XSS")</script><img src="boat.jpg" />';
      
      render(<HistoryCard {...defaultProps} user_images_html={maliciousHtml} />);

      expect(mockSanitizeHtml).toHaveBeenCalledWith(maliciousHtml);
    });

    it('renders sanitized HTML content safely', () => {
      const maliciousHtml = '<script>alert("XSS")</script><img src="boat.jpg" />';
      const sanitizedHtml = '<img src="boat.jpg" />';
      
      mockSanitizeHtml.mockReturnValue(sanitizedHtml);

      const { container } = render(
        <HistoryCard {...defaultProps} user_images_html={maliciousHtml} />
      );

      // Check that the sanitized HTML is rendered
      const imageInContent = container.querySelector('div[class="mt-2"] img');
      expect(imageInContent).toBeInTheDocument();
      expect(imageInContent).toHaveAttribute('src', 'boat.jpg');

      // Ensure no script tags are present
      expect(container.querySelector('script')).not.toBeInTheDocument();
    });

    it('handles complex malicious content', () => {
      const complexMalicious = `
        <div onclick="stealData()">
          <img src="boat.jpg" onerror="alert('XSS')" />
          <script>fetch('/steal-cookies')</script>
          <iframe src="javascript:alert('IFRAME XSS')"></iframe>
        </div>
      `;
      
      const sanitized = '<div><img src="boat.jpg" /></div>';
      mockSanitizeHtml.mockReturnValue(sanitized);

      render(<HistoryCard {...defaultProps} user_images_html={complexMalicious} />);

      expect(mockSanitizeHtml).toHaveBeenCalledWith(complexMalicious);
    });
  });

  describe('Accessibility', () => {
    it('provides proper alt text for thumbnail', () => {
      render(<HistoryCard {...defaultProps} />);

      const thumbnail = screen.getByRole('img', { name: 'Luxury Yacht' });
      expect(thumbnail).toHaveAttribute('alt', 'Luxury Yacht');
    });

    it('uses URL as alt text when title is missing', () => {
      render(<HistoryCard {...defaultProps} title={undefined} />);

      const thumbnail = screen.getByRole('img', { name: 'https://example.com/boat-listing' });
      expect(thumbnail).toHaveAttribute('alt', 'https://example.com/boat-listing');
    });

    it('maintains proper link semantics', () => {
      render(<HistoryCard {...defaultProps} />);

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveClass('block'); // Ensures proper clickable area
    });
  });

  describe('Styling and Layout', () => {
    it('applies correct CSS classes for hover effects', () => {
      render(<HistoryCard {...defaultProps} />);

      const link = screen.getByRole('link');
      expect(link).toHaveClass(
        'hover:border-blue-400',
        'hover:bg-blue-50',
        'dark:hover:border-blue-400',
        'dark:hover:bg-blue-900/20'
      );
    });

    it('applies correct layout classes', () => {
      render(<HistoryCard {...defaultProps} />);

      const link = screen.getByRole('link');
      expect(link).toHaveClass('p-4', 'rounded', 'transition-colors');
      
      // Check internal layout structure
      const flexContainer = link.querySelector('.flex.gap-4.items-start');
      expect(flexContainer).toBeInTheDocument();
    });

    it('applies text styling correctly', () => {
      render(<HistoryCard {...defaultProps} />);

      const title = screen.getByText('Luxury Yacht');
      expect(title).toHaveClass(
        'font-medium',
        'text-blue-700',
        'dark:text-blue-300',
        'underline',
        'break-words'
      );

      const description = screen.getByText('A stunning 50-foot yacht with all amenities');
      expect(description).toHaveClass(
        'mt-1',
        'text-sm',
        'text-slate-600',
        'dark:text-slate-300'
      );
    });
  });

  describe('Content Security', () => {
    it('prevents XSS in title prop', () => {
      const maliciousTitle = '<script>alert("XSS")</script>Boat Title';
      
      render(<HistoryCard {...defaultProps} title={maliciousTitle} />);

      // React automatically escapes text content in JSX
      expect(screen.getByText(maliciousTitle)).toBeInTheDocument();
      
      // Ensure no actual script element is created
      const { container } = render(<HistoryCard {...defaultProps} title={maliciousTitle} />);
      expect(container.querySelector('script')).not.toBeInTheDocument();
    });

    it('prevents XSS in description prop', () => {
      const maliciousDesc = '<img src=x onerror=alert("XSS")>Description';
      
      render(<HistoryCard {...defaultProps} description={maliciousDesc} />);

      // React automatically escapes text content
      expect(screen.getByText(maliciousDesc)).toBeInTheDocument();
    });

    it('only allows dangerous HTML through sanitization function', () => {
      render(<HistoryCard {...defaultProps} />);

      // Verify that ONLY user_images_html goes through sanitization
      expect(mockSanitizeHtml).toHaveBeenCalledTimes(1);
      expect(mockSanitizeHtml).toHaveBeenCalledWith('<img src="boat.jpg" alt="boat" />');
    });
  });

  describe('Real-world Scenarios', () => {
    it('handles typical boat listing data', () => {
      const boatListing = {
        url: 'https://facebook.com/marketplace/item/123456789',
        user_short_description: '32ft Catalina Sailboat - Great condition!',
        user_images_html: '<div class="images"><img src="boat1.jpg" /><img src="boat2.jpg" /></div>',
        thumbnail: 'https://fb-cdn.com/boat-thumb.jpg',
        title: '1985 Catalina 32 Sailboat',
        description: 'Well-maintained sailboat with new sails and electronics'
      };

      render(<HistoryCard {...boatListing} />);

      expect(screen.getByText('1985 Catalina 32 Sailboat')).toBeInTheDocument();
      expect(screen.getByText('Well-maintained sailboat with new sails and electronics')).toBeInTheDocument();
      expect(mockSanitizeHtml).toHaveBeenCalledWith(boatListing.user_images_html);
    });

    it('handles minimal listing data', () => {
      const minimalListing = {
        url: 'https://craigslist.org/boat/123',
        user_short_description: 'Boat for sale'
      };

      render(<HistoryCard {...minimalListing} />);

      expect(screen.getByText('https://craigslist.org/boat/123')).toBeInTheDocument();
      expect(screen.getByText('Boat for sale')).toBeInTheDocument();
      expect(mockSanitizeHtml).toHaveBeenCalledWith("");
    });
  });
});