import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param html - Raw HTML string that needs to be sanitized
 * @returns Sanitized HTML string safe for rendering
 */
export const sanitizeHtml = (html: string): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Configure DOMPurify to allow safe HTML tags and attributes
  // Only allow basic formatting tags that might be needed for image display
  const config = {
    ALLOWED_TAGS: ['img', 'div', 'span', 'p', 'br'],
    ALLOWED_ATTR: ['src', 'alt', 'class', 'style', 'width', 'height'],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    // Prevent script execution
    FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input'],
    FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur']
  };

  return DOMPurify.sanitize(html, config);
};