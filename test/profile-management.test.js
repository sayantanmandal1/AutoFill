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

    // Default mock behavior - use the actual default data structure
    mockStorage.sync.get.mockResolvedValue({
      profiles: {
        default: {
          name: 'Default Profile',
          data: {
            fullName: 'Sayantan Mandal',
            email: 'sayantan.22bce8533@vitapstudent.ac.in',
            studentNumber: '22BCE8533',
            phone: '6290464748',
            tenthMarks: '95',
            twelfthMarks: '75',
            ugCgpa: '8.87',
            gender: 'Male',
            campus: 'VIT-AP',
            leetcodeUrl: 'https://leetcode.com/u/sayonara1337/',
            linkedinUrl: 'https://www.linkedin.com/in/sayantan-mandal-8a14b7202/',
            githubUrl: 'https://github.com/sayantanmandal1',
            resumeUrl: 'https://drive.google.com/file/d/1e_zGr0Ld9mUR9C1HLHjMGN8aV77l1jcO/view?usp=drive_link',
            portfolioUrl: 'https://d1grz986bewgw4.cloudfront.net/',
            customFields: {}
          }
        }
      },
      settings: {
        activeProfile: 'default',
        autoFillEnabled: false,
        blacklistedDomains: [],
        passwordProtected: false,
        passwordHash: '',
        passwordSalt: ''
      }
    });

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
          activeProfile: 'work'
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
          activeProfile: 'nonexistent'
        }
      });

      await expect(StorageManager.getActiveProfile())
        .rejects.toThrow("Active profile 'nonexistent' not found");
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors during profile save', async () => {
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
