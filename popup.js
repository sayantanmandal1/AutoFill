// Popup script for Job Application Autofill extension
class PopupManager {
  constructor() {
    this.currentProfile = 'default';
    this.profiles = {};
    this.settings = {};
    this.isAuthenticated = false;

    // Performance monitoring for popup operations
    this.performanceMetrics = {
      loadTime: 0,
      saveTime: 0,
      autofillTriggerTime: 0,
      operationCount: 0
    };

    // Debug configuration
    this.debugConfig = {
      enabled: this.isDebugMode(),
      logLevel: 'info',
      logPerformance: true
    };

    this.init();
  }

  isDebugMode() {
    try {
      return new URLSearchParams(window.location.search).has('debug') ||
                   localStorage.getItem('autofill_debug') === 'true';
    } catch (error) {
      return false;
    }
  }

  debugLog(level, message, data = null) {
    if (!this.debugConfig.enabled) {return;}

    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const currentLevel = levels[this.debugConfig.logLevel] || 1;
    const messageLevel = levels[level] || 1;

    if (messageLevel >= currentLevel) {
      const timestamp = new Date().toISOString();
      const prefix = `[PopupManager ${timestamp}]`;

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
      case 'dataLoad':
        this.performanceMetrics.loadTime += duration;
        break;
      case 'dataSave':
        this.performanceMetrics.saveTime += duration;
        break;
      case 'autofillTrigger':
        this.performanceMetrics.autofillTriggerTime += duration;
        break;
    }

    this.performanceMetrics.operationCount++;
    return duration;
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();

    // Check if password protection is enabled
    if (this.settings.passwordProtected && !this.isAuthenticated) {
      this.showPasswordPrompt();
    } else {
      this.populateForm();
    }
  }

  async loadData() {
    const timer = this.startPerformanceTimer('dataLoad');

    try {
      this.debugLog('info', 'Starting data load operation');

      // Check if chrome.storage is available
      if (!chrome?.storage?.sync) {
        throw new Error('Chrome storage API is not available');
      }

      const result = await chrome.storage.sync.get(['profiles', 'settings']);

      // Initialize default structure if not exists
      this.profiles = result.profiles || {
        default: {
          name: 'Default Profile',
          data: {
            fullName: '',
            email: '',
            personalEmail: 'msayantan05@gmail.com',
            studentNumber: '',
            phone: '',
            tenthMarks: '',
            twelfthMarks: '',
            ugCgpa: '',
            gender: '',
            campus: '',
            degree: 'B Tech',
            specialization: 'Computer Science and Engineering',
            dateOfBirth: '2004-03-08',
            leetcodeUrl: '',
            linkedinUrl: '',
            githubUrl: '',
            resumeUrl: 'https://drive.google.com/file/d/1YOHB-4UvI9zGhbTOa9wOkyPhYDCmAfbl/view?usp=drive_link',
            portfolioUrl: '',
            customFields: {}
          }
        }
      };

      this.settings = result.settings || {
        activeProfile: 'default',
        autoFillEnabled: false,
        blacklistedDomains: [],
        passwordProtected: false,
        passwordHash: '',
        passwordSalt: ''
      };

      // Validate that the active profile exists
      if (!this.profiles[this.settings.activeProfile]) {
        console.warn(`Active profile '${this.settings.activeProfile}' not found, defaulting to 'default'`);
        this.settings.activeProfile = 'default';
        this.saveSettings();
      }

      this.currentProfile = this.settings.activeProfile;

      this.debugLog('info', 'Data loaded successfully', {
        profileCount: Object.keys(this.profiles).length,
        activeProfile: this.currentProfile,
        settingsKeys: Object.keys(this.settings)
      });
    } catch (error) {
      this.debugLog('error', 'Error loading data:', error);

      // Try fallback to local storage
      try {
        if (chrome?.storage?.local) {
          console.warn('Falling back to local storage');
          const localResult = await chrome.storage.local.get(['profiles', 'settings']);
          this.profiles = localResult.profiles || this.getDefaultProfiles();
          this.settings = localResult.settings || this.getDefaultSettings();
          this.currentProfile = this.settings.activeProfile;
          this.showStatus('Using local storage (sync unavailable)', 'warning');
        } else {
          throw new Error('No storage method available');
        }
      } catch (fallbackError) {
        console.error('Fallback storage also failed:', fallbackError);
        // Use in-memory defaults as last resort
        this.profiles = this.getDefaultProfiles();
        this.settings = this.getDefaultSettings();
        this.currentProfile = 'default';
        this.showStatus('Storage unavailable - changes will not be saved', 'error');
      }
    } finally {
      this.endPerformanceTimer(timer);
    }
  }

