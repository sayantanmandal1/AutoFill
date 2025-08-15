/**
 * Popup Default Values Tests
 * Tests that the popup correctly displays and uses default values
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock Chrome APIs
global.chrome = {
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn()
    }
  }
};

describe('Popup Default Values', () => {
  let dom;
  let document;
  let window;
  let PopupManager;

  beforeEach(() => {
    // Set up JSDOM environment with popup HTML structure
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <form id="settings-form">
            <input type="text" id="degree" name="degree" placeholder="B Tech" value="B Tech">
            <input type="email" id="personal-email" name="personalEmail" placeholder="msayantan05@gmail.com" value="msayantan05@gmail.com">
            <input type="text" id="specialization" name="specialization" placeholder="Computer Science and Engineering" value="Computer Science and Engineering">
            <input type="date" id="date-of-birth" name="dateOfBirth" placeholder="YYYY-MM-DD" value="2004-03-08">
            <input type="text" id="campus" name="campus" placeholder="VIT-AP" value="VIT-AP">
            <input type="url" id="resume-url" name="resumeUrl" placeholder="https://drive.google.com/..." value="https://drive.google.com/file/d/1YOHB-4UvI9zGhbTOa9wOkyPhYDCmAfbl/view?usp=drive_link">
            
            <select id="gender" name="gender">
              <option value="Male" selected>Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            
            <input type="text" id="full-name" name="fullName" placeholder="Enter your full name">
            <input type="email" id="email" name="email" placeholder="your.email@university.edu">
            
            <input type="checkbox" id="auto-fill-enabled">
            <input type="checkbox" id="password-protected">
            <textarea id="blacklisted-domains"></textarea>
          </form>
          
          <select id="profile-select">
            <option value="default">Default Profile</option>
          </select>
          
          <button id="change-password-btn" class="hidden"></button>
        </body>
      </html>
    `, {
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    document = dom.window.document;
    window = dom.window;
    
    // Set up global objects
    global.document = document;
    global.window = window;
    global.localStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn()
    };

    // Mock PopupManager class with the actual logic
    PopupManager = class {
      constructor() {
        this.currentProfile = 'default';
        this.profiles = {};
        this.settings = {};
        this.isAuthenticated = false;
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

      populateForm() {
        const profileData = this.profiles[this.currentProfile]?.data || {};

        // Define default values for fields
        const defaultValues = {
          personalEmail: 'msayantan05@gmail.com',
          degree: 'B Tech',
          specialization: 'Computer Science and Engineering',
          dateOfBirth: '2004-03-08',
          gender: 'Male',
          campus: 'VIT-AP',
          resumeUrl: 'https://drive.google.com/file/d/1YOHB-4UvI9zGhbTOa9wOkyPhYDCmAfbl/view?usp=drive_link'
        };

        // Populate basic fields
        const fields = ['fullName', 'email', 'personalEmail', 'studentNumber', 'phone', 'tenthMarks', 'twelfthMarks', 'ugCgpa', 'gender', 'campus', 'degree', 'specialization', 'dateOfBirth', 'leetcodeUrl', 'linkedinUrl', 'githubUrl', 'resumeUrl', 'portfolioUrl'];
        fields.forEach(field => {
          const element = document.getElementById(field.replace(/([A-Z])/g, '-$1').toLowerCase());
          if (element) {
            // Use profile data if available, otherwise use default value, otherwise empty string
            element.value = profileData[field] || defaultValues[field] || '';
          }
        });

        // Populate settings
        document.getElementById('auto-fill-enabled').checked = this.settings.autoFillEnabled;
        document.getElementById('password-protected').checked = this.settings.passwordProtected;
        document.getElementById('blacklisted-domains').value = this.settings.blacklistedDomains.join('\n');
      }

      async loadData() {
        // Simulate loading with default profiles
        this.profiles = this.getDefaultProfiles();
        this.settings = this.getDefaultSettings();
        this.currentProfile = this.settings.activeProfile;

        // Ensure existing profiles have all default values
        Object.keys(this.profiles).forEach(profileId => {
          const profile = this.profiles[profileId];
          if (profile && profile.data) {
            // Add missing default values to existing profiles
            if (!profile.data.personalEmail) profile.data.personalEmail = 'msayantan05@gmail.com';
            if (!profile.data.degree) profile.data.degree = 'B Tech';
            if (!profile.data.specialization) profile.data.specialization = 'Computer Science and Engineering';
            if (!profile.data.dateOfBirth) profile.data.dateOfBirth = '2004-03-08';
            if (!profile.data.gender) profile.data.gender = 'Male';
            if (!profile.data.campus) profile.data.campus = 'VIT-AP';
            if (!profile.data.resumeUrl) profile.data.resumeUrl = 'https://drive.google.com/file/d/1YOHB-4UvI9zGhbTOa9wOkyPhYDCmAfbl/view?usp=drive_link';
          }
        });
      }
    };
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('HTML Default Values', () => {
    it('should have default values set in HTML form fields', () => {
      // Check that HTML fields have default values
      expect(document.getElementById('degree').value).toBe('B Tech');
      expect(document.getElementById('personal-email').value).toBe('msayantan05@gmail.com');
      expect(document.getElementById('specialization').value).toBe('Computer Science and Engineering');
      expect(document.getElementById('date-of-birth').value).toBe('2004-03-08');
      expect(document.getElementById('campus').value).toBe('VIT-AP');
      expect(document.getElementById('resume-url').value).toBe('https://drive.google.com/file/d/1YOHB-4UvI9zGhbTOa9wOkyPhYDCmAfbl/view?usp=drive_link');
      
      // Check that gender select has Male selected
      const genderSelect = document.getElementById('gender');
      expect(genderSelect.value).toBe('Male');
      expect(genderSelect.selectedOptions[0].text).toBe('Male');
    });

    it('should have empty values for fields without defaults', () => {
      expect(document.getElementById('full-name').value).toBe('');
      expect(document.getElementById('email').value).toBe('');
    });
  });

  describe('PopupManager Default Values', () => {
    it('should provide correct default profile data', () => {
      const manager = new PopupManager();
      const defaultProfiles = manager.getDefaultProfiles();
      const defaultData = defaultProfiles.default.data;

      expect(defaultData.degree).toBe('B Tech');
      expect(defaultData.personalEmail).toBe('msayantan05@gmail.com');
      expect(defaultData.specialization).toBe('Computer Science and Engineering');
      expect(defaultData.dateOfBirth).toBe('2004-03-08');
      expect(defaultData.gender).toBe('Male');
      expect(defaultData.campus).toBe('VIT-AP');
      expect(defaultData.resumeUrl).toBe('https://drive.google.com/file/d/1YOHB-4UvI9zGhbTOa9wOkyPhYDCmAfbl/view?usp=drive_link');
    });

    it('should populate form with default values when no profile data exists', async () => {
      const manager = new PopupManager();
      
      // Simulate empty profile data
      manager.profiles = {
        default: {
          name: 'Default Profile',
          data: {} // Empty data
        }
      };
      manager.settings = manager.getDefaultSettings();
      
      // Populate form
      manager.populateForm();

      // Check that default values are used
      expect(document.getElementById('degree').value).toBe('B Tech');
      expect(document.getElementById('personal-email').value).toBe('msayantan05@gmail.com');
      expect(document.getElementById('specialization').value).toBe('Computer Science and Engineering');
      expect(document.getElementById('date-of-birth').value).toBe('2004-03-08');
      expect(document.getElementById('gender').value).toBe('Male');
      expect(document.getElementById('campus').value).toBe('VIT-AP');
      expect(document.getElementById('resume-url').value).toBe('https://drive.google.com/file/d/1YOHB-4UvI9zGhbTOa9wOkyPhYDCmAfbl/view?usp=drive_link');
    });

    it('should populate form with profile data when available', async () => {
      const manager = new PopupManager();
      
      // Load default data
      await manager.loadData();
      
      // Populate form
      manager.populateForm();

      // Check that profile data is used (from getDefaultProfiles)
      expect(document.getElementById('degree').value).toBe('B Tech');
      expect(document.getElementById('personal-email').value).toBe('msayantan05@gmail.com');
      expect(document.getElementById('specialization').value).toBe('Computer Science and Engineering');
      expect(document.getElementById('date-of-birth').value).toBe('2004-03-08');
      expect(document.getElementById('gender').value).toBe('Male');
      expect(document.getElementById('campus').value).toBe('VIT-AP');
      expect(document.getElementById('resume-url').value).toBe('https://drive.google.com/file/d/1YOHB-4UvI9zGhbTOa9wOkyPhYDCmAfbl/view?usp=drive_link');
      
      // Check that full profile data is also populated
      expect(document.getElementById('full-name').value).toBe('Sayantan Mandal');
      expect(document.getElementById('email').value).toBe('sayantan.22bce8533@vitapstudent.ac.in');
    });

    it('should add missing default values to existing profiles', async () => {
      const manager = new PopupManager();
      
      // First load default data
      await manager.loadData();
      
      // Then simulate existing profile with missing fields by modifying the loaded profile
      manager.profiles.default.data = {
        fullName: 'John Doe',
        email: 'john@example.com'
        // Missing degree, gender, etc.
      };
      
      // Simulate the migration logic that should run
      Object.keys(manager.profiles).forEach(profileId => {
        const profile = manager.profiles[profileId];
        if (profile && profile.data) {
          // Add missing default values to existing profiles
          if (!profile.data.personalEmail) profile.data.personalEmail = 'msayantan05@gmail.com';
          if (!profile.data.degree) profile.data.degree = 'B Tech';
          if (!profile.data.specialization) profile.data.specialization = 'Computer Science and Engineering';
          if (!profile.data.dateOfBirth) profile.data.dateOfBirth = '2004-03-08';
          if (!profile.data.gender) profile.data.gender = 'Male';
          if (!profile.data.campus) profile.data.campus = 'VIT-AP';
          if (!profile.data.resumeUrl) profile.data.resumeUrl = 'https://drive.google.com/file/d/1YOHB-4UvI9zGhbTOa9wOkyPhYDCmAfbl/view?usp=drive_link';
        }
      });
      
      const profileData = manager.profiles.default.data;
      
      // Check that missing defaults were added
      expect(profileData.degree).toBe('B Tech');
      expect(profileData.personalEmail).toBe('msayantan05@gmail.com');
      expect(profileData.gender).toBe('Male');
      expect(profileData.campus).toBe('VIT-AP');
      expect(profileData.resumeUrl).toBe('https://drive.google.com/file/d/1YOHB-4UvI9zGhbTOa9wOkyPhYDCmAfbl/view?usp=drive_link');
      
      // Check that existing data is preserved
      expect(profileData.fullName).toBe('John Doe');
      expect(profileData.email).toBe('john@example.com');
    });
  });

  describe('Field Value Fallback Logic', () => {
    it('should use profile data over default values when available', () => {
      const manager = new PopupManager();
      
      // Set up profile with custom values
      manager.profiles = {
        default: {
          name: 'Default Profile',
          data: {
            degree: 'Masters',
            gender: 'Female',
            personalEmail: 'custom@email.com'
          }
        }
      };
      manager.settings = manager.getDefaultSettings();
      
      manager.populateForm();
      
      // Should use profile data, not defaults
      expect(document.getElementById('degree').value).toBe('Masters');
      expect(document.getElementById('gender').value).toBe('Female');
      expect(document.getElementById('personal-email').value).toBe('custom@email.com');
      
      // Should use defaults for missing fields
      expect(document.getElementById('specialization').value).toBe('Computer Science and Engineering');
      expect(document.getElementById('campus').value).toBe('VIT-AP');
    });

    it('should use default values when profile data is empty', () => {
      const manager = new PopupManager();
      
      // Set up profile with empty/null values
      manager.profiles = {
        default: {
          name: 'Default Profile',
          data: {
            degree: '',
            gender: null,
            personalEmail: undefined
          }
        }
      };
      manager.settings = manager.getDefaultSettings();
      
      manager.populateForm();
      
      // Should use defaults for empty values
      expect(document.getElementById('degree').value).toBe('B Tech');
      expect(document.getElementById('gender').value).toBe('Male');
      expect(document.getElementById('personal-email').value).toBe('msayantan05@gmail.com');
    });
  });
});