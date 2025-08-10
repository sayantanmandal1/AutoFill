import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock chrome API
global.chrome = {
    runtime: {
        onMessage: {
            addListener: vi.fn()
        }
    }
};

// Create a simplified AutofillManager class for testing
class TestAutofillManager {
    constructor() {
        this.fieldMappings = {
            fullName: {
                keywords: ['name', 'full-name', 'fullname', 'your-name', 'applicant-name', 'candidate-name', 'first-name', 'last-name', 'fname', 'lname', 'full_name'],
                inputTypes: ['text'],
                priority: 1,
                jobPortalPatterns: ['candidate_name', 'applicant_full_name', 'user_name', 'profile_name']
            },
            email: {
                keywords: ['email', 'e-mail', 'college-email', 'university-email', 'contact-email', 'mail', 'email-address', 'emailaddress'],
                inputTypes: ['email', 'text'],
                priority: 1,
                jobPortalPatterns: ['email_address', 'contact_email', 'user_email', 'applicant_email']
            }
        };
    }

    // Test the enhanced field detection
    detectFormFields() {
        const fields = [];
        const selectors = [
            'input[type="text"]', 
            'input[type="email"]', 
            'input[type="tel"]', 
            'input[type="url"]', 
            'textarea', 
            'input:not([type])',
            'input[type="search"]',
            'select',
            'input[type="radio"]',
            'input[type="checkbox"]'
        ];
        
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (this.isFieldFillable(element)) {
                    const fieldInfo = this.extractFieldInfo(element);
                    if (fieldInfo) {
                        fields.push(fieldInfo);
                    }
                }
            });
        });

        return fields;
    }

    isFieldFillable(element) {
        if (!element || !element.tagName) return false;
        if (!this.isElementVisible(element)) return false;
        if (element.disabled || element.readOnly) return false;
        if (element.type === 'password') return false;
        return true;
    }

    isElementVisible(element) {
        // In JSDOM, offsetParent might not work as expected, so simplify the check
        if (element.style.display === 'none' || 
            element.style.visibility === 'hidden' ||
            element.hidden) {
            return false;
        }
        return true;
    }

    extractFieldInfo(element) {
        const info = {
            element: element,
            name: element.name || '',
            id: element.id || '',
            placeholder: element.placeholder || '',
            type: element.type || 'text',
            labels: [],
            options: [],
            value: element.value || '',
            className: element.className || '',
            dataAttributes: this.extractDataAttributes(element)
        };

        // Extract labels
        this.extractLabelsAdvanced(element, info);

        // Extract options for select elements
        if (element.tagName === 'SELECT') {
            info.options = Array.from(element.options).map(option => ({
                value: option.value,
                text: option.textContent.trim()
            }));
        }

        return info;
    }

    extractDataAttributes(element) {
        const dataAttrs = {};
        Array.from(element.attributes).forEach(attr => {
            if (attr.name.startsWith('data-')) {
                dataAttrs[attr.name] = attr.value;
            }
        });
        return dataAttrs;
    }

    extractLabelsAdvanced(element, info) {
        // Standard label extraction
        if (element.id) {
            const label = document.querySelector(`label[for="${element.id}"]`);
            if (label && label.textContent) {
                info.labels.push(label.textContent.trim());
            }
        }

        // Check aria-label
        const ariaLabel = element.getAttribute('aria-label');
        if (ariaLabel) {
            info.labels.push(ariaLabel.trim());
        }
    }

    calculateMatchScore(field, mapping) {
        let score = 0;
        const searchText = [
            field.name,
            field.id,
            field.placeholder,
            field.className,
            ...field.labels,
            ...Object.values(field.dataAttributes || {})
        ].join(' ').toLowerCase();

        // Check keyword matches
        mapping.keywords.forEach(keyword => {
            const keywordLower = keyword.toLowerCase();
            if (searchText.includes(keywordLower)) {
                if (field.name.toLowerCase() === keywordLower || field.id.toLowerCase() === keywordLower) {
                    score += 1.0;
                } else {
                    score += 0.8;
                }
            }
        });

        // Check job portal specific patterns
        if (mapping.jobPortalPatterns) {
            mapping.jobPortalPatterns.forEach(pattern => {
                if (searchText.includes(pattern.toLowerCase())) {
                    score += 0.9;
                }
            });
        }

        // Check input type compatibility
        if (mapping.inputTypes.includes(field.type)) {
            score += 0.2;
        }

        return Math.min(score, 1.0);
    }

    fillSelectField(selectElement, value) {
        // Try exact value match first
        for (let option of selectElement.options) {
            if (option.value === value || option.textContent.trim() === value) {
                selectElement.value = option.value;
                return true;
            }
        }

        // Try partial match
        const valueLower = value.toLowerCase();
        for (let option of selectElement.options) {
            if (option.textContent.toLowerCase().includes(valueLower) || 
                option.value.toLowerCase().includes(valueLower)) {
                selectElement.value = option.value;
                return true;
            }
        }

        return false;
    }

    fillRadioField(radioElement, value) {
        const radioGroup = document.querySelectorAll(`input[name="${radioElement.name}"]`);
        
        // Try exact value match
        for (let radio of radioGroup) {
            if (radio.value === value) {
                radio.checked = true;
                return true;
            }
        }

        return false;
    }

    fillCheckboxField(checkboxElement, value) {
        const shouldCheck = value.toLowerCase() === 'true' || 
                          value.toLowerCase() === 'yes' || 
                          value === '1' ||
                          value.toLowerCase() === 'on';
        
        checkboxElement.checked = shouldCheck;
        return true;
    }
}

