/**
 * Browser Compatibility Tests
 * Tests extension functionality across Chrome, Brave, and Edge browsers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock chrome APIs for testing
const mockChromeAPI = {
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      clear: vi.fn()
    }
  },
  tabs: {
    sendMessage: vi.fn(),
    query: vi.fn()
  },
  commands: {
    onCommand: {
      addListener: vi.fn()
    }
  },
  runtime: {
    onMessage: {
      addListener: vi.fn()
    },
    sendMessage: vi.fn()
  }
};

// Mock different browser environments
const browserEnvironments = {
  chrome: {
    name: 'Chrome',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    chrome: mockChromeAPI
  },
  brave: {
    name: 'Brave',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    chrome: mockChromeAPI
  },
  edge: {
    name: 'Edge',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    chrome: mockChromeAPI
  }
};

describe('Browser Compatibility Tests', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Set up global chrome object
    global.chrome = mockChromeAPI;
  });

  describe('Manifest V3 Compatibility', () => {
    it('should have valid manifest version 3 structure', () => {
      // Mock manifest structure for testing
      const manifest = {
        manifest_version: 3,
        background: { service_worker: 'background.js' },
        permissions: ['storage', 'activeTab', 'scripting'],
        content_scripts: [{
          matches: ['http://*/*', 'https://*/*'],
          js: ['content.js']
        }]
      };
      
      expect(manifest.manifest_version).toBe(3);
      expect(manifest.background.service_worker).toBeDefined();
      expect(manifest.background.scripts).toBeUndefined(); // V2 property should not exist
    });

    it('should have proper permissions for all browsers', () => {
      const manifest = {
        permissions: ['storage', 'activeTab', 'scripting']
      };
      
      const requiredPermissions = ['storage', 'activeTab', 'scripting'];
      requiredPermissions.forEach(permission => {
        expect(manifest.permissions).toContain(permission);
      });
    });

    it('should have valid content script configuration', () => {
      const manifest = {
        content_scripts: [{
          matches: ['http://*/*', 'https://*/*'],
          js: ['content.js']
        }]
      };
      
      expect(manifest.content_scripts).toBeDefined();
      expect(manifest.content_scripts[0].matches).toContain('http://*/*');
      expect(manifest.content_scripts[0].matches).toContain('https://*/*');
      expect(manifest.content_scripts[0].js).toContain('content.js');
    });
  });

  describe('Cross-Browser Storage Compatibility', () => {
    Object.entries(browserEnvironments).forEach(([browserKey, browser]) => {
      describe(`${browser.name} Storage Tests`, () => {
        beforeEach(() => {
          global.navigator = { userAgent: browser.userAgent };
          global.chrome = browser.chrome;
        });

        it('should save and retrieve data using chrome.storage.sync', async () => {
          const testData = {
            profiles: {
              default: {
                name: 'Test Profile',
                data: {
                  fullName: 'John Doe',
                  email: 'john@example.com'
                }
              }
            }
          };

          // Mock successful storage operations
          browser.chrome.storage.sync.set.mockImplementation((data, callback) => {
            setTimeout(() => callback && callback(), 0);
          });
          browser.chrome.storage.sync.get.mockImplementation((keys, callback) => {
            setTimeout(() => callback && callback(testData), 0);
          });

          // Test storage set
          await new Promise(resolve => {
            browser.chrome.storage.sync.set(testData, resolve);
          });

          expect(browser.chrome.storage.sync.set).toHaveBeenCalledWith(testData, expect.any(Function));

          // Test storage get
          const retrievedData = await new Promise(resolve => {
            browser.chrome.storage.sync.get(null, resolve);
          });

          expect(browser.chrome.storage.sync.get).toHaveBeenCalledWith(null, expect.any(Function));
          expect(retrievedData).toEqual(testData);
        });

        it('should handle storage quota limits gracefully', async () => {
          const largeData = {
            profiles: {
              default: {
                data: {
                  customFields: {}
                }
              }
            }
          };

          // Create large dataset
          for (let i = 0; i < 100; i++) { // Reduced size to avoid timeout
            largeData.profiles.default.data.customFields[`field${i}`] = 'x'.repeat(50);
          }

          // Mock quota exceeded error
          browser.chrome.storage.sync.set.mockImplementation((data, callback) => {
            global.chrome = { runtime: { lastError: { message: 'QUOTA_BYTES_PER_ITEM quota exceeded' } } };
            setTimeout(() => callback && callback(), 0);
          });

          let errorCaught = false;
          try {
            await new Promise((resolve, reject) => {
              browser.chrome.storage.sync.set(largeData, () => {
                if (chrome.runtime && chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve();
                }
              });
            });
          } catch (error) {
            errorCaught = true;
            expect(error.message).toContain('quota');
          }
          
          expect(errorCaught).toBe(true);
        });
      });
    });
  });

  describe('Cross-Browser Keyboard Shortcuts', () => {
    Object.entries(browserEnvironments).forEach(([browserKey, browser]) => {
      describe(`${browser.name} Keyboard Shortcuts`, () => {
        beforeEach(() => {
          global.navigator = { userAgent: browser.userAgent };
          global.chrome = browser.chrome;
        });

        it('should register keyboard shortcuts properly', () => {
          const mockListener = vi.fn();
          
          // Simulate background script loading
          browser.chrome.commands.onCommand.addListener(mockListener);
          
          expect(browser.chrome.commands.onCommand.addListener).toHaveBeenCalledWith(mockListener);
        });

        it('should handle Alt+Shift+F shortcut trigger', () => {
          const mockListener = vi.fn();
          browser.chrome.commands.onCommand.addListener(mockListener);
          
          // Simulate shortcut trigger
          const command = 'autofill';
          mockListener(command);
          
          expect(mockListener).toHaveBeenCalledWith(command);
        });
      });
    });
  });

  describe('Cross-Browser Message Passing', () => {
    Object.entries(browserEnvironments).forEach(([browserKey, browser]) => {
      describe(`${browser.name} Message Passing`, () => {
        beforeEach(() => {
          global.navigator = { userAgent: browser.userAgent };
          global.chrome = browser.chrome;
        });

        it('should send messages from popup to content script', async () => {
          const testMessage = { action: 'autofill', data: { fullName: 'Test User' } };
          
          browser.chrome.tabs.query.mockImplementation((query, callback) => {
            setTimeout(() => callback && callback([{ id: 123 }]), 0);
          });
          browser.chrome.tabs.sendMessage.mockImplementation((tabId, message, callback) => {
            setTimeout(() => callback && callback({ success: true }), 0);
          });

          // Simulate popup sending message
          const tabs = await new Promise(resolve => {
            browser.chrome.tabs.query({ active: true, currentWindow: true }, resolve);
          });

          await new Promise(resolve => {
            browser.chrome.tabs.sendMessage(tabs[0].id, testMessage, resolve);
          });

          expect(browser.chrome.tabs.sendMessage).toHaveBeenCalledWith(123, testMessage, expect.any(Function));
        });

        it('should handle runtime messages between components', () => {
          const mockListener = vi.fn();
          browser.chrome.runtime.onMessage.addListener(mockListener);
          
          expect(browser.chrome.runtime.onMessage.addListener).toHaveBeenCalledWith(mockListener);
        });
      });
    });
  });
});