/**
 * Content script for Job Application Autofill extension - Google Forms Optimized
 * Handles form detection, field matching, and autofill operations across different form types
 */

/**
 * Main autofill manager class that handles form detection and filling operations
 * Supports both Google Forms and standard HTML forms with intelligent field matching
 */
class AutofillManager {
  /**
     * Initialize the AutofillManager with debug mode and message listener
     */
  constructor() {
    this.debugMode = this.isDebugMode();
    this.setupMessageListener();
    this.log('AutofillManager initialized for Google Forms');
  }

  /**
     * Check if debug mode is enabled via localStorage
     * @returns {boolean} True if debug mode is enabled
     */
  isDebugMode() {
    try {
      return localStorage.getItem('autofill_debug') === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
     * Log debug messages when debug mode is enabled
     * @param {string} message - The message to log
     * @param {*} data - Optional data to log alongside the message
     */
  log(message, data = null) {
    if (this.debugMode) {
      console.log('[Autofill]', message, data || '');
    }
  }

  /**
     * Set up Chrome extension message listener for autofill requests
     * Listens for 'autofill' action messages from the extension popup
     */
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

  /**
     * Perform the main autofill operation on the current page
     * @param {Object} data - User profile data containing form field values
     * @returns {Promise<Object>} Result object with filledCount and message
     * @throws {Error} If autofill operation fails
     */
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

  /**
     * Detect if the current page is a Google Form
     * @returns {boolean} True if the current page is a Google Form
     */
  isGoogleForm() {
    return window.location.hostname === 'docs.google.com' &&
               window.location.pathname.includes('/forms/');
  }

  /**
     * Detect and extract form fields from Google Forms
     * Uses Google Forms specific selectors and DOM structure
     * @returns {Array<Object>} Array of field information objects
     */
  detectGoogleFormFields() {
    const fields = [];

    // Google Forms specific selectors
    const selectors = [
      'input[type="text"]',
      'input[type="email"]',
      'input[type="tel"]',
      'input[type="url"]',
      'input[type="date"]',
      'textarea',
      'select',
      'input[jsname]', // Google Forms specific
      'div[role="textbox"]', // Google Forms rich text
      'input[data-initial-value]', // Google Forms
      'div[role="listbox"]', // Google Forms dropdowns
      'div[role="option"]' // Google Forms options
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

  /**
     * Detect and extract form fields from standard HTML forms
     * @returns {Array<Object>} Array of field information objects
     */
  detectStandardFormFields() {
    const fields = [];
    const elements = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input[type="date"], textarea, select, input:not([type])');

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

  /**
     * Check if a Google Form field element can be filled
     * @param {HTMLElement} element - The form field element to check
     * @returns {boolean} True if the field can be filled
     */
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

  /**
     * Check if a standard form field element can be filled
     * @param {HTMLElement} element - The form field element to check
     * @returns {boolean} True if the field can be filled
     */
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

  /**
     * Extract field information from Google Form elements
     * Uses multiple strategies to identify field labels and context
     * @param {HTMLElement} element - The form field element
     * @returns {Object} Field information object with element, type, labels, and searchText
     */
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

  /**
     * Extract field information from standard HTML form elements
     * @param {HTMLElement} element - The form field element
     * @returns {Object} Field information object with element, type, labels, and searchText
     */
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

  /**
     * Find nearby text content that might serve as field labels
     * Searches through previous siblings and parent elements
     * @param {HTMLElement} element - The form field element
     * @returns {string} Combined nearby text content
     */
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

  /**
     * Match detected form fields to user profile data using intelligent pattern matching
     * @param {Array<Object>} fields - Array of detected form field objects
     * @param {Object} data - User profile data object
     * @returns {Array<Object>} Array of matched field-data pairs with confidence scores
     * @throws {Error} If no matches are found
     */
  matchFieldsToData(fields, data) {
    const matches = [];

    this.log('Starting field matching process', { fieldsCount: fields.length, dataKeys: Object.keys(data) });

    // Enhanced matching patterns with more variations
    const patterns = {
      fullName: ['name', 'full name', 'your name', 'applicant name', 'candidate name', 'first name', 'last name', 'fname', 'lname', 'fullname', 'complete name', 'legal name'],
      email: ['email', 'e-mail', 'email address', 'contact email', 'university email', 'college email', 'mail', 'e mail', 'electronic mail', 'contact', 'reach', 'official email', 'academic email'],
      personalEmail: ['personal email', 'personal mail', 'private email', 'alternate email', 'secondary email', 'personal e-mail', 'mail id', 'email id', 'personal contact'],
      phone: ['phone', 'mobile', 'telephone', 'contact number', 'phone number', 'mobile number', 'cell', 'tel', 'contact', 'number'],
      studentNumber: ['student', 'registration', 'id number', 'student id', 'enrollment', 'roll number', 'id', 'student number', 'reg', 'registration number'],
      tenthMarks: ['10th', 'tenth', '10 grade', 'tenth grade', 'class 10', 'ssc', 'matriculation', '10th marks', 'tenth marks', '10th percentage', 'class x'],
      twelfthMarks: ['12th', 'twelfth', '12 grade', 'twelfth grade', 'class 12', 'hsc', 'intermediate', '12th marks', 'twelfth marks', '12th percentage', 'class xii'],
      ugCgpa: ['cgpa', 'gpa', 'undergraduate', 'ug cgpa', 'college gpa', 'university gpa', 'graduation', 'degree', 'bachelor'],
      gender: ['gender', 'sex', 'male', 'female', 'gender identity', 'sex identity'],
      campus: ['campus', 'college', 'university', 'institution', 'vit', 'amaravathi', 'ap'],
      degree: ['degree', 'qualification', 'education level', 'academic degree', 'bachelor', 'b tech', 'btech', 'b.tech'],
      specialization: ['specialization', 'major', 'field of study', 'degree', 'branch', 'stream', 'discipline', 'course', 'program', 'field', 'study area', 'academic field', 'subject', 'department'],
      dateOfBirth: ['dob', 'date of birth', 'birth date', 'birthday', 'birthdate', 'date birth', 'birth', 'born', 'born on', 'date born', 'birth day', 'birth-date', 'date-of-birth'],
      linkedinUrl: ['linkedin', 'linked in', 'linkedin profile', 'linkedin url', 'professional profile', 'linked-in', 'professional', 'social'],
      githubUrl: ['github', 'git hub', 'github profile', 'github url', 'repository', 'code profile', 'git-hub', 'coding', 'repo'],
      leetcodeUrl: ['leetcode', 'leet code', 'coding profile', 'algorithm profile', 'competitive programming', 'leet-code', 'coding', 'algorithm'],
      resumeUrl: ['resume', 'cv', 'curriculum vitae', 'resume link', 'cv link', 'document', 'curriculum', 'resume url', 'drive link', 'google drive'],
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

  /**
     * Fill form fields with matched data values
     * @param {Array<Object>} matches - Array of field-data matches
     * @param {boolean} isGoogleForm - Whether this is a Google Form
     * @returns {number} Number of successfully filled fields
     */
  fillFields(matches, isGoogleForm) {
    let filledCount = 0;

    matches.forEach(match => {
      try {
        const element = match.field.element;
        const value = match.value;
        const dataKey = match.dataKey;

        // Special handling for select fields and specific data types
        if (element.tagName === 'SELECT') {
          if (this.fillSelectField(element, value, dataKey)) {
            filledCount++;
            this.log(`Filled select field with: ${value}`);
          }
        } else if (dataKey === 'dateOfBirth') {
          // Special handling for date fields with format conversion
          if (this.fillDateField(element, value, isGoogleForm)) {
            filledCount++;
            this.log(`Filled date field with: ${value}`);
          }
        } else if (isGoogleForm) {
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

  /**
     * Format date value for different field types and formats
     * Handles various date input formats and converts ISO date to appropriate format
     * @param {HTMLElement} element - The form field element
     * @param {string} value - The ISO date value (YYYY-MM-DD)
     * @returns {string} Formatted date value appropriate for the field
     */
  formatDateForField(element, value) {
    if (!value) return '';

    try {
      // If the value is already in ISO format (YYYY-MM-DD), use it directly for date inputs
      if (element.type === 'date') {
        return value; // ISO format is perfect for HTML5 date inputs
      }

      // Parse the ISO date
      const date = new Date(value + 'T00:00:00'); // Add time to avoid timezone issues
      
      if (isNaN(date.getTime())) {
        this.log('Invalid date value:', value);
        return value; // Return original if parsing fails
      }

      // Check for common date format patterns in the field
      const searchText = (element.placeholder || element.name || element.id || '').toLowerCase();
      
      // Format based on field hints or common patterns
      if (searchText.includes('dd/mm/yyyy') || searchText.includes('dd-mm-yyyy')) {
        // European format: DD/MM/YYYY or DD-MM-YYYY
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return searchText.includes('/') ? `${day}/${month}/${year}` : `${day}-${month}-${year}`;
      } else if (searchText.includes('mm/dd/yyyy') || searchText.includes('mm-dd-yyyy')) {
        // American format: MM/DD/YYYY or MM-DD-YYYY
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return searchText.includes('/') ? `${month}/${day}/${year}` : `${month}-${day}-${year}`;
      } else if (searchText.includes('dd/mm/yy') || searchText.includes('dd-mm-yy')) {
        // Short European format: DD/MM/YY or DD-MM-YY
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString().slice(-2);
        return searchText.includes('/') ? `${day}/${month}/${year}` : `${day}-${month}-${year}`;
      } else if (searchText.includes('mm/dd/yy') || searchText.includes('mm-dd-yy')) {
        // Short American format: MM/DD/YY or MM-DD-YY
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString().slice(-2);
        return searchText.includes('/') ? `${month}/${day}/${year}` : `${month}-${day}-${year}`;
      }

      // Default formats based on common patterns
      // Try to detect existing format from placeholder or nearby text
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();

      // Most common formats as fallback
      const formats = [
        `${day}/${month}/${year}`, // DD/MM/YYYY
        `${month}/${day}/${year}`, // MM/DD/YYYY
        `${day}-${month}-${year}`, // DD-MM-YYYY
        `${month}-${day}-${year}`, // MM-DD-YYYY
        `${year}-${month}-${day}`, // YYYY-MM-DD (ISO)
        `${day}.${month}.${year}`, // DD.MM.YYYY (German style)
        `${month}.${day}.${year}`  // MM.DD.YYYY
      ];

      // Return the first format (DD/MM/YYYY) as default
      return formats[0];

    } catch (error) {
      this.log('Error formatting date:', error);
      return value; // Return original value if formatting fails
    }
  }

  /**
   * Fill date field with enhanced handling for different input types
   * @param {HTMLElement} element - The date field element
   * @param {string} value - The date value (YYYY-MM-DD format)
   * @param {boolean} isGoogleForm - Whether this is a Google Form
   * @returns {boolean} True if the field was successfully filled
   */
  fillDateField(element, value, isGoogleForm) {
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
        
        if (isGoogleForm) {
          return this.fillGoogleFormField(element, formattedValue);
        } else {
          return this.fillStandardField(element, formattedValue);
        }
      }
    } catch (error) {
      this.log('Error filling date field:', error);
      return false;
    }
  }

  /**
     * Fill a Google Form field with the specified value
     * Uses Google Forms specific event handling for proper form state updates
     * @param {HTMLElement} element - The form field element to fill
     * @param {string} value - The value to fill into the field
     * @returns {boolean} True if the field was successfully filled
     */
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

  /**
     * Fill a standard HTML form field with the specified value
     * @param {HTMLElement} element - The form field element to fill
     * @param {string} value - The value to fill into the field
     * @returns {boolean} True if the field was successfully filled
     */
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

  /**
     * Fill a select dropdown field with intelligent option matching
     * Includes special handling for gender and campus fields with smart pattern matching
     * @param {HTMLSelectElement} element - The select element to fill
     * @param {string} value - The value to match against select options
     * @param {string} dataKey - The data key to determine special handling logic
     * @returns {boolean} True if an option was successfully selected
     */
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
        this.log('Step 1: Focused element');

        // Step 2: Trigger mousedown event (some frameworks require this)
        element.dispatchEvent(new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          view: window
        }));
        this.log('Step 2: Dispatched mousedown');

        // Step 3: Trigger click event on the select element
        element.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        }));
        this.log('Step 3: Dispatched click');

        // Step 4: Clear other selections first
        options.forEach(opt => {
          opt.selected = false;
        });
        this.log('Step 4: Cleared all selections');

        // Step 5: Set the value and selected property
        selectedOption.selected = true;
        element.value = selectedOption.value;
        element.selectedIndex = Array.from(element.options).indexOf(selectedOption);
        this.log(`Step 5: Set value to ${selectedOption.value}, selectedIndex to ${element.selectedIndex}`);

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

        // Dispatch events with small delays for better compatibility
        events.forEach((event, index) => {
          setTimeout(() => {
            try {
              element.dispatchEvent(event);
            } catch (eventError) {
              this.log(`Error dispatching ${event.type} event:`, eventError);
            }
          }, index * 10); // 10ms delay between events
        });

        // Step 7: Additional framework-specific event handling
        setTimeout(() => {
          try {
            // React-specific events
            if (element._reactInternalFiber || element._reactInternalInstance) {
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
        }, 100); // Wait 100ms for all events to process

        // Step 8: Verify the selection was successful
        setTimeout(() => {
          const finalValue = element.value;
          const isSelectionSuccessful = finalValue === selectedOption.value;
          
          if (isSelectionSuccessful) {
            this.log(`✅ Successfully selected option: ${selectedOption.text} (value: ${selectedOption.value})`);
          } else {
            this.log(`⚠️ Selection verification failed. Expected: ${selectedOption.value}, Actual: ${finalValue}`);
            // Try one more time with a different approach
            this.retrySelectFieldFill(element, selectedOption);
          }
        }, 150);

        return true;
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

  /**
   * Retry select field filling with alternative approach
   * Used as fallback when initial selection verification fails
   * @param {HTMLSelectElement} element - The select element
   * @param {HTMLOptionElement} selectedOption - The option to select
   */
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
        setTimeout(() => {
          if (element.value === selectedOption.value) {
            this.log('✅ Retry successful - option selected via selectedIndex');
          } else {
            this.log('❌ Retry failed - selection could not be completed');
          }
        }, 50);
      }
    } catch (retryError) {
      this.log('Retry select field fill error:', retryError);
    }
  }

  /**
     * Display a toast notification to the user
     * @param {string} message - The message to display
     * @param {string} type - The type of toast ('success', 'error', 'warning', 'info')
     */
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