describe('Enhanced Form Detection', () => {
    let dom;
    let document;
    let window;

    beforeEach(() => {
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
                <head><title>Test</title></head>
                <body>
                    <div id="test-container"></div>
                </body>
            </html>
        `, {
            url: 'https://example.com',
            pretendToBeVisual: true
        });

        document = dom.window.document;
        window = dom.window;
        global.document = document;
        global.window = window;
    });

    describe('Select Dropdown Detection', () => {
        it('should detect and extract select dropdown options', () => {
            const container = document.getElementById('test-container');
            container.innerHTML = `
                <form>
                    <label for="experience">Years of Experience</label>
                    <select id="experience" name="experience">
                        <option value="">Select...</option>
                        <option value="0-1">0-1 years</option>
                        <option value="2-5">2-5 years</option>
                        <option value="5+">5+ years</option>
                    </select>
                </form>
            `;

            const manager = new TestAutofillManager();
            const fields = manager.detectFormFields();
            
            const selectField = fields.find(f => f.element.tagName === 'SELECT');
            expect(selectField).toBeDefined();
            expect(selectField.options).toHaveLength(4);
            expect(selectField.options[1].value).toBe('0-1');
            expect(selectField.options[1].text).toBe('0-1 years');
        });

        it('should fill select dropdown with matching value', () => {
            const container = document.getElementById('test-container');
            container.innerHTML = `
                <form>
                    <select id="experience" name="experience">
                        <option value="">Select...</option>
                        <option value="2-5">2-5 years</option>
                        <option value="5+">5+ years</option>
                    </select>
                </form>
            `;

            const manager = new TestAutofillManager();
            const selectElement = document.getElementById('experience');
            
            const result = manager.fillSelectField(selectElement, '2-5');
            expect(result).toBe(true);
            expect(selectElement.value).toBe('2-5');
        });

        it('should fill select dropdown with partial text match', () => {
            const container = document.getElementById('test-container');
            container.innerHTML = `
                <form>
                    <select id="experience" name="experience">
                        <option value="">Select...</option>
                        <option value="junior">Junior Developer</option>
                        <option value="senior">Senior Developer</option>
                    </select>
                </form>
            `;

            const manager = new TestAutofillManager();
            const selectElement = document.getElementById('experience');
            
            const result = manager.fillSelectField(selectElement, 'Senior');
            expect(result).toBe(true);
            expect(selectElement.value).toBe('senior');
        });
    });

    describe('Radio Button Detection', () => {
        it('should fill radio button with matching value', () => {
            const container = document.getElementById('test-container');
            container.innerHTML = `
                <form>
                    <label><input type="radio" name="status" value="student"> Student</label>
                    <label><input type="radio" name="status" value="employed"> Employed</label>
                </form>
            `;

            const manager = new TestAutofillManager();
            const radioElement = document.querySelector('input[value="student"]');
            
            const result = manager.fillRadioField(radioElement, 'student');
            expect(result).toBe(true);
            expect(radioElement.checked).toBe(true);
        });
    });

    describe('Job Portal Specific Patterns', () => {
        it('should recognize job portal field patterns with high score', () => {
            const container = document.getElementById('test-container');
            container.innerHTML = `
                <form>
                    <input type="text" 
                           class="wd-input" 
                           data-automation-id="applicant_full_name"
                           name="candidate_name" 
                           placeholder="Full Name">
                </form>
            `;

            const manager = new TestAutofillManager();
            const fields = manager.detectFormFields();
            
            expect(fields).toHaveLength(1);
            const field = fields[0];
            expect(field).toBeDefined();
            
            const mapping = manager.fieldMappings.fullName;
            const score = manager.calculateMatchScore(field, mapping);
            
            // Should get high score due to job portal patterns
            expect(score).toBeGreaterThan(0.8);
        });

        it('should extract data attributes for better matching', () => {
            const container = document.getElementById('test-container');
            container.innerHTML = `
                <form>
                    <input type="email" 
                           data-field="email_address"
                           data-automation="contact_email"
                           name="user_email">
                </form>
            `;

            const manager = new TestAutofillManager();
            const fields = manager.detectFormFields();
            
            expect(fields).toHaveLength(1);
            const field = fields[0];
            expect(field).toBeDefined();
            expect(field.dataAttributes).toBeDefined();
            expect(field.dataAttributes['data-field']).toBe('email_address');
            expect(field.dataAttributes['data-automation']).toBe('contact_email');
        });
    });

    describe('Checkbox Handling', () => {
        it('should fill checkbox with boolean values', () => {
            const container = document.getElementById('test-container');
            container.innerHTML = `
                <form>
                    <label>
                        <input type="checkbox" name="terms" value="accepted">
                        I agree to terms
                    </label>
                </form>
            `;

            const manager = new TestAutofillManager();
            const checkboxElement = document.querySelector('input[type="checkbox"]');
            
            let result = manager.fillCheckboxField(checkboxElement, 'true');
            expect(result).toBe(true);
            expect(checkboxElement.checked).toBe(true);

            result = manager.fillCheckboxField(checkboxElement, 'false');
            expect(result).toBe(true);
            expect(checkboxElement.checked).toBe(false);

            result = manager.fillCheckboxField(checkboxElement, 'yes');
            expect(result).toBe(true);
            expect(checkboxElement.checked).toBe(true);
        });
    });

    describe('Enhanced Field Detection', () => {
        it('should detect multiple field types in one form', () => {
            const container = document.getElementById('test-container');
            container.innerHTML = `
                <form>
                    <input type="text" name="name" placeholder="Full Name">
                    <select name="experience">
                        <option value="junior">Junior</option>
                        <option value="senior">Senior</option>
                    </select>
                    <input type="radio" name="status" value="student">
                    <input type="checkbox" name="terms" value="accepted">
                </form>
            `;

            const manager = new TestAutofillManager();
            const fields = manager.detectFormFields();
            
            expect(fields).toHaveLength(4);
            
            const fieldTypes = fields.map(f => f.type);
            expect(fieldTypes).toContain('text');
            expect(fieldTypes).toContain('radio');
            expect(fieldTypes).toContain('checkbox');
            
            const selectField = fields.find(f => f.element.tagName === 'SELECT');
            expect(selectField).toBeDefined();
            expect(selectField.options).toHaveLength(2);
        });
    });
});