/**
 * Browser Compatibility Test Reporter
 * Generates comprehensive reports for browser compatibility testing
 */

import fs from 'fs';
import path from 'path';

class BrowserCompatibilityReporter {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      browsers: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      },
      details: []
    };
  }

  onBegin(config, suite) {
    console.log('🚀 Starting browser compatibility tests...');
    this.results.browsers = config.projects.map(p => p.name);
  }

  onTestEnd(test, result) {
    this.results.summary.total++;
    
    if (result.status === 'passed') {
      this.results.summary.passed++;
    } else if (result.status === 'failed') {
      this.results.summary.failed++;
    } else if (result.status === 'skipped') {
      this.results.summary.skipped++;
    }

    this.results.details.push({
      title: test.title,
      browser: test.parent.project()?.name || 'unknown',
      status: result.status,
      duration: result.duration,
      error: result.error?.message || null,
      retry: result.retry
    });
  }

  onEnd(result) {
    const successRate = this.results.summary.total > 0 
      ? ((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1)
      : 0;

    console.log('\n📊 Browser Compatibility Test Results:');
    console.log(`Total Tests: ${this.results.summary.total}`);
    console.log(`Passed: ${this.results.summary.passed}`);
    console.log(`Failed: ${this.results.summary.failed}`);
    console.log(`Skipped: ${this.results.summary.skipped}`);
    console.log(`Success Rate: ${successRate}%`);

    // Generate detailed report by browser
    const browserResults = {};
    this.results.details.forEach(detail => {
      if (!browserResults[detail.browser]) {
        browserResults[detail.browser] = { passed: 0, failed: 0, total: 0 };
      }
      browserResults[detail.browser].total++;
      if (detail.status === 'passed') {
        browserResults[detail.browser].passed++;
      } else if (detail.status === 'failed') {
        browserResults[detail.browser].failed++;
      }
    });

    console.log('\n🌐 Results by Browser:');
    Object.entries(browserResults).forEach(([browser, stats]) => {
      const browserSuccessRate = stats.total > 0 
        ? ((stats.passed / stats.total) * 100).toFixed(1)
        : 0;
      console.log(`${browser}: ${stats.passed}/${stats.total} (${browserSuccessRate}%)`);
    });

    // Save detailed results
    this.saveResults();

    // Generate GitHub Actions summary if in CI
    if (process.env.GITHUB_ACTIONS) {
      this.generateGitHubSummary();
    }
  }

  saveResults() {
    const resultsDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    // Save JSON results
    const jsonPath = path.join(resultsDir, 'browser-compatibility-results.json');
    fs.writeFileSync(jsonPath, JSON.stringify(this.results, null, 2));

    // Generate HTML report
    this.generateHTMLReport(resultsDir);

    console.log(`\n📄 Results saved to: ${resultsDir}`);
  }

  generateHTMLReport(resultsDir) {
    const htmlPath = path.join(resultsDir, 'browser-compatibility-report.html');
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Browser Compatibility Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .summary-card.passed { border-left: 4px solid #28a745; }
        .summary-card.failed { border-left: 4px solid #dc3545; }
        .summary-card.total { border-left: 4px solid #007bff; }
        .browser-results { margin-bottom: 30px; }
        .browser-card { background: #f8f9fa; margin: 10px 0; padding: 15px; border-radius: 8px; }
        .test-details { margin-top: 20px; }
        .test-item { background: white; margin: 5px 0; padding: 10px; border-radius: 4px; border-left: 4px solid #ddd; }
        .test-item.passed { border-left-color: #28a745; }
        .test-item.failed { border-left-color: #dc3545; }
        .test-item.skipped { border-left-color: #ffc107; }
        .error { color: #dc3545; font-size: 0.9em; margin-top: 5px; }
        .timestamp { color: #6c757d; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌐 Browser Compatibility Test Report</h1>
            <p class="timestamp">Generated: ${this.results.timestamp}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card total">
                <h3>Total Tests</h3>
                <div style="font-size: 2em; font-weight: bold;">${this.results.summary.total}</div>
            </div>
            <div class="summary-card passed">
                <h3>Passed</h3>
                <div style="font-size: 2em; font-weight: bold; color: #28a745;">${this.results.summary.passed}</div>
            </div>
            <div class="summary-card failed">
                <h3>Failed</h3>
                <div style="font-size: 2em; font-weight: bold; color: #dc3545;">${this.results.summary.failed}</div>
            </div>
            <div class="summary-card">
                <h3>Success Rate</h3>
                <div style="font-size: 2em; font-weight: bold; color: #007bff;">
                    ${this.results.summary.total > 0 ? ((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1) : 0}%
                </div>
            </div>
        </div>
        
        <div class="browser-results">
            <h2>Results by Browser</h2>
            ${this.generateBrowserResultsHTML()}
        </div>
        
        <div class="test-details">
            <h2>Test Details</h2>
            ${this.generateTestDetailsHTML()}
        </div>
    </div>
</body>
</html>`;

    fs.writeFileSync(htmlPath, html);
  }

  generateBrowserResultsHTML() {
    const browserResults = {};
    this.results.details.forEach(detail => {
      if (!browserResults[detail.browser]) {
        browserResults[detail.browser] = { passed: 0, failed: 0, total: 0, tests: [] };
      }
      browserResults[detail.browser].total++;
      browserResults[detail.browser].tests.push(detail);
      if (detail.status === 'passed') {
        browserResults[detail.browser].passed++;
      } else if (detail.status === 'failed') {
        browserResults[detail.browser].failed++;
      }
    });

    return Object.entries(browserResults).map(([browser, stats]) => {
      const successRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;
      return `
        <div class="browser-card">
          <h3>${browser.charAt(0).toUpperCase() + browser.slice(1)}</h3>
          <p>Tests: ${stats.passed}/${stats.total} passed (${successRate}%)</p>
          <div style="background: #e9ecef; height: 10px; border-radius: 5px; overflow: hidden;">
            <div style="background: #28a745; height: 100%; width: ${successRate}%;"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  generateTestDetailsHTML() {
    return this.results.details.map(detail => `
      <div class="test-item ${detail.status}">
        <strong>${detail.title}</strong>
        <span style="float: right;">
          <span style="background: #e9ecef; padding: 2px 8px; border-radius: 4px; font-size: 0.8em;">
            ${detail.browser}
          </span>
          <span style="margin-left: 10px; color: #6c757d;">
            ${detail.duration}ms
          </span>
        </span>
        ${detail.error ? `<div class="error">Error: ${detail.error}</div>` : ''}
      </div>
    `).join('');
  }

  generateGitHubSummary() {
    const summaryPath = process.env.GITHUB_STEP_SUMMARY;
    if (!summaryPath) return;

    const successRate = this.results.summary.total > 0 
      ? ((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1)
      : 0;

    const summary = `
# 🌐 Browser Compatibility Test Results

## Summary
- **Total Tests:** ${this.results.summary.total}
- **Passed:** ${this.results.summary.passed} ✅
- **Failed:** ${this.results.summary.failed} ❌
- **Success Rate:** ${successRate}%

## Results by Browser
${this.generateGitHubBrowserResults()}

## Test Status
${this.results.summary.failed > 0 ? '❌ Some tests failed' : '✅ All tests passed'}
`;

    fs.appendFileSync(summaryPath, summary);
  }

  generateGitHubBrowserResults() {
    const browserResults = {};
    this.results.details.forEach(detail => {
      if (!browserResults[detail.browser]) {
        browserResults[detail.browser] = { passed: 0, failed: 0, total: 0 };
      }
      browserResults[detail.browser].total++;
      if (detail.status === 'passed') {
        browserResults[detail.browser].passed++;
      } else if (detail.status === 'failed') {
        browserResults[detail.browser].failed++;
      }
    });

    return Object.entries(browserResults).map(([browser, stats]) => {
      const successRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;
      const status = stats.failed === 0 ? '✅' : '❌';
      return `- **${browser}:** ${stats.passed}/${stats.total} (${successRate}%) ${status}`;
    }).join('\n');
  }
}

export default BrowserCompatibilityReporter;