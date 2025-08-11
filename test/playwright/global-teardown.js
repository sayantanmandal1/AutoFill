/**
 * Playwright Global Teardown
 * Cleanup after browser compatibility tests
 */

import fs from 'fs';
import path from 'path';

async function globalTeardown() {
  console.log('🧹 Cleaning up browser compatibility test environment...');

  // Generate test summary report
  const testResultsDir = path.join(process.cwd(), 'test-results');
  const summaryPath = path.join(testResultsDir, 'browser-compatibility-summary.json');
  
  const summary = {
    timestamp: new Date().toISOString(),
    browsers: ['chromium', 'chrome', 'msedge'],
    testCompleted: true,
    resultsLocation: testResultsDir
  };

  try {
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log('✅ Test summary generated');
  } catch (error) {
    console.warn('⚠️ Could not generate test summary:', error.message);
  }

  console.log('✅ Browser compatibility test cleanup completed');
}

export default globalTeardown;