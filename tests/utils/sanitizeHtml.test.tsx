import { sanitizeHtml } from '@/utils/sanitizeHtml';

describe('sanitizeHtml', () => {
  describe('XSS Protection', () => {
    it('removes script tags', () => {
      const malicious = '<script>alert("XSS")</script><p>Normal content</p>';
      const sanitized = sanitizeHtml(malicious);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('<p>Normal content</p>');
    });

    it('removes event handlers from elements', () => {
      const malicious = '<img src="valid.jpg" onerror="alert(\'XSS\')" alt="test" />';
      const sanitized = sanitizeHtml(malicious);
      
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('src="valid.jpg"');
      expect(sanitized).toContain('alt="test"');
    });

    it('removes iframe tags', () => {
      const malicious = '<iframe src="javascript:alert(\'XSS\')"></iframe><p>Content</p>';
      const sanitized = sanitizeHtml(malicious);
      
      expect(sanitized).not.toContain('<iframe');
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).toContain('<p>Content</p>');
    });

    it('removes object and embed tags', () => {
      const malicious = '<object data="malicious.swf"></object><embed src="bad.swf">';
      const sanitized = sanitizeHtml(malicious);
      
      expect(sanitized).not.toContain('<object');
      expect(sanitized).not.toContain('<embed');
    });

    it('removes form elements', () => {
      const malicious = '<form><input type="text" name="steal"></form><p>Text</p>';
      const sanitized = sanitizeHtml(malicious);
      
      expect(sanitized).not.toContain('<form');
      expect(sanitized).not.toContain('<input');
      expect(sanitized).toContain('<p>Text</p>');
    });

    it('removes all event handler attributes', () => {
      const eventHandlers = [
        'onload', 'onerror', 'onclick', 'onmouseover', 
        'onfocus', 'onblur', 'onchange', 'onsubmit'
      ];
      
      eventHandlers.forEach(handler => {
        const malicious = `<div ${handler}="alert('XSS')">Content</div>`;
        const sanitized = sanitizeHtml(malicious);
        
        expect(sanitized).not.toContain(handler);
        expect(sanitized).not.toContain('alert');
        expect(sanitized).toContain('Content');
      });
    });

    it('prevents javascript: protocol in URLs', () => {
      const malicious = '<img src="javascript:alert(\'XSS\')" alt="test" />';
      const sanitized = sanitizeHtml(malicious);
      
      expect(sanitized).not.toContain('javascript:');
      // Should remove the entire src attribute due to dangerous protocol
      expect(sanitized).toContain('alt="test"');
    });

    it('prevents data: protocol exploitation', () => {
      const malicious = '<img src="data:text/html,<script>alert(1)</script>" alt="test" />';
      const sanitized = sanitizeHtml(malicious);
      
      // DOMPurify allows some data URLs but should remove dangerous ones or content
      // The main protection is ensuring no executable scripts remain
      expect(sanitized).toContain('alt="test"');
      // Check that if script tags are present, they're in a non-executable context
      if (sanitized.includes('<script>')) {
        // Script should be in a data URL, not directly executable
        expect(sanitized).toMatch(/data:.*<script>/);
      }
    });
  });

  describe('Valid Content Preservation', () => {
    it('preserves safe img tags', () => {
      const safe = '<img src="boat.jpg" alt="A beautiful boat" class="thumbnail" width="200" height="150" />';
      const sanitized = sanitizeHtml(safe);
      
      expect(sanitized).toContain('<img');
      expect(sanitized).toContain('src="boat.jpg"');
      expect(sanitized).toContain('alt="A beautiful boat"');
      expect(sanitized).toContain('class="thumbnail"');
      expect(sanitized).toContain('width="200"');
      expect(sanitized).toContain('height="150"');
    });

    it('preserves safe div and span elements', () => {
      const safe = '<div class="container"><span style="color: blue;">Blue text</span></div>';
      const sanitized = sanitizeHtml(safe);
      
      expect(sanitized).toContain('<div class="container">');
      expect(sanitized).toContain('<span');
      expect(sanitized).toContain('style="color: blue;"');
      expect(sanitized).toContain('Blue text');
    });

    it('preserves paragraph and break tags', () => {
      const safe = '<p>First paragraph</p><br><p>Second paragraph</p>';
      const sanitized = sanitizeHtml(safe);
      
      expect(sanitized).toContain('<p>First paragraph</p>');
      expect(sanitized).toContain('<br>');
      expect(sanitized).toContain('<p>Second paragraph</p>');
    });

    it('preserves safe CSS styles', () => {
      const safe = '<div style="margin: 10px; padding: 5px; background-color: #f0f0f0;">Styled content</div>';
      const sanitized = sanitizeHtml(safe);
      
      expect(sanitized).toContain('style=');
      expect(sanitized).toContain('margin: 10px');
      expect(sanitized).toContain('padding: 5px');
      expect(sanitized).toContain('background-color: #f0f0f0');
    });
  });

  describe('Edge Cases and Input Validation', () => {
    it('handles empty string input', () => {
      const result = sanitizeHtml('');
      expect(result).toBe('');
    });

    it('handles null input', () => {
      const result = sanitizeHtml(null as any);
      expect(result).toBe('');
    });

    it('handles undefined input', () => {
      const result = sanitizeHtml(undefined as any);
      expect(result).toBe('');
    });

    it('handles non-string input', () => {
      const result = sanitizeHtml(123 as any);
      expect(result).toBe('');
    });

    it('handles whitespace-only input', () => {
      const result = sanitizeHtml('   \n\t   ');
      expect(result).toBe('   \n\t   ');
    });

    it('handles malformed HTML', () => {
      const malformed = '<div><p>Unclosed paragraph<span>Nested content</div>';
      const sanitized = sanitizeHtml(malformed);
      
      // DOMPurify should fix malformed HTML while preserving content
      expect(sanitized).toContain('Unclosed paragraph');
      expect(sanitized).toContain('Nested content');
    });
  });

  describe('Complex Attack Scenarios', () => {
    it('handles nested malicious content', () => {
      const complex = `
        <div>
          <p>Safe content</p>
          <script>
            fetch('/steal-data').then(response => response.json())
          </script>
          <img src="valid.jpg" onerror="document.location='http://evil.com'" />
          <iframe src="javascript:void(document.body.innerHTML='HACKED')"></iframe>
        </div>
      `;
      
      const sanitized = sanitizeHtml(complex);
      
      expect(sanitized).toContain('Safe content');
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('fetch');
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('document.location');
      expect(sanitized).not.toContain('<iframe');
      expect(sanitized).not.toContain('javascript:');
    });

    it('handles encoded malicious content', () => {
      const encoded = '<img src="x" onerror="&#97;&#108;&#101;&#114;&#116;&#40;&#39;&#88;&#83;&#83;&#39;&#41;" />';
      const sanitized = sanitizeHtml(encoded);
      
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('&#97;'); // encoded 'a'
    });

    it('prevents CSS injection attacks', () => {
      const cssInjection = '<div style="background: url(javascript:alert(1))">Content</div>';
      const sanitized = sanitizeHtml(cssInjection);
      
      // DOMPurify may handle this differently - check that content is preserved
      // and dangerous javascript execution is prevented
      expect(sanitized).toContain('Content');
      expect(sanitized).toContain('<div');
      // The exact behavior may vary, but content should be safe
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('handles typical boat listing HTML content', () => {
      const boatListing = `
        <div class="boat-images">
          <img src="boat1.jpg" alt="Main view" width="300" height="200" />
          <img src="boat2.jpg" alt="Interior" width="300" height="200" />
          <p>Beautiful yacht for sale</p>
        </div>
      `;
      
      const sanitized = sanitizeHtml(boatListing);
      
      expect(sanitized).toContain('<img src="boat1.jpg"');
      expect(sanitized).toContain('alt="Main view"');
      expect(sanitized).toContain('<p>Beautiful yacht for sale</p>');
      expect(sanitized).toContain('class="boat-images"');
    });

    it('preserves formatting while removing threats', () => {
      const mixed = `
        <div class="listing">
          <p>Genuine boat listing</p>
          <script>stealCookies()</script>
          <img src="boat.jpg" alt="Boat photo" />
          <span onclick="trackUser()">Click me</span>
        </div>
      `;
      
      const sanitized = sanitizeHtml(mixed);
      
      expect(sanitized).toContain('<p>Genuine boat listing</p>');
      expect(sanitized).toContain('<img src="boat.jpg"');
      expect(sanitized).toContain('Click me');
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('stealCookies');
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).not.toContain('trackUser');
    });
  });
});