/**
 * Playwright Configuration for Browser Compatibility Testing
 * Tests extension functionality across Chrome, Edge, and Brave browsers
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test/playwright',
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'test-results/playwright-report' }],
    ['json', { outputFile: 'test-results/playwright-results.json' }],
    ['junit', { outputFile: 'test-results/playwright-junit.xml' }],
    ['./test/playwright/browser-compatibility-reporter.js'],
    ['list']
  ],
  
  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:3000',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Record video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Chrome-specific extension testing
        launchOptions: {
          args: [
            '--disable-extensions-except=./build',
            '--load-extension=./build',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
          ]
        }
      },
    },
    
    {
      name: 'chrome',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        launchOptions: {
          args: [
            '--disable-extensions-except=./build',
            '--load-extension=./build',
            '--disable-web-security'
          ]
        }
      },
    },

    {
      name: 'msedge',
      use: { 
        ...devices['Desktop Edge'],
        channel: 'msedge',
        launchOptions: {
          args: [
            '--disable-extensions-except=./build',
            '--load-extension=./build',
            '--disable-web-security'
          ]
        }
      },
    },

    // Note: Brave browser testing requires Brave to be installed
    // Uncomment when Brave is available in CI environment
    /*
    {
      name: 'brave',
      use: { 
        ...devices['Desktop Chrome'],
        executablePath: process.env.BRAVE_EXECUTABLE_PATH || '/usr/bin/brave-browser',
        launchOptions: {
          args: [
            '--disable-extensions-except=./build',
            '--load-extension=./build',
            '--disable-web-security'
          ]
        }
      },
    },
    */
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'npm run test:server',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },

  // Global setup and teardown
  globalSetup: './test/playwright/global-setup.js',
  globalTeardown: './test/playwright/global-teardown.js',

  // Test timeout
  timeout: 30000,
  expect: {
    timeout: 5000
  },

  // Output directory for test results
  outputDir: 'test-results/playwright-output',
});