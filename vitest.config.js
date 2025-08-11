import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test environment
    environment: 'jsdom',

    // Global test setup
    globals: true,
    setupFiles: ['./test/setup.js'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'test/**',
        'scripts/**',
        'docs/**',
        '.github/**',
        '*.config.js',
        'coverage/**'
      ],
      thresholds: {
        global: {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95
        }
      },
      include: [
        'storage.js',
        'content.js',
        'background.js',
        'popup.js'
      ]
    },

    // Test file patterns
    include: [
      'test/**/*.test.js',
      'test/**/*.spec.js'
    ],

    // Test timeout
    testTimeout: 10000,

    // Reporter configuration
    reporter: ['verbose', 'json'],
    outputFile: {
      json: './test-results.json'
    },

    // Mock configuration
    mockReset: true,
    clearMocks: true,
    restoreMocks: true
  },

  // Define global variables for browser extension APIs
  define: {
    global: 'globalThis'
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': new URL('./', import.meta.url).pathname
    }
  }
});
