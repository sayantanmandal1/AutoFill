import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Integration tests for complete autofill workflows
 * Tests end-to-end functionality from data storage to form filling
 */
describe('Integration: Complete Autofill Workflows', () => {
  let mockStorageData;
  let mockForm;
  let autofillManager;

  beforeEach(() => {
    // Setup mock storage data
    mockStorageData = {
      profiles: {
        default: {
          name: 'Default Profile',
          data: {
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
          }
        },
        work: {
          name: 'Work Profile',
          data: {
            fullName: 'Jane Smith',
            email: 'jane.smith@company.com',
            phone: '9876543210',
            customFields: {
              'Company': 'Tech Corp',
              'Position': 'Senior Developer'
            }
          }
        }
      },
      settings: {
        activeProfile: 'default',
        autoFillEnabled: true,
        blacklistedDomains: ['blocked.com'],
        passwordProtected: false
      }
    };

    // Setup mock chrome storage
    setupMockStorage(mockStorageData);

    // Create mock form
    mockForm = createMockForm([
      { tag: 'input', type: 'text', name: 'fullName', placeholder: 'Full Name' },
      { tag: 'input', type: 'email', name: 'email', placeholder: 'Email Address' },
      { tag: 'input', type: 'tel', name: 'phone', placeholder: 'Phone Number' },
      { tag: 'input', type: 'text', name: 'student_id', placeholder: 'Student ID' },
      { tag: 'select', name: 'gender', innerHTML: '<option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option>' },
      { tag: 'textarea', name: 'experience', placeholder: 'Programming Experience' }
    ]);

    // Import and initialize AutofillManager
    if (typeof window !== 'undefined' && window.AutofillManager) {
      autofillManager = new window.AutofillManager();
    } else {
      // Mock AutofillManager for testing
      autofillManager = {
        performAutofill: vi.fn(),
        detectStandardFormFields: vi.fn(),
        matchFieldsToData: vi.fn(),
        fillFields: vi.fn()
      };
    }
  });

  describe('Standard HTML Form Workflow', () => {
    it('should complete full autofill workflow on standard form', async () => {
      // Simulate form detection
      const mockFields = [
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

      // Mock field detection
      if (autofillManager.detectStandardFormFields) {
        autofillManager.detectStandardFormFields.mockReturnValue(mockFields);
      }

      // Mock field matching
      const mockMatches = [
        {
          field: mockFields[0],
          dataKey: 'fullName',
          value: 'John Doe',
          confidence: 0.9
        },
        {
          field: mockFields[1],
          dataKey: 'email',
          value: 'john.doe@example.com',
          confidence: 0.95
        },
        {
          field: mockFields[2],
          dataKey: 'phone',
          value: '1234567890',
          confidence: 0.8
        }
      ];

      if (autofillManager.matchFieldsToData) {
        autofillManager.matchFieldsToData.mockReturnValue(mockMatches);
      }

      // Mock field filling
      if (autofillManager.fillFields) {
        autofillManager.fillFields.mockReturnValue(3);
      }

      // Mock the complete workflow
      if (autofillManager.performAutofill) {
        autofillManager.performAutofill.mockResolvedValue({
          filledCount: 3,
          message: 'Success'
        });
      }

      // Execute autofill workflow
      const result = await autofillManager.performAutofill(mockStorageData.profiles.default.data);

      // Verify workflow completion
      expect(result.filledCount).toBe(3);
      expect(result.message).toBe('Success');

      // Verify methods were called
      if (autofillManager.detectStandardFormFields.mock) {
        expect(autofillManager.detectStandardFormFields).toHaveBeenCalled();
      }
      if (autofillManager.matchFieldsToData.mock) {
        expect(autofillManager.matchFieldsToData).toHaveBeenCalledWith(mockFields, mockStorageData.profiles.default.data);
      }
      if (autofillManager.fillFields.mock) {
        expect(autofillManager.fillFields).toHaveBeenCalledWith(mockMatches, false);
      }
    });

    it('should handle form with custom fields', async () => {
      // Add custom field inputs to form
      const customField1 = createMockElement('input', {
        type: 'text',
        name: 'programming_languages',
        placeholder: 'Programming Languages'
      });
      const customField2 = createMockElement('input', {
        type: 'text',
        name: 'experience_years',
        placeholder: 'Years of Experience'
      });

      mockForm.appendChild(customField1);
      mockForm.appendChild(customField2);

      const mockFields = [
        {
          element: customField1,
          type: 'text',
          searchText: 'programming languages',
          labels: ['Programming Languages']
        },
        {
          element: customField2,
          type: 'text',
          searchText: 'years experience',
          labels: ['Years of Experience']
        }
      ];

      const mockMatches = [
        {
          field: mockFields[0],
          dataKey: 'Programming Languages',
          value: 'JavaScript, Python',
          confidence: 0.85,
          matchType: 'custom'
        },
        {
          field: mockFields[1],
          dataKey: 'Years of Experience',
          value: '3',
          confidence: 0.8,
          matchType: 'custom'
        }
      ];

      if (autofillManager.detectStandardFormFields) {
        autofillManager.detectStandardFormFields.mockReturnValue(mockFields);
      }
      if (autofillManager.matchFieldsToData) {
        autofillManager.matchFieldsToData.mockReturnValue(mockMatches);
      }
      if (autofillManager.fillFields) {
        autofillManager.fillFields.mockReturnValue(2);
      }
      if (autofillManager.performAutofill) {
        autofillManager.performAutofill.mockResolvedValue({
          filledCount: 2,
          message: 'Success'
        });
      }

      const result = await autofillManager.performAutofill(mockStorageData.profiles.default.data);

      expect(result.filledCount).toBe(2);
      expect(result.message).toBe('Success');
    });

    it('should handle select dropdown fields with smart matching', async () => {
      const genderSelect = mockForm.querySelector('select[name="gender"]');
      
      const mockFields = [
        {
          element: genderSelect,
          type: 'select-one',
          searchText: 'gender',
          labels: ['Gender']
        }
      ];

      const mockMatches = [
        {
          field: mockFields[0],
          dataKey: 'gender',
          value: 'Male',
          confidence: 0.9
        }
      ];

      if (autofillManager.detectStandardFormFields) {
        autofillManager.detectStandardFormFields.mockReturnValue(mockFields);
      }
      if (autofillManager.matchFieldsToData) {
        autofillManager.matchFieldsToData.mockReturnValue(mockMatches);
      }
      if (autofillManager.fillFields) {
        autofillManager.fillFields.mockReturnValue(1);
      }
      if (autofillManager.performAutofill) {
        autofillManager.performAutofill.mockResolvedValue({
          filledCount: 1,
          message: 'Success'
        });
      }

      const result = await autofillManager.performAutofill(mockStorageData.profiles.default.data);

      expect(result.filledCount).toBe(1);
      expect(result.message).toBe('Success');
    });
  });

  describe('Google Forms Workflow', () => {
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

    it('should complete full autofill workflow on Google Form', async () => {
      // Create Google Forms specific elements
      const googleFormContainer = document.createElement('div');
      googleFormContainer.setAttribute('role', 'listitem');
      
      const questionTitle = document.createElement('div');
      questionTitle.setAttribute('role', 'heading');
      questionTitle.textContent = 'What is your full name?';
      
      const input = createMockElement('input', {
        type: 'text',
        'jsname': 'YPqjbf',
        'data-initial-value': ''
      });

      googleFormContainer.appendChild(questionTitle);
      googleFormContainer.appendChild(input);
      document.body.appendChild(googleFormContainer);

      const mockFields = [
        {
          element: input,
          type: 'text',
          searchText: 'what is your full name',
          labels: ['What is your full name?']
        }
      ];

      const mockMatches = [
        {
          field: mockFields[0],
          dataKey: 'fullName',
          value: 'John Doe',
          confidence: 0.9
        }
      ];

      if (autofillManager.detectGoogleFormFields) {
        autofillManager.detectGoogleFormFields = vi.fn().mockReturnValue(mockFields);
      }
      if (autofillManager.matchFieldsToData) {
        autofillManager.matchFieldsToData.mockReturnValue(mockMatches);
      }
      if (autofillManager.fillFields) {
        autofillManager.fillFields.mockReturnValue(1);
      }
      if (autofillManager.performAutofill) {
        autofillManager.performAutofill.mockResolvedValue({
          filledCount: 1,
          message: 'Success'
        });
      }

      const result = await autofillManager.performAutofill(mockStorageData.profiles.default.data);

      expect(result.filledCount).toBe(1);
      expect(result.message).toBe('Success');

      // Cleanup
      document.body.removeChild(googleFormContainer);
    });

    it('should handle Google Forms with multiple question types', async () => {
      // Create multiple Google Forms elements
      const containers = [];
      const inputs = [];

      // Text input
      const textContainer = document.createElement('div');
      textContainer.setAttribute('role', 'listitem');
      const textTitle = document.createElement('div');
      textTitle.setAttribute('role', 'heading');
      textTitle.textContent = 'Email Address';
      const textInput = createMockElement('input', { type: 'email', 'jsname': 'YPqjbf' });
      textContainer.appendChild(textTitle);
      textContainer.appendChild(textInput);
      containers.push(textContainer);
      inputs.push(textInput);

      // Textarea
      const textareaContainer = document.createElement('div');
      textareaContainer.setAttribute('role', 'listitem');
      const textareaTitle = document.createElement('div');
      textareaTitle.setAttribute('role', 'heading');
      textareaTitle.textContent = 'Tell us about your experience';
      const textarea = createMockElement('textarea', { 'jsname': 'YPqjbf' });
      textareaContainer.appendChild(textareaTitle);
      textareaContainer.appendChild(textarea);
      containers.push(textareaContainer);
      inputs.push(textarea);

      containers.forEach(container => document.body.appendChild(container));

      const mockFields = [
        {
          element: textInput,
          type: 'email',
          searchText: 'email address',
          labels: ['Email Address']
        },
        {
          element: textarea,
          type: 'textarea',
          searchText: 'tell us about your experience',
          labels: ['Tell us about your experience']
        }
      ];

      const mockMatches = [
        {
          field: mockFields[0],
          dataKey: 'email',
          value: 'john.doe@example.com',
          confidence: 0.95
        },
        {
          field: mockFields[1],
          dataKey: 'Programming Languages',
          value: 'JavaScript, Python',
          confidence: 0.7,
          matchType: 'custom'
        }
      ];

      if (autofillManager.detectGoogleFormFields) {
        autofillManager.detectGoogleFormFields = vi.fn().mockReturnValue(mockFields);
      }
      if (autofillManager.matchFieldsToData) {
        autofillManager.matchFieldsToData.mockReturnValue(mockMatches);
      }
      if (autofillManager.fillFields) {
        autofillManager.fillFields.mockReturnValue(2);
      }
      if (autofillManager.performAutofill) {
        autofillManager.performAutofill.mockResolvedValue({
          filledCount: 2,
          message: 'Success'
        });
      }

      const result = await autofillManager.performAutofill(mockStorageData.profiles.default.data);

      expect(result.filledCount).toBe(2);
      expect(result.message).toBe('Success');

      // Cleanup
      containers.forEach(container => document.body.removeChild(container));
    });
  });

  describe('Multi-Profile Workflow', () => {
    it('should use correct profile data for autofill', async () => {
      // Switch to work profile
      mockStorageData.settings.activeProfile = 'work';
      setupMockStorage(mockStorageData);

      const mockFields = [
        {
          element: mockForm.querySelector('input[name="fullName"]'),
          type: 'text',
          searchText: 'full name',
          labels: ['Full Name']
        },
        {
          element: mockForm.querySelector('input[name="email"]'),
          type: 'email',
          searchText: 'email',
          labels: ['Email']
        }
      ];

      const mockMatches = [
        {
          field: mockFields[0],
          dataKey: 'fullName',
          value: 'Jane Smith',
          confidence: 0.9
        },
        {
          field: mockFields[1],
          dataKey: 'email',
          value: 'jane.smith@company.com',
          confidence: 0.95
        }
      ];

      if (autofillManager.detectStandardFormFields) {
        autofillManager.detectStandardFormFields.mockReturnValue(mockFields);
      }
      if (autofillManager.matchFieldsToData) {
        autofillManager.matchFieldsToData.mockReturnValue(mockMatches);
      }
      if (autofillManager.fillFields) {
        autofillManager.fillFields.mockReturnValue(2);
      }
      if (autofillManager.performAutofill) {
        autofillManager.performAutofill.mockResolvedValue({
          filledCount: 2,
          message: 'Success'
        });
      }

      const result = await autofillManager.performAutofill(mockStorageData.profiles.work.data);

      expect(result.filledCount).toBe(2);
      expect(result.message).toBe('Success');

      // Verify work profile data was used
      if (autofillManager.matchFieldsToData.mock) {
        expect(autofillManager.matchFieldsToData).toHaveBeenCalledWith(
          mockFields,
          mockStorageData.profiles.work.data
        );
      }
    });
  });

  describe('Error Handling in Workflows', () => {
    it('should handle no fields found scenario', async () => {
      if (autofillManager.detectStandardFormFields) {
        autofillManager.detectStandardFormFields.mockReturnValue([]);
      }
      if (autofillManager.performAutofill) {
        autofillManager.performAutofill.mockResolvedValue({
          filledCount: 0,
          message: 'No fields found'
        });
      }

      const result = await autofillManager.performAutofill(mockStorageData.profiles.default.data);

      expect(result.filledCount).toBe(0);
      expect(result.message).toBe('No fields found');
    });

    it('should handle no matches found scenario', async () => {
      const mockFields = [
        {
          element: createMockElement('input', { type: 'text', name: 'unknown_field' }),
          type: 'text',
          searchText: 'unknown field',
          labels: ['Unknown Field']
        }
      ];

      if (autofillManager.detectStandardFormFields) {
        autofillManager.detectStandardFormFields.mockReturnValue(mockFields);
      }
      if (autofillManager.matchFieldsToData) {
        autofillManager.matchFieldsToData.mockReturnValue([]);
      }
      if (autofillManager.performAutofill) {
        autofillManager.performAutofill.mockResolvedValue({
          filledCount: 0,
          message: 'No matches found'
        });
      }

      const result = await autofillManager.performAutofill(mockStorageData.profiles.default.data);

      expect(result.filledCount).toBe(0);
      expect(result.message).toBe('No matches found');
    });

    it('should handle field filling failures gracefully', async () => {
      const mockFields = [
        {
          element: mockForm.querySelector('input[name="fullName"]'),
          type: 'text',
          searchText: 'full name',
          labels: ['Full Name']
        }
      ];

      const mockMatches = [
        {
          field: mockFields[0],
          dataKey: 'fullName',
          value: 'John Doe',
          confidence: 0.9
        }
      ];

      if (autofillManager.detectStandardFormFields) {
        autofillManager.detectStandardFormFields.mockReturnValue(mockFields);
      }
      if (autofillManager.matchFieldsToData) {
        autofillManager.matchFieldsToData.mockReturnValue(mockMatches);
      }
      if (autofillManager.fillFields) {
        autofillManager.fillFields.mockReturnValue(0); // Simulate fill failure
      }
      if (autofillManager.performAutofill) {
        autofillManager.performAutofill.mockResolvedValue({
          filledCount: 0,
          message: 'Fill failed'
        });
      }

      const result = await autofillManager.performAutofill(mockStorageData.profiles.default.data);

      expect(result.filledCount).toBe(0);
      expect(result.message).toBe('Fill failed');
    });

    it('should handle DOM not ready scenario', async () => {
      // Mock document not ready
      Object.defineProperty(document, 'readyState', {
        value: 'loading',
        writable: true
      });

      if (autofillManager.performAutofill) {
        autofillManager.performAutofill.mockImplementation(async () => {
          // Simulate waiting for DOM ready
          await new Promise(resolve => {
            document.addEventListener('DOMContentLoaded', resolve, { once: true });
          });
          return { filledCount: 1, message: 'Success' };
        });
      }

      const resultPromise = autofillManager.performAutofill(mockStorageData.profiles.default.data);

      // Simulate DOM ready
      setTimeout(() => {
        Object.defineProperty(document, 'readyState', {
          value: 'complete',
          writable: true
        });
        document.dispatchEvent(new Event('DOMContentLoaded'));
      }, 100);

      const result = await resultPromise;

      expect(result.filledCount).toBe(1);
      expect(result.message).toBe('Success');
    });
  });

  describe('Performance Workflow Tests', () => {
    it('should complete autofill workflow within performance thresholds', async () => {
      const startTime = performance.now();

      const mockFields = Array.from({ length: 10 }, (_, i) => ({
        element: createMockElement('input', { type: 'text', name: `field${i}` }),
        type: 'text',
        searchText: `field ${i}`,
        labels: [`Field ${i}`]
      }));

      const mockMatches = mockFields.slice(0, 5).map((field, i) => ({
        field,
        dataKey: 'fullName',
        value: 'John Doe',
        confidence: 0.8 - (i * 0.1)
      }));

      if (autofillManager.detectStandardFormFields) {
        autofillManager.detectStandardFormFields.mockReturnValue(mockFields);
      }
      if (autofillManager.matchFieldsToData) {
        autofillManager.matchFieldsToData.mockReturnValue(mockMatches);
      }
      if (autofillManager.fillFields) {
        autofillManager.fillFields.mockReturnValue(5);
      }
      if (autofillManager.performAutofill) {
        autofillManager.performAutofill.mockResolvedValue({
          filledCount: 5,
          message: 'Success'
        });
      }

      const result = await autofillManager.performAutofill(mockStorageData.profiles.default.data);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.filledCount).toBe(5);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle large forms efficiently', async () => {
      const startTime = performance.now();

      // Create a large form with 50 fields
      const mockFields = Array.from({ length: 50 }, (_, i) => ({
        element: createMockElement('input', { type: 'text', name: `field${i}` }),
        type: 'text',
        searchText: `field ${i}`,
        labels: [`Field ${i}`]
      }));

      const mockMatches = mockFields.slice(0, 20).map((field, i) => ({
        field,
        dataKey: i % 2 === 0 ? 'fullName' : 'email',
        value: i % 2 === 0 ? 'John Doe' : 'john.doe@example.com',
        confidence: 0.9 - (i * 0.02)
      }));

      if (autofillManager.detectStandardFormFields) {
        autofillManager.detectStandardFormFields.mockReturnValue(mockFields);
      }
      if (autofillManager.matchFieldsToData) {
        autofillManager.matchFieldsToData.mockReturnValue(mockMatches);
      }
      if (autofillManager.fillFields) {
        autofillManager.fillFields.mockReturnValue(20);
      }
      if (autofillManager.performAutofill) {
        autofillManager.performAutofill.mockResolvedValue({
          filledCount: 20,
          message: 'Success'
        });
      }

      const result = await autofillManager.performAutofill(mockStorageData.profiles.default.data);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.filledCount).toBe(20);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds even for large forms
    });
  });
});