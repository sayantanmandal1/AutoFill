/**
 * Radio Button Handling Tests
 * Tests the new radio button detection and filling functionality
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

describe('Radio Button Handling', () => {
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
            <!-- Standard gender radio buttons -->
            <fieldset>
              <legend>Gender</legend>
              <label><input type="radio" name="gender" value="Male"> Male</label>
              <label><input type="radio" name="gender" value="Female"> Female</label>
              <label><input type="radio" name="gender" value="Other"> Other</label>
            </fieldset>
            
            <!-- Gender with different values -->
            <div>
              <label>Sex:</label>
              <label><input type="radio" name="sex" value="M"> Male</label>
              <label><input type="radio" name="sex" value="F"> Female</label>
              <label><input type="radio" name="sex" value="O"> Other</label>
            </div>
            
            <!-- Gender with lowercase values -->
            <div>
              <label>Gender Identity:</label>
              <label><input type="radio" name="genderIdentity" value="male"> Man</label>
              <label><input type="radio" name="genderIdentity" value="female"> Woman</label>
              <label><input type="radio" name="genderIdentity" value="other"> Non-binary</label>
            </div>
            
            <!-- Other radio group for testing -->
            <div>
              <label>Experience Level:</label>
              <label><input type="radio" name="experience" value="beginner"> Beginner</label>
              <label><input type="radio" name="experience" value="intermediate"> Intermediate</label>
              <label><input type="radio" name="experience" value="advanced"> Advanced</label>
            </div>
            
            <!-- Text fields for context -->
            <input type="text" name="degree" placeholder="Degree">
            <input type="email" name="personalEmail" placeholder="Personal Email">
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

      // Radio group detection
      detectRadioGroups() {
        const radioGroups = [];
        const processedGroups = new Set();

        const radioButtons = document.querySelectorAll('input[type="radio"]');
        
        radioButtons.forEach(radio => {
          const groupName = radio.name;
          if (groupName && !processedGroups.has(groupName)) {
            processedGroups.add(groupName);
            
            const groupRadios = document.querySelectorAll(`input[type="radio"][name="${groupName}"]`);
            
            if (groupRadios.length > 0) {
              const fieldInfo = this.extractRadioGroupInfo(groupRadios, groupName);
              if (fieldInfo) {
                radioGroups.push(fieldInfo);
              }
            }
          }
        });

        return radioGroups;
      }

      extractRadioGroupInfo(radioButtons, groupName) {
        const info = {
          element: radioButtons[0],
          type: 'radio-group',
          radioButtons: Array.from(radioButtons),
          groupName: groupName,
          value: '',
          labels: [],
          searchText: '',
          options: []
        };

        // Get the selected value if any
        const selectedRadio = Array.from(radioButtons).find(radio => radio.checked);
        if (selectedRadio) {
          info.value = selectedRadio.value;
        }

        // Extract labels and options
        radioButtons.forEach(radio => {
          const optionValue = radio.value;
          let optionLabel = '';

          const label = radio.closest('label') || document.querySelector(`label[for="${radio.id}"]`);
          if (label) {
            optionLabel = label.textContent.trim();
          }

          info.options.push({
            element: radio,
            value: optionValue,
            label: optionLabel
          });

          if (optionLabel) {
            info.labels.push(optionLabel);
          }
        });

        // Look for group label
        const container = radioButtons[0].closest('fieldset, .form-group, .radio-group, [role="radiogroup"]');
        if (container) {
          const legend = container.querySelector('legend');
          if (legend) {
            info.labels.unshift(legend.textContent.trim());
          }
        }

        // Create search text
        const searchComponents = [
          groupName || '',
          radioButtons[0].className || '',
          ...info.labels
        ];

        info.searchText = searchComponents
          .filter(text => text && typeof text === 'string')
          .map(text => text.trim())
          .filter(text => text.length > 0)
          .join(' ')
          .toLowerCase()
          .replace(/[^\w\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        return info;
      }

      // Radio group filling
      fillRadioGroup(fieldInfo, value, dataKey) {
        try {
          this.log(`Filling radio group for ${dataKey} with value: ${value}`);

          const options = fieldInfo.options;
          let selectedOption = null;

          // Special handling for gender field
          if (dataKey === 'gender') {
            const genderMappings = [
              { value: 'Male', patterns: ['male', 'm', 'man', 'boy', 'masculine'] },
              { value: 'Female', patterns: ['female', 'f', 'woman', 'girl', 'feminine'] },
              { value: 'Other', patterns: ['other', 'prefer not to say', 'non-binary', 'non binary', 'nb'] }
            ];

            for (const mapping of genderMappings) {
              if (mapping.value.toLowerCase() === value.toLowerCase()) {
                // First try exact match on value
                selectedOption = options.find(opt =>
                  opt.value.toLowerCase() === value.toLowerCase()
                );

                // Then try exact match on label
                if (!selectedOption) {
                  selectedOption = options.find(opt =>
                    opt.label.toLowerCase() === value.toLowerCase()
                  );
                }

                // Then try pattern matching on value
                if (!selectedOption) {
                  selectedOption = options.find(opt =>
                    mapping.patterns.some(pattern =>
                      opt.value.toLowerCase().includes(pattern) ||
                      pattern.includes(opt.value.toLowerCase())
                    )
                  );
                }

                // Finally try pattern matching on label
                if (!selectedOption) {
                  selectedOption = options.find(opt =>
                    mapping.patterns.some(pattern =>
                      opt.label.toLowerCase().includes(pattern) ||
                      pattern.includes(opt.label.toLowerCase())
                    )
                  );
                }
                break;
              }
            }
          }
          // Default handling for other radio groups
          else {
            // Try exact match on value first
            selectedOption = options.find(opt =>
              opt.value.toLowerCase() === value.toLowerCase()
            );

            // Then try exact match on label
            if (!selectedOption) {
              selectedOption = options.find(opt =>
                opt.label.toLowerCase() === value.toLowerCase()
              );
            }

            // Then try partial match on value
            if (!selectedOption) {
              selectedOption = options.find(opt =>
                opt.value.toLowerCase().includes(value.toLowerCase()) ||
                value.toLowerCase().includes(opt.value.toLowerCase())
              );
            }

            // Finally try partial match on label
            if (!selectedOption) {
              selectedOption = options.find(opt =>
                opt.label.toLowerCase().includes(value.toLowerCase()) ||
                value.toLowerCase().includes(opt.label.toLowerCase())
              );
            }
          }

          if (selectedOption) {
            this.log(`Attempting to select radio option: ${selectedOption.label} (value: ${selectedOption.value})`);

            // Clear all radio buttons in the group first
            options.forEach(opt => {
              opt.element.checked = false;
            });

            // Select the target radio button
            const radioElement = selectedOption.element;
            radioElement.focus();
            radioElement.checked = true;

            // Trigger events
            const events = [
              new Event('focus', { bubbles: true }),
              new MouseEvent('click', { bubbles: true, cancelable: true, view: window }),
              new Event('change', { bubbles: true }),
              new Event('input', { bubbles: true }),
              new Event('blur', { bubbles: true })
            ];

            events.forEach(event => {
              radioElement.dispatchEvent(event);
            });

            // Verify the selection
            if (radioElement.checked) {
              this.log(`✅ Successfully selected radio option: ${selectedOption.label} (value: ${selectedOption.value})`);
              return true;
            } else {
              this.log(`⚠️ Radio selection verification failed for: ${selectedOption.label}`);
              return false;
            }
          } else {
            this.log(`❌ No matching radio option found for value: ${value}`);
            this.log('Available radio options:', options.map(opt => `"${opt.label}" (value: "${opt.value}")`));
            return false;
          }
        } catch (error) {
          this.log('❌ Error filling radio group:', error);
          return false;
        }
      }
    };
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('Radio Group Detection', () => {
    it('should detect all radio button groups', () => {
      const manager = new AutofillManager();
      const radioGroups = manager.detectRadioGroups();
      
      expect(radioGroups).toHaveLength(4);
      
      const groupNames = radioGroups.map(group => group.groupName);
      expect(groupNames).toContain('gender');
      expect(groupNames).toContain('sex');
      expect(groupNames).toContain('genderIdentity');
      expect(groupNames).toContain('experience');
    });

    it('should extract correct radio group information', () => {
      const manager = new AutofillManager();
      const radioGroups = manager.detectRadioGroups();
      
      const genderGroup = radioGroups.find(group => group.groupName === 'gender');
      expect(genderGroup).toBeDefined();
      expect(genderGroup.type).toBe('radio-group');
      expect(genderGroup.options).toHaveLength(3);
      expect(genderGroup.options[0].value).toBe('Male');
      expect(genderGroup.options[0].label).toContain('Male');
      expect(genderGroup.labels).toContain('Gender');
    });

    it('should create appropriate search text for radio groups', () => {
      const manager = new AutofillManager();
      const radioGroups = manager.detectRadioGroups();
      
      const genderGroup = radioGroups.find(group => group.groupName === 'gender');
      expect(genderGroup.searchText).toContain('gender');
      expect(genderGroup.searchText).toContain('male');
      expect(genderGroup.searchText).toContain('female');
    });
  });

  describe('Radio Group Filling', () => {
    it('should fill gender radio group with exact match', () => {
      const manager = new AutofillManager();
      const radioGroups = manager.detectRadioGroups();
      const genderGroup = radioGroups.find(group => group.groupName === 'gender');
      
      const result = manager.fillRadioGroup(genderGroup, 'Male', 'gender');
      
      expect(result).toBe(true);
      
      const selectedRadio = document.querySelector('input[name="gender"]:checked');
      expect(selectedRadio).toBeTruthy();
      expect(selectedRadio.value).toBe('Male');
    });

    it('should fill gender radio group with pattern matching for short values', () => {
      const manager = new AutofillManager();
      const radioGroups = manager.detectRadioGroups();
      const sexGroup = radioGroups.find(group => group.groupName === 'sex');
      
      const result = manager.fillRadioGroup(sexGroup, 'Male', 'gender');
      
      expect(result).toBe(true);
      
      const selectedRadio = document.querySelector('input[name="sex"]:checked');
      expect(selectedRadio).toBeTruthy();
      expect(selectedRadio.value).toBe('M'); // Should match 'M' for 'Male'
    });

    it('should fill gender radio group with lowercase pattern matching', () => {
      const manager = new AutofillManager();
      const radioGroups = manager.detectRadioGroups();
      const genderIdentityGroup = radioGroups.find(group => group.groupName === 'genderIdentity');
      
      const result = manager.fillRadioGroup(genderIdentityGroup, 'Male', 'gender');
      
      expect(result).toBe(true);
      
      const selectedRadio = document.querySelector('input[name="genderIdentity"]:checked');
      expect(selectedRadio).toBeTruthy();
      expect(selectedRadio.value).toBe('male'); // Should match 'male' for 'Male'
    });

    it('should handle non-gender radio groups with exact matching', () => {
      const manager = new AutofillManager();
      const radioGroups = manager.detectRadioGroups();
      const experienceGroup = radioGroups.find(group => group.groupName === 'experience');
      
      const result = manager.fillRadioGroup(experienceGroup, 'intermediate', 'experience');
      
      expect(result).toBe(true);
      
      const selectedRadio = document.querySelector('input[name="experience"]:checked');
      expect(selectedRadio).toBeTruthy();
      expect(selectedRadio.value).toBe('intermediate');
    });

    it('should handle non-gender radio groups with partial matching', () => {
      const manager = new AutofillManager();
      const radioGroups = manager.detectRadioGroups();
      const experienceGroup = radioGroups.find(group => group.groupName === 'experience');
      
      const result = manager.fillRadioGroup(experienceGroup, 'begin', 'experience');
      
      expect(result).toBe(true);
      
      const selectedRadio = document.querySelector('input[name="experience"]:checked');
      expect(selectedRadio).toBeTruthy();
      expect(selectedRadio.value).toBe('beginner'); // Should match 'beginner' for 'begin'
    });

    it('should return false when no matching option is found', () => {
      const manager = new AutofillManager();
      const radioGroups = manager.detectRadioGroups();
      const genderGroup = radioGroups.find(group => group.groupName === 'gender');
      
      const result = manager.fillRadioGroup(genderGroup, 'NonExistent', 'gender');
      
      expect(result).toBe(false);
      
      const selectedRadio = document.querySelector('input[name="gender"]:checked');
      expect(selectedRadio).toBeFalsy();
    });

    it('should trigger appropriate events when selecting radio button', () => {
      const manager = new AutofillManager();
      const radioGroups = manager.detectRadioGroups();
      const genderGroup = radioGroups.find(group => group.groupName === 'gender');
      
      const eventsFired = [];
      const maleRadio = document.querySelector('input[name="gender"][value="Male"]');
      
      const eventTypes = ['focus', 'click', 'change', 'input', 'blur'];
      eventTypes.forEach(eventType => {
        maleRadio.addEventListener(eventType, () => {
          eventsFired.push(eventType);
        });
      });
      
      const result = manager.fillRadioGroup(genderGroup, 'Male', 'gender');
      
      expect(result).toBe(true);
      expect(eventsFired).toContain('focus');
      expect(eventsFired).toContain('click');
      expect(eventsFired).toContain('change');
    });

    it('should clear other radio buttons in the same group', () => {
      const manager = new AutofillManager();
      const radioGroups = manager.detectRadioGroups();
      const genderGroup = radioGroups.find(group => group.groupName === 'gender');
      
      // Pre-select Female
      const femaleRadio = document.querySelector('input[name="gender"][value="Female"]');
      femaleRadio.checked = true;
      
      // Fill with Male
      const result = manager.fillRadioGroup(genderGroup, 'Male', 'gender');
      
      expect(result).toBe(true);
      expect(femaleRadio.checked).toBe(false);
      
      const maleRadio = document.querySelector('input[name="gender"][value="Male"]');
      expect(maleRadio.checked).toBe(true);
    });
  });

  describe('Gender Pattern Matching', () => {
    it('should match different gender value formats', () => {
      const manager = new AutofillManager();
      const radioGroups = manager.detectRadioGroups();
      
      const testCases = [
        { groupName: 'gender', value: 'Male', expected: 'Male' },
        { groupName: 'sex', value: 'Male', expected: 'M' },
        { groupName: 'genderIdentity', value: 'Male', expected: 'male' },
        { groupName: 'gender', value: 'Female', expected: 'Female' },
        { groupName: 'sex', value: 'Female', expected: 'F' },
        { groupName: 'genderIdentity', value: 'Female', expected: 'female' }
      ];
      
      testCases.forEach(testCase => {
        // Clear all selections first
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
          radio.checked = false;
        });
        
        const group = radioGroups.find(g => g.groupName === testCase.groupName);
        const result = manager.fillRadioGroup(group, testCase.value, 'gender');
        
        expect(result).toBe(true);
        
        const selectedRadio = document.querySelector(`input[name="${testCase.groupName}"]:checked`);
        expect(selectedRadio).toBeTruthy();
        expect(selectedRadio.value).toBe(testCase.expected);
      });
    });
  });
});