  getDefaultProfiles() {
    return {
      default: {
        name: 'Default Profile',
        data: {
          fullName: 'Sayantan Mandal',
          email: 'sayantan.22bce8533@vitapstudent.ac.in',
          personalEmail: 'msayantan05@gmail.com',
          studentNumber: '22BCE8533',
          phone: '6290464748',
          tenthMarks: '95',
          twelfthMarks: '75',
          ugCgpa: '8.87',
          gender: 'Male',
          campus: 'VIT-AP',
          degree: 'B Tech',
          specialization: 'Computer Science and Engineering',
          dateOfBirth: '2004-03-08',
          leetcodeUrl: 'https://leetcode.com/u/sayonara1337/',
          linkedinUrl: 'https://www.linkedin.com/in/sayantan-mandal-8a14b7202/',
          githubUrl: 'https://github.com/sayantanmandal1',
          resumeUrl: 'https://drive.google.com/file/d/1YOHB-4UvI9zGhbTOa9wOkyPhYDCmAfbl/view?usp=drive_link',
          portfolioUrl: 'https://d1grz986bewgw4.cloudfront.net/',
          customFields: {}
        }
      }
    };
  }

  getDefaultSettings() {
    return {
      activeProfile: 'default',
      autoFillEnabled: false,
      blacklistedDomains: [],
      passwordProtected: false,
      passwordHash: '',
      passwordSalt: ''
    };
  }

  setupEventListeners() {
    // Save form data
    document.getElementById('save-btn').addEventListener('click', (e) => {
      e.preventDefault();
      this.saveData();
    });

    // Reset form
    document.getElementById('reset-btn').addEventListener('click', () => {
      this.resetForm();
    });

    // Autofill button
    document.getElementById('autofill-btn').addEventListener('click', () => {
      this.triggerAutofill();
    });

    // Profile selection
    document.getElementById('profile-select').addEventListener('change', (e) => {
      this.switchProfile(e.target.value);
    });

    // New profile button
    document.getElementById('new-profile-btn').addEventListener('click', () => {
      this.showNewProfileDialog();
    });

    // Manage profile button
    document.getElementById('manage-profile-btn').addEventListener('click', () => {
      this.showProfileManagementDialog();
    });

    // Add custom field
    document.getElementById('add-custom-field').addEventListener('click', () => {
      this.addCustomField();
    });

    // Settings checkboxes
    document.getElementById('auto-fill-enabled').addEventListener('change', (e) => {
      this.settings.autoFillEnabled = e.target.checked;
      this.saveSettings();
    });

    document.getElementById('password-protected').addEventListener('change', (e) => {
      if (e.target.checked) {
        this.showPasswordSetup();
      } else {
        this.disablePasswordProtection();
      }
    });

    // Blacklisted domains
    document.getElementById('blacklisted-domains').addEventListener('blur', (e) => {
      const domains = e.target.value.split('\n').filter(d => d.trim());
      this.settings.blacklistedDomains = domains;
      this.saveSettings();
    });

    // Password form event listeners
    this.setupPasswordEventListeners();
  }

  populateForm() {
    const profileData = this.profiles[this.currentProfile]?.data || {};

    // Populate basic fields
    const fields = ['fullName', 'email', 'personalEmail', 'studentNumber', 'phone', 'tenthMarks', 'twelfthMarks', 'ugCgpa', 'gender', 'campus', 'degree', 'specialization', 'dateOfBirth', 'leetcodeUrl', 'linkedinUrl', 'githubUrl', 'resumeUrl', 'portfolioUrl'];
    fields.forEach(field => {
      const element = document.getElementById(field.replace(/([A-Z])/g, '-$1').toLowerCase());
      if (element) {
        element.value = profileData[field] || '';
      }
    });

    // Populate custom fields
    this.populateCustomFields(profileData.customFields || {});

    // Populate settings
    document.getElementById('auto-fill-enabled').checked = this.settings.autoFillEnabled;
    document.getElementById('password-protected').checked = this.settings.passwordProtected;
    document.getElementById('blacklisted-domains').value = this.settings.blacklistedDomains.join('\n');

    // Update profile selector
    this.updateProfileSelector();

    // Show/hide change password button
    const changePasswordBtn = document.getElementById('change-password-btn');
    if (this.settings.passwordProtected) {
      changePasswordBtn.classList.remove('hidden');
    } else {
      changePasswordBtn.classList.add('hidden');
    }
  }

