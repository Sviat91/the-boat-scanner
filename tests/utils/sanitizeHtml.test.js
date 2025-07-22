// Simple test for XSS protection without testing framework
// This can be run with node directly

import { sanitizeHtml } from '../../src/utils/sanitizeHtml.js';

console.log('Testing XSS protection in sanitizeHtml...');

// Test 1: Basic XSS script injection
const xssScript = '<script>alert("XSS")</script><p>Normal text</p>';
const sanitizedScript = sanitizeHtml(xssScript);
console.log('1. Script injection test:');
console.log('Input:', xssScript);
console.log('Output:', sanitizedScript);
console.log('Safe:', !sanitizedScript.includes('<script>'));

// Test 2: Event handler injection
const xssEvent = '<img src="x" onerror="alert(\'XSS\')" /><p>Image test</p>';
const sanitizedEvent = sanitizeHtml(xssEvent);
console.log('\n2. Event handler test:');
console.log('Input:', xssEvent);
console.log('Output:', sanitizedEvent);
console.log('Safe:', !sanitizedEvent.includes('onerror'));

// Test 3: iframe injection
const xssIframe = '<iframe src="javascript:alert(\'XSS\')"></iframe><p>Iframe test</p>';
const sanitizedIframe = sanitizeHtml(xssIframe);
console.log('\n3. Iframe injection test:');
console.log('Input:', xssIframe);
console.log('Output:', sanitizedIframe);
console.log('Safe:', !sanitizedIframe.includes('<iframe'));

// Test 4: Valid image should pass through
const validImg = '<img src="boat.jpg" alt="A boat" class="thumbnail" />';
const sanitizedValid = sanitizeHtml(validImg);
console.log('\n4. Valid image test:');
console.log('Input:', validImg);
console.log('Output:', sanitizedValid);
console.log('Safe:', sanitizedValid.includes('<img'));

// Test 5: Empty/null input
const emptyInput = '';
const nullInput = null;
const sanitizedEmpty = sanitizeHtml(emptyInput);
const sanitizedNull = sanitizeHtml(nullInput);
console.log('\n5. Empty/null input test:');
console.log('Empty input result:', sanitizedEmpty);
console.log('Null input result:', sanitizedNull);
console.log('Safe:', sanitizedEmpty === '' && sanitizedNull === '');

console.log('\nAll XSS protection tests completed!');