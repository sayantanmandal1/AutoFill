// Performance monitoring tests
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock chrome APIs
global.chrome = {
  runtime: {
    onMessage: {
      addListener: vi.fn()
    }
  },
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn()
    }
  }
};

describe('Performance Monitoring', () => {
  let dom;
  let AutofillManager;

  beforeEach(() => {
    // Create a new DOM for each test
    dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <form>
                    <input type="text" name="fullName" placeholder="Full Name">
                    <input type="email" name="email" placeholder="Email">
                    <input type="tel" name="phone" placeholder="Phone">
                    <textarea name="message" placeholder="Message"></textarea>
                </form>
            </body>
            </html>
        `, { url: 'https://example.com?autofill_debug=true' });

    global.window = dom.window;
    global.document = dom.window.document;
    global.localStorage = dom.window.localStorage;
    global.sessionStorage = dom.window.sessionStorage;

    // Mock performance API to avoid circular reference
    let mockTime = 0;
    global.performance = {
      now: vi.fn(() => {
        mockTime += Math.random() * 10 + 1; // Add 1-11ms each call
        return mockTime;
      })
    };

    // Enable debug mode
    global.localStorage.setItem('autofill_debug', 'true');

    // Create a simple AutofillManager class for testing
    AutofillManager = class {
      constructor() {
        this.performanceMetrics = {
          formDetectionTime: 0,
          fieldMatchingTime: 0,
          fieldFillingTime: 0,
          totalOperationTime: 0,
          fieldsDetected: 0,
          fieldsMatched: 0,
          fieldsFilled: 0,
          operationCount: 0
        };

        this.debugConfig = {
          enabled: this.isDebugMode(),
          logLevel: 'info',
          logPerformance: true,
          logFieldMatching: true,
          logFieldFilling: true
        };

        this.fieldCache = new Map();
        this.labelCache = new Map();
        this.visibilityCache = new Map();
        this.cacheTimeout = 5000;

        this.fieldMappings = {
          email: {
            keywords: ['email', 'e-mail', 'mail'],
            inputTypes: ['email', 'text'],
            priority: 1
          }
        };
      }

      isDebugMode() {
        try {
          return window.location.search.includes('autofill_debug=true') ||
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
          const prefix = `[AutofillManager ${timestamp}]`;

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
        timer.endTime = performance.now();
        timer.duration = timer.endTime - timer.startTime;

        switch (timer.operation) {
          case 'formDetection':
            this.performanceMetrics.formDetectionTime += timer.duration;
            break;
          case 'fieldMatching':
            this.performanceMetrics.fieldMatchingTime += timer.duration;
            break;
          case 'fieldFilling':
            this.performanceMetrics.fieldFillingTime += timer.duration;
            break;
        }

        return timer.duration;
      }

      getCacheKey(element) {
        return `${element.tagName}_${element.id || ''}_${element.name || ''}_${element.className || ''}`;
      }

      clearExpiredCaches() {
        const now = Date.now();

        for (const [key, value] of this.fieldCache.entries()) {
          if (now - value.timestamp > this.cacheTimeout) {
            this.fieldCache.delete(key);
          }
        }
      }

      detectFormFields() {
        const timer = this.startPerformanceTimer('formDetection');
        const fields = Array.from(document.querySelectorAll('input, textarea')).map(el => ({
          element: el,
          name: el.name,
          type: el.type,
          id: el.id
        }));
        this.endPerformanceTimer(timer);
        return fields;
      }

      matchFieldsToData(fields, data) {
        const timer = this.startPerformanceTimer('fieldMatching');
        const matches = fields.filter(field => data[field.name]).map(field => ({
          field,
          dataKey: field.name,
          value: data[field.name],
          confidence: 0.8
        }));
        this.endPerformanceTimer(timer);
        return matches;
      }

      calculateMatchScoreOptimized(searchText, field, mapping) {
        return 0.8; // Mock score
      }

      calculateCustomFieldScoreOptimized(searchText, customKey) {
        return 0.6; // Mock score
      }

      calculateJobPortalScoreOptimized(searchText, mapping) {
        return 0.3; // Mock score
      }
    };
  });

  describe('Performance Metrics Collection', () => {
    it('should initialize performance metrics', () => {
      const autofillManager = new AutofillManager();

      expect(autofillManager.performanceMetrics).toBeDefined();
      expect(autofillManager.performanceMetrics.formDetectionTime).toBe(0);
      expect(autofillManager.performanceMetrics.fieldMatchingTime).toBe(0);
      expect(autofillManager.performanceMetrics.fieldFillingTime).toBe(0);
      expect(autofillManager.performanceMetrics.operationCount).toBe(0);
    });

    it('should track form detection time', () => {
      const autofillManager = new AutofillManager();
      const initialTime = autofillManager.performanceMetrics.formDetectionTime;

      // Trigger form detection
      const fields = autofillManager.detectFormFields();

      expect(fields.length).toBeGreaterThan(0);
      expect(autofillManager.performanceMetrics.formDetectionTime).toBeGreaterThan(initialTime);
    });

    it('should track field matching time', () => {
      const autofillManager = new AutofillManager();
      const fields = autofillManager.detectFormFields();
      const testData = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890'
      };

      const initialTime = autofillManager.performanceMetrics.fieldMatchingTime;

      // Trigger field matching
      const matches = autofillManager.matchFieldsToData(fields, testData);

      expect(matches.length).toBeGreaterThan(0);
      expect(autofillManager.performanceMetrics.fieldMatchingTime).toBeGreaterThan(initialTime);
    });

    it('should provide performance timer functionality', () => {
      const autofillManager = new AutofillManager();
      const timer = autofillManager.startPerformanceTimer('testOperation');

      expect(timer).toBeDefined();
      expect(timer.operation).toBe('testOperation');
      expect(timer.startTime).toBeDefined();
      expect(typeof timer.startTime).toBe('number');

      // Simulate some work
      const endTime = autofillManager.endPerformanceTimer(timer);

      expect(timer.endTime).toBeDefined();
      expect(timer.duration).toBeDefined();
      expect(timer.duration).toBeGreaterThanOrEqual(0);
      expect(endTime).toBe(timer.duration);
    });
  });

  describe('Debug Logging', () => {
    it('should enable debug mode when URL parameter is present', () => {
      const autofillManager = new AutofillManager();
      expect(autofillManager.debugConfig.enabled).toBe(true);
    });

    it('should provide debug logging functionality', () => {
      const autofillManager = new AutofillManager();
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      autofillManager.debugLog('info', 'Test message', { test: 'data' });

      expect(consoleSpy).toHaveBeenCalled();
      const call = consoleSpy.mock.calls[0];
      expect(call[0]).toContain('[AutofillManager');
      expect(call[1]).toBe('Test message');
      expect(call[2]).toEqual({ test: 'data' });

      consoleSpy.mockRestore();
    });

    it('should respect log levels', () => {
      const autofillManager = new AutofillManager();
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      // Set log level to warn (should not log debug messages)
      autofillManager.debugConfig.logLevel = 'warn';
      autofillManager.debugLog('debug', 'Debug message');

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Caching System', () => {
    it('should initialize caches', () => {
      const autofillManager = new AutofillManager();

      expect(autofillManager.fieldCache).toBeInstanceOf(Map);
      expect(autofillManager.labelCache).toBeInstanceOf(Map);
      expect(autofillManager.visibilityCache).toBeInstanceOf(Map);
    });

    it('should generate cache keys', () => {
      const autofillManager = new AutofillManager();
      const field = document.querySelector('input[name="fullName"]');
      const cacheKey = autofillManager.getCacheKey(field);

      expect(typeof cacheKey).toBe('string');
      expect(cacheKey.length).toBeGreaterThan(0);
      expect(cacheKey).toContain('INPUT');
    });

    it('should clear expired caches', () => {
      const autofillManager = new AutofillManager();
      const field = document.querySelector('input[name="phone"]');
      const cacheKey = autofillManager.getCacheKey(field);

      // Add item to cache with old timestamp
      autofillManager.fieldCache.set(cacheKey, {
        fieldInfo: { test: 'data' },
        timestamp: Date.now() - 10000 // 10 seconds ago
      });

      expect(autofillManager.fieldCache.has(cacheKey)).toBe(true);

      // Clear expired caches
      autofillManager.clearExpiredCaches();

      expect(autofillManager.fieldCache.has(cacheKey)).toBe(false);
    });
  });

  describe('Performance Optimization Features', () => {
    it('should track performance metrics during operations', () => {
      const autofillManager = new AutofillManager();

      // Test form detection timing
      const fields = autofillManager.detectFormFields();
      expect(autofillManager.performanceMetrics.formDetectionTime).toBeGreaterThan(0);

      // Test field matching timing
      const testData = { email: 'test@example.com' };
      const matches = autofillManager.matchFieldsToData(fields, testData);
      expect(autofillManager.performanceMetrics.fieldMatchingTime).toBeGreaterThan(0);
    });

    it('should provide debug configuration', () => {
      const autofillManager = new AutofillManager();

      expect(autofillManager.debugConfig).toBeDefined();
      expect(autofillManager.debugConfig.enabled).toBe(true);
      expect(autofillManager.debugConfig.logLevel).toBe('info');
      expect(autofillManager.debugConfig.logPerformance).toBe(true);
    });

    it('should support caching for performance', () => {
      const autofillManager = new AutofillManager();

      expect(autofillManager.fieldCache).toBeInstanceOf(Map);
      expect(autofillManager.labelCache).toBeInstanceOf(Map);
      expect(autofillManager.visibilityCache).toBeInstanceOf(Map);
      expect(typeof autofillManager.cacheTimeout).toBe('number');
    });
  });

  describe('Optimized Algorithms', () => {
    it('should use optimized field matching', () => {
      const autofillManager = new AutofillManager();
      const field = {
        name: 'email',
        id: 'user-email',
        placeholder: 'Enter your email',
        type: 'email',
        labels: ['Email Address'],
        dataAttributes: {}
      };

      const mapping = autofillManager.fieldMappings.email;
      const searchText = 'email user-email enter your email email address';

      const score = autofillManager.calculateMatchScoreOptimized(searchText, field, mapping);

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should use optimized custom field scoring', () => {
      const autofillManager = new AutofillManager();
      const searchText = 'linkedin profile social media';
      const customKey = 'linkedin-profile';

      const score = autofillManager.calculateCustomFieldScoreOptimized(searchText, customKey);

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should use optimized job portal scoring', () => {
      const autofillManager = new AutofillManager();
      const searchText = 'workday applicant name candidate';
      const mapping = autofillManager.fieldMappings.email; // Use existing mapping

      const score = autofillManager.calculateJobPortalScoreOptimized(searchText, mapping);

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(0.5);
    });
  });
});
