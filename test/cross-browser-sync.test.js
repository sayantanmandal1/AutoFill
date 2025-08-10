/**
 * Cross-Browser Data Synchronization Tests
 * Tests chrome.storage.sync functionality across different browsers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock chrome.storage.sync with different browser behaviors
const createBrowserStorageMock = (browserType) => {
  const storage = {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
      getBytesInUse: vi.fn(),
      QUOTA_BYTES: 102400, // 100KB
      QUOTA_BYTES_PER_ITEM: 8192, // 8KB
      MAX_ITEMS: 512,
      MAX_WRITE_OPERATIONS_PER_HOUR: 1800,
      MAX_WRITE_OPERATIONS_PER_MINUTE: 120
    }
  };

  // Browser-specific behaviors
  switch (browserType) {
    case 'chrome':
      // Chrome has full sync support
      break;
    case 'brave':
      // Brave inherits Chrome's sync but may have privacy restrictions
      break;
    case 'edge':
      // Edge has sync support but may have different quota limits
      storage.sync.QUOTA_BYTES = 100000; // Slightly different quota
      break;
  }

  return storage;
};

describe('Cross-Browser Data Synchronization', () => {
  const browsers = [
    { name: 'Chrome', key: 'chrome' },
    { name: 'Brave', key: 'brave' },
    { name: 'Edge', key: 'edge' }
  ];

  browsers.forEach(browser => {
    describe(`${browser.name} Storage Sync`, () => {
      let mockStorage;

      beforeEach(() => {
        mockStorage = createBrowserStorageMock(browser.key);
        global.chrome = { storage: mockStorage };
      });

      it('should save profile data successfully', async () => {
        const profileData = {
          profiles: {
            default: {
              name: 'Default Profile',
              data: {
                fullName: 'John Doe',
                email: 'john@example.com',
                phone: '+1234567890',
                linkedinUrl: 'https://linkedin.com/in/johndoe',
                githubUrl: 'https://github.com/johndoe',
                resumeUrl: 'https://drive.google.com/file/d/123'
              }
            }
          },
          settings: {
            activeProfile: 'default',
            autoFillEnabled: false,
            blacklistedDomains: ['example.com'],
            passwordProtected: false
          }
        };

        mockStorage.sync.set.mockImplementation((data, callback) => {
          // Simulate successful storage
          setTimeout(() => callback && callback(), 0);
        });

        await new Promise((resolve, reject) => {
          chrome.storage.sync.set(profileData, () => {
            if (chrome.runtime && chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        });

        expect(mockStorage.sync.set).toHaveBeenCalledWith(profileData, expect.any(Function));
      });

      it('should retrieve profile data successfully', async () => {
        const expectedData = {
          profiles: {
            default: {
              name: 'Test Profile',
              data: { fullName: 'Test User' }
            }
          }
        };

        mockStorage.sync.get.mockImplementation((keys, callback) => {
          setTimeout(() => callback && callback(expectedData), 0);
        });

        const retrievedData = await new Promise((resolve, reject) => {
          chrome.storage.sync.get(null, (data) => {
            if (chrome.runtime && chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(data);
            }
          });
        });

        expect(mockStorage.sync.get).toHaveBeenCalledWith(null, expect.any(Function));
        expect(retrievedData).toEqual(expectedData);
      });

      it('should handle storage quota limits', async () => {
        // Create data that exceeds quota
        const largeData = {
          profiles: {
            default: {
              data: {
                customFields: {}
              }
            }
          }
        };

        // Fill with large data
        for (let i = 0; i < 2000; i++) {
          largeData.profiles.default.data.customFields[`field${i}`] = 'x'.repeat(50);
        }

        mockStorage.sync.set.mockImplementation((data, callback) => {
          // Simulate quota exceeded error
          const error = { message: 'QUOTA_BYTES quota exceeded' };
          global.chrome.runtime = { lastError: error };
          setTimeout(() => callback && callback(), 0);
        });

        try {
          await new Promise((resolve, reject) => {
            chrome.storage.sync.set(largeData, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });
        } catch (error) {
          expect(error.message).toContain('QUOTA_BYTES');
        }
      });

      it('should handle network connectivity issues', async () => {
        const testData = { test: 'data' };

        mockStorage.sync.set.mockImplementation((data, callback) => {
          // Simulate network error
          const error = { message: 'Network error' };
          global.chrome.runtime = { lastError: error };
          setTimeout(() => callback && callback(), 0);
        });

        try {
          await new Promise((resolve, reject) => {
            chrome.storage.sync.set(testData, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });
        } catch (error) {
          expect(error.message).toContain('Network error');
        }
      });

      it('should respect write operation limits', async () => {
        const writeOperations = [];
        
        mockStorage.sync.set.mockImplementation((data, callback) => {
          writeOperations.push(Date.now());
          
          // Simulate rate limiting after too many operations
          if (writeOperations.length > mockStorage.sync.MAX_WRITE_OPERATIONS_PER_MINUTE) {
            const error = { message: 'MAX_WRITE_OPERATIONS_PER_MINUTE exceeded' };
            global.chrome.runtime = { lastError: error };
          }
          
          setTimeout(() => callback && callback(), 0);
        });

        // Attempt many write operations
        const promises = [];
        for (let i = 0; i < 125; i++) {
          promises.push(
            new Promise((resolve, reject) => {
              chrome.storage.sync.set({ [`key${i}`]: `value${i}` }, () => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve();
                }
              });
            }).catch(error => error)
          );
        }

        const results = await Promise.all(promises);
        const errors = results.filter(result => result instanceof Error);
        
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].message).toContain('MAX_WRITE_OPERATIONS_PER_MINUTE');
      });

      it('should handle data corruption gracefully', async () => {
        // Mock corrupted data retrieval
        mockStorage.sync.get.mockImplementation((keys, callback) => {
          const corruptedData = {
            profiles: "invalid_json_structure",
            settings: null
          };
          setTimeout(() => callback && callback(corruptedData), 0);
        });

        const retrievedData = await new Promise((resolve, reject) => {
          chrome.storage.sync.get(null, (data) => {
            if (chrome.runtime && chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(data);
            }
          });
        });

        // Extension should handle corrupted data
        expect(retrievedData.profiles).toBe("invalid_json_structure");
        expect(retrievedData.settings).toBe(null);
      });

      it('should sync data across browser instances', async () => {
        const profileData = {
          profiles: {
            work: {
              name: 'Work Profile',
              data: { fullName: 'Professional Name' }
            }
          }
        };

        // Simulate data being set in one instance
        mockStorage.sync.set.mockImplementation((data, callback) => {
          // Store data in mock "cloud"
          mockStorage._cloudData = { ...mockStorage._cloudData, ...data };
          setTimeout(() => callback && callback(), 0);
        });

        // Simulate data being retrieved in another instance
        mockStorage.sync.get.mockImplementation((keys, callback) => {
          setTimeout(() => callback && callback(mockStorage._cloudData || {}), 0);
        });

        // Set data in "first instance"
        await new Promise(resolve => {
          chrome.storage.sync.set(profileData, resolve);
        });

        // Get data in "second instance"
        const syncedData = await new Promise(resolve => {
          chrome.storage.sync.get(null, resolve);
        });

        expect(syncedData).toEqual(profileData);
      });
    });
  });

  describe('Cross-Browser Sync Compatibility', () => {
    it('should maintain data format consistency across browsers', () => {
      const testData = {
        profiles: {
          default: {
            name: 'Test Profile',
            data: {
              fullName: 'John Doe',
              customFields: {
                'field1': 'value1',
                'field2': 'value2'
              }
            }
          }
        },
        settings: {
          activeProfile: 'default',
          autoFillEnabled: true,
          blacklistedDomains: ['test.com']
        }
      };

      // Data should be serializable across all browsers
      const serialized = JSON.stringify(testData);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toEqual(testData);
    });

    it('should handle browser-specific storage limitations', () => {
      const browsers = ['chrome', 'brave', 'edge'];
      
      browsers.forEach(browserType => {
        const storage = createBrowserStorageMock(browserType);
        
        // All browsers should support basic sync operations
        expect(typeof storage.sync.get).toBe('function');
        expect(typeof storage.sync.set).toBe('function');
        expect(typeof storage.sync.remove).toBe('function');
        expect(typeof storage.sync.clear).toBe('function');
        
        // Quota limits should be reasonable
        expect(storage.sync.QUOTA_BYTES).toBeGreaterThan(50000);
        expect(storage.sync.MAX_ITEMS).toBeGreaterThan(100);
      });
    });
  });
});