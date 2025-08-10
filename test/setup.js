// Mock Chrome APIs for testing
global.chrome = {
  storage: {
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
  }
};

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});