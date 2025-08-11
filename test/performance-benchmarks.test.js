import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Performance benchmark tests for form detection and filling speed
 * Tests performance requirements from the design document
 */
describe('Performance Benchmarks', () => {
  let performanceMetrics;
  let mockForm;
  let mockStorageData;

  beforeEach(() => {
    performanceMetrics = {
      formDetectionTime: [],
      fieldMatchingTime: [],
      fieldFillingTime: [],
      totalAutofillTime: []
    };

    mockStorageData = {
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      phone: '1234567890',
      studentNumber: '12345',
      customFields: {
        'Programming Languages': 'JavaScript, Python',
        'Experience': '3 years'
      }
    };

    // Create a realistic form for testing
    mockForm = createMockForm([
      { tag: 'input', type: 'text', name: 'fullName', placeholder: 'Full Name' },
      { tag: 'input', type: 'email', name: 'email', placeholder: 'Email Address' },
      { tag: 'input', type: 'tel', name: 'phone', placeholder: 'Phone Number' },
      { tag: 'input', type: 'text', name: 'student_id', placeholder: 'Student ID' },
      { tag: 'textarea', name: 'experience', placeholder: 'Experience' }
    ]);
  });

  describe('Form Detection Performance', () => {
    it('should detect form fields within 50ms for typical forms', () => {
      const startTime = performance.now();

      // Simulate form field detection
      const fields = [];
      const selectors = [
        'input[type="text"]',
        'input[type="email"]',
        'input[type="tel"]',
        'textarea'
      ];

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (isFieldFillable(element)) {
            fields.push({
              element,
              type: element.type || 'text',
              searchText: extractSearchText(element)
            });
          }
        });
      });

      const endTime = performance.now();
      const detectionTime = endTime - startTime;

      expect(detectionTime).toBeLessThan(50);
      expect(fields.length).toBeGreaterThan(0);
      
      performanceMetrics.formDetectionTime.push(detectionTime);
    });

    it('should detect Google Form fields within 100ms', () => {
      // Create Google Forms specific elements
      const googleFormContainer = document.createElement('div');
      googleFormContainer.setAttribute('role', 'listitem');
      
      const questionTitle = document.createElement('div');
      questionTitle.setAttribute('role', 'heading');
      questionTitle.textContent = 'What is your name?';
      
      const input = createMockElement('input', {
        type: 'text',
        'jsname': 'YPqjbf'
      });

      googleFormContainer.appendChild(questionTitle);
      googleFormContainer.appendChild(input);
      document.body.appendChild(googleFormContainer);

      const startTime = performance.now();

      // Simulate Google Forms field detection
      const fields = [];
      const selectors = [
        'input[type="text"]',
        'input[jsname]',
        'div[role="textbox"]',
        'textarea'
      ];

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (isGoogleFormFieldFillable(element)) {
            fields.push({
              element,
              type: element.type || 'text',
              searchText: extractGoogleFormFieldInfo(element)
            });
          }
        });
      });

      const endTime = performance.now();
      const detectionTime = endTime - startTime;

      expect(detectionTime).toBeLessThan(100);
      expect(fields.length).toBeGreaterThan(0);

      // Cleanup
      document.body.removeChild(googleFormContainer);
      
      performanceMetrics.formDetectionTime.push(detectionTime);
    });

    it('should handle large forms (50+ fields) within 200ms', () => {
      // Create a large form with 50 fields
      const largeForm = document.createElement('form');
      for (let i = 0; i < 50; i++) {
        const input = createMockElement('input', {
          type: 'text',
          name: `field${i}`,
          placeholder: `Field ${i}`
        });
        largeForm.appendChild(input);
      }
      document.body.appendChild(largeForm);

      const startTime = performance.now();

      // Simulate field detection on large form
      const fields = [];
      const elements = largeForm.querySelectorAll('input');
      elements.forEach(element => {
        if (isFieldFillable(element)) {
          fields.push({
            element,
            type: element.type,
            searchText: extractSearchText(element)
          });
        }
      });

      const endTime = performance.now();
      const detectionTime = endTime - startTime;

      expect(detectionTime).toBeLessThan(200);
      expect(fields.length).toBe(50);

      // Cleanup
      document.body.removeChild(largeForm);
      
      performanceMetrics.formDetectionTime.push(detectionTime);
    });
  });

  describe('Field Matching Performance', () => {
    it('should match fields to data within 30ms for typical forms', () => {
      const fields = [
        {
          element: mockForm.querySelector('input[name="fullName"]'),
          type: 'text',
          searchText: 'full name',
          labels: ['Full Name']
        },
        {
          element: mockForm.querySelector('input[name="email"]'),
          type: 'email',
          searchText: 'email address',
          labels: ['Email Address']
        },
        {
          element: mockForm.querySelector('input[name="phone"]'),
          type: 'tel',
          searchText: 'phone number',
          labels: ['Phone Number']
        }
      ];

      const startTime = performance.now();

      // Simulate field matching algorithm
      const matches = [];
      const patterns = {
        fullName: ['name', 'full name', 'fullname'],
        email: ['email', 'e-mail', 'mail'],
        phone: ['phone', 'mobile', 'telephone', 'tel']
      };

      fields.forEach(field => {
        let bestMatch = null;
        let bestScore = 0;

        Object.entries(patterns).forEach(([dataKey, keywords]) => {
          if (!mockStorageData[dataKey]) return;

          let score = 0;
          keywords.forEach(keyword => {
            if (field.searchText.includes(keyword.toLowerCase())) {
              score += keyword.length;
            }
          });

          if (score > bestScore) {
            bestScore = score;
            bestMatch = {
              field,
              dataKey,
              value: mockStorageData[dataKey],
              confidence: Math.min(score / 5, 1.0)
            };
          }
        });

        if (bestMatch && bestMatch.confidence > 0.1) {
          matches.push(bestMatch);
        }
      });

      const endTime = performance.now();
      const matchingTime = endTime - startTime;

      expect(matchingTime).toBeLessThan(30);
      expect(matches.length).toBeGreaterThan(0);
      
      performanceMetrics.fieldMatchingTime.push(matchingTime);
    });

    it('should match custom fields within 50ms', () => {
      const fields = [
        {
          element: createMockElement('input', { name: 'programming_languages' }),
          type: 'text',
          searchText: 'programming languages',
          labels: ['Programming Languages']
        },
        {
          element: createMockElement('input', { name: 'experience_years' }),
          type: 'text',
          searchText: 'years of experience',
          labels: ['Years of Experience']
        }
      ];

      const startTime = performance.now();

      // Simulate custom field matching
      const matches = [];
      fields.forEach(field => {
        Object.entries(mockStorageData.customFields || {}).forEach(([customKey, customValue]) => {
          const customKeyLower = customKey.toLowerCase();
          let score = 0;

          if (field.searchText.includes(customKeyLower)) {
            score = customKey.length * 2;
          } else {
            const searchWords = field.searchText.split(/\s+/);
            const customWords = customKeyLower.split(/\s+/);

            searchWords.forEach(searchWord => {
              customWords.forEach(customWord => {
                if (searchWord.includes(customWord) || customWord.includes(searchWord)) {
                  if (Math.min(searchWord.length, customWord.length) >= 3) {
                    score += Math.min(searchWord.length, customWord.length);
                  }
                }
              });
            });
          }

          if (score > 0) {
            matches.push({
              field,
              dataKey: customKey,
              value: customValue,
              confidence: Math.min(score / 8, 1.0),
              matchType: 'custom'
            });
          }
        });
      });

      const endTime = performance.now();
      const matchingTime = endTime - startTime;

      expect(matchingTime).toBeLessThan(50);
      expect(matches.length).toBeGreaterThan(0);
      
      performanceMetrics.fieldMatchingTime.push(matchingTime);
    });

    it('should handle complex matching patterns within 100ms', () => {
      // Create complex form with various field types
      const complexFields = [
        { searchText: 'full legal name as per documents', type: 'text' },
        { searchText: 'primary email address for communication', type: 'email' },
        { searchText: 'mobile phone number with country code', type: 'tel' },
        { searchText: 'university student identification number', type: 'text' },
        { searchText: 'programming languages and frameworks experience', type: 'textarea' },
        { searchText: 'years of professional software development experience', type: 'text' }
      ].map((fieldData, index) => ({
        element: createMockElement('input', { name: `complex_field_${index}` }),
        ...fieldData,
        labels: [fieldData.searchText]
      }));

      const startTime = performance.now();

      // Simulate complex matching with multiple strategies
      const matches = [];
      const enhancedPatterns = {
        fullName: ['name', 'full name', 'legal name', 'complete name', 'applicant name'],
        email: ['email', 'e-mail', 'mail', 'electronic mail', 'communication'],
        phone: ['phone', 'mobile', 'telephone', 'contact number', 'country code'],
        studentNumber: ['student', 'identification', 'id number', 'university', 'enrollment']
      };

      complexFields.forEach(field => {
        let bestMatch = null;
        let bestScore = 0;

        // Strategy 1: Exact keyword matching
        Object.entries(enhancedPatterns).forEach(([dataKey, keywords]) => {
          if (!mockStorageData[dataKey]) return;

          let score = 0;
          keywords.forEach(keyword => {
            if (field.searchText.includes(keyword.toLowerCase())) {
              score += keyword.length;
            }
          });

          if (score > bestScore) {
            bestScore = score;
            bestMatch = {
              field,
              dataKey,
              value: mockStorageData[dataKey],
              confidence: Math.min(score / 5, 1.0)
            };
          }
        });

        // Strategy 2: Partial word matching
        if (!bestMatch || bestMatch.confidence < 0.5) {
          Object.entries(enhancedPatterns).forEach(([dataKey, keywords]) => {
            if (!mockStorageData[dataKey]) return;

            keywords.forEach(keyword => {
              const searchWords = field.searchText.split(/\s+/);
              searchWords.forEach(word => {
                if (word.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(word)) {
                  const score = Math.min(keyword.length, word.length);
                  if (score > bestScore && score >= 3) {
                    bestScore = score;
                    bestMatch = {
                      field,
                      dataKey,
                      value: mockStorageData[dataKey],
                      confidence: Math.min(score / 8, 0.8),
                      matchType: 'partial'
                    };
                  }
                }
              });
            });
          });
        }

        if (bestMatch && bestMatch.confidence > 0.1) {
          matches.push(bestMatch);
        }
      });

      const endTime = performance.now();
      const matchingTime = endTime - startTime;

      expect(matchingTime).toBeLessThan(100);
      expect(matches.length).toBeGreaterThan(0);
      
      performanceMetrics.fieldMatchingTime.push(matchingTime);
    });
  });

  describe('Field Filling Performance', () => {
    it('should fill standard form fields within 20ms per field', () => {
      const matches = [
        {
          field: { element: mockForm.querySelector('input[name="fullName"]') },
          value: 'John Doe'
        },
        {
          field: { element: mockForm.querySelector('input[name="email"]') },
          value: 'john.doe@example.com'
        },
        {
          field: { element: mockForm.querySelector('input[name="phone"]') },
          value: '1234567890'
        }
      ];

      const startTime = performance.now();

      // Simulate field filling
      let filledCount = 0;
      matches.forEach(match => {
        const element = match.field.element;
        if (element && !element.disabled && !element.readOnly) {
          element.focus();
          element.value = match.value;
          
          // Trigger events
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          element.dispatchEvent(new Event('blur', { bubbles: true }));
          
          filledCount++;
        }
      });

      const endTime = performance.now();
      const fillingTime = endTime - startTime;
      const timePerField = fillingTime / matches.length;

      expect(timePerField).toBeLessThan(20);
      expect(filledCount).toBe(matches.length);
      
      performanceMetrics.fieldFillingTime.push(fillingTime);
    });

    it('should fill Google Form fields within 30ms per field', () => {
      // Create Google Forms elements
      const googleInputs = [];
      for (let i = 0; i < 3; i++) {
        const container = document.createElement('div');
        container.setAttribute('role', 'listitem');
        
        const input = createMockElement('input', {
          type: 'text',
          'jsname': 'YPqjbf'
        });
        
        container.appendChild(input);
        document.body.appendChild(container);
        googleInputs.push({ container, input });
      }

      const matches = googleInputs.map((item, index) => ({
        field: { element: item.input },
        value: `Test Value ${index + 1}`
      }));

      const startTime = performance.now();

      // Simulate Google Forms field filling
      let filledCount = 0;
      matches.forEach(match => {
        const element = match.field.element;
        if (element) {
          element.focus();
          element.value = '';
          element.value = match.value;

          // Google Forms specific events
          const events = [
            new Event('input', { bubbles: true }),
            new Event('change', { bubbles: true }),
            new KeyboardEvent('keydown', { bubbles: true }),
            new KeyboardEvent('keyup', { bubbles: true }),
            new Event('blur', { bubbles: true })
          ];

          events.forEach(event => element.dispatchEvent(event));
          
          // Additional Google Forms trigger
          setTimeout(() => {
            element.dispatchEvent(new Event('input', { bubbles: true }));
          }, 10);
          
          filledCount++;
        }
      });

      const endTime = performance.now();
      const fillingTime = endTime - startTime;
      const timePerField = fillingTime / matches.length;

      expect(timePerField).toBeLessThan(30);
      expect(filledCount).toBe(matches.length);

      // Cleanup
      googleInputs.forEach(item => document.body.removeChild(item.container));
      
      performanceMetrics.fieldFillingTime.push(fillingTime);
    });

    it('should fill select dropdown fields within 25ms per field', () => {
      const selectElement = createMockElement('select', {
        name: 'gender',
        innerHTML: '<option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option>'
      });
      document.body.appendChild(selectElement);

      const matches = [
        {
          field: { element: selectElement },
          dataKey: 'gender',
          value: 'Male'
        }
      ];

      const startTime = performance.now();

      // Simulate select field filling with smart matching
      let filledCount = 0;
      matches.forEach(match => {
        const element = match.field.element;
        const value = match.value;

        if (element && element.tagName === 'SELECT') {
          const options = Array.from(element.options);
          let selectedOption = null;

          // Try exact match first
          selectedOption = options.find(opt =>
            opt.value.toLowerCase() === value.toLowerCase() ||
            opt.text.toLowerCase() === value.toLowerCase()
          );

          if (selectedOption) {
            element.focus();
            element.value = selectedOption.value;
            selectedOption.selected = true;

            // Trigger events
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('blur', { bubbles: true }));

            filledCount++;
          }
        }
      });

      const endTime = performance.now();
      const fillingTime = endTime - startTime;
      const timePerField = fillingTime / matches.length;

      expect(timePerField).toBeLessThan(25);
      expect(filledCount).toBe(matches.length);

      // Cleanup
      document.body.removeChild(selectElement);
      
      performanceMetrics.fieldFillingTime.push(fillingTime);
    });
  });

  describe('End-to-End Performance', () => {
    it('should complete full autofill workflow within 200ms', async () => {
      const startTime = performance.now();

      // Simulate complete workflow
      // 1. Form detection
      const fields = Array.from(mockForm.querySelectorAll('input, textarea')).map(element => ({
        element,
        type: element.type || 'text',
        searchText: extractSearchText(element)
      }));

      // 2. Field matching
      const matches = [];
      const patterns = {
        fullName: ['name', 'full name'],
        email: ['email', 'mail'],
        phone: ['phone', 'mobile']
      };

      fields.forEach(field => {
        Object.entries(patterns).forEach(([dataKey, keywords]) => {
          if (mockStorageData[dataKey]) {
            keywords.forEach(keyword => {
              if (field.searchText.includes(keyword)) {
                matches.push({
                  field,
                  dataKey,
                  value: mockStorageData[dataKey],
                  confidence: 0.9
                });
              }
            });
          }
        });
      });

      // 3. Field filling
      let filledCount = 0;
      matches.forEach(match => {
        const element = match.field.element;
        if (element) {
          element.value = match.value;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          filledCount++;
        }
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(200);
      expect(filledCount).toBeGreaterThan(0);
      
      performanceMetrics.totalAutofillTime.push(totalTime);
    });

    it('should maintain performance with concurrent operations', async () => {
      const startTime = performance.now();

      // Simulate multiple concurrent autofill operations
      const operations = Array.from({ length: 5 }, async (_, index) => {
        const operationStart = performance.now();
        
        // Simulate field detection
        const fields = Array.from(mockForm.querySelectorAll('input')).map(element => ({
          element,
          searchText: `field ${index}`
        }));

        // Simulate matching
        const matches = fields.slice(0, 2).map(field => ({
          field,
          value: `Value ${index}`
        }));

        // Simulate filling
        matches.forEach(match => {
          match.field.element.value = match.value;
        });

        const operationEnd = performance.now();
        return operationEnd - operationStart;
      });

      const operationTimes = await Promise.all(operations);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(500); // All operations within 500ms
      operationTimes.forEach(time => {
        expect(time).toBeLessThan(100); // Each operation within 100ms
      });
    });
  });

  describe('Memory Usage Performance', () => {
    it('should maintain reasonable memory usage during operations', () => {
      const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

      // Simulate memory-intensive operations
      const largeDataSet = Array.from({ length: 1000 }, (_, i) => ({
        element: createMockElement('input', { name: `field${i}` }),
        searchText: `field ${i} with long description and metadata`,
        labels: [`Field ${i}`, `Description for field ${i}`, `Additional metadata ${i}`]
      }));

      // Process the large dataset
      const matches = [];
      largeDataSet.forEach(field => {
        if (field.searchText.includes('field')) {
          matches.push({
            field,
            value: 'Test Value',
            confidence: 0.8
          });
        }
      });

      const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      if (performance.memory) {
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      }

      expect(matches.length).toBe(1000);
    });
  });

  // Helper functions
  function isFieldFillable(element) {
    return element && !element.disabled && !element.readOnly && element.type !== 'password';
  }

  function isGoogleFormFieldFillable(element) {
    if (!element || element.disabled || element.readOnly) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function extractSearchText(element) {
    return [
      element.name || '',
      element.id || '',
      element.placeholder || '',
      element.getAttribute('aria-label') || ''
    ].join(' ').toLowerCase().trim();
  }

  function extractGoogleFormFieldInfo(element) {
    const container = element.closest('[role="listitem"]');
    if (container) {
      const heading = container.querySelector('[role="heading"]');
      if (heading) {
        return heading.textContent.toLowerCase().trim();
      }
    }
    return extractSearchText(element);
  }
});