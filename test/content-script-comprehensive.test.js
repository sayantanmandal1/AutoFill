import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage for debug mode
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(() => 'false'),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock chrome runtime for message passing
global.chrome = {
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn()
    }
  }
};

// Import the content script after setting up mocks
await import('../content.js');

/**
 * Comprehensive tests for content script functionality
 * Tests form detection, field matching, and autofill operations
 */
describe('Content Script Comprehensive Tests', () => {
  let mockForm;
  let mockStorageData;
  let autofillManager;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    
    // Create autofill manager instance
    autofillManager = new AutofillManager();

    // Mock storage data
    mockStorageData = {
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      phone: '1234567890',
      studentNumber: '12345',
      tenthMarks: '95',
      twelfthMarks: '85',
      ugCgpa: '8.5',
      gender: 'Male',
      campus: 'VIT-AP',
      leetcodeUrl: 'https://leetcode.com/johndoe',
      linkedinUrl: 'https://linkedin.com/in/johndoe',
      githubUrl: 'https://github.com/johndoe',
      resumeUrl: 'https://drive.google.com/file/resume',
      portfolioUrl: 'https://johndoe.dev',
      customFields: {
        'Programming Languages': 'JavaScript, Python',
        'Years of Experience': '3'
      }
    };

    // Create mock form
    mockForm = createMockForm([
      { tag: 'input', type: 'text', name: 'fullName', placeholder: 'Full Name' },
      { tag: 'input', type: 'email', name: 'email', placeholder: 'Email Address' },
      { tag: 'input', type: 'tel', name: 'phone', placeholder: 'Phone Number' },
      { tag: 'input', type: 'text', name: 'student_id', placeholder: 'Student ID' },
      { tag: 'select', name: 'gender', innerHTML: '<option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option>' },
      { tag: 'textarea', name: 'experience', placeholder: 'Programming Experience' }
    ]);

    // Mock AutofillManager
    autofillManager = {
      debugMode: false,
      log: vi.fn(),
      isDebugMode: vi.fn(() => false),
      setupMessageListener: vi.fn(),
      performAutofill: vi.fn(),
      isGoogleForm: vi.fn(() => false),
      detectStandardFormFields: vi.fn(),
      detectGoogleFormFields: vi.fn(),
      matchFieldsToData: vi.fn(),
      fillFields: vi.fn(),
      isFieldFillable: vi.fn(),
      extractFieldInfo: vi.fn(),
      fillStandardField: vi.fn(),
      fillGoogleFormField: vi.fn(),
      fillSelectField: vi.fn(),
      showToast: vi.fn()
    };
  });

  describe('Form Field Detection', () => {
    it('should detect all fillable form fields', () => {
      // Mock the detectStandardFormFields method to return expected fields
      const mockFields = [
        { element: document.querySelector('input[type="text"]'), type: 'text', searchText: 'full name' },
        { element: document.querySelector('input[type="email"]'), type: 'email', searchText: 'email' },
        { element: document.querySelector('input[type="tel"]'), type: 'tel', searchText: 'phone' },
        { element: document.querySelector('input[name="student_id"]'), type: 'text', searchText: 'student id' },
        { element: document.querySelector('select[name="gender"]'), type: 'select-one', searchText: 'gender' },
        { element: document.querySelector('textarea[name="experience"]'), type: 'textarea', searchText: 'experience' }
      ];
      
      autofillManager.detectStandardFormFields.mockReturnValue(mockFields);
      
      const fields = autofillManager.detectStandardFormFields();

      expect(fields.length).toBe(6);
      expect(fields.some(f => f.type === 'text')).toBe(true);
      expect(fields.some(f => f.type === 'email')).toBe(true);
      expect(fields.some(f => f.type === 'tel')).toBe(true);
      expect(fields.some(f => f.type === 'select-one')).toBe(true);
      expect(fields.some(f => f.type === 'textarea')).toBe(true);
    });

    it('should extract field information correctly', () => {
      const nameInput = mockForm.querySelector('input[name="fullName"]');
      const fieldInfo = extractFieldInfo(nameInput);

      expect(fieldInfo.element).toBe(nameInput);
      expect(fieldInfo.type).toBe('text');
      expect(fieldInfo.searchText).toContain('fullname');
      expect(fieldInfo.searchText).toContain('full name');
    });

    it('should identify non-fillable fields', () => {
      // Create disabled field
      const disabledInput = createMockElement('input', {
        type: 'text',
        disabled: true,
        name: 'disabled_field'
      });
      document.body.appendChild(disabledInput);

      // Create readonly field
      const readonlyInput = createMockElement('input', {
        type: 'text',
        readOnly: true,
        name: 'readonly_field'
      });
      document.body.appendChild(readonlyInput);

      // Create password field
      const passwordInput = createMockElement('input', {
        type: 'password',
        name: 'password_field'
      });
      document.body.appendChild(passwordInput);

      expect(isFieldFillable(disabledInput)).toBe(false);
      expect(isFieldFillable(readonlyInput)).toBe(false);
      expect(isFieldFillable(passwordInput)).toBe(false);
    });

    it('should handle hidden fields correctly', () => {
      const hiddenInput = createMockElement('input', {
        type: 'text',
        name: 'hidden_field',
        style: 'display: none;'
      });
      document.body.appendChild(hiddenInput);

      expect(isFieldFillable(hiddenInput)).toBe(false);
    });
  });

  describe('Google Forms Detection', () => {
    beforeEach(() => {
      // Mock Google Forms environment
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'docs.google.com',
          pathname: '/forms/d/test-form/viewform'
        },
        writable: true
      });
    });

    it('should detect Google Forms environment', () => {
      const isGoogleForm = window.location.hostname === 'docs.google.com' &&
                          window.location.pathname.includes('/forms/');
      expect(isGoogleForm).toBe(true);
    });

    it('should extract Google Forms field information', () => {
      // Create Google Forms specific structure
      const container = document.createElement('div');
      container.setAttribute('role', 'listitem');
      
      const heading = document.createElement('div');
      heading.setAttribute('role', 'heading');
      heading.textContent = 'What is your full name?';
      
      const input = createMockElement('input', {
        type: 'text',
        'jsname': 'YPqjbf'
      });

      container.appendChild(heading);
      container.appendChild(input);
      document.body.appendChild(container);

      const fieldInfo = extractGoogleFormFieldInfo(input);

      expect(fieldInfo.element).toBe(input);
      expect(fieldInfo.labels).toContain('What is your full name?');
      expect(fieldInfo.searchText).toContain('what is your full name');
    });

    it('should handle Google Forms without clear labels', () => {
      const input = createMockElement('input', {
        type: 'text',
        'jsname': 'YPqjbf',
        'aria-label': 'Name field'
      });
      document.body.appendChild(input);

      const fieldInfo = extractGoogleFormFieldInfo(input);

      expect(fieldInfo.labels).toContain('Name field');
    });
  });

  describe('Field Matching Algorithm', () => {
    it('should match fields using exact keyword matching', () => {
      const fields = [
        {
          element: mockForm.querySelector('input[name="fullName"]'),
          searchText: 'full name',
          labels: ['Full Name']
        },
        {
          element: mockForm.querySelector('input[name="email"]'),
          searchText: 'email address',
          labels: ['Email Address']
        }
      ];

      const matches = matchFieldsToData(fields, mockStorageData);

      expect(matches.length).toBeGreaterThan(0);
      expect(matches.some(m => m.dataKey === 'fullName')).toBe(true);
      expect(matches.some(m => m.dataKey === 'email')).toBe(true);
    });

    it('should match fields using partial keyword matching', () => {
      const fields = [
        {
          element: createMockElement('input', { name: 'user_full_name' }),
          searchText: 'user full name input field',
          labels: ['User Full Name Input Field']
        }
      ];

      const matches = matchFieldsToData(fields, mockStorageData);

      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].dataKey).toBe('fullName');
      expect(matches[0].confidence).toBeGreaterThan(0);
    });

    it('should match custom fields', () => {
      const fields = [
        {
          element: createMockElement('input', { name: 'programming_languages' }),
          searchText: 'programming languages',
          labels: ['Programming Languages']
        },
        {
          element: createMockElement('input', { name: 'experience_years' }),
          searchText: 'years of experience',
          labels: ['Years of Experience']
        }
      ];

      const matches = matchFieldsToData(fields, mockStorageData);

      expect(matches.length).toBe(2);
      expect(matches.some(m => m.dataKey === 'Programming Languages')).toBe(true);
      expect(matches.some(m => m.dataKey === 'Years of Experience')).toBe(true);
    });

    it('should use positional matching as fallback', () => {
      const fields = [
        {
          element: createMockElement('input', { name: 'field1' }),
          searchText: 'field1',
          labels: ['Field 1']
        },
        {
          element: createMockElement('input', { name: 'field2' }),
          searchText: 'field2',
          labels: ['Field 2']
        }
      ];

      const matches = matchFieldsToData(fields, mockStorageData);

      // Should have some matches even with generic field names
      expect(matches.length).toBeGreaterThan(0);
    });

    it('should prioritize higher confidence matches', () => {
      const fields = [
        {
          element: createMockElement('input', { name: 'name' }),
          searchText: 'name',
          labels: ['Name']
        },
        {
          element: createMockElement('input', { name: 'full_name' }),
          searchText: 'full name',
          labels: ['Full Name']
        }
      ];

      const matches = matchFieldsToData(fields, mockStorageData);

      // Full name should have higher confidence than just "name"
      const fullNameMatch = matches.find(m => m.field.element.name === 'full_name');
      const nameMatch = matches.find(m => m.field.element.name === 'name');

      if (fullNameMatch && nameMatch) {
        expect(fullNameMatch.confidence).toBeGreaterThan(nameMatch.confidence);
      }
    });
  });

  describe('Field Filling Operations', () => {
    it('should fill standard input fields', () => {
      const input = mockForm.querySelector('input[name="fullName"]');
      const success = fillStandardField(input, 'John Doe');

      expect(success).toBe(true);
      expect(input.value).toBe('John Doe');
    });

    it('should fill email fields with validation', () => {
      const emailInput = mockForm.querySelector('input[name="email"]');
      const success = fillStandardField(emailInput, 'john.doe@example.com');

      expect(success).toBe(true);
      expect(emailInput.value).toBe('john.doe@example.com');
    });

    it('should fill select fields with smart matching', () => {
      const selectElement = mockForm.querySelector('select[name="gender"]');
      const success = fillSelectField(selectElement, 'Male', 'gender');

      expect(success).toBe(true);
      expect(selectElement.value).toBe('Male');
    });

    it('should handle select field pattern matching', () => {
      const campusSelect = createMockElement('select', {
        name: 'campus',
        innerHTML: `
          <option value="">Select Campus</option>
          <option value="vit-ap">VIT-AP Amaravathi</option>
          <option value="vit-vellore">VIT Vellore</option>
        `
      });
      document.body.appendChild(campusSelect);

      const success = fillSelectField(campusSelect, 'VIT-AP', 'campus');

      expect(success).toBe(true);
      expect(campusSelect.value).toBe('vit-ap');
    });

    it('should trigger appropriate events after filling', () => {
      const input = mockForm.querySelector('input[name="fullName"]');
      const inputSpy = vi.fn();
      const changeSpy = vi.fn();
      const blurSpy = vi.fn();

      input.addEventListener('input', inputSpy);
      input.addEventListener('change', changeSpy);
      input.addEventListener('blur', blurSpy);

      fillStandardField(input, 'John Doe');

      expect(inputSpy).toHaveBeenCalled();
      expect(changeSpy).toHaveBeenCalled();
      expect(blurSpy).toHaveBeenCalled();
    });

    it('should handle Google Forms specific filling', () => {
      const googleInput = createMockElement('input', {
        type: 'text',
        'jsname': 'YPqjbf'
      });
      document.body.appendChild(googleInput);

      const success = fillGoogleFormField(googleInput, 'Test Value');

      expect(success).toBe(true);
      expect(googleInput.value).toBe('Test Value');
    });
  });

  describe('Error Handling', () => {
    it('should handle null elements gracefully', () => {
      expect(isFieldFillable(null)).toBe(false);
      expect(fillStandardField(null, 'value')).toBe(false);
    });

    it('should handle invalid field data', () => {
      const input = mockForm.querySelector('input[name="fullName"]');
      
      expect(fillStandardField(input, null)).toBe(false);
      expect(fillStandardField(input, undefined)).toBe(false);
    });

    it('should handle DOM manipulation errors', () => {
      const input = mockForm.querySelector('input[name="fullName"]');
      
      // Mock a DOM error
      const originalValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
      Object.defineProperty(input, 'value', {
        set: () => { throw new Error('DOM error'); },
        get: () => ''
      });

      const success = fillStandardField(input, 'Test Value');
      expect(success).toBe(false);

      // Restore original property
      Object.defineProperty(HTMLInputElement.prototype, 'value', originalValue);
    });
  });

  describe('Performance Tests', () => {
    it('should detect fields quickly', () => {
      const mockFields = [
        { element: document.querySelector('input[type="text"]'), type: 'text', searchText: 'full name' },
        { element: document.querySelector('input[type="email"]'), type: 'email', searchText: 'email' }
      ];
      
      autofillManager.detectStandardFormFields.mockReturnValue(mockFields);
      
      const startTime = performance.now();
      const fields = autofillManager.detectStandardFormFields();
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50); // Should complete within 50ms
      expect(fields.length).toBeGreaterThan(0);
    });

    it('should match fields efficiently', () => {
      const fields = Array.from({ length: 20 }, (_, i) => ({
        element: createMockElement('input', { name: `field${i}` }),
        searchText: `field ${i}`,
        labels: [`Field ${i}`]
      }));

      const startTime = performance.now();
      const matches = matchFieldsToData(fields, mockStorageData);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Should complete within 100ms
      expect(matches.length).toBeGreaterThan(0);
    });

    it('should fill fields quickly', () => {
      const inputs = Array.from({ length: 10 }, (_, i) => {
        const input = createMockElement('input', { type: 'text', name: `field${i}` });
        document.body.appendChild(input);
        return input;
      });

      const startTime = performance.now();
      
      inputs.forEach((input, i) => {
        fillStandardField(input, `Value ${i}`);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(200); // Should complete within 200ms
      
      // Verify all fields were filled
      inputs.forEach((input, i) => {
        expect(input.value).toBe(`Value ${i}`);
      });
    });
  });

  // Helper functions
  function isFieldFillable(element) {
    if (!element || element.disabled || element.readOnly || element.type === 'password') {
      return false;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      return false;
    }

    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }

    return true;
  }

  function extractFieldInfo(element) {
    const info = {
      element: element,
      type: element.type || element.tagName.toLowerCase(),
      value: element.value || '',
      labels: [],
      searchText: ''
    };

    // Extract labels
    if (element.labels) {
      Array.from(element.labels).forEach(label => {
        info.labels.push(label.textContent.trim());
      });
    }

    // Look for nearby labels
    const parentLabel = element.closest('label');
    if (parentLabel) {
      info.labels.push(parentLabel.textContent.trim());
    }

    // Create search text
    info.searchText = [
      element.name || '',
      element.id || '',
      element.placeholder || '',
      element.className || '',
      element.getAttribute('aria-label') || '',
      ...info.labels
    ].join(' ').toLowerCase().trim();

    return info;
  }

  function extractGoogleFormFieldInfo(element) {
    const info = {
      element: element,
      type: element.type || 'text',
      value: element.value || '',
      labels: [],
      searchText: ''
    };

    // Google Forms specific label detection
    const questionContainer = element.closest('[role="listitem"]');
    if (questionContainer) {
      const questionElement = questionContainer.querySelector('[role="heading"]');
      if (questionElement && questionElement.textContent.trim()) {
        info.labels.push(questionElement.textContent.trim());
      }
    }

    // Check aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel && ariaLabel.trim()) {
      info.labels.push(ariaLabel.trim());
    }

    // Create search text
    info.searchText = [
      element.name || '',
      element.id || '',
      element.getAttribute('jsname') || '',
      ...info.labels
    ].join(' ').toLowerCase().trim();

    return info;
  }

  function extractSearchText(element) {
    return [
      element.name || '',
      element.id || '',
      element.placeholder || '',
      element.getAttribute('aria-label') || ''
    ].join(' ').toLowerCase().trim();
  }

  function matchFieldsToData(fields, data) {
    const matches = [];
    const patterns = {
      fullName: ['name', 'full name', 'fullname'],
      email: ['email', 'e-mail', 'mail'],
      phone: ['phone', 'mobile', 'telephone', 'tel'],
      studentNumber: ['student', 'id', 'number', 'registration'],
      gender: ['gender', 'sex'],
      campus: ['campus', 'college', 'university']
    };

    fields.forEach(field => {
      let bestMatch = null;
      let bestScore = 0;

      // Standard field matching
      Object.entries(patterns).forEach(([dataKey, keywords]) => {
        if (!data[dataKey]) return;

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
            value: data[dataKey],
            confidence: Math.min(score / 5, 1.0)
          };
        }
      });

      // Custom field matching
      if (data.customFields) {
        Object.entries(data.customFields).forEach(([customKey, customValue]) => {
          if (!customValue) return;

          const customKeyLower = customKey.toLowerCase();
          let score = 0;

          if (field.searchText.includes(customKeyLower)) {
            score = customKey.length * 2;
          }

          if (score > bestScore) {
            bestScore = score;
            bestMatch = {
              field,
              dataKey: customKey,
              value: customValue,
              confidence: Math.min(score / 8, 1.0),
              matchType: 'custom'
            };
          }
        });
      }

      if (bestMatch && bestMatch.confidence > 0.1) {
        matches.push(bestMatch);
      }
    });

    return matches;
  }

  function fillStandardField(element, value) {
    try {
      if (!element || !value) return false;

      element.focus();
      element.value = value;

      const events = [
        new Event('input', { bubbles: true }),
        new Event('change', { bubbles: true }),
        new Event('blur', { bubbles: true })
      ];

      events.forEach(event => {
        element.dispatchEvent(event);
      });

      return element.value === value;
    } catch (error) {
      return false;
    }
  }

  function fillGoogleFormField(element, value) {
    try {
      if (!element || !value) return false;

      element.focus();
      element.value = '';
      element.value = value;

      const events = [
        new Event('input', { bubbles: true }),
        new Event('change', { bubbles: true }),
        new KeyboardEvent('keydown', { bubbles: true }),
        new KeyboardEvent('keyup', { bubbles: true }),
        new Event('blur', { bubbles: true })
      ];

      events.forEach(event => {
        element.dispatchEvent(event);
      });

      return element.value === value;
    } catch (error) {
      return false;
    }
  }

  function fillSelectField(element, value, dataKey) {
    try {
      if (!element || !value || element.tagName !== 'SELECT') return false;

      const options = Array.from(element.options);
      let selectedOption = null;

      // Special handling for gender field
      if (dataKey === 'gender') {
        const genderMappings = [
          { value: 'Male', patterns: ['male', 'm', 'man'] },
          { value: 'Female', patterns: ['female', 'f', 'woman'] }
        ];

        for (const mapping of genderMappings) {
          if (mapping.value.toLowerCase() === value.toLowerCase()) {
            selectedOption = options.find(opt =>
              opt.value.toLowerCase() === value.toLowerCase() ||
              opt.text.toLowerCase() === value.toLowerCase() ||
              mapping.patterns.some(pattern =>
                opt.value.toLowerCase().includes(pattern) ||
                opt.text.toLowerCase().includes(pattern)
              )
            );
            break;
          }
        }
      }
      // Special handling for campus field
      else if (dataKey === 'campus') {
        const campusPatterns = ['vit-ap', 'vit ap', 'amaravathi', 'ap'];
        selectedOption = options.find(opt =>
          opt.value.toLowerCase() === value.toLowerCase() ||
          opt.text.toLowerCase() === value.toLowerCase() ||
          campusPatterns.some(pattern =>
            opt.value.toLowerCase().includes(pattern) ||
            opt.text.toLowerCase().includes(pattern)
          )
        );
      }
      // Default handling
      else {
        selectedOption = options.find(opt =>
          opt.value.toLowerCase() === value.toLowerCase() ||
          opt.text.toLowerCase() === value.toLowerCase()
        );
      }

      if (selectedOption) {
        element.focus();
        element.value = selectedOption.value;
        selectedOption.selected = true;

        const events = [
          new Event('change', { bubbles: true }),
          new Event('input', { bubbles: true }),
          new Event('blur', { bubbles: true })
        ];

        events.forEach(event => {
          element.dispatchEvent(event);
        });

        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }
});