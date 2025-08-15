/**
 * Enhanced Field Handling Tests
 * Tests for new fields, date inputs, and improved text field handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock Chrome APIs
global.chrome = {
  runtime: {
    onMessage: {
      addListener: vi.fn()
    }
  }
};

describe('Enhanced Field Handling', () => {
  let dom;
  let document;
  let window;
  let AutofillManager;

  beforeEach(() => {
    // Set up JSDOM environment
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <form id="test-form">
            <!-- New fields -->
            <input type="text" id="degree" name="degree" placeholder="B Tech">
            <input type="email" id="personal-email" name="personalEmail" placeholder="msayantan05@gmail.com">
            
            <!-- Date fields -->
            <input type="date" id="date-calendar" name="dateOfBirth">
            <input type="text" id="date-text" name="dateOfBirthText" placeholder="DD/MM/YYYY">
            
            <!-- Text specialization field -->
            <input type="text" id="specialization-text" name="specialization" placeholder="Computer Science and Engineering">
            
            <!-- Select specialization field -->
            <select id="specialization-select" name="specialization">
              <option value="">Select Specialization</option>
              <option value="computer-science">Computer Science and Engineering</option>
              <option value="information-technology">Information Technology</option>
              <option value="electronics">Electronics and Communication</option>
            </select>
            
            <!-- Gender select with different values -->
            <select id="gender-select" name="gender">
              <option value="">Select Gender</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </select>
            
            <!-- Campus select with pattern matching -->
            <select id="campus-select" name="campus">
              <option value="">Select Campus</option>
              <option value="vit-ap-amaravathi">VIT-AP Amaravathi Campus</option>
              <option value="vit-vellore">VIT Vellore Campus</option>
              <option value="other-university">Other University</option>
            </select>
          </form>
        </body>
      </html>
    `, {
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    document = dom.window.document;
    window = dom.window;
    
    // Set up global objects
    global.document = document;
    global.window = window;
    global.Node = window.Node;
    global.Event = window.Event;
    global.MouseEvent = window.MouseEvent;
    global.KeyboardEvent = window.KeyboardEvent;
    global.FocusEvent = window.FocusEvent;

    // Mock localStorage for debug mode
    global.localStorage = {
      getItem: vi.fn(() => 'true'), // Enable debug mode
      setItem: vi.fn(),
      removeItem: vi.fn()
    };

    // Create a simplified AutofillManager class for testing
    AutofillManager = class {
      constructor() {
        this.debugMode = true;
      }

      log(message, data = null) {
        if (this.debugMode) {
          console.log('[Test Autofill]', message, data || '');
        }
      }

      // Enhanced fillStandardField method
      fillStandardField(element, value) {
        try {
          this.log(`Filling standard field: ${element.type || element.tagName}, value: ${value}`);
          
          // Focus the element
          element.focus();
          
          // Clear existing value first
          element.value = '';
          
          // Set the new value
          element.value = value;
          
          // For text inputs, also try setting via setAttribute as fallback
          if (element.tagName === 'INPUT' && (element.type === 'text' || !element.type)) {
            element.setAttribute('value', value);
          }

          // Comprehensive event sequence
          const events = [
            new Event('focus', { bubbles: true }),
            new Event('input', { bubbles: true }),
            new Event('change', { bubbles: true }),
            new KeyboardEvent('keydown', { bubbles: true }),
            new KeyboardEvent('keyup', { bubbles: true }),
            new Event('blur', { bubbles: true })
          ];

          events.forEach(event => {
            element.dispatchEvent(event);
          });

          // Verify the value was set
          const success = element.value === value;
          this.log(`Standard field fill ${success ? 'successful' : 'failed'}: expected "${value}", got "${element.value}"`);
          
          return success;
        } catch (error) {
          this.log('Error filling standard field:', error);
          return false;
        }
      }

      // Enhanced date field handling
      fillDateField(element, value, isGoogleForm = false) {
        try {
          this.log(`Filling date field: ${element.type}, value: ${value}`);

          // Handle different input types
          if (element.type === 'date') {
            // HTML5 date input - use ISO format directly
            element.focus();
            element.value = value; // YYYY-MM-DD format
            
            // Trigger events for date inputs
            const events = [
              new Event('input', { bubbles: true }),
              new Event('change', { bubbles: true }),
              new Event('blur', { bubbles: true })
            ];
            
            events.forEach(event => {
              element.dispatchEvent(event);
            });
            
            this.log(`Date input filled with ISO format: ${value}`);
            return true;
          } else {
            // Text input or other type - format the date appropriately
            const formattedValue = this.formatDateForField(element, value);
            return this.fillStandardField(element, formattedValue);
          }
        } catch (error) {
          this.log('Error filling date field:', error);
          return false;
        }
      }

      formatDateForField(element, value) {
        if (!value) return '';

        try {
          // Parse the ISO date
          const date = new Date(value + 'T00:00:00');
          
          if (isNaN(date.getTime())) {
            this.log('Invalid date value:', value);
            return value;
          }

          // Check for common date format patterns in the field
          const searchText = (element.placeholder || element.name || element.id || '').toLowerCase();
          
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();

          // Format based on field hints or use DD/MM/YYYY as default
          if (searchText.includes('mm/dd/yyyy') || searchText.includes('mm-dd-yyyy')) {
            return `${month}/${day}/${year}`;
          } else {
            return `${day}/${month}/${year}`; // Default DD/MM/YYYY
          }
        } catch (error) {
          this.log('Error formatting date:', error);
          return value;
        }
      }

      // Enhanced select field handling
      fillSelectField(element, value, dataKey) {
        try {
          this.log(`Filling select field for ${dataKey} with value: ${value}`);

          const options = Array.from(element.options);
          let selectedOption = null;

          // Special handling for gender field
          if (dataKey === 'gender') {
            const genderMappings = [
              { value: 'Male', patterns: ['male', 'm', 'man', 'boy'] },
              { value: 'Female', patterns: ['female', 'f', 'woman', 'girl'] },
              { value: 'Other', patterns: ['other', 'prefer not to say', 'non-binary'] }
            ];

            for (const mapping of genderMappings) {
              if (mapping.value.toLowerCase() === value.toLowerCase()) {
                // First try exact match
                selectedOption = options.find(opt =>
                  opt.value.toLowerCase() === value.toLowerCase() ||
                  opt.text.toLowerCase() === value.toLowerCase()
                );

                // Then try pattern matching
                if (!selectedOption) {
                  selectedOption = options.find(opt =>
                    mapping.patterns.some(pattern =>
                      opt.value.toLowerCase().includes(pattern) ||
                      opt.text.toLowerCase().includes(pattern)
                    )
                  );
                }
                break;
              }
            }
          }
          // Special handling for campus field
          else if (dataKey === 'campus') {
            const campusPatterns = [
              'vit-ap', 'vit ap', 'vitap', 'vit amaravathi', 'vit amravati',
              'amaravathi', 'amravati', 'ap', 'andhra pradesh'
            ];

            // First try exact match
            selectedOption = options.find(opt =>
              opt.value.toLowerCase() === value.toLowerCase() ||
              opt.text.toLowerCase() === value.toLowerCase()
            );

            // Then try pattern matching
            if (!selectedOption) {
              selectedOption = options.find(opt =>
                campusPatterns.some(pattern =>
                  opt.value.toLowerCase().includes(pattern) ||
                  opt.text.toLowerCase().includes(pattern)
                )
              );
            }
          }
          // Default handling for other select fields
          else {
            // Try exact match first
            selectedOption = options.find(opt =>
              opt.value.toLowerCase() === value.toLowerCase() ||
              opt.text.toLowerCase() === value.toLowerCase()
            );

            // Try partial match
            if (!selectedOption) {
              selectedOption = options.find(opt =>
                opt.value.toLowerCase().includes(value.toLowerCase()) ||
                opt.text.toLowerCase().includes(value.toLowerCase())
              );
            }
          }

          if (selectedOption) {
            // Enhanced selection process
            element.focus();
            
            // Clear other selections first
            options.forEach(opt => {
              opt.selected = false;
            });
            
            // Set the selection
            selectedOption.selected = true;
            element.value = selectedOption.value;
            element.selectedIndex = Array.from(element.options).indexOf(selectedOption);

            // Trigger comprehensive events
            const events = [
              new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }),
              new MouseEvent('click', { bubbles: true, cancelable: true, view: window }),
              new Event('input', { bubbles: true, cancelable: true }),
              new Event('change', { bubbles: true, cancelable: true }),
              new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }),
              new Event('blur', { bubbles: true, cancelable: true })
            ];

            events.forEach(event => {
              element.dispatchEvent(event);
            });

            this.log(`✅ Successfully selected option: ${selectedOption.text} (value: ${selectedOption.value})`);
            return true;
          } else {
            this.log(`❌ No matching option found for value: ${value}`);
            return false;
          }
        } catch (error) {
          this.log('❌ Error filling select field:', error);
          return false;
        }
      }
    };
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('New Field Types', () => {
    it('should fill degree field with default value', () => {
      const manager = new AutofillManager();
      const degreeField = document.getElementById('degree');
      
      const result = manager.fillStandardField(degreeField, 'B Tech');
      
      expect(result).toBe(true);
      expect(degreeField.value).toBe('B Tech');
    });

    it('should fill personal email field', () => {
      const manager = new AutofillManager();
      const personalEmailField = document.getElementById('personal-email');
      
      const result = manager.fillStandardField(personalEmailField, 'msayantan05@gmail.com');
      
      expect(result).toBe(true);
      expect(personalEmailField.value).toBe('msayantan05@gmail.com');
    });
  });

  describe('Date Field Handling', () => {
    it('should fill HTML5 date input with ISO format', () => {
      const manager = new AutofillManager();
      const dateField = document.getElementById('date-calendar');
      
      const result = manager.fillDateField(dateField, '2004-03-08');
      
      expect(result).toBe(true);
      expect(dateField.value).toBe('2004-03-08');
    });

    it('should fill text date input with formatted date', () => {
      const manager = new AutofillManager();
      const dateTextField = document.getElementById('date-text');
      
      const result = manager.fillDateField(dateTextField, '2004-03-08');
      
      expect(result).toBe(true);
      expect(dateTextField.value).toBe('08/03/2004'); // DD/MM/YYYY format
    });

    it('should handle invalid date gracefully', () => {
      const manager = new AutofillManager();
      const dateTextField = document.getElementById('date-text'); // Use text field for invalid date test
      
      const result = manager.fillDateField(dateTextField, 'invalid-date');
      
      expect(result).toBe(true);
      expect(dateTextField.value).toBe('invalid-date'); // Should use original value for text fields
    });
  });

  describe('Enhanced Text Field Handling', () => {
    it('should fill specialization text field properly', () => {
      const manager = new AutofillManager();
      const specializationField = document.getElementById('specialization-text');
      
      const result = manager.fillStandardField(specializationField, 'Computer Science and Engineering');
      
      expect(result).toBe(true);
      expect(specializationField.value).toBe('Computer Science and Engineering');
    });

    it('should trigger comprehensive events for text fields', () => {
      const manager = new AutofillManager();
      const specializationField = document.getElementById('specialization-text');
      
      const eventsFired = [];
      const eventTypes = ['focus', 'input', 'change', 'keydown', 'keyup', 'blur'];
      
      eventTypes.forEach(eventType => {
        specializationField.addEventListener(eventType, () => {
          eventsFired.push(eventType);
        });
      });
      
      const result = manager.fillStandardField(specializationField, 'Computer Science and Engineering');
      
      expect(result).toBe(true);
      expect(eventsFired).toContain('focus');
      expect(eventsFired).toContain('input');
      expect(eventsFired).toContain('change');
      expect(eventsFired).toContain('blur');
    });
  });

  describe('Enhanced Select Field Handling', () => {
    it('should fill specialization select field', () => {
      const manager = new AutofillManager();
      const specializationSelect = document.getElementById('specialization-select');
      
      const result = manager.fillSelectField(specializationSelect, 'Computer Science and Engineering', 'specialization');
      
      expect(result).toBe(true);
      expect(specializationSelect.value).toBe('computer-science');
    });

    it('should handle gender select with pattern matching', () => {
      const manager = new AutofillManager();
      const genderSelect = document.getElementById('gender-select');
      
      const result = manager.fillSelectField(genderSelect, 'Male', 'gender');
      
      expect(result).toBe(true);
      expect(genderSelect.value).toBe('M'); // Should match the 'M' option
    });

    it('should handle campus select with complex pattern matching', () => {
      const manager = new AutofillManager();
      const campusSelect = document.getElementById('campus-select');
      
      const result = manager.fillSelectField(campusSelect, 'VIT-AP', 'campus');
      
      expect(result).toBe(true);
      expect(campusSelect.value).toBe('vit-ap-amaravathi');
    });

    it('should trigger comprehensive events for select fields', () => {
      const manager = new AutofillManager();
      const genderSelect = document.getElementById('gender-select');
      
      const eventsFired = [];
      const eventTypes = ['mousedown', 'click', 'input', 'change', 'mouseup', 'blur'];
      
      eventTypes.forEach(eventType => {
        genderSelect.addEventListener(eventType, () => {
          eventsFired.push(eventType);
        });
      });
      
      const result = manager.fillSelectField(genderSelect, 'Male', 'gender');
      
      expect(result).toBe(true);
      expect(eventsFired).toContain('mousedown');
      expect(eventsFired).toContain('click');
      expect(eventsFired).toContain('input');
      expect(eventsFired).toContain('change');
    });
  });

  describe('Field Value Persistence', () => {
    it('should ensure text field values persist after events', () => {
      const manager = new AutofillManager();
      const degreeField = document.getElementById('degree');
      
      // Fill the field
      const result = manager.fillStandardField(degreeField, 'B Tech');
      expect(result).toBe(true);
      
      // Simulate user interaction that might clear the field
      degreeField.focus();
      degreeField.blur();
      
      // Value should still be there
      expect(degreeField.value).toBe('B Tech');
    });

    it('should ensure select field values persist after events', () => {
      const manager = new AutofillManager();
      const genderSelect = document.getElementById('gender-select');
      
      // Fill the field
      const result = manager.fillSelectField(genderSelect, 'Male', 'gender');
      expect(result).toBe(true);
      
      // Simulate user interaction
      genderSelect.focus();
      genderSelect.blur();
      
      // Value should still be there
      expect(genderSelect.value).toBe('M');
      expect(genderSelect.selectedIndex).toBe(1); // Male option
    });

    it('should ensure date field values persist', () => {
      const manager = new AutofillManager();
      const dateField = document.getElementById('date-calendar');
      
      // Fill the field
      const result = manager.fillDateField(dateField, '2004-03-08');
      expect(result).toBe(true);
      
      // Simulate user interaction
      dateField.focus();
      dateField.blur();
      
      // Value should still be there
      expect(dateField.value).toBe('2004-03-08');
    });
  });
});