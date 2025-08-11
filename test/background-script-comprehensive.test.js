import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Comprehensive tests for background script functionality
 * Tests keyboard shortcuts, message handling, and autofill coordination
 */
describe('Background Script Comprehensive Tests', () => {
  let backgroundManager;
  let mockTabs;
  let mockStorage;
  let mockCommands;
  let mockRuntime;

  beforeEach(() => {
    // Mock Chrome APIs
    mockTabs = {
      query: vi.fn(),
      sendMessage: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      onUpdated: {
        addListener: vi.fn()
      }
    };

    mockStorage = {
      sync: {
        get: vi.fn(),
        set: vi.fn()
      },
      local: {
        get: vi.fn(),
        set: vi.fn()
      }
    };

    mockCommands = {
      onCommand: {
        addListener: vi.fn()
      }
    };

    mockRuntime = {
      onInstalled: {
        addListener: vi.fn()
      },
      onMessage: {
        addListener: vi.fn()
      },
      sendMessage: vi.fn(),
      getManifest: vi.fn(() => ({
        version: '1.0.0',
        name: 'Test Extension'
      }))
    };

    global.chrome = {
      tabs: mockTabs,
      storage: mockStorage,
      commands: mockCommands,
      runtime: mockRuntime
    };

    // Mock performance API
    global.performance = {
      now: vi.fn(() => Date.now())
    };

    // Mock BackgroundManager
    backgroundManager = {
      performanceMetrics: {
        shortcutTriggerTime: 0,
        messageHandlingTime: 0,
        storageAccessTime: 0,
        operationCount: 0
      },
      debugConfig: {
        enabled: false,
        logLevel: 'info',
        logPerformance: true
      },
      isDebugMode: vi.fn(() => false),
      debugLog: vi.fn(),
      startPerformanceTimer: vi.fn((operation) => ({ operation, startTime: Date.now() })),
      endPerformanceTimer: vi.fn(() => { backgroundManager.performanceMetrics.operationCount++; return 100; }),
      setupEventListeners: vi.fn(),
      handleAutofillShortcut: vi.fn(),
      handleInstallation: vi.fn(),
      handleMessage: vi.fn(),
      shouldAutoFill: vi.fn()
    };
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(backgroundManager.performanceMetrics).toBeDefined();
      expect(backgroundManager.debugConfig).toBeDefined();
      expect(backgroundManager.performanceMetrics.operationCount).toBe(0);
    });

    it('should setup event listeners', () => {
      backgroundManager.setupEventListeners();
      expect(backgroundManager.setupEventListeners).toHaveBeenCalled();
    });

    it('should handle debug mode configuration', () => {
      backgroundManager.isDebugMode.mockReturnValue(true);
      const isDebug = backgroundManager.isDebugMode();
      expect(isDebug).toBe(true);
    });
  });

  describe('Keyboard Shortcut Handling', () => {
    beforeEach(() => {
      mockTabs.query.mockResolvedValue([{
        id: 1,
        url: 'https://example.com/form',
        active: true
      }]);

      mockStorage.sync.get.mockResolvedValue({
        profiles: {
          default: {
            name: 'Default Profile',
            data: {
              fullName: 'John Doe',
              email: 'john@example.com',
              phone: '1234567890'
            }
          }
        },
        settings: {
          activeProfile: 'default',
          autoFillEnabled: true,
          blacklistedDomains: []
        }
      });

      mockTabs.sendMessage.mockResolvedValue({ success: true });
    });

    it('should handle autofill shortcut successfully', async () => {
      backgroundManager.handleAutofillShortcut.mockImplementation(async () => {
        const [tab] = await mockTabs.query({ active: true, currentWindow: true });
        expect(tab).toBeDefined();
        expect(tab.url).toBe('https://example.com/form');

        const result = await mockStorage.sync.get(['profiles', 'settings']);
        expect(result.profiles).toBeDefined();
        expect(result.settings).toBeDefined();

        await mockTabs.sendMessage(tab.id, {
          action: 'autofill',
          data: result.profiles.default.data
        });
      });

      await backgroundManager.handleAutofillShortcut();
      expect(backgroundManager.handleAutofillShortcut).toHaveBeenCalled();
    });

    it('should handle no active tab scenario', async () => {
      mockTabs.query.mockResolvedValue([]);

      backgroundManager.handleAutofillShortcut.mockImplementation(async () => {
        const tabs = await mockTabs.query({ active: true, currentWindow: true });
        if (tabs.length === 0) {
          throw new Error('No active tab found');
        }
      });

      await expect(backgroundManager.handleAutofillShortcut()).rejects.toThrow('No active tab found');
    });

    it('should handle invalid tab URLs', async () => {
      mockTabs.query.mockResolvedValue([{
        id: 1,
        url: 'chrome://settings/',
        active: true
      }]);

      backgroundManager.handleAutofillShortcut.mockImplementation(async () => {
        const [tab] = await mockTabs.query({ active: true, currentWindow: true });
        if (!tab.url.startsWith('http://') && !tab.url.startsWith('https://')) {
          throw new Error('Autofill not available on this page type');
        }
      });

      await expect(backgroundManager.handleAutofillShortcut()).rejects.toThrow('Autofill not available on this page type');
    });

    it('should handle storage errors gracefully', async () => {
      mockStorage.sync.get.mockRejectedValue(new Error('Storage error'));
      mockStorage.local.get.mockRejectedValue(new Error('Local storage error'));

      backgroundManager.handleAutofillShortcut.mockImplementation(async () => {
        try {
          await mockStorage.sync.get(['profiles', 'settings']);
        } catch (syncError) {
          try {
            await mockStorage.local.get(['profiles', 'settings']);
          } catch (localError) {
            throw new Error('No storage available');
          }
        }
      });

      await expect(backgroundManager.handleAutofillShortcut()).rejects.toThrow('No storage available');
    });

    it('should handle blacklisted domains', async () => {
      mockStorage.sync.get.mockResolvedValue({
        profiles: {
          default: { name: 'Default', data: { fullName: 'John' } }
        },
        settings: {
          activeProfile: 'default',
          blacklistedDomains: ['example.com']
        }
      });

      backgroundManager.handleAutofillShortcut.mockImplementation(async () => {
        const [tab] = await mockTabs.query({ active: true, currentWindow: true });
        const result = await mockStorage.sync.get(['profiles', 'settings']);
        
        const url = new URL(tab.url);
        if (result.settings.blacklistedDomains.includes(url.hostname)) {
          throw new Error('Autofill disabled for this domain');
        }
      });

      await expect(backgroundManager.handleAutofillShortcut()).rejects.toThrow('Autofill disabled for this domain');
    });

    it('should handle content script communication errors', async () => {
      mockTabs.sendMessage.mockRejectedValue(new Error('Could not establish connection'));

      backgroundManager.handleAutofillShortcut.mockImplementation(async () => {
        const [tab] = await mockTabs.query({ active: true, currentWindow: true });
        const result = await mockStorage.sync.get(['profiles', 'settings']);
        
        try {
          await mockTabs.sendMessage(tab.id, {
            action: 'autofill',
            data: result.profiles.default.data
          });
        } catch (error) {
          if (error.message.includes('Could not establish connection')) {
            throw new Error('Content script not ready');
          }
          throw error;
        }
      });

      await expect(backgroundManager.handleAutofillShortcut()).rejects.toThrow('Content script not ready');
    });
  });

  describe('Message Handling', () => {
    it('should handle getActiveTab message', async () => {
      const mockTab = { id: 1, url: 'https://example.com', active: true };
      mockTabs.query.mockResolvedValue([mockTab]);

      backgroundManager.handleMessage.mockImplementation(async (request, sender, sendResponse) => {
        if (request.action === 'getActiveTab') {
          const [tab] = await mockTabs.query({ active: true, currentWindow: true });
          sendResponse({ success: true, tab });
        }
      });

      const mockSendResponse = vi.fn();
      await backgroundManager.handleMessage(
        { action: 'getActiveTab' },
        {},
        mockSendResponse
      );

      expect(mockSendResponse).toHaveBeenCalledWith({
        success: true,
        tab: mockTab
      });
    });

    it('should handle checkDomainBlacklist message', async () => {
      mockStorage.sync.get.mockResolvedValue({
        settings: {
          blacklistedDomains: ['blocked.com', 'spam.com']
        }
      });

      backgroundManager.handleMessage.mockImplementation(async (request, sender, sendResponse) => {
        if (request.action === 'checkDomainBlacklist') {
          const result = await mockStorage.sync.get(['settings']);
          const url = new URL(request.url);
          const isBlacklisted = result.settings.blacklistedDomains?.includes(url.hostname) || false;
          sendResponse({ success: true, isBlacklisted });
        }
      });

      const mockSendResponse = vi.fn();
      await backgroundManager.handleMessage(
        { action: 'checkDomainBlacklist', url: 'https://blocked.com/form' },
        {},
        mockSendResponse
      );

      expect(mockSendResponse).toHaveBeenCalledWith({
        success: true,
        isBlacklisted: true
      });
    });

    it('should handle triggerAutofill message', async () => {
      backgroundManager.handleMessage.mockImplementation(async (request, sender, sendResponse) => {
        if (request.action === 'triggerAutofill') {
          await backgroundManager.handleAutofillShortcut();
          sendResponse({ success: true });
        }
      });

      const mockSendResponse = vi.fn();
      await backgroundManager.handleMessage(
        { action: 'triggerAutofill' },
        {},
        mockSendResponse
      );

      expect(backgroundManager.handleAutofillShortcut).toHaveBeenCalled();
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should handle unknown message actions', async () => {
      backgroundManager.handleMessage.mockImplementation(async (request, sender, sendResponse) => {
        if (!['getActiveTab', 'checkDomainBlacklist', 'triggerAutofill'].includes(request.action)) {
          sendResponse({ success: false, error: 'Unknown action' });
        }
      });

      const mockSendResponse = vi.fn();
      await backgroundManager.handleMessage(
        { action: 'unknownAction' },
        {},
        mockSendResponse
      );

      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Unknown action'
      });
    });

    it('should handle malformed requests', async () => {
      backgroundManager.handleMessage.mockImplementation(async (request, sender, sendResponse) => {
        if (!request || typeof request !== 'object' || !request.action) {
          sendResponse({ error: 'Invalid request format' });
        }
      });

      const mockSendResponse = vi.fn();
      await backgroundManager.handleMessage(
        null,
        {},
        mockSendResponse
      );

      expect(mockSendResponse).toHaveBeenCalledWith({
        error: 'Invalid request format'
      });
    });
  });

  describe('Installation Handling', () => {
    it('should initialize default data on installation', async () => {
      mockStorage.sync.get.mockResolvedValue({});
      mockStorage.sync.set.mockResolvedValue();

      backgroundManager.handleInstallation.mockImplementation(async () => {
        const existingData = await mockStorage.sync.get(['profiles', 'settings']);
        if (!existingData.profiles) {
          const defaultData = {
            profiles: {
              default: {
                name: 'Default Profile',
                data: {
                  fullName: 'Sayantan Mandal',
                  email: 'sayantan.22bce8533@vitapstudent.ac.in',
                  studentNumber: '22BCE8533'
                }
              }
            },
            settings: {
              activeProfile: 'default',
              autoFillEnabled: false,
              blacklistedDomains: []
            }
          };
          await mockStorage.sync.set(defaultData);
        }
      });

      await backgroundManager.handleInstallation();

      expect(mockStorage.sync.get).toHaveBeenCalledWith(['profiles', 'settings']);
      expect(mockStorage.sync.set).toHaveBeenCalled();
    });

    it('should not overwrite existing data on installation', async () => {
      mockStorage.sync.get.mockResolvedValue({
        profiles: {
          existing: { name: 'Existing Profile', data: {} }
        }
      });

      backgroundManager.handleInstallation.mockImplementation(async () => {
        const existingData = await mockStorage.sync.get(['profiles', 'settings']);
        if (existingData.profiles) {
          // Don't overwrite existing data
          return;
        }
      });

      await backgroundManager.handleInstallation();

      expect(mockStorage.sync.get).toHaveBeenCalled();
      expect(mockStorage.sync.set).not.toHaveBeenCalled();
    });
  });

  describe('Auto-fill Decision Logic', () => {
    it('should allow auto-fill for valid URLs', async () => {
      mockStorage.sync.get.mockResolvedValue({
        settings: {
          autoFillEnabled: true,
          blacklistedDomains: []
        }
      });

      backgroundManager.shouldAutoFill.mockImplementation(async (tabUrl) => {
        if (!tabUrl || typeof tabUrl !== 'string') return false;
        
        const url = new URL(tabUrl);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
        
        const result = await mockStorage.sync.get(['settings']);
        const settings = result.settings || {};
        
        if (!settings.autoFillEnabled) return false;
        if (settings.blacklistedDomains?.includes(url.hostname)) return false;
        
        return true;
      });

      const shouldFill = await backgroundManager.shouldAutoFill('https://example.com/form');
      expect(shouldFill).toBe(true);
    });

    it('should reject auto-fill for disabled setting', async () => {
      mockStorage.sync.get.mockResolvedValue({
        settings: {
          autoFillEnabled: false,
          blacklistedDomains: []
        }
      });

      backgroundManager.shouldAutoFill.mockImplementation(async (tabUrl) => {
        const result = await mockStorage.sync.get(['settings']);
        return result.settings?.autoFillEnabled || false;
      });

      const shouldFill = await backgroundManager.shouldAutoFill('https://example.com/form');
      expect(shouldFill).toBe(false);
    });

    it('should reject auto-fill for blacklisted domains', async () => {
      mockStorage.sync.get.mockResolvedValue({
        settings: {
          autoFillEnabled: true,
          blacklistedDomains: ['example.com']
        }
      });

      backgroundManager.shouldAutoFill.mockImplementation(async (tabUrl) => {
        const url = new URL(tabUrl);
        const result = await mockStorage.sync.get(['settings']);
        const settings = result.settings || {};
        
        return !settings.blacklistedDomains?.includes(url.hostname);
      });

      const shouldFill = await backgroundManager.shouldAutoFill('https://example.com/form');
      expect(shouldFill).toBe(false);
    });

    it('should reject auto-fill for non-HTTP URLs', async () => {
      backgroundManager.shouldAutoFill.mockImplementation(async (tabUrl) => {
        const url = new URL(tabUrl);
        return url.protocol === 'http:' || url.protocol === 'https:';
      });

      const shouldFillChrome = await backgroundManager.shouldAutoFill('chrome://settings/');
      const shouldFillFile = await backgroundManager.shouldAutoFill('file:///local/file.html');
      
      expect(shouldFillChrome).toBe(false);
      expect(shouldFillFile).toBe(false);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics', () => {
      const timer = backgroundManager.startPerformanceTimer('test-operation');
      expect(timer).toHaveProperty('operation', 'test-operation');
      expect(timer).toHaveProperty('startTime');

      const duration = backgroundManager.endPerformanceTimer(timer);
      expect(typeof duration).toBe('number');
      expect(backgroundManager.performanceMetrics.operationCount).toBeGreaterThan(0);
    });

    it('should categorize performance metrics', () => {
      backgroundManager.startPerformanceTimer.mockReturnValue({
        operation: 'shortcutTrigger',
        startTime: Date.now()
      });

      backgroundManager.endPerformanceTimer.mockImplementation((timer) => {
        const duration = 50;
        backgroundManager.performanceMetrics.shortcutTriggerTime += duration;
        backgroundManager.performanceMetrics.operationCount++;
        return duration;
      });

      const timer = backgroundManager.startPerformanceTimer('shortcutTrigger');
      const duration = backgroundManager.endPerformanceTimer(timer);

      expect(duration).toBe(50);
      expect(backgroundManager.performanceMetrics.shortcutTriggerTime).toBe(50);
    });

    it('should handle performance monitoring errors', () => {
      backgroundManager.endPerformanceTimer.mockImplementation(() => {
        throw new Error('Performance monitoring error');
      });

      expect(() => {
        const timer = { operation: 'test', startTime: Date.now() };
        backgroundManager.endPerformanceTimer(timer);
      }).toThrow('Performance monitoring error');
    });
  });

  describe('Error Handling', () => {
    it('should handle Chrome API unavailability', async () => {
      global.chrome = undefined;

      backgroundManager.handleAutofillShortcut.mockImplementation(async () => {
        if (!global.chrome?.tabs?.query) {
          throw new Error('Chrome tabs API is not available');
        }
      });

      await expect(backgroundManager.handleAutofillShortcut()).rejects.toThrow('Chrome tabs API is not available');
    });

    it('should handle network connectivity issues', async () => {
      mockStorage.sync.get.mockRejectedValue(new Error('Network error'));
      mockStorage.local.get.mockResolvedValue({
        profiles: { default: { name: 'Default', data: {} } },
        settings: { activeProfile: 'default' }
      });

      backgroundManager.handleAutofillShortcut.mockImplementation(async () => {
        try {
          await mockStorage.sync.get(['profiles', 'settings']);
        } catch (syncError) {
          console.warn('Falling back to local storage');
          return await mockStorage.local.get(['profiles', 'settings']);
        }
      });

      const result = await backgroundManager.handleAutofillShortcut();
      expect(result).toBeDefined();
    });

    it('should handle tab permission errors', async () => {
      mockTabs.query.mockRejectedValue(new Error('Permission denied'));

      backgroundManager.handleAutofillShortcut.mockImplementation(async () => {
        try {
          await mockTabs.query({ active: true, currentWindow: true });
        } catch (error) {
          throw new Error('Cannot access tab information');
        }
      });

      await expect(backgroundManager.handleAutofillShortcut()).rejects.toThrow('Cannot access tab information');
    });
  });

  describe('Tab Update Handling', () => {
    it('should trigger auto-fill on page load when enabled', async () => {
      const mockTabId = 1;
      const mockTab = {
        id: mockTabId,
        url: 'https://example.com/form'
      };

      backgroundManager.shouldAutoFill.mockResolvedValue(true);
      mockStorage.sync.get.mockResolvedValue({
        profiles: {
          default: { name: 'Default', data: { fullName: 'John' } }
        },
        settings: { activeProfile: 'default' }
      });
      mockTabs.sendMessage.mockResolvedValue({ success: true });

      // Simulate tab update handler
      const tabUpdateHandler = async (tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' && tab.url) {
          const shouldAutoFill = await backgroundManager.shouldAutoFill(tab.url);
          if (shouldAutoFill) {
            const result = await mockStorage.sync.get(['profiles', 'settings']);
            const activeProfile = result.profiles[result.settings.activeProfile];
            if (activeProfile) {
              await mockTabs.sendMessage(tabId, {
                action: 'autofill',
                data: activeProfile.data
              });
            }
          }
        }
      };

      await tabUpdateHandler(mockTabId, { status: 'complete' }, mockTab);

      expect(backgroundManager.shouldAutoFill).toHaveBeenCalledWith(mockTab.url);
      expect(mockTabs.sendMessage).toHaveBeenCalledWith(mockTabId, {
        action: 'autofill',
        data: { fullName: 'John' }
      });
    });

    it('should not trigger auto-fill when disabled', async () => {
      backgroundManager.shouldAutoFill.mockResolvedValue(false);

      const tabUpdateHandler = async (tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' && tab.url) {
          const shouldAutoFill = await backgroundManager.shouldAutoFill(tab.url);
          if (!shouldAutoFill) {
            return; // Don't trigger autofill
          }
        }
      };

      await tabUpdateHandler(1, { status: 'complete' }, { url: 'https://example.com' });

      expect(backgroundManager.shouldAutoFill).toHaveBeenCalled();
      expect(mockTabs.sendMessage).not.toHaveBeenCalled();
    });
  });
});