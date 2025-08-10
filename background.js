// Background service worker for Job Application Autofill extension
class BackgroundManager {
    constructor() {
        // Performance monitoring
        this.performanceMetrics = {
            shortcutTriggerTime: 0,
            messageHandlingTime: 0,
            storageAccessTime: 0,
            operationCount: 0
        };

        // Debug configuration
        this.debugConfig = {
            enabled: this.isDebugMode(),
            logLevel: 'info',
            logPerformance: true
        };

        this.setupEventListeners();
        this.debugLog('info', 'BackgroundManager initialized');
    }

    isDebugMode() {
        // Check if debug mode is enabled
        try {
            return chrome.storage && chrome.storage.local.get(['autofill_debug']).then(result => 
                result.autofill_debug === 'true'
            ).catch(() => false);
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
            const prefix = `[BackgroundManager ${timestamp}]`;
            
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
        return {
            operation,
            startTime: performance.now()
        };
    }

    endPerformanceTimer(timer) {
        const duration = performance.now() - timer.startTime;
        this.debugLog('debug', `${timer.operation} completed in ${duration.toFixed(2)}ms`);
        
        // Update metrics
        switch (timer.operation) {
            case 'shortcutTrigger':
                this.performanceMetrics.shortcutTriggerTime += duration;
                break;
            case 'messageHandling':
                this.performanceMetrics.messageHandlingTime += duration;
                break;
            case 'storageAccess':
                this.performanceMetrics.storageAccessTime += duration;
                break;
        }
        
        this.performanceMetrics.operationCount++;
        return duration;
    }

    setupEventListeners() {
        // Handle keyboard shortcuts
        chrome.commands.onCommand.addListener((command) => {
            if (command === 'autofill') {
                this.handleAutofillShortcut();
            }
        });

        // Handle extension installation
        chrome.runtime.onInstalled.addListener((details) => {
            if (details.reason === 'install') {
                this.handleInstallation();
            }
        });

        // Handle messages from popup and content scripts
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep message channel open for async responses
        });
    }

    async handleAutofillShortcut() {
        const timer = this.startPerformanceTimer('shortcutTrigger');
        
        try {
            this.debugLog('info', 'Handling autofill shortcut');
            
            // Check if chrome.tabs API is available
            if (!chrome?.tabs?.query) {
                this.debugLog('error', 'Chrome tabs API is not available');
                return;
            }

            // Get the active tab with timeout
            const tabPromise = chrome.tabs.query({ active: true, currentWindow: true });
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Tab query timeout')), 5000);
            });

            const [tab] = await Promise.race([tabPromise, timeoutPromise]);
            
            if (!tab) {
                this.debugLog('error', 'No active tab found');
                return;
            }

            this.debugLog('debug', 'Active tab found', { 
                tabId: tab.id, 
                url: tab.url?.substring(0, 100) 
            });

            // Validate tab properties
            if (!tab.url) {
                console.error('Tab URL is not accessible');
                return;
            }

            if (!tab.id || tab.id < 0) {
                console.error('Invalid tab ID');
                return;
            }

            // Check if the tab URL is valid (not chrome:// or extension pages)
            if (!tab.url.startsWith('http://') && !tab.url.startsWith('https://')) {
                console.log('Autofill not available on this page type:', tab.url);
                return;
            }

            // Load user data and settings with fallback
            let result;
            const storageTimer = this.startPerformanceTimer('storageAccess');
            try {
                if (chrome?.storage?.sync) {
                    result = await chrome.storage.sync.get(['profiles', 'settings']);
                } else if (chrome?.storage?.local) {
                    this.debugLog('warn', 'Using local storage fallback');
                    result = await chrome.storage.local.get(['profiles', 'settings']);
                } else {
                    throw new Error('No storage API available');
                }
            } catch (storageError) {
                this.debugLog('error', 'Storage access failed:', storageError);
                return;
            } finally {
                this.endPerformanceTimer(storageTimer);
            }

            const profiles = result.profiles || {};
            const settings = result.settings || { activeProfile: 'default' };
            
            // Validate profile data
            if (!profiles || typeof profiles !== 'object') {
                console.error('Invalid profiles data structure');
                return;
            }

            const activeProfile = profiles[settings.activeProfile];
            if (!activeProfile || !activeProfile.data) {
                console.error(`Active profile '${settings.activeProfile}' not found or has no data`);
                return;
            }

            // Check if domain is blacklisted
            let url;
            try {
                url = new URL(tab.url);
            } catch (urlError) {
                console.error('Invalid tab URL:', urlError);
                return;
            }

            if (settings.blacklistedDomains && 
                Array.isArray(settings.blacklistedDomains) && 
                settings.blacklistedDomains.includes(url.hostname)) {
                console.log('Autofill disabled for this domain:', url.hostname);
                return;
            }

            // Check if there's any data to fill
            const hasData = Object.values(activeProfile.data).some(value => {
                if (typeof value === 'string') return value.trim().length > 0;
                if (typeof value === 'object' && value !== null) {
                    return Object.values(value).some(v => typeof v === 'string' && v.trim().length > 0);
                }
                return false;
            });

            if (!hasData) {
                console.log('No data available to fill');
                return;
            }

            // Send autofill message to content script with timeout and error handling
            try {
                const messagePromise = chrome.tabs.sendMessage(tab.id, {
                    action: 'autofill',
                    data: activeProfile.data
                });

                const messageTimeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Message timeout')), 10000);
                });

                await Promise.race([messagePromise, messageTimeoutPromise]);
                this.debugLog('info', 'Autofill shortcut executed successfully');
            } catch (messageError) {
                this.debugLog('error', 'Failed to send autofill message:', messageError);
                
                // Provide specific error handling
                if (messageError.message.includes('Could not establish connection')) {
                    console.log('Content script not ready - page may need to be refreshed');
                } else if (messageError.message.includes('timeout')) {
                    console.log('Autofill operation timed out');
                }
            }

        } catch (error) {
            this.debugLog('error', 'Error handling autofill shortcut:', error);
        } finally {
            this.endPerformanceTimer(timer);
        }
    }

    async handleInstallation() {
        try {
            // Initialize default data structure with your information
            const defaultData = {
                profiles: {
                    default: {
                        name: "Default Profile",
                        data: {
                            fullName: "Sayantan Mandal",
                            email: "sayantan.22bce8533@vitapstudent.ac.in",
                            studentNumber: "22BCE8533",
                            phone: "6290464748",
                            tenthMarks: "95",
                            twelfthMarks: "75",
                            ugCgpa: "8.87",
                            gender: "Male",
                            campus: "VIT-AP",
                            leetcodeUrl: "https://leetcode.com/u/sayonara1337/",
                            linkedinUrl: "https://www.linkedin.com/in/sayantan-mandal-8a14b7202/",
                            githubUrl: "https://github.com/sayantanmandal1",
                            resumeUrl: "https://drive.google.com/file/d/1e_zGr0Ld9mUR9C1HLHjMGN8aV77l1jcO/view?usp=drive_link",
                            portfolioUrl: "https://d1grz986bewgw4.cloudfront.net/",
                            customFields: {}
                        }
                    }
                },
                settings: {
                    activeProfile: "default",
                    autoFillEnabled: false,
                    blacklistedDomains: [],
                    passwordProtected: false,
                    passwordHash: ""
                }
            };

            // Only set default data if no data exists
            const existingData = await chrome.storage.sync.get(['profiles', 'settings']);
            if (!existingData.profiles) {
                await chrome.storage.sync.set(defaultData);
                console.log('Extension installed with default data');
            }

        } catch (error) {
            console.error('Error during installation:', error);
        }
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            // Validate request structure
            if (!request || typeof request !== 'object' || !request.action) {
                sendResponse({ error: 'Invalid request format' });
                return;
            }

            switch (request.action) {
                case 'getActiveTab':
                    try {
                        if (!chrome?.tabs?.query) {
                            throw new Error('Chrome tabs API not available');
                        }
                        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                        sendResponse({ success: true, tab: tab || null });
                    } catch (tabError) {
                        console.error('Error getting active tab:', tabError);
                        sendResponse({ success: false, error: 'Failed to get active tab' });
                    }
                    break;

                case 'checkDomainBlacklist':
                    try {
                        if (!request.url || typeof request.url !== 'string') {
                            throw new Error('Invalid URL provided');
                        }

                        // Try sync storage first, fallback to local
                        let result;
                        try {
                            if (chrome?.storage?.sync) {
                                result = await chrome.storage.sync.get(['settings']);
                            } else if (chrome?.storage?.local) {
                                result = await chrome.storage.local.get(['settings']);
                            } else {
                                throw new Error('No storage API available');
                            }
                        } catch (storageError) {
                            console.error('Storage access failed:', storageError);
                            sendResponse({ success: false, error: 'Storage access failed' });
                            return;
                        }

                        const settings = result.settings || {};
                        
                        let url;
                        try {
                            url = new URL(request.url);
                        } catch (urlError) {
                            throw new Error('Invalid URL format');
                        }

                        const isBlacklisted = settings.blacklistedDomains && 
                                            Array.isArray(settings.blacklistedDomains) &&
                                            settings.blacklistedDomains.includes(url.hostname);
                        
                        sendResponse({ success: true, isBlacklisted: isBlacklisted });
                    } catch (blacklistError) {
                        console.error('Error checking domain blacklist:', blacklistError);
                        sendResponse({ success: false, error: blacklistError.message });
                    }
                    break;

                case 'triggerAutofill':
                    try {
                        await this.handleAutofillShortcut();
                        sendResponse({ success: true });
                    } catch (autofillError) {
                        console.error('Error triggering autofill:', autofillError);
                        sendResponse({ success: false, error: 'Autofill trigger failed' });
                    }
                    break;

                default:
                    console.log('Unknown message action:', request.action);
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ success: false, error: 'Message processing failed' });
        }
    }

    // Utility method to check if automatic autofill should be triggered
    async shouldAutoFill(tabUrl) {
        try {
            // Validate input
            if (!tabUrl || typeof tabUrl !== 'string') {
                console.error('Invalid tab URL provided');
                return false;
            }

            // Validate URL format
            let url;
            try {
                url = new URL(tabUrl);
            } catch (urlError) {
                console.error('Invalid URL format:', urlError);
                return false;
            }

            // Only allow HTTP/HTTPS URLs
            if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                return false;
            }

            // Get settings with fallback
            let result;
            try {
                if (chrome?.storage?.sync) {
                    result = await chrome.storage.sync.get(['settings']);
                } else if (chrome?.storage?.local) {
                    result = await chrome.storage.local.get(['settings']);
                } else {
                    console.error('No storage API available');
                    return false;
                }
            } catch (storageError) {
                console.error('Storage access failed:', storageError);
                return false;
            }

            const settings = result.settings || {};
            
            // Check if auto-fill is enabled
            if (!settings.autoFillEnabled) {
                return false;
            }

            // Check if domain is blacklisted
            if (settings.blacklistedDomains && 
                Array.isArray(settings.blacklistedDomains) && 
                settings.blacklistedDomains.includes(url.hostname)) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error checking auto-fill conditions:', error);
            return false;
        }
    }
}

// Initialize the background manager
const backgroundManager = new BackgroundManager();

// Handle tab updates for automatic autofill (if enabled)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // Only trigger on complete page loads
    if (changeInfo.status === 'complete' && tab.url) {
        try {
            // Check if automatic autofill should be triggered
            const shouldAutoFill = await backgroundManager.shouldAutoFill(tab.url);
            
            if (shouldAutoFill) {
                // Small delay to ensure page is fully loaded
                setTimeout(async () => {
                    try {
                        const result = await chrome.storage.sync.get(['profiles', 'settings']);
                        const profiles = result.profiles || {};
                        const settings = result.settings || { activeProfile: 'default' };
                        
                        const activeProfile = profiles[settings.activeProfile];
                        if (activeProfile) {
                            await chrome.tabs.sendMessage(tabId, {
                                action: 'autofill',
                                data: activeProfile.data
                            });
                        }
                    } catch (error) {
                        // Silently fail if content script is not ready or page doesn't support it
                        console.log('Auto-fill not triggered:', error.message);
                    }
                }, 1000);
            }
        } catch (error) {
            console.error('Error in tab update handler:', error);
        }
    }
});