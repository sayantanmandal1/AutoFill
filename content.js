// Content script for Job Application Autofill extension
class AutofillManager {
    constructor() {
        // Performance monitoring
        this.performanceMetrics = {
            formDetectionTime: 0,
            fieldMatchingTime: 0,
            fieldFillingTime: 0,
            totalOperationTime: 0,
            fieldsDetected: 0,
            fieldsMatched: 0,
            fieldsFilled: 0,
            operationCount: 0
        };

        // Debug configuration
        this.debugConfig = {
            enabled: this.isDebugMode(),
            logLevel: 'info', // 'debug', 'info', 'warn', 'error'
            logPerformance: true,
            logFieldMatching: true,
            logFieldFilling: true
        };

        // Performance optimization caches
        this.fieldCache = new Map();
        this.labelCache = new Map();
        this.visibilityCache = new Map();
        this.cacheTimeout = 5000; // 5 seconds

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
            },
            studentNumber: {
                keywords: ['student', 'registration', 'id', 'number', 'student-id', 'reg-no', 'roll-no', 'enrollment', 'student_id', 'reg_number'],
                inputTypes: ['text', 'number'],
                priority: 2,
                jobPortalPatterns: ['student_number', 'registration_id', 'enrollment_number']
            },
            phone: {
                keywords: ['phone', 'mobile', 'contact', 'telephone', 'cell', 'number', 'phone-number', 'phonenumber', 'contact_number'],
                inputTypes: ['tel', 'text'],
                priority: 1,
                jobPortalPatterns: ['phone_number', 'mobile_number', 'contact_phone', 'telephone_number']
            },
            leetcodeUrl: {
                keywords: ['leetcode', 'leet-code', 'coding-profile', 'algorithm', 'competitive-programming', 'coding_profile'],
                inputTypes: ['url', 'text'],
                priority: 3,
                jobPortalPatterns: ['leetcode_profile', 'coding_profile_url', 'algorithm_profile']
            },
            linkedinUrl: {
                keywords: ['linkedin', 'linked-in', 'professional-profile', 'social', 'linkedin-profile', 'linkedin_profile'],
                inputTypes: ['url', 'text'],
                priority: 2,
                jobPortalPatterns: ['linkedin_url', 'professional_profile', 'linkedin_profile_url']
            },
            githubUrl: {
                keywords: ['github', 'git-hub', 'repository', 'code-profile', 'portfolio', 'github-profile', 'github_profile'],
                inputTypes: ['url', 'text'],
                priority: 2,
                jobPortalPatterns: ['github_url', 'repository_url', 'code_repository', 'github_profile_url']
            },
            resumeUrl: {
                keywords: ['resume', 'cv', 'curriculum', 'document', 'drive', 'resume-link', 'cv-link', 'resume_link'],
                inputTypes: ['url', 'text'],
                priority: 2,
                jobPortalPatterns: ['resume_url', 'cv_link', 'resume_document', 'curriculum_vitae']
            },
            portfolioUrl: {
                keywords: ['portfolio', 'website', 'personal-site', 'work-samples', 'portfolio-website', 'personal_website'],
                inputTypes: ['url', 'text'],
                priority: 3,
                jobPortalPatterns: ['portfolio_url', 'personal_website', 'work_portfolio', 'portfolio_link']
            }
        };

        // Multi-step form tracking
        this.formStepTracker = {
            currentStep: 0,
            totalSteps: 0,
            stepIndicators: [],
            filledSteps: new Set()
        };

        // Dynamic form observer for SPAs
        this.formObserver = null;
        this.setupDynamicFormDetection();
        this.setupMessageListener();

        // Initialize performance monitoring
        this.initializePerformanceMonitoring();
    }

    // Performance monitoring and debugging methods
    initializePerformanceMonitoring() {
        this.debugLog('info', 'AutofillManager initialized with performance monitoring');
        
        // Clear old caches periodically
        setInterval(() => {
            this.clearExpiredCaches();
        }, this.cacheTimeout);

        // Log performance metrics periodically if debug is enabled
        if (this.debugConfig.enabled && this.debugConfig.logPerformance) {
            setInterval(() => {
                this.logPerformanceMetrics();
            }, 30000); // Every 30 seconds
        }
    }

    isDebugMode() {
        // Check if debug mode is enabled via URL parameter or localStorage
        try {
            return window.location.search.includes('autofill_debug=true') ||
                   localStorage.getItem('autofill_debug') === 'true' ||
                   sessionStorage.getItem('autofill_debug') === 'true';
        } catch (error) {
            return false;
        }
    }

    debugLog(level, message, data = null) {
        if (!this.debugConfig.enabled) return;

        const levels = { debug: 0, info: 1, warn: 2, error: 3 };
        const currentLevel = levels[this.debugConfig.logLevel] || 1;
        const messageLevel = levels[level] || 1;

        if (messageLevel >= currentLevel) {
            const timestamp = new Date().toISOString();
            const prefix = `[AutofillManager ${timestamp}]`;
            
            switch (level) {
                case 'debug':
                    console.debug(prefix, message, data);
                    break;
                case 'info':
                    console.info(prefix, message, data);
                    break;
                case 'warn':
                    console.warn(prefix, message, data);
                    break;
                case 'error':
                    console.error(prefix, message, data);
                    break;
                default:
                    console.log(prefix, message, data);
            }
        }
    }

    startPerformanceTimer(operation) {
        const timer = {
            operation,
            startTime: performance.now(),
            endTime: null,
            duration: null
        };
        
        this.debugLog('debug', `Starting ${operation} timer`);
        return timer;
    }

    endPerformanceTimer(timer) {
        timer.endTime = performance.now();
        timer.duration = timer.endTime - timer.startTime;
        
        this.debugLog('debug', `${timer.operation} completed in ${timer.duration.toFixed(2)}ms`);
        
        // Update metrics
        switch (timer.operation) {
            case 'formDetection':
                this.performanceMetrics.formDetectionTime += timer.duration;
                break;
            case 'fieldMatching':
                this.performanceMetrics.fieldMatchingTime += timer.duration;
                break;
            case 'fieldFilling':
                this.performanceMetrics.fieldFillingTime += timer.duration;
                break;
            case 'totalOperation':
                this.performanceMetrics.totalOperationTime = timer.duration;
                this.performanceMetrics.operationCount++;
                break;
        }
        
        return timer;
    }

    logPerformanceMetrics() {
        if (this.performanceMetrics.operationCount === 0) return;

        const metrics = {
            ...this.performanceMetrics,
            averageFormDetection: this.performanceMetrics.formDetectionTime / this.performanceMetrics.operationCount,
            averageFieldMatching: this.performanceMetrics.fieldMatchingTime / this.performanceMetrics.operationCount,
            averageFieldFilling: this.performanceMetrics.fieldFillingTime / this.performanceMetrics.operationCount,
            averageTotalOperation: this.performanceMetrics.totalOperationTime / this.performanceMetrics.operationCount,
            fillSuccessRate: this.performanceMetrics.fieldsDetected > 0 ? 
                (this.performanceMetrics.fieldsFilled / this.performanceMetrics.fieldsDetected * 100).toFixed(2) + '%' : '0%'
        };

        this.debugLog('info', 'Performance Metrics:', metrics);
    }

    clearExpiredCaches() {
        const now = Date.now();
        
        // Clear field cache
        for (const [key, value] of this.fieldCache.entries()) {
            if (now - value.timestamp > this.cacheTimeout) {
                this.fieldCache.delete(key);
            }
        }

        // Clear label cache
        for (const [key, value] of this.labelCache.entries()) {
            if (now - value.timestamp > this.cacheTimeout) {
                this.labelCache.delete(key);
            }
        }

        // Clear visibility cache
        for (const [key, value] of this.visibilityCache.entries()) {
            if (now - value.timestamp > this.cacheTimeout) {
                this.visibilityCache.delete(key);
            }
        }

        this.debugLog('debug', `Cache cleanup completed. Remaining entries: fields=${this.fieldCache.size}, labels=${this.labelCache.size}, visibility=${this.visibilityCache.size}`);
    }

    getCacheKey(element) {
        // Generate a unique cache key for an element
        return `${element.tagName}_${element.id || ''}_${element.name || ''}_${element.className || ''}`;
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            try {
                if (!request || typeof request !== 'object') {
                    sendResponse({ success: false, error: 'Invalid request format' });
                    return;
                }

                if (request.action === 'autofill') {
                    if (!request.data || typeof request.data !== 'object') {
                        sendResponse({ success: false, error: 'Invalid autofill data' });
                        return;
                    }

                    this.performAutofill(request.data)
                        .then(result => {
                            sendResponse({ success: true, result });
                        })
                        .catch(error => {
                            console.error('Autofill error:', error);
                            sendResponse({ success: false, error: error.message });
                        });
                    
                    return true; // Keep message channel open for async response
                } else {
                    sendResponse({ success: false, error: 'Unknown action' });
                }
            } catch (error) {
                console.error('Message listener error:', error);
                sendResponse({ success: false, error: 'Message processing failed' });
            }
            return true;
        });
    }

    async performAutofill(data) {
        const totalTimer = this.startPerformanceTimer('totalOperation');
        
        try {
            this.debugLog('info', 'Starting autofill operation', { 
                url: window.location.href,
                dataKeys: Object.keys(data || {})
            });

            // Validate input data
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid autofill data provided');
            }

            // Check if page is ready for autofill
            if (document.readyState === 'loading') {
                this.debugLog('info', 'Waiting for page to load...');
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve, { once: true });
                });
            }

            // Detect form fields with error handling and performance monitoring
            let formFields;
            const detectionTimer = this.startPerformanceTimer('formDetection');
            try {
                formFields = this.detectFormFields();
                this.performanceMetrics.fieldsDetected += formFields.length;
            } catch (detectionError) {
                this.debugLog('error', 'Form detection error:', detectionError);
                throw new Error('Failed to detect form fields on this page');
            } finally {
                this.endPerformanceTimer(detectionTimer);
            }

            if (!formFields || formFields.length === 0) {
                this.debugLog('warn', 'No fillable form fields found on this page');
                this.showToast('No fillable form fields found on this page', 'warning');
                return { filledCount: 0, message: 'No fields found' };
            }

            this.debugLog('info', `Detected ${formFields.length} form fields`);

            // Match fields to data with error handling and performance monitoring
            let matches;
            const matchingTimer = this.startPerformanceTimer('fieldMatching');
            try {
                matches = this.matchFieldsToData(formFields, data);
                this.performanceMetrics.fieldsMatched += matches.length;
            } catch (matchingError) {
                this.debugLog('error', 'Field matching error:', matchingError);
                throw new Error('Failed to match form fields with your data');
            } finally {
                this.endPerformanceTimer(matchingTimer);
            }

            if (!matches || matches.length === 0) {
                this.debugLog('warn', 'No matching fields found for user data');
                this.showToast('No matching fields found for your data', 'warning');
                return { filledCount: 0, message: 'No matches found' };
            }

            this.debugLog('info', `Matched ${matches.length} fields`, 
                this.debugConfig.logFieldMatching ? matches.map(m => ({
                    field: m.field.name || m.field.id,
                    dataKey: m.dataKey,
                    confidence: m.confidence
                })) : null
            );

            // Fill fields with error handling and performance monitoring
            let filledCount;
            const fillingTimer = this.startPerformanceTimer('fieldFilling');
            try {
                filledCount = this.fillFields(matches);
                this.performanceMetrics.fieldsFilled += filledCount;
            } catch (fillingError) {
                this.debugLog('error', 'Field filling error:', fillingError);
                throw new Error('Failed to fill form fields');
            } finally {
                this.endPerformanceTimer(fillingTimer);
            }

            if (filledCount > 0) {
                this.debugLog('info', `Successfully filled ${filledCount} fields`);
                this.showToast(`Autofilled ${filledCount} field${filledCount === 1 ? '' : 's'} successfully!`, 'success');
                return { filledCount, message: 'Success' };
            } else {
                this.debugLog('warn', 'No fields were filled - they may be protected or incompatible');
                this.showToast('No fields were filled - they may be protected or incompatible', 'warning');
                return { filledCount: 0, message: 'No fields filled' };
            }
        } catch (error) {
            this.debugLog('error', 'Autofill operation failed:', error);
            this.showToast(`Autofill failed: ${error.message}`, 'error');
            throw error;
        } finally {
            this.endPerformanceTimer(totalTimer);
            
            // Log operation summary
            this.debugLog('info', 'Autofill operation completed', {
                totalTime: totalTimer.duration?.toFixed(2) + 'ms',
                fieldsDetected: this.performanceMetrics.fieldsDetected,
                fieldsMatched: this.performanceMetrics.fieldsMatched,
                fieldsFilled: this.performanceMetrics.fieldsFilled
            });
        }
    }

    async detectFormFields() {
        try {
            this.debugLog('debug', 'Starting form field detection');
            const fields = [];
            
            // Optimized selectors - combine similar ones for better performance
            const selectors = [
                'input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input[type="search"], input:not([type])',
                'textarea', 
                'select',
                'input[type="radio"], input[type="checkbox"]'
            ];
            
            // Detect multi-step forms
            this.detectMultiStepForm();
            
            // Use batch processing for better performance
            const allElements = [];
            selectors.forEach(selector => {
                try {
                    const elements = document.querySelectorAll(selector);
                    allElements.push(...Array.from(elements));
                    this.debugLog('debug', `Found ${elements.length} elements for selector: ${selector}`);
                } catch (selectorError) {
                    this.debugLog('warn', `Error with selector ${selector}:`, selectorError);
                }
            });

            // Process elements in batches to avoid blocking the main thread
            const batchSize = 50;
            for (let i = 0; i < allElements.length; i += batchSize) {
                const batch = allElements.slice(i, i + batchSize);
                
                batch.forEach(element => {
                    try {
                        // Check cache first for performance
                        const cacheKey = this.getCacheKey(element);
                        const cached = this.fieldCache.get(cacheKey);
                        
                        if (cached && (Date.now() - cached.timestamp < this.cacheTimeout)) {
                            if (cached.fieldInfo) {
                                fields.push(cached.fieldInfo);
                            }
                            return;
                        }

                        // Enhanced visibility and accessibility checks
                        if (!this.isFieldFillable(element)) {
                            // Cache negative result
                            this.fieldCache.set(cacheKey, {
                                fieldInfo: null,
                                timestamp: Date.now()
                            });
                            return;
                        }

                        const fieldInfo = this.extractFieldInfo(element);
                        
                        // Cache the result
                        this.fieldCache.set(cacheKey, {
                            fieldInfo: fieldInfo,
                            timestamp: Date.now()
                        });

                        if (fieldInfo) {
                            fields.push(fieldInfo);
                        }
                    } catch (elementError) {
                        this.debugLog('warn', 'Error processing form element:', elementError);
                        // Continue with other elements
                    }
                });

                // Yield control to prevent blocking
                if (i + batchSize < allElements.length) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }

            // Add dynamic form detection for SPAs
            this.detectDynamicFields(fields);

            this.debugLog('info', `Form field detection completed. Found ${fields.length} fillable fields`);
            return fields;
        } catch (error) {
            this.debugLog('error', 'Error detecting form fields:', error);
            throw new Error('Form field detection failed');
        }
    }

    isFieldFillable(element) {
        try {
            // Check if element exists and is an input element
            if (!element || !element.tagName) {
                return false;
            }

            // Enhanced visibility checks for dynamic forms
            if (!this.isElementVisible(element)) {
                return false;
            }

            // Skip disabled or readonly fields
            if (element.disabled || element.readOnly) {
                return false;
            }

            // Skip fields with certain attributes that indicate they shouldn't be filled
            if (element.hasAttribute('data-no-autofill') || 
                element.hasAttribute('autocomplete') && element.getAttribute('autocomplete') === 'off') {
                return false;
            }

            // Skip password fields for security
            if (element.type === 'password') {
                return false;
            }

            // Special handling for radio buttons and checkboxes
            if (element.type === 'radio' || element.type === 'checkbox') {
                return this.isSelectableFieldFillable(element);
            }

            return true;
        } catch (error) {
            console.warn('Error checking if field is fillable:', error);
            return false;
        }
    }

    extractFieldInfo(element) {
        try {
            if (!element) {
                throw new Error('Element is null or undefined');
            }

            const info = {
                element: element,
                name: element.name || '',
                id: element.id || '',
                placeholder: element.placeholder || '',
                type: element.type || 'text',
                labels: [],
                options: [], // For select dropdowns
                value: element.value || '',
                className: element.className || '',
                dataAttributes: this.extractDataAttributes(element)
            };

            // Enhanced label detection for job portals
            this.extractLabelsAdvanced(element, info);

            // Extract options for select elements
            if (element.tagName === 'SELECT') {
                info.options = Array.from(element.options).map(option => ({
                    value: option.value,
                    text: option.textContent.trim()
                }));
            }

            // Extract radio button group information
            if (element.type === 'radio') {
                info.radioGroup = this.extractRadioGroupInfo(element);
            }

            return info;
        } catch (error) {
            console.error('Error extracting field info:', error);
            return null;
        }
    }

    findNearbyLabels(element) {
        const labels = [];
        
        // Check parent for label
        let parent = element.parentElement;
        while (parent && parent.tagName !== 'FORM') {
            if (parent.tagName === 'LABEL') {
                labels.push(parent.textContent.trim());
                break;
            }
            
            // Look for label siblings
            const labelSibling = parent.querySelector('label');
            if (labelSibling) {
                labels.push(labelSibling.textContent.trim());
            }
            
            parent = parent.parentElement;
        }

        // Check previous siblings for text content
        let sibling = element.previousElementSibling;
        let siblingCount = 0;
        while (sibling && siblingCount < 3) {
            if (sibling.tagName === 'LABEL' || sibling.textContent.trim()) {
                const text = sibling.textContent.trim();
                if (text.length > 0 && text.length < 100) {
                    labels.push(text);
                }
            }
            sibling = sibling.previousElementSibling;
            siblingCount++;
        }

        return labels.filter(label => label.length > 0);
    }

    matchFieldsToData(formFields, data) {
        this.debugLog('debug', `Starting field matching for ${formFields.length} fields`);
        const matches = [];
        const matchingStats = {
            totalFields: formFields.length,
            matchedFields: 0,
            highConfidenceMatches: 0,
            mediumConfidenceMatches: 0,
            lowConfidenceMatches: 0
        };

        // Pre-process data keys for faster lookup
        const dataKeys = Object.keys(data);
        const customFieldKeys = data.customFields ? Object.keys(data.customFields) : [];
        
        this.debugLog('debug', 'Available data keys:', { dataKeys, customFieldKeys });

        formFields.forEach((field, index) => {
            try {
                const bestMatch = this.findBestMatch(field, data);
                if (bestMatch) {
                    matches.push({
                        field: field,
                        dataKey: bestMatch.key,
                        value: bestMatch.value,
                        confidence: bestMatch.confidence
                    });

                    matchingStats.matchedFields++;
                    
                    // Categorize by confidence level
                    if (bestMatch.confidence >= 0.8) {
                        matchingStats.highConfidenceMatches++;
                    } else if (bestMatch.confidence >= 0.5) {
                        matchingStats.mediumConfidenceMatches++;
                    } else {
                        matchingStats.lowConfidenceMatches++;
                    }

                    if (this.debugConfig.logFieldMatching) {
                        this.debugLog('debug', `Field matched:`, {
                            fieldName: field.name || field.id,
                            dataKey: bestMatch.key,
                            confidence: bestMatch.confidence.toFixed(3),
                            value: bestMatch.value?.substring(0, 50) + (bestMatch.value?.length > 50 ? '...' : '')
                        });
                    }
                }
            } catch (matchError) {
                this.debugLog('warn', `Error matching field ${index}:`, matchError);
            }
        });

        // Sort by confidence (highest first) for optimal filling order
        matches.sort((a, b) => b.confidence - a.confidence);

        this.debugLog('info', 'Field matching completed:', matchingStats);
        
        return matches;
    }

    findBestMatch(field, data) {
        let bestMatch = null;
        let highestScore = 0;
        const minConfidenceThreshold = 0.3;

        // Create search text once for performance
        const searchText = this.createSearchText(field);
        
        // Early exit if no search text available
        if (!searchText) {
            return null;
        }

        // Check against predefined field mappings with optimized scoring
        for (const [dataKey, mapping] of Object.entries(this.fieldMappings)) {
            if (!data[dataKey] || typeof data[dataKey] !== 'string' || !data[dataKey].trim()) {
                continue;
            }

            const score = this.calculateMatchScoreOptimized(searchText, field, mapping);
            if (score > highestScore && score > minConfidenceThreshold) {
                highestScore = score;
                bestMatch = {
                    key: dataKey,
                    value: data[dataKey],
                    confidence: score
                };
                
                // Early exit for very high confidence matches
                if (score >= 0.95) {
                    break;
                }
            }
        }

        // Check against custom fields only if no high-confidence match found
        if (data.customFields && highestScore < 0.8) {
            for (const [customKey, customValue] of Object.entries(data.customFields)) {
                if (!customValue || typeof customValue !== 'string' || !customValue.trim()) {
                    continue;
                }

                const score = this.calculateCustomFieldScoreOptimized(searchText, customKey);
                if (score > highestScore && score > minConfidenceThreshold) {
                    highestScore = score;
                    bestMatch = {
                        key: customKey,
                        value: customValue,
                        confidence: score
                    };
                }
            }
        }

        return bestMatch;
    }

    createSearchText(field) {
        // Create and cache search text for performance
        const cacheKey = `searchText_${this.getCacheKey(field)}`;
        const cached = this.labelCache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp < this.cacheTimeout)) {
            return cached.searchText;
        }

        const searchText = [
            field.name || '',
            field.id || '',
            field.placeholder || '',
            field.className || '',
            ...(field.labels || []),
            ...Object.values(field.dataAttributes || {})
        ].join(' ').toLowerCase().trim();

        // Cache the result
        this.labelCache.set(cacheKey, {
            searchText: searchText,
            timestamp: Date.now()
        });

        return searchText;
    }

    calculateMatchScoreOptimized(searchText, field, mapping) {
        let score = 0;

        // Pre-compile regex patterns for better performance (cache them)
        const keywordPatterns = mapping.keywords.map(keyword => {
            const cacheKey = `regex_${keyword}`;
            let pattern = this.labelCache.get(cacheKey);
            
            if (!pattern || (Date.now() - pattern.timestamp > this.cacheTimeout)) {
                pattern = {
                    regex: new RegExp(`\\b${keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'),
                    exact: new RegExp(`^${keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
                    timestamp: Date.now()
                };
                this.labelCache.set(cacheKey, pattern);
            }
            
            return { keyword, ...pattern };
        });

        // Optimized keyword matching
        for (const { keyword, regex, exact } of keywordPatterns) {
            if (exact.test(field.name) || exact.test(field.id)) {
                score += 1.0; // Exact match gets highest score
                break; // Early exit for exact matches
            } else if (regex.test(searchText)) {
                score += 0.8;
            }
        }

        // Check job portal specific patterns with optimized regex
        if (mapping.jobPortalPatterns && score < 0.9) {
            for (const pattern of mapping.jobPortalPatterns) {
                if (searchText.includes(pattern.toLowerCase())) {
                    score += 0.9;
                    break; // Early exit
                }
            }
        }

        // Enhanced pattern matching for common job portal naming conventions
        if (score < 0.8) {
            const jobPortalScore = this.calculateJobPortalScoreOptimized(searchText, mapping);
            score += jobPortalScore;
        }

        // Check input type compatibility
        if (mapping.inputTypes.includes(field.type)) {
            score += 0.2;
        }

        // Optimized data attribute matching
        if (field.dataAttributes && score < 0.9) {
            for (const [key, value] of Object.entries(field.dataAttributes)) {
                const attrText = `${key} ${value}`.toLowerCase();
                for (const keyword of mapping.keywords) {
                    if (attrText.includes(keyword.toLowerCase())) {
                        score += 0.3;
                        break;
                    }
                }
                if (score >= 0.9) break;
            }
        }

        // Apply priority weighting
        score *= (4 - mapping.priority) / 3;

        return Math.min(score, 1.0);
    }

    calculateMatchScore(field, mapping) {
        // Legacy method - redirect to optimized version
        const searchText = this.createSearchText(field);
        return this.calculateMatchScoreOptimized(searchText, field, mapping);
    }

    calculateCustomFieldScoreOptimized(searchText, customKey) {
        const customKeyLower = customKey.toLowerCase();
        
        // Exact match check
        if (searchText.includes(customKeyLower)) {
            return 0.7;
        }

        // Optimized partial matching
        const words = customKeyLower.split(/[-_\s]+/).filter(word => word.length > 2); // Filter short words
        if (words.length === 0) return 0;

        let partialMatches = 0;
        for (const word of words) {
            if (searchText.includes(word)) {
                partialMatches++;
            }
        }

        return (partialMatches / words.length) * 0.5;
    }

    calculateCustomFieldScore(field, customKey) {
        // Legacy method - redirect to optimized version
        const searchText = this.createSearchText(field);
        return this.calculateCustomFieldScoreOptimized(searchText, customKey);
    }

    fillFields(matches) {
        let filledCount = 0;
        const errors = [];
        const fillStats = {
            totalMatches: matches.length,
            successfulFills: 0,
            failedFills: 0,
            skippedFills: 0
        };

        if (!Array.isArray(matches)) {
            throw new Error('Matches must be an array');
        }

        this.debugLog('debug', `Starting to fill ${matches.length} matched fields`);

        matches.forEach((match, index) => {
            try {
                if (!match || !match.field || !match.field.element) {
                    errors.push(`Match ${index}: Invalid match structure`);
                    return;
                }

                const element = match.field.element;
                const value = match.value;

                // Validate that element is still in DOM and fillable
                if (!document.contains(element)) {
                    errors.push(`Match ${index}: Element no longer in DOM`);
                    return;
                }

                if (!this.isFieldFillable(element)) {
                    errors.push(`Match ${index}: Element is no longer fillable`);
                    return;
                }

                // Validate value
                if (typeof value !== 'string') {
                    errors.push(`Match ${index}: Value must be a string`);
                    return;
                }

                // Handle different field types
                let filled = false;
                if (element.tagName === 'SELECT') {
                    filled = this.fillSelectField(element, value);
                } else if (element.type === 'radio') {
                    filled = this.fillRadioField(element, value);
                } else if (element.type === 'checkbox') {
                    filled = this.fillCheckboxField(element, value);
                } else {
                    filled = this.fillTextualField(element, value);
                }

                if (filled) {
                    filledCount++;
                    fillStats.successfulFills++;
                    
                    if (this.debugConfig.logFieldFilling) {
                        this.debugLog('debug', `Successfully filled field:`, {
                            fieldName: element.name || element.id,
                            fieldType: element.type,
                            dataKey: match.dataKey,
                            confidence: match.confidence.toFixed(3)
                        });
                    }
                } else {
                    fillStats.failedFills++;
                    errors.push(`Match ${index}: Failed to fill ${element.type} field`);
                }

            } catch (error) {
                fillStats.failedFills++;
                errors.push(`Match ${index}: Unexpected error - ${error.message}`);
                this.debugLog('warn', `Error filling field ${index}:`, error);
            }
        });

        // Log filling statistics
        this.debugLog('info', 'Field filling completed:', fillStats);

        // Log errors for debugging but don't throw unless no fields were filled
        if (errors.length > 0) {
            this.debugLog('warn', 'Field filling errors:', errors);
        }

        if (filledCount === 0 && matches.length > 0) {
            throw new Error(`Failed to fill any fields. Errors: ${errors.join(', ')}`);
        }

        return filledCount;
    }

    showToast(message, type) {
        try {
            // Validate inputs
            if (!message || typeof message !== 'string') {
                console.error('Invalid toast message');
                return;
            }

            const validTypes = ['success', 'error', 'warning', 'info'];
            const safeType = validTypes.includes(type) ? type : 'info';

            // Sanitize message to prevent XSS
            const sanitizedMessage = message.replace(/</g, '&lt;').replace(/>/g, '&gt;');

            // Remove existing toast
            const existingToast = document.getElementById('autofill-toast');
            if (existingToast) {
                try {
                    existingToast.remove();
                } catch (removeError) {
                    console.warn('Error removing existing toast:', removeError);
                }
            }

            // Check if document.body exists
            if (!document.body) {
                console.error('Document body not available for toast');
                return;
            }

            // Create toast element
            const toast = document.createElement('div');
            toast.id = 'autofill-toast';
            
            // Define colors for different types
            const colors = {
                success: '#4CAF50',
                error: '#f44336',
                warning: '#ff9800',
                info: '#2196F3'
            };

            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${colors[safeType]};
                color: white;
                padding: 12px 20px;
                border-radius: 6px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 2147483647;
                max-width: 300px;
                word-wrap: break-word;
                animation: slideIn 0.3s ease-out;
                pointer-events: auto;
                cursor: pointer;
            `;

            // Add animation keyframes if not already present
            if (!document.getElementById('autofill-toast-styles')) {
                try {
                    const style = document.createElement('style');
                    style.id = 'autofill-toast-styles';
                    style.textContent = `
                        @keyframes slideIn {
                            from { transform: translateX(100%); opacity: 0; }
                            to { transform: translateX(0); opacity: 1; }
                        }
                        @keyframes slideOut {
                            from { transform: translateX(0); opacity: 1; }
                            to { transform: translateX(100%); opacity: 0; }
                        }
                    `;
                    
                    if (document.head) {
                        document.head.appendChild(style);
                    } else {
                        document.documentElement.appendChild(style);
                    }
                } catch (styleError) {
                    console.warn('Error adding toast styles:', styleError);
                }
            }

            // Set message content safely
            toast.textContent = sanitizedMessage;

            // Add click to dismiss functionality
            toast.addEventListener('click', () => {
                try {
                    this.dismissToast(toast);
                } catch (clickError) {
                    console.warn('Error dismissing toast on click:', clickError);
                }
            });

            // Append to body
            document.body.appendChild(toast);

            // Auto-remove after duration based on type
            const duration = safeType === 'error' ? 5000 : 3000;
            setTimeout(() => {
                try {
                    this.dismissToast(toast);
                } catch (timeoutError) {
                    console.warn('Error auto-dismissing toast:', timeoutError);
                }
            }, duration);

        } catch (error) {
            console.error('Error showing toast:', error);
            // Fallback to console log if toast fails
            console.log(`Toast [${type}]: ${message}`);
        }
    }

    dismissToast(toast) {
        try {
            if (!toast || !toast.parentNode) {
                return;
            }

            toast.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                try {
                    if (toast.parentNode) {
                        toast.remove();
                    }
                } catch (removeError) {
                    console.warn('Error removing toast element:', removeError);
                }
            }, 300);
        } catch (error) {
            console.error('Error dismissing toast:', error);
        }
    }

    // Enhanced visibility detection for dynamic forms and SPAs with caching
    isElementVisible(element) {
        try {
            // Check cache first for performance
            const cacheKey = `visibility_${this.getCacheKey(element)}`;
            const cached = this.visibilityCache.get(cacheKey);
            
            if (cached && (Date.now() - cached.timestamp < 1000)) { // Shorter cache for visibility
                return cached.isVisible;
            }

            let isVisible = true;

            // Fast basic visibility checks first
            if (element.offsetParent === null || 
                element.style.display === 'none' || 
                element.style.visibility === 'hidden' ||
                element.hidden) {
                isVisible = false;
            } else {
                // Check if field is actually visible (has dimensions)
                const rect = element.getBoundingClientRect();
                if (rect.width === 0 || rect.height === 0) {
                    isVisible = false;
                } else {
                    // Check for opacity (only if needed)
                    const computedStyle = window.getComputedStyle(element);
                    if (computedStyle.opacity === '0') {
                        isVisible = false;
                    } else {
                        // Check if element is within viewport or scrollable container
                        const isInViewport = rect.top >= -100 && rect.left >= -100 && 
                                           rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + 1000 &&
                                           rect.right <= (window.innerWidth || document.documentElement.clientWidth) + 100;

                        // For SPAs, also check if element is in a visible tab/step
                        if (!isInViewport) {
                            isVisible = this.isElementInVisibleStep(element);
                        }
                    }
                }
            }

            // Cache the result
            this.visibilityCache.set(cacheKey, {
                isVisible: isVisible,
                timestamp: Date.now()
            });

            return isVisible;
        } catch (error) {
            this.debugLog('warn', 'Error checking element visibility:', error);
            return false;
        }
    }

    // Check if element is in a visible step of multi-step form
    isElementInVisibleStep(element) {
        try {
            let parent = element.parentElement;
            while (parent) {
                // Check for common step container patterns
                if (parent.classList.contains('step') || 
                    parent.classList.contains('tab-pane') ||
                    parent.classList.contains('form-step') ||
                    parent.hasAttribute('data-step')) {
                    
                    // Check if this step is active/visible
                    return parent.classList.contains('active') || 
                           parent.classList.contains('show') ||
                           parent.style.display !== 'none';
                }
                parent = parent.parentElement;
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    // Enhanced field fillability check for radio buttons and checkboxes
    isSelectableFieldFillable(element) {
        try {
            // For radio buttons, check if we can find a matching option
            if (element.type === 'radio') {
                const radioGroup = document.querySelectorAll(`input[name="${element.name}"]`);
                return radioGroup.length > 0;
            }

            // For checkboxes, they're generally fillable if visible
            if (element.type === 'checkbox') {
                return true;
            }

            return false;
        } catch (error) {
            return false;
        }
    }

    // Extract data attributes for better matching
    extractDataAttributes(element) {
        try {
            const dataAttrs = {};
            Array.from(element.attributes).forEach(attr => {
                if (attr.name.startsWith('data-')) {
                    dataAttrs[attr.name] = attr.value;
                }
            });
            return dataAttrs;
        } catch (error) {
            return {};
        }
    }

    // Enhanced label extraction for job portals
    extractLabelsAdvanced(element, info) {
        try {
            // Standard label extraction
            if (element.id) {
                const label = document.querySelector(`label[for="${element.id}"]`);
                if (label && label.textContent) {
                    const labelText = label.textContent.trim();
                    if (labelText.length > 0 && labelText.length < 200) {
                        info.labels.push(labelText);
                    }
                }
            }

            // Find nearby labels
            const nearbyLabels = this.findNearbyLabels(element);
            if (Array.isArray(nearbyLabels)) {
                info.labels.push(...nearbyLabels);
            }

            // Check aria-label
            const ariaLabel = element.getAttribute('aria-label');
            if (ariaLabel && ariaLabel.trim().length > 0 && ariaLabel.trim().length < 200) {
                info.labels.push(ariaLabel.trim());
            }

            // Check aria-labelledby
            const ariaLabelledBy = element.getAttribute('aria-labelledby');
            if (ariaLabelledBy) {
                const labelElement = document.getElementById(ariaLabelledBy);
                if (labelElement && labelElement.textContent) {
                    const labelText = labelElement.textContent.trim();
                    if (labelText.length > 0 && labelText.length < 200) {
                        info.labels.push(labelText);
                    }
                }
            }

            // Job portal specific label patterns
            this.extractJobPortalLabels(element, info);

        } catch (error) {
            console.warn('Error extracting labels:', error);
        }
    }

    // Extract job portal specific labels
    extractJobPortalLabels(element, info) {
        try {
            // Look for common job portal label patterns
            const container = element.closest('.form-group, .field-container, .input-group, .form-field, .question-container');
            if (container) {
                // Look for labels within the container
                const containerLabels = container.querySelectorAll('label, .label, .field-label, .question-text');
                containerLabels.forEach(label => {
                    if (label.textContent && label !== element) {
                        const labelText = label.textContent.trim();
                        if (labelText.length > 0 && labelText.length < 200) {
                            info.labels.push(labelText);
                        }
                    }
                });

                // Look for help text or descriptions
                const helpTexts = container.querySelectorAll('.help-text, .field-description, .hint, .description');
                helpTexts.forEach(help => {
                    if (help.textContent) {
                        const helpText = help.textContent.trim();
                        if (helpText.length > 0 && helpText.length < 100) {
                            info.labels.push(helpText);
                        }
                    }
                });
            }
        } catch (error) {
            console.warn('Error extracting job portal labels:', error);
        }
    }

    // Extract radio button group information
    extractRadioGroupInfo(element) {
        try {
            const radioGroup = document.querySelectorAll(`input[name="${element.name}"]`);
            return Array.from(radioGroup).map(radio => ({
                value: radio.value,
                label: this.getRadioLabel(radio),
                element: radio
            }));
        } catch (error) {
            return [];
        }
    }

    // Get label for a radio button
    getRadioLabel(radioElement) {
        try {
            // Check for associated label
            if (radioElement.id) {
                const label = document.querySelector(`label[for="${radioElement.id}"]`);
                if (label) return label.textContent.trim();
            }

            // Check parent label
            const parentLabel = radioElement.closest('label');
            if (parentLabel) {
                return parentLabel.textContent.replace(radioElement.value, '').trim();
            }

            // Check next sibling text
            if (radioElement.nextSibling && radioElement.nextSibling.nodeType === Node.TEXT_NODE) {
                return radioElement.nextSibling.textContent.trim();
            }

            return radioElement.value;
        } catch (error) {
            return radioElement.value || '';
        }
    }

    // Calculate job portal specific matching score - optimized version
    calculateJobPortalScoreOptimized(searchText, mapping) {
        try {
            let score = 0;

            // Pre-compiled patterns for better performance
            const jobPortalPatterns = [
                { test: () => searchText.includes('workday'), bonus: 0.2 },
                { test: () => searchText.includes('wd-input'), bonus: 0.3 },
                { test: () => searchText.includes('greenhouse'), bonus: 0.2 },
                { test: () => searchText.includes('gh-input'), bonus: 0.3 },
                { test: () => searchText.includes('lever'), bonus: 0.2 },
                { test: () => searchText.includes('bamboo'), bonus: 0.2 },
                { test: () => searchText.includes('applicant'), bonus: 0.1 },
                { test: () => searchText.includes('candidate'), bonus: 0.1 },
                { test: () => searchText.includes('application'), bonus: 0.1 }
            ];

            // Early exit optimization
            for (const { test, bonus } of jobPortalPatterns) {
                if (test()) {
                    score += bonus;
                    if (score >= 0.5) break; // Early exit when max bonus reached
                }
            }

            return Math.min(score, 0.5); // Cap bonus at 0.5
        } catch (error) {
            this.debugLog('warn', 'Error calculating job portal score:', error);
            return 0;
        }
    }

    // Legacy method - redirect to optimized version
    calculateJobPortalScore(field, mapping) {
        const searchText = this.createSearchText(field);
        return this.calculateJobPortalScoreOptimized(searchText, mapping);
    }

    // Fill select dropdown field
    fillSelectField(selectElement, value) {
        try {
            // Try exact value match first
            for (let option of selectElement.options) {
                if (option.value === value || option.textContent.trim() === value) {
                    selectElement.value = option.value;
                    this.triggerChangeEvents(selectElement);
                    return true;
                }
            }

            // Try partial match
            const valueLower = value.toLowerCase();
            for (let option of selectElement.options) {
                if (option.textContent.toLowerCase().includes(valueLower) || 
                    option.value.toLowerCase().includes(valueLower)) {
                    selectElement.value = option.value;
                    this.triggerChangeEvents(selectElement);
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.warn('Error filling select field:', error);
            return false;
        }
    }

    // Fill radio button field
    fillRadioField(radioElement, value) {
        try {
            const radioGroup = document.querySelectorAll(`input[name="${radioElement.name}"]`);
            
            // Try exact value match
            for (let radio of radioGroup) {
                if (radio.value === value) {
                    radio.checked = true;
                    this.triggerChangeEvents(radio);
                    return true;
                }
            }

            // Try label match
            const valueLower = value.toLowerCase();
            for (let radio of radioGroup) {
                const label = this.getRadioLabel(radio);
                if (label.toLowerCase().includes(valueLower)) {
                    radio.checked = true;
                    this.triggerChangeEvents(radio);
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.warn('Error filling radio field:', error);
            return false;
        }
    }

    // Fill checkbox field
    fillCheckboxField(checkboxElement, value) {
        try {
            // Convert value to boolean
            const shouldCheck = value.toLowerCase() === 'true' || 
                              value.toLowerCase() === 'yes' || 
                              value === '1' ||
                              value.toLowerCase() === 'on';
            
            checkboxElement.checked = shouldCheck;
            this.triggerChangeEvents(checkboxElement);
            return true;
        } catch (error) {
            console.warn('Error filling checkbox field:', error);
            return false;
        }
    }

    // Fill textual field (input, textarea)
    fillTextualField(element, value) {
        try {
            // Check if field already has the same value
            if (element.value === value) {
                return true;
            }

            // Focus the element first (some forms require this)
            element.focus();
            
            // Clear existing value
            element.value = '';
            
            // Set new value
            element.value = value;
            
            // Trigger events
            this.triggerChangeEvents(element);

            // For React forms, also try setting the value property directly
            try {
                const descriptor = Object.getOwnPropertyDescriptor(element, 'value') || 
                                 Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value');
                if (descriptor && descriptor.set) {
                    descriptor.set.call(element, value);
                }
            } catch (reactError) {
                // This is expected for non-React forms
            }

            return true;
        } catch (error) {
            console.warn('Error filling textual field:', error);
            return false;
        }
    }

    // Trigger change events for different frameworks
    triggerChangeEvents(element) {
        try {
            const events = [
                new Event('input', { bubbles: true, cancelable: true }),
                new Event('change', { bubbles: true, cancelable: true }),
                new Event('blur', { bubbles: true, cancelable: true })
            ];

            events.forEach(event => {
                try {
                    element.dispatchEvent(event);
                } catch (eventError) {
                    console.warn(`Error dispatching ${event.type} event:`, eventError);
                }
            });
        } catch (error) {
            console.warn('Error triggering change events:', error);
        }
    }

    // Detect multi-step forms
    detectMultiStepForm() {
        try {
            // Look for common multi-step indicators
            const stepIndicators = document.querySelectorAll(
                '.step-indicator, .progress-bar, .stepper, .wizard-steps, ' +
                '[data-step], .tab-nav, .form-steps, .step-counter'
            );

            if (stepIndicators.length > 0) {
                this.formStepTracker.stepIndicators = Array.from(stepIndicators);
                this.formStepTracker.totalSteps = this.calculateTotalSteps();
                this.formStepTracker.currentStep = this.getCurrentStep();
            }

            // Look for next/previous buttons
            const navigationButtons = document.querySelectorAll(
                'button[class*="next"], button[class*="prev"], ' +
                'button[class*="continue"], button[class*="back"], ' +
                '.btn-next, .btn-prev, .next-step, .prev-step'
            );

            if (navigationButtons.length > 0) {
                this.formStepTracker.hasNavigation = true;
            }

        } catch (error) {
            console.warn('Error detecting multi-step form:', error);
        }
    }

    // Calculate total steps in multi-step form
    calculateTotalSteps() {
        try {
            // Try different methods to determine total steps
            const stepElements = document.querySelectorAll('.step, .tab-pane, [data-step]');
            if (stepElements.length > 0) {
                return stepElements.length;
            }

            // Look for step counters
            const stepCounter = document.querySelector('.step-counter, .progress-text');
            if (stepCounter) {
                const match = stepCounter.textContent.match(/(\d+)\s*\/\s*(\d+)/);
                if (match) {
                    return parseInt(match[2]);
                }
            }

            return 0;
        } catch (error) {
            return 0;
        }
    }

    // Get current step in multi-step form
    getCurrentStep() {
        try {
            // Look for active step
            const activeStep = document.querySelector('.step.active, .tab-pane.active, [data-step].active');
            if (activeStep) {
                const stepNumber = activeStep.getAttribute('data-step') || 
                                 activeStep.getAttribute('data-step-number');
                if (stepNumber) {
                    return parseInt(stepNumber);
                }
            }

            // Look for step counter
            const stepCounter = document.querySelector('.step-counter, .progress-text');
            if (stepCounter) {
                const match = stepCounter.textContent.match(/(\d+)\s*\/\s*(\d+)/);
                if (match) {
                    return parseInt(match[1]);
                }
            }

            return 1;
        } catch (error) {
            return 1;
        }
    }

    // Setup dynamic form detection for SPAs
    setupDynamicFormDetection() {
        try {
            // Create mutation observer for dynamic content
            this.formObserver = new MutationObserver((mutations) => {
                let shouldRedetect = false;
                
                mutations.forEach((mutation) => {
                    // Check if new form elements were added
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                const hasFormElements = node.querySelectorAll && 
                                    node.querySelectorAll('input, select, textarea').length > 0;
                                if (hasFormElements || node.tagName === 'FORM') {
                                    shouldRedetect = true;
                                }
                            }
                        });
                    }
                    
                    // Check if attributes changed (like class changes for step visibility)
                    if (mutation.type === 'attributes' && 
                        (mutation.attributeName === 'class' || 
                         mutation.attributeName === 'style' ||
                         mutation.attributeName.startsWith('data-'))) {
                        shouldRedetect = true;
                    }
                });

                if (shouldRedetect) {
                    // Debounce redetection
                    clearTimeout(this.redetectionTimeout);
                    this.redetectionTimeout = setTimeout(() => {
                        this.detectMultiStepForm();
                    }, 500);
                }
            });

            // Start observing
            this.formObserver.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'style', 'data-step', 'data-active']
            });

        } catch (error) {
            console.warn('Error setting up dynamic form detection:', error);
        }
    }

    // Detect dynamic fields for SPAs
    detectDynamicFields(fields) {
        try {
            // Look for fields that might be dynamically loaded
            const dynamicContainers = document.querySelectorAll(
                '[data-react-component], [data-vue-component], [data-angular-component], ' +
                '.react-component, .vue-component, .ng-component, ' +
                '[class*="dynamic"], [class*="lazy-load"]'
            );

            dynamicContainers.forEach(container => {
                const containerFields = container.querySelectorAll('input, select, textarea');
                containerFields.forEach(field => {
                    if (this.isFieldFillable(field)) {
                        const fieldInfo = this.extractFieldInfo(field);
                        if (fieldInfo && !fields.some(f => f.element === field)) {
                            fields.push(fieldInfo);
                        }
                    }
                });
            });

        } catch (error) {
            console.warn('Error detecting dynamic fields:', error);
        }
    }
}

// Initialize the autofill manager
const autofillManager = new AutofillManager();

// Expose performance metrics and debugging methods to global scope for debugging
if (autofillManager.debugConfig.enabled) {
    window.autofillDebug = {
        getMetrics: () => autofillManager.performanceMetrics,
        clearMetrics: () => {
            autofillManager.performanceMetrics = {
                formDetectionTime: 0,
                fieldMatchingTime: 0,
                fieldFillingTime: 0,
                totalOperationTime: 0,
                fieldsDetected: 0,
                fieldsMatched: 0,
                fieldsFilled: 0,
                operationCount: 0
            };
        },
        getCacheStats: () => ({
            fieldCache: autofillManager.fieldCache.size,
            labelCache: autofillManager.labelCache.size,
            visibilityCache: autofillManager.visibilityCache.size
        }),
        clearCaches: () => {
            autofillManager.fieldCache.clear();
            autofillManager.labelCache.clear();
            autofillManager.visibilityCache.clear();
        },
        setLogLevel: (level) => {
            autofillManager.debugConfig.logLevel = level;
        },
        enablePerformanceLogging: (enabled) => {
            autofillManager.debugConfig.logPerformance = enabled;
        },
        testFieldDetection: () => {
            const timer = autofillManager.startPerformanceTimer('testDetection');
            const fields = autofillManager.detectFormFields();
            autofillManager.endPerformanceTimer(timer);
            return {
                fieldsFound: fields.length,
                detectionTime: timer.duration,
                fields: fields.map(f => ({
                    name: f.name,
                    id: f.id,
                    type: f.type,
                    labels: f.labels
                }))
            };
        }
    };
    
    console.info('[AutofillManager] Debug mode enabled. Use window.autofillDebug for debugging tools.');
}