  populateCustomFields(customFields) {
    const container = document.getElementById('custom-fields-container');
    container.innerHTML = '';

    Object.entries(customFields).forEach(([key, value]) => {
      this.createCustomFieldElement(key, value);
    });
  }

  createCustomFieldElement(key = '', value = '') {
    const container = document.getElementById('custom-fields-container');
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'custom-field-item';

    fieldDiv.innerHTML = `
            <input type="text" placeholder="Field name" value="${key}" class="custom-field-key">
            <input type="text" placeholder="Field value" value="${value}" class="custom-field-value">
            <button type="button" class="remove-field">Remove</button>
        `;

    // Add remove functionality
    fieldDiv.querySelector('.remove-field').addEventListener('click', () => {
      fieldDiv.remove();
    });

    container.appendChild(fieldDiv);
  }

  addCustomField() {
    this.createCustomFieldElement();
  }

  async saveData() {
    const timer = this.startPerformanceTimer('dataSave');

    // Check authentication if password protection is enabled
    if (this.settings.passwordProtected && !this.isAuthenticated) {
      this.showPasswordPrompt();
      return;
    }

    try {
      this.debugLog('info', 'Starting data save operation');
      const formData = new FormData(document.getElementById('settings-form'));
      const profileData = {};
      const validationErrors = [];

      // Collect basic form data with validation
      for (const [key, value] of formData.entries()) {
        const trimmedValue = value.trim();

        // Validate field length
        if (trimmedValue.length > 500) {
          validationErrors.push(`${key} exceeds maximum length of 500 characters`);
          continue;
        }

        // Validate specific field types
        if (key === 'email' && trimmedValue && !this.isValidEmail(trimmedValue)) {
          validationErrors.push('Email format is invalid');
          continue;
        }

        if (key.includes('Url') && trimmedValue && !this.isValidUrl(trimmedValue)) {
          validationErrors.push(`${key} is not a valid URL`);
          continue;
        }

        if (key === 'phone' && trimmedValue && !this.isValidPhone(trimmedValue)) {
          validationErrors.push('Phone number format is invalid');
          continue;
        }

        profileData[key] = trimmedValue;
      }

      // Collect and validate custom fields
      const customFields = {};
      const customFieldItems = document.querySelectorAll('.custom-field-item');
      customFieldItems.forEach((item, index) => {
        const keyInput = item.querySelector('.custom-field-key');
        const valueInput = item.querySelector('.custom-field-value');

        if (!keyInput || !valueInput) {
          validationErrors.push(`Custom field ${index + 1} is missing input elements`);
          return;
        }

        const key = keyInput.value.trim();
        const value = valueInput.value.trim();

        if (key && value) {
          if (key.length > 100) {
            validationErrors.push(`Custom field key "${key}" exceeds maximum length of 100 characters`);
          } else if (value.length > 500) {
            validationErrors.push(`Custom field value for "${key}" exceeds maximum length of 500 characters`);
          } else {
            customFields[key] = value;
          }
        } else if (key && !value) {
          validationErrors.push(`Custom field "${key}" has no value`);
        } else if (!key && value) {
          validationErrors.push(`Custom field with value "${value}" has no key`);
        }
      });
      profileData.customFields = customFields;

      // Show validation errors if any
      if (validationErrors.length > 0) {
        this.showStatus(`Validation errors: ${validationErrors.join(', ')}`, 'error');
        return;
      }

      // Validate that current profile exists
      if (!this.profiles[this.currentProfile]) {
        throw new Error(`Current profile '${this.currentProfile}' does not exist`);
      }

      // Update profile data
      this.profiles[this.currentProfile].data = profileData;

      // Save to storage with fallback
      try {
        if (chrome?.storage?.sync) {
          await chrome.storage.sync.set({ profiles: this.profiles });
        } else if (chrome?.storage?.local) {
          await chrome.storage.local.set({ profiles: this.profiles });
          this.showStatus('Settings saved to local storage (sync unavailable)', 'warning');
          return;
        } else {
          throw new Error('No storage method available');
        }
        this.showStatus('Settings saved successfully!', 'success');
        this.debugLog('info', 'Data saved successfully', {
          profileId: this.currentProfile,
          dataSize: JSON.stringify(this.profiles[this.currentProfile].data).length
        });
      } catch (storageError) {
        this.debugLog('error', 'Storage error:', storageError);
        this.showStatus('Failed to save settings: Storage error', 'error');
      }
    } catch (error) {
      this.debugLog('error', 'Error saving data:', error);
      this.showStatus(`Error saving settings: ${error.message}`, 'error');
    } finally {
      this.endPerformanceTimer(timer);
    }
  }

