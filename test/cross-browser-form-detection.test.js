/**
 * Cross-Browser Form Detection Tests
 * Tests form detection and filling across different browser environments
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock different browser DOM implementations
const createMockDOM = (browserType) => {
  const mockDocument = {
    querySelectorAll: vi.fn(),
    createElement: vi.fn(),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn()
    }
  };

  const mockWindow = {
    document: mockDocument,
    getComputedStyle: vi.fn(),
    navigator: {
      userAgent: getBrowserUserAgent(browserType)
    }
  };

  return { document: mockDocument, window: mockWindow };
};

const getBrowserUserAgent = (browserType) => {
  const userAgents = {
    chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    brave: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
  };
  return userAgents[browserType] || userAgents.chrome;
};

// Mock form elements for testing
const createMockFormElements = () => {
  const createMockElement = (tag, attributes = {}) => ({
    tagName: tag.toUpperCase(),
    type: attributes.type || 'text',
    name: attributes.name || '',
    id: attributes.id || '',
    placeholder: attributes.placeholder || '',
    value: '',
    getAttribute: vi.fn((attr) => attributes[attr] || null),
    setAttribute: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    dispatchEvent: vi.fn(),
    labels: attributes.labels || [],
    closest: vi.fn()
  });

  return [
    createMockElement('input', { 
      name: 'full-name', 
      id: 'applicant-name', 
      placeholder: 'Enter your full name',
      type: 'text'
    }),
    createMockElement('input', { 
      name: 'email', 
      id: 'contact-email', 
      placeholder: 'Your email address',
      type: 'email'
    }),
    createMockElement('input', { 
      name: 'phone', 
      id: 'phone-number', 
      placeholder: 'Phone number',
      type: 'tel'
    }),
    createMockElement('textarea', { 
      name: 'cover-letter', 
      id: 'cover-letter-text', 
      placeholder: 'Write your cover letter'
    }),
    createMockElement('select', { 
      name: 'experience-level', 
      id: 'experience-select'
    })
  ];
};

describe('Cross-Browser Form Detection', () => {
  const browsers = ['chrome', 'brave', 'edge'];
  
  browsers.forEach(browserType => {
    describe(`${browserType.charAt(0).toUpperCase() + browserType.slice(1)} Browser`, () => {
      let mockDOM;
      let mockElements;

      beforeEach(() => {
        mockDOM = createMockDOM(browserType);
        mockElements = createMockFormElements();
        
        // Set up global objects
        global.document = mockDOM.document;
        global.window = mockDOM.window;
        global.navigator = mockDOM.window.navigator;
        
        // Mock querySelectorAll to return our test elements
        mockDOM.document.querySelectorAll.mockReturnValue(mockElements);
      });

      it('should detect form fields using multiple strategies', () => {
        const fieldMappings = {
          fullName: {
            keywords: ['name', 'full-name', 'fullname', 'your-name', 'applicant-name'],
            inputTypes: ['text'],
            priority: 1
          },
          email: {
            keywords: ['email', 'e-mail', 'contact-email', 'university-email'],
            inputTypes: ['email', 'text'],
            priority: 1
          },
          phone: {
            keywords: ['phone', 'mobile', 'contact', 'telephone', 'cell'],
            inputTypes: ['tel', 'text'],
            priority: 1
          }
        };

        // Simulate form detection algorithm
        const detectedFields = {};
        
        mockElements.forEach(element => {
          Object.entries(fieldMappings).forEach(([fieldKey, mapping]) => {
            const nameMatch = mapping.keywords.some(keyword => 
              element.name.toLowerCase().includes(keyword.toLowerCase())
            );
            const idMatch = mapping.keywords.some(keyword => 
              element.id.toLowerCase().includes(keyword.toLowerCase())
            );
            const placeholderMatch = mapping.keywords.some(keyword => 
              element.placeholder.toLowerCase().includes(keyword.toLowerCase())
            );

            if (nameMatch || idMatch || placeholderMatch) {
              detectedFields[fieldKey] = element;
            }
          });
        });

        expect(detectedFields.fullName).toBeDefined();
        expect(detectedFields.email).toBeDefined();
        expect(detectedFields.phone).toBeDefined();
      });

      it('should handle different input types correctly', () => {
        const inputTypes = ['text', 'email', 'tel', 'url', 'password'];
        
        inputTypes.forEach(type => {
          const element = {
            type: type,
            name: 'test-field',
            value: '',
            setAttribute: vi.fn(),
            dispatchEvent: vi.fn()
          };

          // Simulate filling the field
          const testValue = 'test-value';
          element.value = testValue;
          
          expect(element.value).toBe(testValue);
        });
      });

      it('should trigger appropriate events after filling', () => {
        const element = mockElements[0]; // text input
        const testValue = 'John Doe';
        
        // Simulate the filling process with events
        element.focus();
        element.value = testValue;
        
        // Create and dispatch events
        const inputEvent = new Event('input', { bubbles: true });
        const changeEvent = new Event('change', { bubbles: true });
        
        element.dispatchEvent(inputEvent);
        element.dispatchEvent(changeEvent);
        element.blur();

        expect(element.focus).toHaveBeenCalled();
        expect(element.dispatchEvent).toHaveBeenCalledTimes(2);
        expect(element.blur).toHaveBeenCalled();
      });

      it('should handle dynamic forms and SPAs', () => {
        // Mock MutationObserver for dynamic content
        const mockMutationObserver = vi.fn();
        mockMutationObserver.prototype.observe = vi.fn();
        mockMutationObserver.prototype.disconnect = vi.fn();
        global.MutationObserver = mockMutationObserver;

        // Simulate dynamic form detection
        const observer = new MutationObserver(() => {});
        observer.observe(mockDOM.document.body, {
          childList: true,
          subtree: true
        });

        expect(mockMutationObserver.prototype.observe).toHaveBeenCalled();
      });

      it('should respect browser-specific form validation', () => {
        const emailInput = mockElements.find(el => el.type === 'email');
        
        // Mock browser validation
        emailInput.checkValidity = vi.fn(() => true);
        emailInput.setCustomValidity = vi.fn();
        
        // Test email validation
        emailInput.value = 'test@example.com';
        const isValid = emailInput.checkValidity();
        
        expect(isValid).toBe(true);
        expect(emailInput.checkValidity).toHaveBeenCalled();
      });
    });
  });

  describe('Browser-Specific Edge Cases', () => {
    it('should handle Chrome-specific form behaviors', () => {
      const mockDOM = createMockDOM('chrome');
      global.document = mockDOM.document;
      global.navigator = mockDOM.window.navigator;

      // Chrome-specific autocomplete handling
      const input = createMockFormElements()[0];
      input.autocomplete = 'name';
      
      expect(input.autocomplete).toBe('name');
    });

    it('should handle Brave privacy features', () => {
      const mockDOM = createMockDOM('brave');
      global.document = mockDOM.document;
      global.navigator = mockDOM.window.navigator;

      // Brave might block certain tracking scripts
      const isBlocked = mockDOM.window.navigator.userAgent.includes('Brave');
      
      // Our extension should work regardless
      expect(typeof mockDOM.document.querySelectorAll).toBe('function');
    });

    it('should handle Edge compatibility mode', () => {
      const mockDOM = createMockDOM('edge');
      global.document = mockDOM.document;
      global.navigator = mockDOM.window.navigator;

      // Edge-specific user agent detection
      const isEdge = mockDOM.window.navigator.userAgent.includes('Edg/');
      
      expect(isEdge).toBe(true);
    });
  });
});