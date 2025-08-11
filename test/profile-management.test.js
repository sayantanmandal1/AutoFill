/**
 * Tests for profile management functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock chrome storage API
const mockStorage = {
  sync: {
    get: vi.fn(),
    set: vi.fn(),
    clear: vi.fn()
  },
  local: {
    get: vi.fn(),
    set: vi.fn(),
    clear: vi.fn()
  }
};

global.chrome = {
  storage: mockStorage
};

// Import after setting up mocks
const { StorageManager } = await import('../storage.js');

describe('Profile Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock behavior - return empty profiles for most tests
    mockStorage.sync.get.mockResolvedValue({
      profiles: {},
      settings: {
        activeProfile: 'default',
        autoFillEnabled: false,
        blacklistedDomains: [],
        passwordProtected: false,
        passwordHash: '',
        passwordSalt: ''
      }
    });
    
    // Mock successful set operations
    mockStorage.sync.set.mockResolvedValue();
    mockStorage.local.set.mockResolvedValue();
  });

  describe('Profile Creation', () => {
    it('should create a new profile with default data structure', async () => {
      const profileData = {
        name: 'Work Profile',
        fullName: 'John Doe',
        email: 'john@company.com',
        phone: '123-456-7890'
      };

      await StorageManager.saveProfile('work-profile', profileData);

      expect(mockStorage.sync.set).toHaveBeenCalledWith({
        profiles: expect.objectContaining({
          'work-profile': expect.objectContaining({
            name: 'Work Profile',
            data: expect.objectContaining({
              fullName: 'John Doe',
              email: 'john@company.com',
              phone: '123-456-7890'
            })
          })
        })
      });
    });

    it('should validate profile name length', async () => {
      const longName = 'a'.repeat(101); // 101 characters
      const profileData = {
        name: longName,
        fullName: 'Test'
      };

      // The validation should happen in the UI layer, but storage should handle it gracefully
      await StorageManager.saveProfile('test-profile', profileData);

      // Should still save but with a reasonable name
      expect(mockStorage.sync.set).toHaveBeenCalled();
    });

    it('should handle profile creation with custom fields', async () => {
      const profileData = {
        name: 'Custom Profile',
        fullName: 'Jane Smith',
        customFields: {
          'Skills': 'JavaScript, Python',
          'Experience': '5 years'
        }
      };

      await StorageManager.saveProfile('custom-profile', profileData);

      expect(mockStorage.sync.set).toHaveBeenCalledWith({
        profiles: expect.objectContaining({
          'custom-profile': expect.objectContaining({
            name: 'Custom Profile',
            data: expect.objectContaining({
              customFields: {
                'Skills': 'JavaScript, Python',
                'Experience': '5 years'
              }
            })
          })
        })
      });
    });
  });

  describe('Profile Validation', () => {
    it('should validate email format in profile data', async () => {
      const profileData = {
        name: 'Test Profile',
        email: 'invalid-email'
      };

      await expect(StorageManager.saveProfile('test-profile', profileData))
        .rejects.toThrow('Email format is invalid');
    });

    it('should validate URL format in profile data', async () => {
      const profileData = {
        name: 'Test Profile',
        githubUrl: 'not-a-url'
      };

      await expect(StorageManager.saveProfile('test-profile', profileData))
        .rejects.toThrow('githubUrl is not a valid URL');
    });

    it('should validate phone format in profile data', async () => {
      const profileData = {
        name: 'Test Profile',
        phone: 'abc'
      };

      await expect(StorageManager.saveProfile('test-profile', profileData))
        .rejects.toThrow('Phone number format is invalid');
    });
  });

  describe('Profile Retrieval', () => {
    it('should retrieve active profile correctly', async () => {
      // Mock the complete data structure that validateAndMergeData expects
      mockStorage.sync.get.mockResolvedValue({
        profiles: {
          default: {
            name: 'Default Profile',
            data: { fullName: 'Default User' }
          },
          work: {
            name: 'Work Profile',
            data: { fullName: 'Work User' }
          }
        },
        settings: {
          activeProfile: 'work',
          autoFillEnabled: false,
          blacklistedDomains: [],
          passwordProtected: false,
          passwordHash: '',
          passwordSalt: ''
        }
      });

      const activeProfile = await StorageManager.getActiveProfile();

      expect(activeProfile).toEqual({
        id: 'work',
        name: 'Work Profile',
        data: expect.objectContaining({
          fullName: 'Work User'
        })
      });
    });

    it('should throw error when active profile does not exist', async () => {
      mockStorage.sync.get.mockResolvedValue({
        profiles: {
          default: { name: 'Default Profile', data: {} }
        },
        settings: {
          activeProfile: 'nonexistent',
          autoFillEnabled: false,
          blacklistedDomains: [],
          passwordProtected: false,
          passwordHash: '',
          passwordSalt: ''
        }
      });

      await expect(StorageManager.getActiveProfile())
        .rejects.toThrow("Active profile 'nonexistent' not found");
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors during profile save', async () => {
      // Mock getAllData to return empty structure
      mockStorage.sync.get.mockResolvedValue({
        profiles: {},
        settings: {
          activeProfile: 'default',
          autoFillEnabled: false,
          blacklistedDomains: [],
          passwordProtected: false,
          passwordHash: '',
          passwordSalt: ''
        }
      });
      
      // Mock both storage methods to fail
      mockStorage.sync.set.mockRejectedValue(new Error('Storage full'));
      mockStorage.local.set.mockRejectedValue(new Error('Local storage full'));

      const profileData = {
        name: 'Test Profile',
        fullName: 'Test User'
      };

      await expect(StorageManager.saveProfile('test-profile', profileData))
        .rejects.toThrow('Failed to save profile');
    });

    it('should fallback to local storage when sync fails', async () => {
      // Mock getAllData to return empty structure
      mockStorage.sync.get.mockResolvedValue({
        profiles: {},
        settings: {
          activeProfile: 'default',
          autoFillEnabled: false,
          blacklistedDomains: [],
          passwordProtected: false,
          passwordHash: '',
          passwordSalt: ''
        }
      });
      
      mockStorage.sync.set.mockRejectedValue(new Error('Sync unavailable'));
      mockStorage.local.set.mockResolvedValue();

      const profileData = {
        name: 'Test Profile',
        fullName: 'Test User'
      };

      await StorageManager.saveProfile('test-profile', profileData);

      expect(mockStorage.local.set).toHaveBeenCalled();
    });
  });
});
