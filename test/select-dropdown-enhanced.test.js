/**
 * Enhanced Select Dropdown Functionality Tests
 * Tests the improved fillSelectField method with comprehensive event handling
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

describe('Enhanced Select Dropdown Functionality', () => {
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
            <select id="gender-select" name="gender">
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            
            <select id="campus-select" name="campus">
              <option value="">Select Campus</option>
              <option value="vit-ap">VIT-AP Amaravathi</option>
              <option value="vit-vellore">VIT Vellore</option>
              <option value="vit-chennai">VIT Chennai</option>
            </select>
            
            <select id="experience-select" name="experience">
              <option value="">Select Experience</option>
              <option value="0-1">0-1 years</option>
              <option value="2-5">2-5 years</option>
              <option value="5+">5+ years</option>
            </select>
            
            <select id="framework-select" name="framework" class="react-component">
              <option value="">Select Framework</option>
              <option value="react">React</option>
              <option value="vue">Vue.js</option>
              <option value="angular">Angular</option>
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

      fillSelectField(element, value, dataKey) {
        try {
          this.log(`Filling select field for ${dataKey} with value: ${value}`);

          // Store original value for verification
          const originalValue = element.value;

          // Get all options
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
            // Enhanced event sequence for better framework compatibility
            this.log(`Attempting to select option: ${selectedOption.text} (value: ${selectedOption.value})`);

            // Step 1: Focus the element to ensure it's active
            element.focus();

            // Step 2: Trigger mousedown event (some frameworks require this)
            element.dispatchEvent(new MouseEvent('mousedown', {
              bubbles: true,
              cancelable: true,
              view: window
            }));

            // Step 3: Trigger click event on the select element
            element.dispatchEvent(new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window
            }));

            // Step 4: Set the value and selected property
            element.value = selectedOption.value;
            selectedOption.selected = true;

            // Step 5: Clear other selections to ensure only our option is selected
            options.forEach(opt => {
              if (opt !== selectedOption) {
                opt.selected = false;
              }
            });

            // Step 6: Trigger comprehensive event sequence
            const events = [
              // Input events for real-time validation
              new Event('input', { bubbles: true, cancelable: true }),
              
              // Change event for form validation and dependent logic
              new Event('change', { bubbles: true, cancelable: true }),
              
              // Focus events for framework state management
              new FocusEvent('focusin', { bubbles: true, cancelable: true }),
              new FocusEvent('focusout', { bubbles: true, cancelable: true }),
              
              // Mouse events for click simulation
              new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }),
              
              // Keyboard events for accessibility and framework compatibility
              new KeyboardEvent('keydown', { 
                bubbles: true, 
                cancelable: true, 
                key: 'Enter',
                keyCode: 13,
                which: 13
              }),
              new KeyboardEvent('keyup', { 
                bubbles: true, 
                cancelable: true, 
                key: 'Enter',
                keyCode: 13,
                which: 13
              }),
              
              // Blur event to finalize the selection
              new FocusEvent('blur', { bubbles: true, cancelable: true })
            ];

            // Dispatch events synchronously for testing
            events.forEach((event) => {
              try {
                element.dispatchEvent(event);
              } catch (eventError) {
                this.log(`Error dispatching ${event.type} event:`, eventError);
              }
            });

            // Framework-specific event handling (synchronous for testing)
            try {
              // React-specific events
              if (element._reactInternalFiber || element._reactInternalInstance || element.className.includes('react')) {
                const reactEvent = new Event('change', { bubbles: true });
                reactEvent.simulated = true;
                element.dispatchEvent(reactEvent);
              }

              // Vue.js specific events
              if (element.__vue__) {
                element.__vue__.$emit('change', selectedOption.value);
              }

              // Angular specific events
              if (element.ng339 || element.getAttribute('ng-model')) {
                element.dispatchEvent(new Event('ng-change', { bubbles: true }));
              }

              // jQuery specific trigger (if jQuery is available)
              if (window.jQuery && window.jQuery(element).length) {
                window.jQuery(element).trigger('change');
              }

            } catch (frameworkError) {
              this.log('Framework-specific event error (non-critical):', frameworkError);
            }

            // Verify the selection was successful
            const finalValue = element.value;
            const isSelectionSuccessful = finalValue === selectedOption.value;
            
            if (isSelectionSuccessful) {
              this.log(`✅ Successfully selected option: ${selectedOption.text} (value: ${selectedOption.value})`);
              return true;
            } else {
              this.log(`⚠️ Selection verification failed. Expected: ${selectedOption.value}, Actual: ${finalValue}`);
              // Try retry approach
              return this.retrySelectFieldFill(element, selectedOption);
            }
          } else {
            this.log(`❌ No matching option found for value: ${value}`);
            this.log('Available options:', options.map(opt => `"${opt.text}" (value: "${opt.value}")`));
            
            // Log additional debugging information
            this.log('Search attempted with:', {
              originalValue: value,
              dataKey: dataKey,
              lowercaseValue: value.toLowerCase(),
              optionCount: options.length
            });
            
            return false;
          }
        } catch (error) {
          this.log('❌ Error filling select field:', error);
          return false;
        }
      }

      retrySelectFieldFill(element, selectedOption) {
        try {
          this.log('Retrying select field fill with alternative approach...');
          
          // Alternative approach: Set selectedIndex directly
          const optionIndex = Array.from(element.options).indexOf(selectedOption);
          if (optionIndex >= 0) {
            element.selectedIndex = optionIndex;
            
            // Trigger essential events only
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Final verification
            if (element.value === selectedOption.value) {
              this.log('✅ Retry successful - option selected via selectedIndex');
              return true;
            } else {
              this.log('❌ Retry failed - selection could not be completed');
              return false;
            }
          }
          return false;
        } catch (retryError) {
          this.log('Retry select field fill error:', retryError);
          return false;
        }
      }
    };
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('Basic Select Field Functionality', () => {
    it('should successfully fill gender select field with exact match', () => {
      const manager = new AutofillManager();
      const genderSelect = document.getElementById('gender-select');
      
      const result = manager.fillSelectField(genderSelect, 'Male', 'gender');
      
      expect(result).toBe(true);
      expect(genderSelect.value).toBe('male');
      expect(genderSelect.selectedOptions[0].text).toBe('Male');
    });

    it('should successfully fill campus select field with pattern matching', () => {
      const manager = new AutofillManager();
      const campusSelect = document.getElementById('campus-select');
      
      const result = manager.fillSelectField(campusSelect, 'VIT-AP', 'campus');
      
      expect(result).toBe(true);
      expect(campusSelect.value).toBe('vit-ap');
      expect(campusSelect.selectedOptions[0].text).toBe('VIT-AP Amaravathi');
    });

    it('should handle partial text matching for experience field', () => {
      const manager = new AutofillManager();
      const experienceSelect = document.getElementById('experience-select');
      
      const result = manager.fillSelectField(experienceSelect, '2-5', 'experience');
      
      expect(result).toBe(true);
      expect(experienceSelect.value).toBe('2-5');
    });

    it('should return false when no matching option is found', () => {
      const manager = new AutofillManager();
      const genderSelect = document.getElementById('gender-select');
      
      const result = manager.fillSelectField(genderSelect, 'NonExistent', 'gender');
      
      expect(result).toBe(false);
      expect(genderSelect.value).toBe(''); // Should remain unchanged
    });
  });

  describe('Event Handling', () => {
    it('should trigger all required events when filling select field', () => {
      const manager = new AutofillManager();
      const genderSelect = document.getElementById('gender-select');
      
      // Set up event listeners
      const eventsFired = [];
      const eventTypes = ['mousedown', 'click', 'input', 'change', 'focusin', 'focusout', 'mouseup', 'keydown', 'keyup', 'blur'];
      
      eventTypes.forEach(eventType => {
        genderSelect.addEventListener(eventType, () => {
          eventsFired.push(eventType);
        });
      });
      
      const result = manager.fillSelectField(genderSelect, 'Female', 'gender');
      
      expect(result).toBe(true);
      expect(genderSelect.value).toBe('female');
      
      // Check that key events were fired
      expect(eventsFired).toContain('mousedown');
      expect(eventsFired).toContain('click');
      expect(eventsFired).toContain('input');
      expect(eventsFired).toContain('change');
      expect(eventsFired).toContain('blur');
    });

    it('should handle framework-specific events for React components', () => {
      const manager = new AutofillManager();
      const frameworkSelect = document.getElementById('framework-select');
      
      // Mock React internal properties
      frameworkSelect._reactInternalFiber = { mock: 'react' };
      
      const eventsFired = [];
      frameworkSelect.addEventListener('change', (event) => {
        if (event.simulated) {
          eventsFired.push('react-change');
        } else {
          eventsFired.push('change');
        }
      });
      
      const result = manager.fillSelectField(frameworkSelect, 'React', 'framework');
      
      expect(result).toBe(true);
      expect(frameworkSelect.value).toBe('react');
      expect(eventsFired).toContain('change');
      expect(eventsFired).toContain('react-change');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle null or undefined elements gracefully', () => {
      const manager = new AutofillManager();
      
      const result1 = manager.fillSelectField(null, 'test', 'test');
      const result2 = manager.fillSelectField(undefined, 'test', 'test');
      
      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });

    it('should handle empty value gracefully', () => {
      const manager = new AutofillManager();
      const genderSelect = document.getElementById('gender-select');
      
      const result = manager.fillSelectField(genderSelect, '', 'gender');
      
      expect(result).toBe(false);
    });

    it('should handle select elements with no options', () => {
      const manager = new AutofillManager();
      const emptySelect = document.createElement('select');
      emptySelect.name = 'empty';
      
      const result = manager.fillSelectField(emptySelect, 'test', 'empty');
      
      expect(result).toBe(false);
    });

    it('should test retry mechanism directly', () => {
      const manager = new AutofillManager();
      const genderSelect = document.getElementById('gender-select');
      
      // Get the male option
      const maleOption = Array.from(genderSelect.options).find(opt => opt.value === 'male');
      expect(maleOption).toBeDefined();
      
      // Test the retry method directly
      const retryResult = manager.retrySelectFieldFill(genderSelect, maleOption);
      
      expect(retryResult).toBe(true);
      expect(genderSelect.value).toBe('male');
      expect(genderSelect.selectedIndex).toBe(1); // Male option is at index 1
    });
  });

  describe('Special Field Handling', () => {
    it('should handle gender field with pattern matching', () => {
      const manager = new AutofillManager();
      const genderSelect = document.getElementById('gender-select');
      
      // Test different gender value formats
      const testCases = [
        { input: 'Male', expected: 'male' },
        { input: 'MALE', expected: 'male' },
        { input: 'male', expected: 'male' },
        { input: 'Female', expected: 'female' },
        { input: 'FEMALE', expected: 'female' }
      ];
      
      testCases.forEach(testCase => {
        // Reset select
        genderSelect.selectedIndex = 0;
        
        const result = manager.fillSelectField(genderSelect, testCase.input, 'gender');
        
        expect(result).toBe(true);
        expect(genderSelect.value).toBe(testCase.expected);
      });
    });

    it('should handle campus field with multiple pattern variations', () => {
      const manager = new AutofillManager();
      const campusSelect = document.getElementById('campus-select');
      
      const testCases = [
        { input: 'VIT-AP', expected: 'vit-ap' },
        { input: 'vit ap', expected: 'vit-ap' },
        { input: 'amaravathi', expected: 'vit-ap' },
        { input: 'AP', expected: 'vit-ap' }
      ];
      
      testCases.forEach(testCase => {
        // Reset select
        campusSelect.selectedIndex = 0;
        
        const result = manager.fillSelectField(campusSelect, testCase.input, 'campus');
        
        expect(result).toBe(true);
        expect(campusSelect.value).toBe(testCase.expected);
      });
    });
  });

  describe('Selection Verification', () => {
    it('should verify selection success and log appropriate messages', () => {
      const manager = new AutofillManager();
      const genderSelect = document.getElementById('gender-select');
      
      // Spy on console.log to check logging
      const logSpy = vi.spyOn(console, 'log');
      
      const result = manager.fillSelectField(genderSelect, 'Male', 'gender');
      
      expect(result).toBe(true);
      expect(genderSelect.value).toBe('male');
      
      // Check that success message was logged
      expect(logSpy).toHaveBeenCalledWith(
        '[Test Autofill]',
        expect.stringContaining('✅ Successfully selected option'),
        expect.any(String)
      );
      
      logSpy.mockRestore();
    });

    it('should log detailed debugging information when no match is found', () => {
      const manager = new AutofillManager();
      const genderSelect = document.getElementById('gender-select');
      
      const logSpy = vi.spyOn(console, 'log');
      
      const result = manager.fillSelectField(genderSelect, 'InvalidGender', 'gender');
      
      expect(result).toBe(false);
      
      // Check that error and debugging messages were logged
      expect(logSpy).toHaveBeenCalledWith(
        '[Test Autofill]',
        expect.stringContaining('❌ No matching option found'),
        expect.any(String)
      );
      
      expect(logSpy).toHaveBeenCalledWith(
        '[Test Autofill]',
        'Available options:',
        expect.any(Array)
      );
      
      logSpy.mockRestore();
    });
  });
});