  // Validation helper methods
  isValidEmail(email) {
    if (!email || typeof email !== 'string') {return false;}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  isValidUrl(url) {
    if (!url || typeof url !== 'string') {return false;}
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') {return false;}
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,20}$/;
    return phoneRegex.test(phone);
  }

  async saveSettings() {
    try {
      // Validate settings before saving
      if (!this.settings || typeof this.settings !== 'object') {
        throw new Error('Settings object is invalid');
      }

      // Save with fallback
      if (chrome?.storage?.sync) {
        await chrome.storage.sync.set({ settings: this.settings });
      } else if (chrome?.storage?.local) {
        await chrome.storage.local.set({ settings: this.settings });
        console.warn('Settings saved to local storage (sync unavailable)');
      } else {
        throw new Error('No storage method available');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showStatus('Failed to save settings', 'error');
    }
  }

  resetForm() {
    if (confirm('Are you sure you want to reset all fields?')) {
      // Clear all form fields
      document.getElementById('settings-form').reset();
      document.getElementById('custom-fields-container').innerHTML = '';
      this.showStatus('Form reset', 'success');
    }
  }

  async triggerAutofill() {
    const timer = this.startPerformanceTimer('autofillTrigger');

    // Check authentication if password protection is enabled
    if (this.settings.passwordProtected && !this.isAuthenticated) {
      this.showPasswordPrompt();
      return;
    }

    try {
      this.debugLog('info', 'Starting autofill trigger operation');
      // Check if chrome.tabs API is available
      if (!chrome?.tabs?.query) {
        throw new Error('Chrome tabs API is not available');
      }

      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab) {
        this.showStatus('No active tab found', 'error');
        return;
      }

      // Validate tab URL
      if (!tab.url) {
        this.showStatus('Cannot access tab URL', 'error');
        return;
      }

      // Check if URL is supported
      if (!tab.url.startsWith('http://') && !tab.url.startsWith('https://')) {
        this.showStatus('Autofill not supported on this page type', 'error');
        return;
      }

      let url;
      try {
        url = new URL(tab.url);
      } catch (urlError) {
        this.showStatus('Invalid page URL', 'error');
        return;
      }

      // Check if domain is blacklisted
      if (this.settings.blacklistedDomains && this.settings.blacklistedDomains.includes(url.hostname)) {
        this.showStatus('Autofill disabled for this domain', 'error');
        return;
      }

      // Validate profile data
      const profileData = this.profiles[this.currentProfile]?.data;
      if (!profileData) {
        this.showStatus('No profile data available', 'error');
        return;
      }

      // Check if there's any data to fill
      const hasData = Object.values(profileData).some(value => {
        if (typeof value === 'string') {return value.trim().length > 0;}
        if (typeof value === 'object' && value !== null) {
          return Object.values(value).some(v => typeof v === 'string' && v.trim().length > 0);
        }
        return false;
      });

      if (!hasData) {
        this.showStatus('No data to fill - please add your information first', 'error');
        return;
      }

      // Send message to content script with timeout
      const messagePromise = chrome.tabs.sendMessage(tab.id, {
        action: 'autofill',
        data: profileData
      });

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Autofill timeout')), 10000);
      });

      await Promise.race([messagePromise, timeoutPromise]);

