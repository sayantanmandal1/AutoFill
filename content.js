// Content script for Job Application Autofill extension - Google Forms Optimized
class AutofillManager {
    constructor() {
        this.debugMode = this.isDebugMode();
        this.setupMessageListener();
        this.log('AutofillManager initialized for Google Forms');
    }

    isDebugMode() {
        try {
            return localStorage.getItem('autofill_debug') === 'true';
        } catch (error) {
            return false;
        }
    }

    log(message, data = null) {
        if (this.debugMode) {
            console.log('[Autofill]', message, data || '');
        }
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'autofill') {
                this.performAutofill(request.data)
                    .then(result => sendResponse({ success: true, result }))
                    .catch(error => sendResponse({ success: false, error: error.message }));
                return true;
            }
        });
    }

    async performAutofill(data) {
        this.log('Starting autofill for Google Forms', data);
        
        try {
            // Wait for page to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve, { once: true });
                });
            }

            // Detect if this is a Google Form
            const isGoogleForm = this.isGoogleForm();
            this.log('Is Google Form:', isGoogleForm);

            let fields;
            if (isGoogleForm) {
                fields = this.detectGoogleFormFields();
            } else {
                fields = this.detectStandardFormFields();
            }

            this.log(`Detected ${fields.length} fields`, fields);

            if (fields.length === 0) {
                this.showToast('No fillable form fields found', 'warning');
                return { filledCount: 0, message: 'No fields found' };
            }

            const matches = this.matchFieldsToData(fields, data);
            this.log(`Matched ${matches.length} fields`, matches);

            if (matches.length === 0) {
                this.showToast('No matching fields found for your data', 'warning');
                return { filledCount: 0, message: 'No matches found' };
            }

            const filledCount = this.fillFields(matches, isGoogleForm);
            
            if (filledCount > 0) {
                this.showToast(`✅ Autofilled ${filledCount} field${filledCount === 1 ? '' : 's'}!`, 'success');
                return { filledCount, message: 'Success' };
            } else {
                this.showToast('Failed to fill any fields', 'error');
                return { filledCount: 0, message: 'Fill failed' };
            }

        } catch (error) {
            this.log('Autofill error:', error);
            this.showToast(`Autofill failed: ${error.message}`, 'error');
            throw error;
        }
    }

    isGoogleForm() {
        return window.location.hostname === 'docs.google.com' && 
               window.location.pathname.includes('/forms/');
    }

    detectGoogleFormFields() {
        const fields = [];
        
        // Google Forms specific selectors
        const selectors = [
            'input[type="text"]',
            'input[type="email"]', 
            'input[type="tel"]',
            'input[type="url"]',
            'textarea',
            'input[jsname]', // Google Forms specific
            'div[role="textbox"]', // Google Forms rich text
            'input[data-initial-value]' // Google Forms
        ];

        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (this.isGoogleFormFieldFillable(element)) {
                    const fieldInfo = this.extractGoogleFormFieldInfo(element);
                    if (fieldInfo) {
                        fields.push(fieldInfo);
                    }
                }
            });
        });

        return fields;
    }

    detectStandardFormFields() {
        const fields = [];
        const elements = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="url"], textarea, input:not([type])');
        
        elements.forEach(element => {
            if (this.isFieldFillable(element)) {
                const fieldInfo = this.extractFieldInfo(element);
                if (fieldInfo) {
                    fields.push(fieldInfo);
                }
            }
        });

        return fields;
    }

    isGoogleFormFieldFillable(element) {
        if (!element || element.disabled || element.readOnly) {
            return false;
        }

        // Check visibility
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

    isFieldFillable(element) {
        if (!element || element.disabled || element.readOnly || element.type === 'password') {
            return false;
        }

        const rect = element.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) {
            return false;
        }

        return true;
    }

    extractGoogleFormFieldInfo(element) {
        const info = {
            element: element,
            type: element.type || 'text',
            value: element.value || '',
            labels: [],
            searchText: ''
        };

        // Google Forms specific label detection with multiple strategies
        const questionContainer = element.closest('[role="listitem"], .freebirdFormviewerViewItemsItemItem, [data-params]');
        if (questionContainer) {
            // Strategy 1: Look for question text with multiple selectors
            const questionSelectors = [
                '[role="heading"]',
                '.freebirdFormviewerViewItemsItemItemTitle',
                '.Xb9hP', // Common Google Forms class
                '.M7eMe', // Another common class
                'span[jsslot]',
                'div[jsname] span',
                '.exportLabel', // Sometimes used
                '[data-value]' // Data attributes
            ];

            for (const selector of questionSelectors) {
                const questionElement = questionContainer.querySelector(selector);
                if (questionElement && questionElement.textContent.trim()) {
                    info.labels.push(questionElement.textContent.trim());
                    break; // Use the first match
                }
            }

            // Strategy 2: Look for description text
            const descSelectors = [
                '.freebirdFormviewerViewItemsItemItemHelpText',
                '.freebirdFormviewerViewItemsItemItemDescription',
                '.exportItemDescription'
            ];

            for (const selector of descSelectors) {
                const descElement = questionContainer.querySelector(selector);
                if (descElement && descElement.textContent.trim()) {
                    info.labels.push(descElement.textContent.trim());
                }
            }

            // Strategy 3: If no specific elements found, use container text
            if (info.labels.length === 0) {
                const containerText = questionContainer.textContent.trim();
                if (containerText && containerText.length < 300) {
                    // Clean up the text
                    const cleanText = containerText
                        .replace(/\n+/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();
                    if (cleanText) {
                        info.labels.push(cleanText);
                    }
                }
            }
        }

        // Strategy 4: Look for aria-label and other attributes
        const ariaLabel = element.getAttribute('aria-label');
        if (ariaLabel && ariaLabel.trim()) {
            info.labels.push(ariaLabel.trim());
        }

        const title = element.getAttribute('title');
        if (title && title.trim()) {
            info.labels.push(title.trim());
        }

        // Strategy 5: Fallback to nearby text
        if (info.labels.length === 0) {
            const nearbyText = this.findNearbyText(element);
            if (nearbyText) {
                info.labels.push(nearbyText);
            }
        }

        // Strategy 6: Use data attributes
        const dataParams = element.getAttribute('data-params');
        if (dataParams) {
            try {
                // Sometimes data-params contains useful info
                const params = JSON.parse(dataParams);
                if (params && params[1] && typeof params[1] === 'string') {
                    info.labels.push(params[1]);
                }
            } catch (e) {
                // Ignore JSON parse errors
            }
        }

        // Create comprehensive search text
        const searchComponents = [
            element.name || '',
            element.id || '',
            element.placeholder || '',
            element.className || '',
            element.getAttribute('aria-label') || '',
            element.getAttribute('jsname') || '',
            ...info.labels
        ];

        info.searchText = searchComponents
            .filter(text => text && typeof text === 'string')
            .map(text => text.trim())
            .filter(text => text.length > 0)
            .join(' ')
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ') // Replace special chars with spaces
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim();

        this.log('Extracted Google Form field info:', {
            element: element.tagName + (element.type ? `[${element.type}]` : ''),
            labels: info.labels,
            searchText: info.searchText
        });

        return info;
    }

    extractFieldInfo(element) {
        const info = {
            element: element,
            type: element.type || 'text',
            value: element.value || '',
            labels: [],
            searchText: ''
        };

        // Standard label detection
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

        // Look for previous siblings
        const nearbyText = this.findNearbyText(element);
        if (nearbyText) {
            info.labels.push(nearbyText);
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

    findNearbyText(element) {
        const texts = [];
        
        // Check previous siblings
        let sibling = element.previousElementSibling;
        let count = 0;
        while (sibling && count < 3) {
            const text = sibling.textContent || sibling.innerText || '';
            if (text.trim() && text.trim().length < 200) {
                texts.push(text.trim());
            }
            sibling = sibling.previousElementSibling;
            count++;
        }

        // Check parent elements
        let parent = element.parentElement;
        count = 0;
        while (parent && count < 2) {
            const directText = Array.from(parent.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE)
                .map(node => node.textContent.trim())
                .filter(text => text && text.length < 100)
                .join(' ');
            
            if (directText) {
                texts.push(directText);
            }
            parent = parent.parentElement;
            count++;
        }

        return texts.join(' ').trim();
    }

    matchFieldsToData(fields, data) {
        const matches = [];
        
        this.log('Starting field matching process', { fieldsCount: fields.length, dataKeys: Object.keys(data) });
        
        // Enhanced matching patterns with more variations
        const patterns = {
            fullName: ['name', 'full name', 'your name', 'applicant name', 'candidate name', 'first name', 'last name', 'fname', 'lname', 'fullname', 'complete name', 'legal name'],
            email: ['email', 'e-mail', 'email address', 'contact email', 'university email', 'college email', 'mail', 'e mail', 'electronic mail', 'contact', 'reach'],
            phone: ['phone', 'mobile', 'telephone', 'contact number', 'phone number', 'mobile number', 'cell', 'tel', 'contact', 'number'],
            studentNumber: ['student', 'registration', 'id number', 'student id', 'enrollment', 'roll number', 'id', 'student number', 'reg', 'registration number'],
            linkedinUrl: ['linkedin', 'linked in', 'linkedin profile', 'linkedin url', 'professional profile', 'linked-in', 'professional', 'social'],
            githubUrl: ['github', 'git hub', 'github profile', 'github url', 'repository', 'code profile', 'git-hub', 'coding', 'repo'],
            leetcodeUrl: ['leetcode', 'leet code', 'coding profile', 'algorithm profile', 'competitive programming', 'leet-code', 'coding', 'algorithm'],
            resumeUrl: ['resume', 'cv', 'curriculum vitae', 'resume link', 'cv link', 'document', 'curriculum', 'resume url'],
            portfolioUrl: ['portfolio', 'website', 'personal website', 'portfolio website', 'work samples', 'personal site', 'portfolio url', 'site']
        };

        fields.forEach((field, fieldIndex) => {
            const searchText = field.searchText;
            this.log(`Analyzing field ${fieldIndex + 1}:`, { searchText, element: field.element });
            
            let bestMatch = null;
            let bestScore = 0;

            // Strategy 1: Exact keyword matching
            Object.entries(patterns).forEach(([dataKey, keywords]) => {
                if (!data[dataKey] || !data[dataKey].trim()) {
                    return;
                }

                let score = 0;
                const matchedKeywords = [];
                
                keywords.forEach(keyword => {
                    if (searchText.includes(keyword.toLowerCase())) {
                        score += keyword.length;
                        matchedKeywords.push(keyword);
                    }
                });

                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = {
                        field: field,
                        dataKey: dataKey,
                        value: data[dataKey],
                        confidence: Math.min(score / 5, 1.0), // Lower divisor for higher confidence
                        matchedKeywords: matchedKeywords
                    };
                }
            });

            // Strategy 2: Partial word matching
            if (!bestMatch || bestMatch.confidence < 0.5) {
                Object.entries(patterns).forEach(([dataKey, keywords]) => {
                    if (!data[dataKey] || !data[dataKey].trim()) {
                        return;
                    }

                    keywords.forEach(keyword => {
                        // Check if any word in searchText contains the keyword
                        const searchWords = searchText.split(/\s+/);
                        searchWords.forEach(word => {
                            if (word.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(word)) {
                                const score = Math.min(keyword.length, word.length);
                                if (score > bestScore && score >= 3) { // Minimum 3 characters
                                    bestScore = score;
                                    bestMatch = {
                                        field: field,
                                        dataKey: dataKey,
                                        value: data[dataKey],
                                        confidence: Math.min(score / 8, 0.8), // Lower confidence for partial matches
                                        matchType: 'partial'
                                    };
                                }
                            }
                        });
                    });
                });
            }

            // Strategy 3: Custom fields matching (more aggressive)
            if (data.customFields) {
                Object.entries(data.customFields).forEach(([customKey, customValue]) => {
                    if (!customValue || !customValue.trim()) {
                        return;
                    }

                    const customKeyLower = customKey.toLowerCase();
                    let score = 0;

                    // Exact match
                    if (searchText.includes(customKeyLower)) {
                        score = customKey.length * 2; // Higher score for custom fields
                    } else {
                        // Partial match for custom fields
                        const searchWords = searchText.split(/\s+/);
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

                    if (score > bestScore) {
                        bestScore = score;
                        bestMatch = {
                            field: field,
                            dataKey: customKey,
                            value: customValue,
                            confidence: Math.min(score / 8, 1.0),
                            matchType: 'custom'
                        };
                    }
                });
            }

            // Strategy 4: Positional matching (fallback)
            if (!bestMatch && fieldIndex < 5) {
                const positionMatches = [
                    { index: 0, dataKey: 'fullName', confidence: 0.3 },
                    { index: 1, dataKey: 'email', confidence: 0.3 },
                    { index: 2, dataKey: 'phone', confidence: 0.2 },
                    { index: 3, dataKey: 'studentNumber', confidence: 0.2 }
                ];

                const posMatch = positionMatches.find(pm => pm.index === fieldIndex);
                if (posMatch && data[posMatch.dataKey] && data[posMatch.dataKey].trim()) {
                    bestMatch = {
                        field: field,
                        dataKey: posMatch.dataKey,
                        value: data[posMatch.dataKey],
                        confidence: posMatch.confidence,
                        matchType: 'positional'
                    };
                }
            }

            // Strategy 5: Input type matching (last resort)
            if (!bestMatch) {
                const typeMatches = {
                    'email': 'email',
                    'tel': 'phone',
                    'url': 'linkedinUrl' // Try LinkedIn first for URL fields
                };

                const typeMatch = typeMatches[field.type];
                if (typeMatch && data[typeMatch] && data[typeMatch].trim()) {
                    bestMatch = {
                        field: field,
                        dataKey: typeMatch,
                        value: data[typeMatch],
                        confidence: 0.4,
                        matchType: 'type-based'
                    };
                }
            }

            if (bestMatch && bestMatch.confidence > 0.05) { // Very low threshold
                this.log(`Field ${fieldIndex + 1} matched:`, {
                    dataKey: bestMatch.dataKey,
                    confidence: bestMatch.confidence,
                    matchType: bestMatch.matchType || 'keyword',
                    value: bestMatch.value.substring(0, 30) + '...'
                });
                matches.push(bestMatch);
            } else {
                this.log(`Field ${fieldIndex + 1} NO MATCH:`, { searchText });
            }
        });

        this.log(`Matching complete: ${matches.length} matches found`);
        
        // If no matches found, provide helpful error
        if (matches.length === 0) {
            this.log('No matches found. Field analysis:', fields.map(f => ({
                searchText: f.searchText,
                element: f.element.tagName + (f.element.type ? `[${f.element.type}]` : '')
            })));
            
            throw new Error(`Failed to match form fields with your data. Found ${fields.length} fields but none matched your saved data. Try adding custom fields in the extension popup.`);
        }

        return matches;
    }

    fillFields(matches, isGoogleForm) {
        let filledCount = 0;

        matches.forEach(match => {
            try {
                const element = match.field.element;
                const value = match.value;

                if (isGoogleForm) {
                    if (this.fillGoogleFormField(element, value)) {
                        filledCount++;
                        this.log(`Filled Google Form field with: ${value.substring(0, 30)}...`);
                    }
                } else {
                    if (this.fillStandardField(element, value)) {
                        filledCount++;
                        this.log(`Filled standard field with: ${value.substring(0, 30)}...`);
                    }
                }
            } catch (error) {
                this.log('Error filling field:', error);
            }
        });

        return filledCount;
    }

    fillGoogleFormField(element, value) {
        try {
            // Focus the element
            element.focus();
            
            // Clear existing value
            element.value = '';
            
            // For Google Forms, we need to trigger specific events
            element.value = value;
            
            // Trigger Google Forms specific events
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

            // Additional Google Forms trigger
            if (element.getAttribute('jsname')) {
                // Trigger Google's internal event system
                setTimeout(() => {
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                }, 100);
            }

            return element.value === value;
        } catch (error) {
            this.log('Error filling Google Form field:', error);
            return false;
        }
    }

    fillStandardField(element, value) {
        try {
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
            this.log('Error filling standard field:', error);
            return false;
        }
    }

    showToast(message, type = 'info') {
        try {
            // Remove existing toast
            const existingToast = document.getElementById('autofill-toast');
            if (existingToast) {
                existingToast.remove();
            }

            // Create toast element
            const toast = document.createElement('div');
            toast.id = 'autofill-toast';
            toast.textContent = message;
            
            // Style the toast
            Object.assign(toast.style, {
                position: 'fixed',
                top: '20px',
                right: '20px',
                padding: '12px 20px',
                borderRadius: '6px',
                color: 'white',
                fontFamily: 'Arial, sans-serif',
                fontSize: '14px',
                fontWeight: 'bold',
                zIndex: '10000',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                maxWidth: '300px',
                wordWrap: 'break-word'
            });

            // Set color based on type
            const colors = {
                success: '#4CAF50',
                error: '#f44336',
                warning: '#ff9800',
                info: '#2196F3'
            };
            toast.style.backgroundColor = colors[type] || colors.info;

            // Add to page
            document.body.appendChild(toast);

            // Auto remove after 3 seconds
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 3000);

        } catch (error) {
            console.log('Autofill:', message);
        }
    }
}

// Initialize the autofill manager
const autofillManager = new AutofillManager();