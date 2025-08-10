import { vi } from 'vitest';

// Mock Chrome Extension APIs
global.chrome = {
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn()
    },
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn()
    }
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    },
    getManifest: vi.fn(() => ({
      version: '1.0.0',
      name: 'Test Extension'
    })),
    id: 'test-extension-id'
  },
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  },
  scripting: {
    executeScript: vi.fn()
  },
  commands: {
    onCommand: {
      addListener: vi.fn()
    }
  },
  action: {
    onClicked: {
      addListener: vi.fn()
    }
  }
};

// Mock browser APIs for cross-browser compatibility
global.browser = global.chrome;

// Mock DOM APIs that might not be available in jsdom
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock crypto API for password hashing
if (!global.crypto) {
  global.crypto = {};
}
if (!global.crypto.subtle) {
  global.crypto.subtle = {
    digest: vi.fn(async () => new ArrayBuffer(32))
  };
}

// Mock console methods for cleaner test output
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn()
};

// Setup DOM environment
beforeEach(() => {
  // Reset DOM
  if (document.body) {document.body.innerHTML = '';}
  if (document.head) {document.head.innerHTML = '';}

  // Reset all mocks
  vi.clearAllMocks();

  // Recreate chrome API mocks to ensure they exist
  global.chrome = {
    storage: {
      sync: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue(),
        remove: vi.fn().mockResolvedValue(),
        clear: vi.fn().mockResolvedValue()
      },
      local: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue(),
        remove: vi.fn().mockResolvedValue(),
        clear: vi.fn().mockResolvedValue()
      }
    },
    runtime: {
      sendMessage: vi.fn().mockResolvedValue({}),
      onMessage: {
        addListener: vi.fn(),
        removeListener: vi.fn()
      },
      getManifest: vi.fn(() => ({
        version: '1.0.0',
        name: 'Test Extension'
      })),
      id: 'test-extension-id'
    },
    tabs: {
      query: vi.fn().mockResolvedValue([]),
      sendMessage: vi.fn().mockResolvedValue({}),
      create: vi.fn(),
      update: vi.fn()
    },
    scripting: {
      executeScript: vi.fn()
    },
    commands: {
      onCommand: {
        addListener: vi.fn()
      }
    },
    action: {
      onClicked: {
        addListener: vi.fn()
      }
    }
  };

  // Ensure browser API is also available
  global.browser = global.chrome;
});

// Cleanup after each test
afterEach(() => {
  vi.restoreAllMocks();
});

// Global test utilities
global.createMockElement = (tag, attributes = {}) => {
  const element = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'textContent') {
      element.textContent = value;
    } else {
      element.setAttribute(key, value);
    }
  });
  return element;
};

global.createMockForm = (fields = []) => {
  const form = document.createElement('form');
  fields.forEach(field => {
    const input = createMockElement(field.tag || 'input', field);
    form.appendChild(input);
  });
  document.body.appendChild(form);
  return form;
};

global.waitFor = (condition, timeout = 1000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, 10);
      }
    };
    check();
  });
};

// Mock extension storage data
global.mockStorageData = {
  profiles: {
    default: {
      name: 'Default Profile',
      data: {
        fullName: 'Test User',
        email: 'test@example.com',
        studentNumber: '12345',
        phone: '1234567890',
        tenthMarks: '95',
        twelfthMarks: '85',
        ugCgpa: '8.5',
        gender: 'Male',
        campus: 'VIT-AP',
        leetcodeUrl: 'https://leetcode.com/testuser',
        linkedinUrl: 'https://linkedin.com/in/testuser',
        githubUrl: 'https://github.com/testuser',
        resumeUrl: 'https://drive.google.com/file/test',
        portfolioUrl: 'https://testuser.dev',
        customFields: {}
      }
    }
  },
  settings: {
    autoFillEnabled: true,
    blacklistedDomains: [],
    passwordProtected: false,
    currentProfile: 'default'
  }
};

// Helper to setup mock storage with test data
global.setupMockStorage = (data = mockStorageData) => {
  chrome.storage.sync.get.mockImplementation((keys) => {
    if (typeof keys === 'string') {
      return Promise.resolve({ [keys]: data[keys] });
    }
    if (Array.isArray(keys)) {
      const result = {};
      keys.forEach(key => {
        if (data[key] !== undefined) {
          result[key] = data[key];
        }
      });
      return Promise.resolve(result);
    }
    return Promise.resolve(data);
  });
};