      this.showStatus('Autofill triggered!', 'success');
      this.debugLog('info', 'Autofill triggered successfully', {
        tabId: tab.id,
        url: tab.url,
        profileId: this.currentProfile
      });

      // Close popup after successful autofill
      setTimeout(() => {
        window.close();
      }, 1000);
    } catch (error) {
      this.debugLog('error', 'Error triggering autofill:', error);

      // Provide specific error messages
      if (error.message.includes('Could not establish connection')) {
        this.showStatus('Page not ready for autofill - try refreshing the page', 'error');
      } else if (error.message.includes('timeout')) {
        this.showStatus('Autofill timed out - page may not support autofill', 'error');
      } else if (error.message.includes('Extension context invalidated')) {
        this.showStatus('Extension needs to be reloaded', 'error');
      } else {
        this.showStatus(`Autofill failed: ${error.message}`, 'error');
      }
    } finally {
      this.endPerformanceTimer(timer);
    }
  }

  switchProfile(profileId) {
    this.currentProfile = profileId;
    this.settings.activeProfile = profileId;
    this.saveSettings();
    this.populateForm();
  }

  updateProfileSelector() {
    const select = document.getElementById('profile-select');
    select.innerHTML = '';

    Object.entries(this.profiles).forEach(([id, profile]) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = profile.name;
      option.selected = id === this.currentProfile;
      select.appendChild(option);
    });

    // Add context menu support for profile management
    select.addEventListener('contextmenu', (e) => {
      const selectedProfileId = select.value;
      if (selectedProfileId && selectedProfileId !== 'default') {
        this.showProfileContextMenu(selectedProfileId, e);
      }
    });
  }

  showNewProfileDialog() {
    const profileName = prompt('Enter a name for the new profile:');
    if (!profileName || !profileName.trim()) {
      return;
    }

    const trimmedName = profileName.trim();
    if (trimmedName.length > 100) {
      this.showStatus('Profile name must be 100 characters or less', 'error');
      return;
    }

    // Generate unique profile ID
    const profileId = this.generateProfileId(trimmedName);

    // Check if profile already exists
    if (this.profiles[profileId]) {
      this.showStatus('A profile with this name already exists', 'error');
      return;
    }

    this.createNewProfile(profileId, trimmedName);
  }

  generateProfileId(name) {
    // Create a URL-safe ID from the name
    let baseId = name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    if (!baseId) {
      baseId = 'profile';
    }

    // Ensure uniqueness
    let counter = 1;
    let profileId = baseId;
    while (this.profiles[profileId]) {
      profileId = `${baseId}-${counter}`;
      counter++;
    }

    return profileId;
  }

  async createNewProfile(profileId, profileName) {
    try {
      // Create new profile with default data
      this.profiles[profileId] = {
        name: profileName,
        data: {
          fullName: '',
          email: '',
          personalEmail: 'msayantan05@gmail.com',
          studentNumber: '',
          phone: '',
          tenthMarks: '',
          twelfthMarks: '',
          ugCgpa: '',
          gender: '',
          campus: '',
          degree: 'B Tech',
          specialization: 'Computer Science and Engineering',
          dateOfBirth: '2004-03-08',
          leetcodeUrl: '',
          linkedinUrl: '',
          githubUrl: '',
          resumeUrl: 'https://drive.google.com/file/d/1YOHB-4UvI9zGhbTOa9wOkyPhYDCmAfbl/view?usp=drive_link',
          portfolioUrl: '',
          customFields: {}
        }
      };

      // Save to storage
      await this.saveProfiles();

      // Switch to new profile
      this.switchProfile(profileId);

      this.showStatus(`Profile "${profileName}" created successfully`, 'success');
    } catch (error) {
      console.error('Error creating profile:', error);
      this.showStatus('Failed to create profile', 'error');
    }
  }

  async saveProfiles() {
    try {
      if (chrome?.storage?.sync) {
        await chrome.storage.sync.set({ profiles: this.profiles });
      } else if (chrome?.storage?.local) {
        await chrome.storage.local.set({ profiles: this.profiles });
        console.warn('Profiles saved to local storage (sync unavailable)');
      } else {
        throw new Error('No storage method available');
      }
    } catch (error) {
      console.error('Error saving profiles:', error);
      throw new Error('Failed to save profiles to storage');
    }
  }

  showProfileManagementDialog() {
    const currentProfileId = this.currentProfile;
    const currentProfileName = this.profiles[currentProfileId]?.name || 'Unknown Profile';

    if (currentProfileId === 'default') {
      this.showStatus('The default profile cannot be renamed or deleted', 'info');
      return;
    }

    // Create a simple menu for profile actions
    const action = prompt(`Profile: "${currentProfileName}"\n\nEnter 'rename' to rename this profile\nEnter 'delete' to delete this profile\nPress Cancel to do nothing`);

    if (action) {
      const normalizedAction = action.toLowerCase().trim();
      if (normalizedAction === 'rename') {
        this.showRenameProfileDialog(currentProfileId);
      } else if (normalizedAction === 'delete') {
        this.showDeleteProfileDialog(currentProfileId);
      } else {
        this.showStatus('Invalid action. Use "rename" or "delete"', 'error');
      }
    }
  }

  showProfileContextMenu(profileId, event) {
    event.preventDefault();

    // Remove any existing context menu
    const existingMenu = document.querySelector('.profile-context-menu');
    if (existingMenu) {
      existingMenu.remove();
    }

    // Don't show context menu for default profile
    if (profileId === 'default') {
      return;
    }

    const menu = document.createElement('div');
    menu.className = 'profile-context-menu';
    menu.style.position = 'absolute';
    menu.style.left = event.pageX + 'px';
    menu.style.top = event.pageY + 'px';
    menu.style.zIndex = '1000';

    menu.innerHTML = `
            <div class="context-menu-item" data-action="rename">Rename Profile</div>
            <div class="context-menu-item" data-action="delete">Delete Profile</div>
        `;

    // Add event listeners
    menu.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action === 'rename') {
        this.showRenameProfileDialog(profileId);
      } else if (action === 'delete') {
        this.showDeleteProfileDialog(profileId);
      }
      menu.remove();
    });

    // Close menu when clicking elsewhere
    document.addEventListener('click', () => {
      menu.remove();
    }, { once: true });

    document.body.appendChild(menu);
  }

  showRenameProfileDialog(profileId) {
    const currentName = this.profiles[profileId]?.name || '';
    const newName = prompt('Enter new profile name:', currentName);

    if (!newName || !newName.trim()) {
      return;
    }

    const trimmedName = newName.trim();
    if (trimmedName.length > 100) {
      this.showStatus('Profile name must be 100 characters or less', 'error');
      return;
    }

    if (trimmedName === currentName) {
      return; // No change
    }

    this.renameProfile(profileId, trimmedName);
  }

  async renameProfile(profileId, newName) {
    try {
      if (!this.profiles[profileId]) {
        throw new Error('Profile not found');
      }

      const oldName = this.profiles[profileId].name;
      this.profiles[profileId].name = newName;

      await this.saveProfiles();
      this.updateProfileSelector();

      this.showStatus(`Profile renamed from "${oldName}" to "${newName}"`, 'success');
    } catch (error) {
      console.error('Error renaming profile:', error);
      this.showStatus('Failed to rename profile', 'error');
    }
  }

  showDeleteProfileDialog(profileId) {
    if (profileId === 'default') {
      this.showStatus('Cannot delete the default profile', 'error');
      return;
    }

    const profileName = this.profiles[profileId]?.name || 'Unknown Profile';
    const confirmed = confirm(`Are you sure you want to delete the profile "${profileName}"?\n\nThis action cannot be undone.`);

    if (confirmed) {
      this.deleteProfile(profileId);
    }
  }

  async deleteProfile(profileId) {
    try {
      if (profileId === 'default') {
        throw new Error('Cannot delete the default profile');
      }

      if (!this.profiles[profileId]) {
        throw new Error('Profile not found');
      }

      const profileName = this.profiles[profileId].name;

      // If deleting the active profile, switch to default
      if (this.currentProfile === profileId) {
        this.currentProfile = 'default';
        this.settings.activeProfile = 'default';
        await this.saveSettings();
      }

      // Delete the profile
      delete this.profiles[profileId];

      // Save changes
      await this.saveProfiles();

      // Update UI
      this.updateProfileSelector();
      if (this.currentProfile === 'default') {
        this.populateForm();
      }

      this.showStatus(`Profile "${profileName}" deleted successfully`, 'success');
    } catch (error) {
      console.error('Error deleting profile:', error);
      this.showStatus('Failed to delete profile', 'error');
    }
  }

  setupPasswordEventListeners() {
    // Password prompt form
    document.getElementById('password-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handlePasswordSubmit();
    });

    document.getElementById('password-cancel').addEventListener('click', () => {
      this.hidePasswordPrompt();
      window.close();
    });

    // Password setup form
    document.getElementById('password-setup-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handlePasswordSetup();
    });

    document.getElementById('password-setup-cancel').addEventListener('click', () => {
      this.hidePasswordSetup();
      // Reset the checkbox
      document.getElementById('password-protected').checked = false;
    });

    // Change password button
    document.getElementById('change-password-btn').addEventListener('click', () => {
      this.showChangePasswordDialog();
    });
  }

  showPasswordPrompt() {
    document.getElementById('password-overlay').classList.remove('hidden');
    document.getElementById('password-input').focus();

    // Hide main content
    document.querySelector('main').style.display = 'none';
  }

  hidePasswordPrompt() {
    document.getElementById('password-overlay').classList.add('hidden');
    document.querySelector('main').style.display = 'block';

    // Reset form to default state
    document.getElementById('password-modal-title').textContent = 'Enter Password';
    document.getElementById('password-modal-description').textContent = 'Please enter your password to access extension settings.';
    document.getElementById('new-password-group').classList.add('hidden');
    document.getElementById('confirm-password-group').classList.add('hidden');

    // Reset form handler
    const form = document.getElementById('password-form');
    form.onsubmit = (e) => {
      e.preventDefault();
      this.handlePasswordSubmit();
    };

    // Clear all inputs and errors
    document.getElementById('password-input').value = '';
    document.getElementById('new-password-input').value = '';
    document.getElementById('confirm-password-input').value = '';
    document.getElementById('password-error').textContent = '';
    document.getElementById('new-password-error').textContent = '';
    document.getElementById('confirm-password-error').textContent = '';
  }

  showPasswordSetup() {
    document.getElementById('password-setup-overlay').classList.remove('hidden');
    document.getElementById('setup-password-input').focus();
  }

  hidePasswordSetup() {
    document.getElementById('password-setup-overlay').classList.add('hidden');

    // Clear form
    document.getElementById('password-setup-form').reset();
    document.getElementById('setup-password-error').textContent = '';
    document.getElementById('setup-confirm-password-error').textContent = '';
  }

  async handlePasswordSubmit() {
    const password = document.getElementById('password-input').value;
    const errorElement = document.getElementById('password-error');

    if (!password) {
      errorElement.textContent = 'Please enter your password';
      return;
    }

    try {
      const isValid = await StorageManager.verifyPassword(password);

      if (isValid) {
        this.isAuthenticated = true;
        this.hidePasswordPrompt();
        this.populateForm();
        this.showStatus('Access granted', 'success');
      } else {
        errorElement.textContent = 'Incorrect password';
        document.getElementById('password-input').value = '';
        document.getElementById('password-input').focus();
      }
    } catch (error) {
      console.error('Password verification error:', error);
      errorElement.textContent = 'Error verifying password';
    }
  }

  async handlePasswordSetup() {
    const password = document.getElementById('setup-password-input').value;
    const confirmPassword = document.getElementById('setup-confirm-password-input').value;
    const passwordError = document.getElementById('setup-password-error');
    const confirmError = document.getElementById('setup-confirm-password-error');

    // Clear previous errors
    passwordError.textContent = '';
    confirmError.textContent = '';

    // Validate password
    if (!password) {
      passwordError.textContent = 'Please enter a password';
      return;
    }

    if (password.length < 6) {
      passwordError.textContent = 'Password must be at least 6 characters long';
      return;
    }

    if (password !== confirmPassword) {
      confirmError.textContent = 'Passwords do not match';
      return;
    }

    try {
      await StorageManager.setupPassword(password);
      this.settings.passwordProtected = true;
      this.isAuthenticated = true;

      this.hidePasswordSetup();
      this.showStatus('Password protection enabled successfully', 'success');

      // Show change password button
      document.getElementById('change-password-btn').classList.remove('hidden');
    } catch (error) {
      console.error('Password setup error:', error);
      passwordError.textContent = 'Error setting up password protection';
    }
  }

  showChangePasswordDialog() {
    // Show password modal in change password mode
    document.getElementById('password-modal-title').textContent = 'Change Password';
    document.getElementById('password-modal-description').textContent = 'Enter your current password and choose a new password.';

    // Show additional fields for new password
    document.getElementById('new-password-group').classList.remove('hidden');
    document.getElementById('confirm-password-group').classList.remove('hidden');

    // Update form handler
    const form = document.getElementById('password-form');
    form.onsubmit = (e) => {
      e.preventDefault();
      this.handlePasswordChange();
    };

    document.getElementById('password-overlay').classList.remove('hidden');
    document.getElementById('password-input').focus();
  }

  async handlePasswordChange() {
    const currentPassword = document.getElementById('password-input').value;
    const newPassword = document.getElementById('new-password-input').value;
    const confirmPassword = document.getElementById('confirm-password-input').value;

    const passwordError = document.getElementById('password-error');
    const newPasswordError = document.getElementById('new-password-error');
    const confirmPasswordError = document.getElementById('confirm-password-error');

    // Clear previous errors
    passwordError.textContent = '';
    newPasswordError.textContent = '';
    confirmPasswordError.textContent = '';

    // Validate inputs
    if (!currentPassword) {
      passwordError.textContent = 'Please enter your current password';
      return;
    }

    if (!newPassword) {
      newPasswordError.textContent = 'Please enter a new password';
      return;
    }

    if (newPassword.length < 6) {
      newPasswordError.textContent = 'Password must be at least 6 characters long';
      return;
    }

    if (newPassword !== confirmPassword) {
      confirmPasswordError.textContent = 'Passwords do not match';
      return;
    }

    try {
      const success = await StorageManager.changePassword(currentPassword, newPassword);

      if (success) {
        this.hidePasswordPrompt();
        this.showStatus('Password changed successfully', 'success');
      } else {
        passwordError.textContent = 'Current password is incorrect';
        document.getElementById('password-input').value = '';
        document.getElementById('password-input').focus();
      }
    } catch (error) {
      console.error('Password change error:', error);
      passwordError.textContent = 'Error changing password';
    }
  }

  async disablePasswordProtection() {
    if (!this.settings.passwordProtected) {
      return;
    }

    // Show password prompt to confirm
    const password = prompt('Enter your current password to disable protection:');
    if (!password) {
      // User cancelled, reset checkbox
      document.getElementById('password-protected').checked = true;
      return;
    }

    try {
      const success = await StorageManager.disablePasswordProtection(password);

      if (success) {
        this.settings.passwordProtected = false;
        this.settings.passwordHash = '';
        this.settings.passwordSalt = '';
        this.showStatus('Password protection disabled', 'success');

        // Hide change password button
        document.getElementById('change-password-btn').classList.add('hidden');
      } else {
        document.getElementById('password-protected').checked = true;
        this.showStatus('Incorrect password', 'error');
      }
    } catch (error) {
      console.error('Error disabling password protection:', error);
      document.getElementById('password-protected').checked = true;
      this.showStatus('Error disabling password protection', 'error');
    }
  }

  showStatus(message, type) {
    try {
      const statusElement = document.getElementById('status-message');
      if (!statusElement) {
        console.error('Status message element not found');
        return;
      }

      // Sanitize message to prevent XSS
      const sanitizedMessage = typeof message === 'string' ? message.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'Unknown error';
      const validTypes = ['success', 'error', 'warning', 'info'];
      const safeType = validTypes.includes(type) ? type : 'info';

      statusElement.textContent = sanitizedMessage;
      statusElement.className = `status-message ${safeType}`;

      // Show message
      setTimeout(() => {
        statusElement.classList.remove('hidden');
      }, 10);

      // Hide after appropriate duration based on type
      const duration = safeType === 'error' ? 5000 : 3000;
      setTimeout(() => {
        statusElement.classList.add('hidden');
      }, duration);

      // Log to console for debugging
      console.log(`Status [${safeType}]: ${sanitizedMessage}`);
    } catch (error) {
      console.error('Error showing status message:', error);
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
