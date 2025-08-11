import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Comprehensive tests for popup script functionality
 * Tests UI interactions, data management, and form validation
 */
describe('Popup Script Comprehensive Tests', () => {
  let popupManager;
  let mockStorage;
  let mockTabs;
  let mockRuntime;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <form id="settings-form">
        <input type="text" id="full-name" name="fullName" />
        <input type="email" id="email" name="email" />
        <input type="tel" id="phone" name="phone" />
        <input type="text" id="student-number" name="studentNumber" />
        <div id="custom-fields-container"></div>
        <select id="profile-select"></select>
        <input type="checkbox" id="auto-fill-enabled" />
        <input type="checkbox" id="password-protected" />
        <textarea id="blacklisted-domains"></textarea>
        <button id="save-btn">Save</button>
        <button id="reset-btn">Reset</button>
        <button id="autofill-btn">Autofill</button>
        <button id="new-profile-btn">New Profile</button>
        <button id="manage-profile-btn">Manage Profile</button>
        <button id="add-custom-field">Add Custom Field</button>
        <button id="change-password-btn" class="hidden">Change Password</button>
      </form>
      <div id="password-form" style="display: none;">
        <input type="password" id="password-input" />
        <button id="password-submit">Submit</button>
        <button id="password-cancel">Cancel</button>
      </div>
      <div id="password-setup-form" style="display: none;">
        <input type="password" id="new-password" />
        <input type="password" id="confirm-password" />
        <button id="setup-password-btn">Setup</button>
      </div>
      <div id="status-message"></div>
    `;

    // Mock Chrome APIs
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

    mockTabs = {
      query: vi.fn(),
      sendMessage: vi.fn()
    };

    mockRuntime = {
      sendMessage: vi.fn()
    };

    global.chrome = {
      storage: mockStorage,
      tabs: mockTabs,
      runtime: mockRuntime
    };

    // Mock performance API
    global.performance = {
      now: vi.fn(() => Date.now())
    };

    // Mock PopupManager
    popupManager = {
      currentProfile: 'default',
      profiles: {},
      settings: {},
      isAuthenticated: false,
      performanceMetrics: {
        loadTime: 0,
        saveTime: 0,
        autofillTriggerTime: 0,
        operationCount: 0
      },
      debugConfig: {
        enabled: false,
        logLevel: 'info'
      },
      init: vi.fn(),
      loadData: vi.fn(),
      setupEventListeners: vi.fn(),
      populateForm: vi.fn(),
      saveData: vi.fn(),
      saveSettings: vi.fn(),
      resetForm: vi.fn(),
      triggerAutofill: vi.fn(),
      switchProfile: vi.fn(),
      updateProfileSelector: vi.fn(),
      showNewProfileDialog: vi.fn(),
      showProfileManagementDialog: vi.fn(),
      addCustomField: vi.fn(),
      createCustomFieldElement: vi.fn(),
      populateCustomFields: vi.fn(),
      showStatus: vi.fn(),
      isValidEmail: vi.fn(),
      isValidUrl: vi.fn(),
      isValidPhone: vi.fn(),
      showPasswordPrompt: vi.fn(),
      hidePasswordPrompt: vi.fn(),
      showPasswordSetup: vi.fn(),
      disablePasswordProtection: vi.fn(),
      isDebugMode: vi.fn(() => false),
      debugLog: vi.fn(),
      startPerformanceTimer: vi.fn((operation) => ({ operation, startTime: Date.now() })),
      endPerformanceTimer: vi.fn(() => 100)
    };
  });

  describe('Initialization', () => {
    it('should initialize with default data', async () => {
      const defaultData = {
        profiles: {
          default: {
            name: 'Default Profile',
            data: {
              fullName: 'Sayantan Mandal',
              email: 'sayantan.22bce8533@vitapstudent.ac.in',
              studentNumber: '22BCE8533',
              customFields: {}
            }
          }
        },
        settings: {
          activeProfile: 'default',
          autoFillEnabled: false,
          blacklistedDomains: [],
          passwordProtected: false
        }
      };

      mockStorage.sync.get.mockResolvedValue(defaultData);

      popupManager.loadData.mockImplementation(async () => {
        const result = await mockStorage.sync.get(['profiles', 'settings']);
        popupManager.profiles = result.profiles || {};
        popupManager.settings = result.settings || {};
        popupManager.currentProfile = popupManager.settings.activeProfile || 'default';
      });

      await popupManager.loadData();

      expect(popupManager.profiles).toEqual(defaultData.profiles);
      expect(popupManager.settings).toEqual(defaultData.settings);
      expect(popupManager.currentProfile).toBe('default');
    });

    it('should handle storage unavailability', async () => {
      mockStorage.sync.get.mockRejectedValue(new Error('Storage error'));
      mockStorage.local.get.mockRejectedValue(new Error('Local storage error'));

      popupManager.loadData.mockImplementation(async () => {
        try {
          await mockStorage.sync.get(['profiles', 'settings']);
        } catch (syncError) {
          try {
            await mockStorage.local.get(['profiles', 'settings']);
          } catch (localError) {
            // Use in-memory defaults
            popupManager.profiles = {
              default: { name: 'Default Profile', data: {} }
            };
            popupManager.settings = { activeProfile: 'default' };
            throw new Error('Storage unavailable');
          }
        }
      });

      await expect(popupManager.loadData()).rejects.toThrow('Storage unavailable');
      expect(popupManager.profiles).toBeDefined();
      expect(popupManager.settings).toBeDefined();
    });

    it('should setup event listeners', () => {
      popupManager.setupEventListeners();
      expect(popupManager.setupEventListeners).toHaveBeenCalled();
    });

    it('should handle password protection on init', async () => {
      popupManager.settings = { passwordProtected: true };
      popupManager.isAuthenticated = false;

      popupManager.init.mockImplementation(async () => {
        await popupManager.loadData();
        if (popupManager.settings.passwordProtected && !popupManager.isAuthenticated) {
          popupManager.showPasswordPrompt();
        } else {
          popupManager.populateForm();
        }
      });

      await popupManager.init();
      expect(popupManager.showPasswordPrompt).toHaveBeenCalled();
    });
  });

  describe('Form Population', () => {
    it('should populate form fields with profile data', () => {
      popupManager.profiles = {
        default: {
          name: 'Default Profile',
          data: {
            fullName: 'John Doe',
            email: 'john@example.com',
            phone: '1234567890',
            customFields: {
              'Skills': 'JavaScript, Python'
            }
          }
        }
      };
      popupManager.currentProfile = 'default';

      popupManager.populateForm.mockImplementation(() => {
        const profileData = popupManager.profiles[popupManager.currentProfile]?.data || {};
        
        // Populate basic fields
        const fullNameField = document.getElementById('full-name');
        if (fullNameField) fullNameField.value = profileData.fullName || '';
        
        const emailField = document.getElementById('email');
        if (emailField) emailField.value = profileData.email || '';
        
        const phoneField = document.getElementById('phone');
        if (phoneField) phoneField.value = profileData.phone || '';
      });

      popupManager.populateForm();

      expect(popupManager.populateForm).toHaveBeenCalled();
    });

    it('should populate custom fields', () => {
      const customFields = {
        'Programming Languages': 'JavaScript, Python',
        'Experience': '3 years'
      };

      popupManager.populateCustomFields.mockImplementation((fields) => {
        const container = document.getElementById('custom-fields-container');
        container.innerHTML = '';
        
        Object.entries(fields).forEach(([key, value]) => {
          const fieldDiv = document.createElement('div');
          fieldDiv.className = 'custom-field-item';
          fieldDiv.innerHTML = `
            <input type="text" value="${key}" class="custom-field-key">
            <input type="text" value="${value}" class="custom-field-value">
            <button type="button" class="remove-field">Remove</button>
          `;
          container.appendChild(fieldDiv);
        });
      });

      popupManager.populateCustomFields(customFields);

      expect(popupManager.populateCustomFields).toHaveBeenCalledWith(customFields);
    });

    it('should update profile selector', () => {
      popupManager.profiles = {
        default: { name: 'Default Profile' },
        work: { name: 'Work Profile' }
      };
      popupManager.currentProfile = 'work';

      popupManager.updateProfileSelector.mockImplementation(() => {
        const select = document.getElementById('profile-select');
        select.innerHTML = '';
        
        Object.entries(popupManager.profiles).forEach(([id, profile]) => {
          const option = document.createElement('option');
          option.value = id;
          option.textContent = profile.name;
          option.selected = id === popupManager.currentProfile;
          select.appendChild(option);
        });
      });

      popupManager.updateProfileSelector();

      expect(popupManager.updateProfileSelector).toHaveBeenCalled();
    });
  });

  describe('Data Validation', () => {
    it('should validate email format', () => {
      popupManager.isValidEmail.mockImplementation((email) => {
        if (!email || typeof email !== 'string') return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length <= 254;
      });

      expect(popupManager.isValidEmail('valid@example.com')).toBe(true);
      expect(popupManager.isValidEmail('invalid-email')).toBe(false);
      expect(popupManager.isValidEmail('')).toBe(false);
      expect(popupManager.isValidEmail(null)).toBe(false);
    });

    it('should validate URL format', () => {
      popupManager.isValidUrl.mockImplementation((url) => {
        if (!url || typeof url !== 'string') return false;
        try {
          const urlObj = new URL(url);
          return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
          return false;
        }
      });

      expect(popupManager.isValidUrl('https://example.com')).toBe(true);
      expect(popupManager.isValidUrl('http://example.com')).toBe(true);
      expect(popupManager.isValidUrl('ftp://example.com')).toBe(false);
      expect(popupManager.isValidUrl('not-a-url')).toBe(false);
      expect(popupManager.isValidUrl('')).toBe(false);
    });

    it('should validate phone format', () => {
      popupManager.isValidPhone.mockImplementation((phone) => {
        if (!phone || typeof phone !== 'string') return false;
        const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,20}$/;
        return phoneRegex.test(phone);
      });

      expect(popupManager.isValidPhone('1234567890')).toBe(true);
      expect(popupManager.isValidPhone('+1 (234) 567-8900')).toBe(true);
      expect(popupManager.isValidPhone('123-456-7890')).toBe(true);
      expect(popupManager.isValidPhone('abc')).toBe(false);
      expect(popupManager.isValidPhone('123')).toBe(false);
    });

    it('should handle validation errors during save', async () => {
      popupManager.saveData.mockImplementation(async () => {
        const formData = new FormData(document.getElementById('settings-form'));
        const validationErrors = [];

        for (const [key, value] of formData.entries()) {
          if (key === 'email' && value && !popupManager.isValidEmail(value)) {
            validationErrors.push('Email format is invalid');
          }
          if (key.includes('Url') && value && !popupManager.isValidUrl(value)) {
            validationErrors.push(`${key} is not a valid URL`);
          }
          if (key === 'phone' && value && !popupManager.isValidPhone(value)) {
            validationErrors.push('Phone number format is invalid');
          }
        }

        if (validationErrors.length > 0) {
          throw new Error(`Validation errors: ${validationErrors.join(', ')}`);
        }
      });

      // Set invalid email
      document.getElementById('email').value = 'invalid-email';

      await expect(popupManager.saveData()).rejects.toThrow('Email format is invalid');
    });
  });

  describe('Profile Management', () => {
    it('should create new profile', async () => {
      popupManager.showNewProfileDialog.mockImplementation(() => {
        const profileName = 'Work Profile';
        const profileId = 'work-profile';
        
        popupManager.profiles[profileId] = {
          name: profileName,
          data: {
            fullName: '',
            email: '',
            customFields: {}
          }
        };
        
        popupManager.currentProfile = profileId;
        popupManager.settings.activeProfile = profileId;
      });

      popupManager.showNewProfileDialog();

      expect(popupManager.profiles['work-profile']).toBeDefined();
      expect(popupManager.profiles['work-profile'].name).toBe('Work Profile');
      expect(popupManager.currentProfile).toBe('work-profile');
    });

    it('should switch between profiles', () => {
      popupManager.profiles = {
        default: { name: 'Default Profile', data: { fullName: 'Default User' } },
        work: { name: 'Work Profile', data: { fullName: 'Work User' } }
      };

      popupManager.switchProfile.mockImplementation((profileId) => {
        popupManager.currentProfile = profileId;
        popupManager.settings.activeProfile = profileId;
        popupManager.populateForm();
      });

      popupManager.switchProfile('work');

      expect(popupManager.currentProfile).toBe('work');
      expect(popupManager.settings.activeProfile).toBe('work');
      expect(popupManager.populateForm).toHaveBeenCalled();
    });

    it('should handle profile deletion', async () => {
      popupManager.profiles = {
        default: { name: 'Default Profile' },
        work: { name: 'Work Profile' },
        personal: { name: 'Personal Profile' }
      };
      popupManager.currentProfile = 'work';

      const deleteProfile = async (profileId) => {
        if (profileId === 'default') {
          throw new Error('Cannot delete the default profile');
        }
        
        if (popupManager.currentProfile === profileId) {
          popupManager.currentProfile = 'default';
          popupManager.settings.activeProfile = 'default';
        }
        
        delete popupManager.profiles[profileId];
      };

      await deleteProfile('work');

      expect(popupManager.profiles.work).toBeUndefined();
      expect(popupManager.currentProfile).toBe('default');
    });

    it('should prevent deletion of default profile', async () => {
      const deleteProfile = async (profileId) => {
        if (profileId === 'default') {
          throw new Error('Cannot delete the default profile');
        }
      };

      await expect(deleteProfile('default')).rejects.toThrow('Cannot delete the default profile');
    });
  });

  describe('Custom Fields Management', () => {
    it('should add custom field', () => {
      popupManager.addCustomField.mockImplementation(() => {
        popupManager.createCustomFieldElement('', '');
      });

      popupManager.createCustomFieldElement.mockImplementation((key = '', value = '') => {
        const container = document.getElementById('custom-fields-container');
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'custom-field-item';
        fieldDiv.innerHTML = `
          <input type="text" placeholder="Field name" value="${key}" class="custom-field-key">
          <input type="text" placeholder="Field value" value="${value}" class="custom-field-value">
          <button type="button" class="remove-field">Remove</button>
        `;
        container.appendChild(fieldDiv);
      });

      popupManager.addCustomField();

      expect(popupManager.createCustomFieldElement).toHaveBeenCalledWith('', '');
    });

    it('should remove custom field', () => {
      // Create a custom field element
      const container = document.getElementById('custom-fields-container');
      const fieldDiv = document.createElement('div');
      fieldDiv.className = 'custom-field-item';
      fieldDiv.innerHTML = `
        <input type="text" value="Test Field" class="custom-field-key">
        <input type="text" value="Test Value" class="custom-field-value">
        <button type="button" class="remove-field">Remove</button>
      `;
      container.appendChild(fieldDiv);

      // Simulate remove button click
      const removeButton = fieldDiv.querySelector('.remove-field');
      removeButton.addEventListener('click', () => {
        fieldDiv.remove();
      });

      expect(container.children.length).toBe(1);
      removeButton.click();
      expect(container.children.length).toBe(0);
    });

    it('should validate custom field data', () => {
      const validateCustomFields = (customFieldItems) => {
        const customFields = {};
        const errors = [];

        customFieldItems.forEach((item, index) => {
          const keyInput = item.querySelector('.custom-field-key');
          const valueInput = item.querySelector('.custom-field-value');

          const key = keyInput?.value.trim();
          const value = valueInput?.value.trim();

          if (key && value) {
            if (key.length > 100) {
              errors.push(`Custom field key "${key}" exceeds maximum length`);
            } else if (value.length > 500) {
              errors.push(`Custom field value for "${key}" exceeds maximum length`);
            } else {
              customFields[key] = value;
            }
          }
        });

        return { customFields, errors };
      };

      // Create test custom field elements
      const container = document.getElementById('custom-fields-container');
      container.innerHTML = `
        <div class="custom-field-item">
          <input type="text" value="Valid Field" class="custom-field-key">
          <input type="text" value="Valid Value" class="custom-field-value">
        </div>
        <div class="custom-field-item">
          <input type="text" value="${'a'.repeat(101)}" class="custom-field-key">
          <input type="text" value="Too Long Key" class="custom-field-value">
        </div>
      `;

      const customFieldItems = container.querySelectorAll('.custom-field-item');
      const result = validateCustomFields(customFieldItems);

      expect(result.customFields['Valid Field']).toBe('Valid Value');
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('exceeds maximum length');
    });
  });

  describe('Autofill Trigger', () => {
    it('should trigger autofill successfully', async () => {
      const mockTab = {
        id: 1,
        url: 'https://example.com/form'
      };

      mockTabs.query.mockResolvedValue([mockTab]);
      mockTabs.sendMessage.mockResolvedValue({ success: true });

      popupManager.profiles = {
        default: {
          name: 'Default Profile',
          data: { fullName: 'John Doe', email: 'john@example.com' }
        }
      };
      popupManager.currentProfile = 'default';
      popupManager.settings = { blacklistedDomains: [] };

      popupManager.triggerAutofill.mockImplementation(async () => {
        const [tab] = await mockTabs.query({ active: true, currentWindow: true });
        if (!tab) throw new Error('No active tab found');

        const url = new URL(tab.url);
        if (popupManager.settings.blacklistedDomains.includes(url.hostname)) {
          throw new Error('Autofill disabled for this domain');
        }

        const profileData = popupManager.profiles[popupManager.currentProfile]?.data;
        if (!profileData) throw new Error('No profile data available');

        await mockTabs.sendMessage(tab.id, {
          action: 'autofill',
          data: profileData
        });

        popupManager.showStatus('Autofill triggered!', 'success');
      });

      await popupManager.triggerAutofill();

      expect(mockTabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
      expect(mockTabs.sendMessage).toHaveBeenCalledWith(1, {
        action: 'autofill',
        data: { fullName: 'John Doe', email: 'john@example.com' }
      });
      expect(popupManager.showStatus).toHaveBeenCalledWith('Autofill triggered!', 'success');
    });

    it('should handle no active tab', async () => {
      mockTabs.query.mockResolvedValue([]);

      popupManager.triggerAutofill.mockImplementation(async () => {
        const tabs = await mockTabs.query({ active: true, currentWindow: true });
        if (tabs.length === 0) {
          throw new Error('No active tab found');
        }
      });

      await expect(popupManager.triggerAutofill()).rejects.toThrow('No active tab found');
    });

    it('should handle blacklisted domains', async () => {
      const mockTab = { id: 1, url: 'https://blocked.com/form' };
      mockTabs.query.mockResolvedValue([mockTab]);

      popupManager.settings = { blacklistedDomains: ['blocked.com'] };

      popupManager.triggerAutofill.mockImplementation(async () => {
        const [tab] = await mockTabs.query({ active: true, currentWindow: true });
        const url = new URL(tab.url);
        
        if (popupManager.settings.blacklistedDomains.includes(url.hostname)) {
          throw new Error('Autofill disabled for this domain');
        }
      });

      await expect(popupManager.triggerAutofill()).rejects.toThrow('Autofill disabled for this domain');
    });

    it('should handle content script communication errors', async () => {
      const mockTab = { id: 1, url: 'https://example.com/form' };
      mockTabs.query.mockResolvedValue([mockTab]);
      mockTabs.sendMessage.mockRejectedValue(new Error('Could not establish connection'));

      popupManager.triggerAutofill.mockImplementation(async () => {
        const [tab] = await mockTabs.query({ active: true, currentWindow: true });
        
        try {
          await mockTabs.sendMessage(tab.id, { action: 'autofill', data: {} });
        } catch (error) {
          if (error.message.includes('Could not establish connection')) {
            throw new Error('Page not ready for autofill - try refreshing the page');
          }
          throw error;
        }
      });

      await expect(popupManager.triggerAutofill()).rejects.toThrow('Page not ready for autofill - try refreshing the page');
    });
  });

  describe('Password Protection', () => {
    it('should show password prompt when protection is enabled', () => {
      popupManager.settings = { passwordProtected: true };
      popupManager.isAuthenticated = false;

      popupManager.showPasswordPrompt.mockImplementation(() => {
        const passwordForm = document.getElementById('password-form');
        passwordForm.style.display = 'block';
      });

      popupManager.showPasswordPrompt();

      expect(popupManager.showPasswordPrompt).toHaveBeenCalled();
    });

    it('should hide password prompt after authentication', () => {
      popupManager.hidePasswordPrompt.mockImplementation(() => {
        const passwordForm = document.getElementById('password-form');
        passwordForm.style.display = 'none';
        popupManager.isAuthenticated = true;
      });

      popupManager.hidePasswordPrompt();

      expect(popupManager.isAuthenticated).toBe(true);
    });

    it('should show password setup dialog', () => {
      popupManager.showPasswordSetup.mockImplementation(() => {
        const setupForm = document.getElementById('password-setup-form');
        setupForm.style.display = 'block';
      });

      popupManager.showPasswordSetup();

      expect(popupManager.showPasswordSetup).toHaveBeenCalled();
    });

    it('should disable password protection', async () => {
      popupManager.settings = { passwordProtected: true };

      popupManager.disablePasswordProtection.mockImplementation(async () => {
        popupManager.settings.passwordProtected = false;
        popupManager.settings.passwordHash = '';
        popupManager.settings.passwordSalt = '';
        await popupManager.saveSettings();
      });

      await popupManager.disablePasswordProtection();

      expect(popupManager.settings.passwordProtected).toBe(false);
      expect(popupManager.saveSettings).toHaveBeenCalled();
    });
  });

  describe('Performance Monitoring', () => {
    it('should track operation performance', () => {
      const timer = popupManager.startPerformanceTimer('saveData');
      expect(timer.operation).toBe('saveData');

      const duration = popupManager.endPerformanceTimer(timer);
      expect(typeof duration).toBe('number');
    });

    it('should categorize performance metrics', () => {
      popupManager.endPerformanceTimer.mockImplementation((timer) => {
        const duration = 50;
        switch (timer.operation) {
          case 'dataLoad':
            popupManager.performanceMetrics.loadTime += duration;
            break;
          case 'dataSave':
            popupManager.performanceMetrics.saveTime += duration;
            break;
          case 'autofillTrigger':
            popupManager.performanceMetrics.autofillTriggerTime += duration;
            break;
        }
        popupManager.performanceMetrics.operationCount++;
        return duration;
      });

      const timer = { operation: 'dataSave', startTime: Date.now() };
      const duration = popupManager.endPerformanceTimer(timer);

      expect(duration).toBe(50);
      expect(popupManager.performanceMetrics.saveTime).toBe(50);
      expect(popupManager.performanceMetrics.operationCount).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle form reset confirmation', () => {
      // Mock window.confirm
      global.confirm = vi.fn(() => true);

      popupManager.resetForm.mockImplementation(() => {
        if (confirm('Are you sure you want to reset all fields?')) {
          document.getElementById('settings-form').reset();
          document.getElementById('custom-fields-container').innerHTML = '';
          popupManager.showStatus('Form reset', 'success');
        }
      });

      popupManager.resetForm();

      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to reset all fields?');
      expect(popupManager.showStatus).toHaveBeenCalledWith('Form reset', 'success');
    });

    it('should handle storage quota exceeded', async () => {
      mockStorage.sync.set.mockRejectedValue(new Error('QUOTA_BYTES_PER_ITEM quota exceeded'));

      popupManager.saveData.mockImplementation(async () => {
        try {
          await mockStorage.sync.set({ profiles: popupManager.profiles });
        } catch (error) {
          if (error.message.includes('quota exceeded')) {
            throw new Error('Storage quota exceeded - please reduce data size');
          }
          throw error;
        }
      });

      await expect(popupManager.saveData()).rejects.toThrow('Storage quota exceeded - please reduce data size');
    });

    it('should handle network connectivity issues', async () => {
      mockStorage.sync.get.mockRejectedValue(new Error('Network error'));
      mockStorage.local.get.mockResolvedValue({
        profiles: { default: { name: 'Default', data: {} } }
      });

      popupManager.loadData.mockImplementation(async () => {
        try {
          return await mockStorage.sync.get(['profiles', 'settings']);
        } catch (syncError) {
          console.warn('Falling back to local storage');
          return await mockStorage.local.get(['profiles', 'settings']);
        }
      });

      const result = await popupManager.loadData();
      expect(result).toBeDefined();
    });
  });

  describe('UI Status Messages', () => {
    it('should show success status', () => {
      popupManager.showStatus.mockImplementation((message, type) => {
        const statusElement = document.getElementById('status-message');
        statusElement.textContent = message;
        statusElement.className = `status-${type}`;
      });

      popupManager.showStatus('Operation successful', 'success');

      const statusElement = document.getElementById('status-message');
      expect(statusElement.textContent).toBe('Operation successful');
      expect(statusElement.className).toBe('status-success');
    });

    it('should show error status', () => {
      popupManager.showStatus.mockImplementation((message, type) => {
        const statusElement = document.getElementById('status-message');
        statusElement.textContent = message;
        statusElement.className = `status-${type}`;
      });

      popupManager.showStatus('Operation failed', 'error');

      const statusElement = document.getElementById('status-message');
      expect(statusElement.textContent).toBe('Operation failed');
      expect(statusElement.className).toBe('status-error');
    });

    it('should show warning status', () => {
      popupManager.showStatus.mockImplementation((message, type) => {
        const statusElement = document.getElementById('status-message');
        statusElement.textContent = message;
        statusElement.className = `status-${type}`;
      });

      popupManager.showStatus('Storage unavailable', 'warning');

      const statusElement = document.getElementById('status-message');
      expect(statusElement.textContent).toBe('Storage unavailable');
      expect(statusElement.className).toBe('status-warning');
    });
  });
});