import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageManager, PasswordManager, DEFAULT_PROFILE_DATA, DEFAULT_SETTINGS, DEFAULT_DATA_STRUCTURE } from '../storage.js';

describe('StorageManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize with default data structure when storage is empty', async () => {
      chrome.storage.sync.get.mockResolvedValue({});
      chrome.storage.sync.set.mockResolvedValue();

      const result = await StorageManager.initialize();

      expect(chrome.storage.sync.get).toHaveBeenCalledWith(null);
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(DEFAULT_DATA_STRUCTURE);
      expect(result).toEqual(DEFAULT_DATA_STRUCTURE);
    });

    it('should return existing data when storage has valid data', async () => {
      const existingData = {
        profiles: {
          default: {
            name: 'Default Profile',
            data: { ...DEFAULT_PROFILE_DATA, fullName: 'John Doe' }
          }
        },
        settings: { ...DEFAULT_SETTINGS }
      };

      chrome.storage.sync.get.mockResolvedValue(existingData);

      const result = await StorageManager.initialize();

      expect(chrome.storage.sync.get).toHaveBeenCalledWith(null);
      expect(chrome.storage.sync.set).not.toHaveBeenCalled();
      expect(result.profiles.default.data.fullName).toBe('John Doe');
    });

    it('should handle storage errors gracefully', async () => {
      chrome.storage.sync.get.mockRejectedValue(new Error('Storage error'));

      await expect(StorageManager.initialize()).rejects.toThrow('Storage initialization failed');
    });
  });

  describe('getAllData', () => {
    it('should return validated and merged data', async () => {
      const partialData = {
        profiles: {
          default: {
            name: 'Test Profile',
            data: { fullName: 'Jane Doe' }
          }
        }
      };

      chrome.storage.sync.get.mockResolvedValue(partialData);

      const result = await StorageManager.getAllData();

      expect(result.profiles.default.data.fullName).toBe('Jane Doe');
      expect(result.profiles.default.data.email).toBe(''); // Should be filled with default
      expect(result.settings).toEqual(DEFAULT_SETTINGS); // Should be filled with defaults
    });

    it('should handle storage retrieval errors', async () => {
      chrome.storage.sync.get.mockRejectedValue(new Error('Storage error'));

      await expect(StorageManager.getAllData()).rejects.toThrow('Failed to retrieve data: Storage is not accessible');
    });
  });

  describe('getActiveProfile', () => {
    it('should return active profile data', async () => {
      const data = {
        profiles: {
          default: {
            name: 'Default Profile',
            data: { fullName: 'John Doe', email: 'john@example.com' }
          },
          work: {
            name: 'Work Profile',
            data: { fullName: 'John Smith', email: 'john.smith@work.com' }
          }
        },
        settings: { ...DEFAULT_SETTINGS, activeProfile: 'work' }
      };

      // Mock both calls to chrome.storage.sync.get
      chrome.storage.sync.get.mockResolvedValue(data);

      const result = await StorageManager.getActiveProfile();

      expect(result.id).toBe('work');
      expect(result.name).toBe('Work Profile');
      expect(result.data.fullName).toBe('John Smith');
    });

    it('should throw error when active profile does not exist', async () => {
      const data = {
        profiles: {
          default: {
            name: 'Default Profile',
            data: { ...DEFAULT_PROFILE_DATA }
          }
        },
        settings: { ...DEFAULT_SETTINGS, activeProfile: 'nonexistent' }
      };

      // Mock both calls to chrome.storage.sync.get
      chrome.storage.sync.get.mockResolvedValue(data);

      await expect(StorageManager.getActiveProfile()).rejects.toThrow("Active profile 'nonexistent' not found");
    });
  });

  describe('saveProfile', () => {
    it('should save new profile data', async () => {
      const existingData = {
        profiles: {
          default: {
            name: 'Default Profile',
            data: { ...DEFAULT_PROFILE_DATA }
          }
        },
        settings: { ...DEFAULT_SETTINGS }
      };

      chrome.storage.sync.get.mockResolvedValue(existingData);
      chrome.storage.sync.set.mockResolvedValue();

      const profileData = {
        name: 'Work Profile',
        fullName: 'John Doe',
        email: 'john@work.com',
        phone: '123-456-7890'
      };

      await StorageManager.saveProfile('work', profileData);

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        profiles: {
          default: existingData.profiles.default,
          work: {
            name: 'Work Profile',
            data: {
              ...DEFAULT_PROFILE_DATA,
              fullName: 'John Doe',
              email: 'john@work.com',
              phone: '123-456-7890'
            }
          }
        }
      });
    });

    it('should update existing profile data', async () => {
      const existingData = {
        profiles: {
          default: {
            name: 'Default Profile',
            data: { ...DEFAULT_PROFILE_DATA, fullName: 'Old Name' }
          }
        },
        settings: { ...DEFAULT_SETTINGS }
      };

      chrome.storage.sync.get.mockResolvedValue(existingData);
      chrome.storage.sync.set.mockResolvedValue();

      const profileData = {
        fullName: 'New Name',
        email: 'new@email.com'
      };

      await StorageManager.saveProfile('default', profileData);

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        profiles: {
          default: {
            name: 'Default Profile',
            data: {
              ...DEFAULT_PROFILE_DATA,
              fullName: 'New Name',
              email: 'new@email.com'
            }
          }
        }
      });
    });

    it('should handle save errors gracefully', async () => {
      chrome.storage.sync.get.mockResolvedValue(DEFAULT_DATA_STRUCTURE);
      chrome.storage.sync.set.mockRejectedValue(new Error('Storage error'));
      chrome.storage.local.set.mockRejectedValue(new Error('Local storage error'));

      await expect(StorageManager.saveProfile('test', { fullName: 'Test' })).rejects.toThrow('Failed to save profile: Local storage error');
    });
  });

  describe('getSettings', () => {
    it('should return settings data', async () => {
      const data = {
        profiles: { default: { name: 'Default', data: DEFAULT_PROFILE_DATA } },
        settings: { ...DEFAULT_SETTINGS, autoFillEnabled: true }
      };

      chrome.storage.sync.get.mockResolvedValue(data);

      const result = await StorageManager.getSettings();

      expect(result.autoFillEnabled).toBe(true);
      expect(result.activeProfile).toBe('default');
    });
  });

  describe('saveSettings', () => {
    it('should save validated settings', async () => {
      chrome.storage.sync.get.mockResolvedValue(DEFAULT_DATA_STRUCTURE);
      chrome.storage.sync.set.mockResolvedValue();

      const newSettings = {
        autoFillEnabled: true,
        blacklistedDomains: ['example.com', 'test.com'],
        activeProfile: 'work'
      };

      await StorageManager.saveSettings(newSettings);

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        settings: {
          ...DEFAULT_SETTINGS,
          autoFillEnabled: true,
          blacklistedDomains: ['example.com', 'test.com'],
          activeProfile: 'work'
        }
      });
    });
  });

  describe('validateProfileData', () => {
    it('should validate and clean profile data', () => {
      const input = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: 1234567890, // Invalid type
        customFields: {
          'field1': 'value1',
          'field2': 123, // Invalid type
          123: 'invalid key' // Invalid key type
        },
        invalidField: 'should be ignored'
      };

      const result = StorageManager.validateProfileData(input);

      expect(result.fullName).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
      expect(result.phone).toBe(''); // Should be converted to empty string
      expect(result.customFields).toEqual({ 'field1': 'value1' });
      expect(result.invalidField).toBeUndefined();
    });
  });

  describe('validateSettings', () => {
    it('should validate and clean settings data', () => {
      const input = {
        activeProfile: 'work',
        autoFillEnabled: 'true', // String instead of boolean
        blacklistedDomains: ['valid.com', 123, 'another.com'], // Mixed types
        passwordProtected: 1, // Number instead of boolean
        invalidSetting: 'should be ignored'
      };

      const result = StorageManager.validateSettings(input);

      expect(result.activeProfile).toBe('work');
      expect(result.autoFillEnabled).toBe(true);
      expect(result.blacklistedDomains).toEqual(['valid.com', 'another.com']);
      expect(result.passwordProtected).toBe(true);
      expect(result.invalidSetting).toBeUndefined();
    });
  });

  describe('clearAll', () => {
    it('should clear all storage data', async () => {
      chrome.storage.sync.clear.mockResolvedValue();

      await StorageManager.clearAll();

      expect(chrome.storage.sync.clear).toHaveBeenCalled();
    });

    it('should handle clear errors gracefully', async () => {
      chrome.storage.sync.clear.mockRejectedValue(new Error('Clear error'));

      await expect(StorageManager.clearAll()).rejects.toThrow('Failed to clear storage');
    });
  });

  describe('Password Protection', () => {
    describe('setupPassword', () => {
      it('should setup password protection with hashed password', async () => {
        chrome.storage.sync.get.mockResolvedValue(DEFAULT_DATA_STRUCTURE);
        chrome.storage.sync.set.mockResolvedValue();

        await StorageManager.setupPassword('testpassword123');

        expect(chrome.storage.sync.set).toHaveBeenCalledWith({
          settings: expect.objectContaining({
            passwordProtected: true,
            passwordHash: expect.any(String),
            passwordSalt: expect.any(String)
          })
        });
      });

      it('should handle setup errors gracefully', async () => {
        chrome.storage.sync.get.mockRejectedValue(new Error('Storage error'));

        await expect(StorageManager.setupPassword('test')).rejects.toThrow('Failed to setup password protection');
      });
    });

    describe('verifyPassword', () => {
      it('should return true for correct password', async () => {
        const salt = 'testsalt123';
        const hash = await PasswordManager.hashPasswordWithSalt('testpassword', salt);

        const data = {
          ...DEFAULT_DATA_STRUCTURE,
          settings: {
            ...DEFAULT_SETTINGS,
            passwordProtected: true,
            passwordHash: hash,
            passwordSalt: salt
          }
        };

        chrome.storage.sync.get.mockResolvedValue(data);

        const result = await StorageManager.verifyPassword('testpassword');
        expect(result).toBe(true);
      });

      it('should return false for incorrect password', async () => {
        const salt = 'testsalt123';
        const hash = await PasswordManager.hashPasswordWithSalt('correctpassword', salt);

        const data = {
          ...DEFAULT_DATA_STRUCTURE,
          settings: {
            ...DEFAULT_SETTINGS,
            passwordProtected: true,
            passwordHash: hash,
            passwordSalt: salt
          }
        };

        chrome.storage.sync.get.mockResolvedValue(data);

        const result = await StorageManager.verifyPassword('wrongpassword');
        expect(result).toBe(false);
      });

      it('should return true when password protection is disabled', async () => {
        chrome.storage.sync.get.mockResolvedValue(DEFAULT_DATA_STRUCTURE);

        const result = await StorageManager.verifyPassword('anypassword');
        expect(result).toBe(true);
      });
    });

    describe('changePassword', () => {
      it('should change password when current password is correct', async () => {
        const salt = 'testsalt123';
        const hash = await PasswordManager.hashPasswordWithSalt('oldpassword', salt);

        const data = {
          ...DEFAULT_DATA_STRUCTURE,
          settings: {
            ...DEFAULT_SETTINGS,
            passwordProtected: true,
            passwordHash: hash,
            passwordSalt: salt
          }
        };

        chrome.storage.sync.get.mockResolvedValue(data);
        chrome.storage.sync.set.mockResolvedValue();

        const result = await StorageManager.changePassword('oldpassword', 'newpassword');

        expect(result).toBe(true);
        expect(chrome.storage.sync.set).toHaveBeenCalledWith({
          settings: expect.objectContaining({
            passwordHash: expect.any(String),
            passwordSalt: expect.any(String)
          })
        });
      });

      it('should return false when current password is incorrect', async () => {
        const salt = 'testsalt123';
        const hash = await PasswordManager.hashPasswordWithSalt('correctpassword', salt);

        const data = {
          ...DEFAULT_DATA_STRUCTURE,
          settings: {
            ...DEFAULT_SETTINGS,
            passwordProtected: true,
            passwordHash: hash,
            passwordSalt: salt
          }
        };

        chrome.storage.sync.get.mockResolvedValue(data);

        const result = await StorageManager.changePassword('wrongpassword', 'newpassword');
        expect(result).toBe(false);
      });
    });

    describe('disablePasswordProtection', () => {
      it('should disable password protection when password is correct', async () => {
        const salt = 'testsalt123';
        const hash = await PasswordManager.hashPasswordWithSalt('testpassword', salt);

        const data = {
          ...DEFAULT_DATA_STRUCTURE,
          settings: {
            ...DEFAULT_SETTINGS,
            passwordProtected: true,
            passwordHash: hash,
            passwordSalt: salt
          }
        };

        chrome.storage.sync.get.mockResolvedValue(data);
        chrome.storage.sync.set.mockResolvedValue();

        const result = await StorageManager.disablePasswordProtection('testpassword');

        expect(result).toBe(true);
        expect(chrome.storage.sync.set).toHaveBeenCalledWith({
          settings: expect.objectContaining({
            passwordProtected: false,
            passwordHash: '',
            passwordSalt: ''
          })
        });
      });

      it('should return false when password is incorrect', async () => {
        const salt = 'testsalt123';
        const hash = await PasswordManager.hashPasswordWithSalt('correctpassword', salt);

        const data = {
          ...DEFAULT_DATA_STRUCTURE,
          settings: {
            ...DEFAULT_SETTINGS,
            passwordProtected: true,
            passwordHash: hash,
            passwordSalt: salt
          }
        };

        chrome.storage.sync.get.mockResolvedValue(data);

        const result = await StorageManager.disablePasswordProtection('wrongpassword');
        expect(result).toBe(false);
      });
    });
  });

  describe('PasswordManager', () => {
    describe('hashPassword', () => {
      it('should hash password consistently', async () => {
        const password = 'testpassword123';
        const hash1 = await PasswordManager.hashPassword(password);
        const hash2 = await PasswordManager.hashPassword(password);

        expect(hash1).toBe(hash2);
        expect(hash1).toHaveLength(64); // SHA-256 produces 64 character hex string
      });
    });

    describe('verifyPassword', () => {
      it('should verify password against hash', async () => {
        const password = 'testpassword123';
        const hash = await PasswordManager.hashPassword(password);

        const isValid = await PasswordManager.verifyPassword(password, hash);
        expect(isValid).toBe(true);

        const isInvalid = await PasswordManager.verifyPassword('wrongpassword', hash);
        expect(isInvalid).toBe(false);
      });
    });

    describe('generateSalt', () => {
      it('should generate random salt', () => {
        const salt1 = PasswordManager.generateSalt();
        const salt2 = PasswordManager.generateSalt();

        expect(salt1).not.toBe(salt2);
        expect(salt1).toHaveLength(32); // 16 bytes = 32 hex characters
      });
    });

    describe('hashPasswordWithSalt', () => {
      it('should hash password with salt consistently', async () => {
        const password = 'testpassword';
        const salt = 'testsalt123';

        const hash1 = await PasswordManager.hashPasswordWithSalt(password, salt);
        const hash2 = await PasswordManager.hashPasswordWithSalt(password, salt);

        expect(hash1).toBe(hash2);
        expect(hash1).toHaveLength(64);
      });

      it('should produce different hashes for different salts', async () => {
        const password = 'testpassword';
        const salt1 = 'salt1';
        const salt2 = 'salt2';

        const hash1 = await PasswordManager.hashPasswordWithSalt(password, salt1);
        const hash2 = await PasswordManager.hashPasswordWithSalt(password, salt2);

        expect(hash1).not.toBe(hash2);
      });
    });
  });
});
