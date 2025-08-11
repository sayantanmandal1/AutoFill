#!/usr/bin/env node

/**
 * GitHub Issue Manager for Deployment Failures
 * Automatically creates and manages GitHub issues for deployment failures
 */

const fs = require('fs');
const path = require('path');

class GitHubIssueManager {
  constructor() {
    this.token = process.env.GITHUB_TOKEN;
    this.repo = process.env.GITHUB_REPOSITORY || 'unknown/unknown';
    this.runId = process.env.GITHUB_RUN_ID;
    this.runNumber = process.env.GITHUB_RUN_NUMBER;
  }

  /**
   * Create deployment failure issue
   */
  async createDeploymentFailureIssue(deploymentInfo, error) {
    console.log('🐙 Creating GitHub issue for deployment failure...');
    
    try {
      const issueData = {
        title: this.generateIssueTitle(deploymentInfo),
        body: this.generateIssueBody(deploymentInfo, error),
        labels: this.getIssueLabels(deploymentInfo, error),
        assignees: this.getAssignees()
      };

      // Save issue data for GitHub Actions to create
      const issueFile = path.join(process.cwd(), 'deployment-failure-issue.json');
      fs.writeFileSync(issueFile, JSON.stringify(issueData, null, 2));
      
      console.log('✅ Issue data prepared:', issueData.title);
      console.log('💾 Issue data saved to deployment-failure-issue.json');
      
      return issueData;
      
    } catch (error) {
      console.error('❌ Failed to prepare deployment failure issue:', error.message);
      throw error;
    }
  }

  /**
   * Create Chrome Web Store failure issue
   */
  async createChromeStoreFailureIssue(deploymentInfo, error) {
    console.log('🐙 Creating GitHub issue for Chrome Web Store failure...');
    
    try {
      const issueData = {
        title: `🏪 Chrome Web Store Upload Failed - v${deploymentInfo.version}`,
        body: this.generateChromeStoreIssueBody(deploymentInfo, error),
        labels: ['bug', 'chrome-web-store', 'deployment', 'automated', 'high-priority'],
        assignees: this.getAssignees()
      };

      // Save issue data for GitHub Actions to create
      const issueFile = path.join(process.cwd(), 'chrome-store-failure-issue.json');
      fs.writeFileSync(issueFile, JSON.stringify(issueData, null, 2));
      
      console.log('✅ Chrome Web Store issue data prepared:', issueData.title);
      console.log('💾 Issue data saved to chrome-store-failure-issue.json');
      
      return issueData;
      
    } catch (error) {
      console.error('❌ Failed to prepare Chrome Web Store failure issue:', error.message);
      throw error;
    }
  }

  /**
   * Create test failure issue
   */
  async createTestFailureIssue(testResults, deploymentInfo) {
    console.log('🐙 Creating GitHub issue for test failures...');
    
    try {
      const issueData = {
        title: `🧪 Test Failures Detected - Build #${deploymentInfo.buildNumber}`,
        body: this.generateTestFailureIssueBody(testResults, deploymentInfo),
        labels: ['bug', 'tests', 'ci-cd', 'automated'],
        assignees: this.getAssignees()
      };

      // Save issue data for GitHub Actions to create
      const issueFile = path.join(process.cwd(), 'test-failure-issue.json');
      fs.writeFileSync(issueFile, JSON.stringify(issueData, null, 2));
      
      console.log('✅ Test failure issue data prepared:', issueData.title);
      console.log('💾 Issue data saved to test-failure-issue.json');
      
      return issueData;
      
    } catch (error) {
      console.error('❌ Failed to prepare test failure issue:', error.message);
      throw error;
    }
  }

  /**
   * Generate issue title
   */
  generateIssueTitle(deploymentInfo) {
    const timestamp = new Date().toISOString().split('T')[0];
    return `🚨 Deployment Failed - v${deploymentInfo.version} (${timestamp})`;
  }

  /**
   * Generate issue body
   */
  generateIssueBody(deploymentInfo, error) {
    const workflowUrl = this.runId ? 
      `https://github.com/${this.repo}/actions/runs/${this.runId}` : 
      'Unknown';

    return `## 🚨 Deployment Failure Report

### Summary
The automated deployment process failed for version **${deploymentInfo.version}**.

### Deployment Information
| Field | Value |
|-------|-------|
| **Version** | ${deploymentInfo.version} |
| **Extension ID** | ${deploymentInfo.extensionId} |
| **Build Number** | ${deploymentInfo.buildNumber} |
| **Commit** | ${deploymentInfo.commit} |
| **Environment** | ${deploymentInfo.environment || 'production'} |
| **Failure Time** | ${new Date().toISOString()} |
| **Workflow Run** | [#${this.runNumber}](${workflowUrl}) |

### Error Details
\`\`\`
${error.message || 'Unknown error occurred'}
${error.stack ? '\n' + error.stack : ''}
\`\`\`

### Environment Information
- **Node Version:** ${process.version}
- **Platform:** ${process.platform}
- **Architecture:** ${process.arch}
- **GitHub Runner:** ${process.env.RUNNER_OS || 'Unknown'}

### Troubleshooting Steps
- [ ] Check the [workflow logs](${workflowUrl}) for detailed error information
- [ ] Verify Chrome Web Store API credentials are valid and not expired
- [ ] Ensure the extension package meets Chrome Web Store requirements
- [ ] Check if there are any Chrome Web Store policy violations
- [ ] Verify all required files are included in the build
- [ ] Test the extension package locally before deployment

### Recovery Options

#### Option 1: Retry Deployment
If this was a temporary issue, you can retry the deployment:
1. Go to the [failed workflow](${workflowUrl})
2. Click "Re-run failed jobs"
3. Monitor the deployment progress

#### Option 2: Manual Deployment
If automated deployment continues to fail:
1. Download the build artifacts from the [failed workflow](${workflowUrl})
2. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. Upload the extension package manually
4. Publish the extension

#### Option 3: Rollback (if needed)
If a previous version was partially deployed:
1. Go to Chrome Web Store Developer Dashboard
2. Select the previous working version
3. Publish the previous version
4. Monitor for user reports

### Next Steps
1. **Immediate:** Investigate the error and determine if manual intervention is needed
2. **Short-term:** Fix the underlying issue that caused the deployment failure
3. **Long-term:** Improve deployment resilience and error handling

### Related Links
- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- [Extension Deployment Guide](docs/CHROME_WEB_STORE_SETUP.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)

---
*This issue was automatically created by the deployment monitoring system at ${new Date().toISOString()}*

/cc @${this.getAssignees().join(' @')}`;
  }

  /**
   * Generate Chrome Web Store specific issue body
   */
  generateChromeStoreIssueBody(deploymentInfo, error) {
    const workflowUrl = this.runId ? 
      `https://github.com/${this.repo}/actions/runs/${this.runId}` : 
      'Unknown';

    return `## 🏪 Chrome Web Store Upload Failure

### Summary
The Chrome Web Store upload failed for version **${deploymentInfo.version}**.

### Upload Information
| Field | Value |
|-------|-------|
| **Version** | ${deploymentInfo.version} |
| **Extension ID** | ${deploymentInfo.extensionId} |
| **Build Number** | ${deploymentInfo.buildNumber} |
| **Commit** | ${deploymentInfo.commit} |
| **Upload Time** | ${new Date().toISOString()} |
| **Workflow Run** | [#${this.runNumber}](${workflowUrl}) |

### Error Details
\`\`\`
${error.message || 'Chrome Web Store upload failed'}
${error.stack ? '\n' + error.stack : ''}
\`\`\`

### Common Chrome Web Store Issues
- **Authentication Error:** API credentials may be expired or invalid
- **Package Validation Error:** Extension package doesn't meet Chrome Web Store requirements
- **Policy Violation:** Extension content violates Chrome Web Store policies
- **Rate Limiting:** Too many upload attempts in a short period
- **Server Error:** Temporary Chrome Web Store API issues

### Immediate Actions Required
- [ ] Check Chrome Web Store API credentials in GitHub Secrets
- [ ] Verify extension package integrity and contents
- [ ] Review Chrome Web Store Developer Dashboard for any policy violations
- [ ] Check if the extension ID is correct and accessible

### Manual Upload Process
1. Download the extension package from [build artifacts](${workflowUrl})
2. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. Select your extension (ID: ${deploymentInfo.extensionId})
4. Upload the new package manually
5. Fill in any required store listing information
6. Submit for review/publish

### API Credentials Check
Verify these GitHub Secrets are set correctly:
- \`CHROME_CLIENT_ID\`
- \`CHROME_CLIENT_SECRET\`
- \`CHROME_REFRESH_TOKEN\`
- \`CHROME_EXTENSION_ID\`

### Prevention Steps
- [ ] Set up monitoring for API credential expiration
- [ ] Add pre-upload validation checks
- [ ] Implement retry logic with exponential backoff
- [ ] Add Chrome Web Store API health checks

---
*This issue was automatically created by the Chrome Web Store upload monitor at ${new Date().toISOString()}*`;
  }

  /**
   * Generate test failure issue body
   */
  generateTestFailureIssueBody(testResults, deploymentInfo) {
    const workflowUrl = this.runId ? 
      `https://github.com/${this.repo}/actions/runs/${this.runId}` : 
      'Unknown';

    return `## 🧪 Test Failures Detected

### Summary
Automated tests failed during the CI/CD pipeline for build **#${deploymentInfo.buildNumber}**.

### Build Information
| Field | Value |
|-------|-------|
| **Build Number** | ${deploymentInfo.buildNumber} |
| **Commit** | ${deploymentInfo.commit} |
| **Branch** | ${process.env.GITHUB_REF_NAME || 'unknown'} |
| **Test Run Time** | ${new Date().toISOString()} |
| **Workflow Run** | [#${this.runNumber}](${workflowUrl}) |

### Test Results Summary
\`\`\`
${JSON.stringify(testResults, null, 2)}
\`\`\`

### Failed Tests
${this.formatFailedTests(testResults)}

### Next Steps
- [ ] Review the [test logs](${workflowUrl}) for detailed failure information
- [ ] Run tests locally to reproduce the failures
- [ ] Fix the failing tests
- [ ] Ensure all tests pass before merging

### Local Testing
To run tests locally:
\`\`\`bash
npm test
npm run test:cross-browser
npm run test:playwright
\`\`\`

---
*This issue was automatically created by the test monitoring system at ${new Date().toISOString()}*`;
  }

  /**
   * Format failed tests for display
   */
  formatFailedTests(testResults) {
    if (!testResults || !testResults.failures) {
      return 'No specific test failure details available.';
    }

    let output = '';
    testResults.failures.forEach((failure, index) => {
      output += `#### ${index + 1}. ${failure.test || 'Unknown Test'}\n`;
      output += `**File:** ${failure.file || 'Unknown'}\n`;
      output += `**Error:** ${failure.error || 'No error message'}\n\n`;
    });

    return output || 'No failed test details available.';
  }

  /**
   * Get issue labels based on deployment info and error
   */
  getIssueLabels(deploymentInfo, error) {
    const labels = ['bug', 'deployment', 'automated'];
    
    // Add priority based on environment
    if (deploymentInfo.environment === 'production') {
      labels.push('high-priority');
    }
    
    // Add specific labels based on error type
    if (error.message?.includes('Chrome Web Store')) {
      labels.push('chrome-web-store');
    }
    
    if (error.message?.includes('test')) {
      labels.push('tests');
    }
    
    if (error.message?.includes('build')) {
      labels.push('build');
    }
    
    return labels;
  }

  /**
   * Get assignees for the issue
   */
  getAssignees() {
    // Get assignees from environment variable or use defaults
    const assigneesEnv = process.env.GITHUB_ISSUE_ASSIGNEES;
    if (assigneesEnv) {
      return assigneesEnv.split(',').map(a => a.trim());
    }
    
    // Default assignees (can be configured)
    return [];
  }

  /**
   * Check if similar issue already exists
   */
  async checkForExistingIssue(deploymentInfo) {
    console.log('🔍 Checking for existing deployment failure issues...');
    
    // In a real implementation, you would query the GitHub API
    // For now, we'll create a simple check file
    const checkFile = path.join(process.cwd(), 'existing-issues-check.json');
    const checkData = {
      version: deploymentInfo.version,
      checkTime: new Date().toISOString(),
      existingIssues: [] // Would be populated by GitHub API call
    };
    
    fs.writeFileSync(checkFile, JSON.stringify(checkData, null, 2));
    console.log('💾 Existing issues check saved to existing-issues-check.json');
    
    return false; // Assume no existing issues for now
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const issueManager = new GitHubIssueManager();

  switch (command) {
    case 'deployment-failure':
      const deploymentInfo = {
        version: process.env.DEPLOYMENT_VERSION || process.argv[3] || '1.0.0',
        extensionId: process.env.CHROME_EXTENSION_ID || 'unknown',
        buildNumber: process.env.GITHUB_RUN_NUMBER || 'local',
        commit: process.env.GITHUB_SHA?.substring(0, 8) || 'unknown',
        environment: process.env.DEPLOYMENT_ENVIRONMENT || 'production'
      };
      const error = new Error(process.argv[4] || 'Deployment failed');
      issueManager.createDeploymentFailureIssue(deploymentInfo, error);
      break;

    case 'chrome-store-failure':
      const chromeStoreInfo = {
        version: process.env.DEPLOYMENT_VERSION || process.argv[3] || '1.0.0',
        extensionId: process.env.CHROME_EXTENSION_ID || 'unknown',
        buildNumber: process.env.GITHUB_RUN_NUMBER || 'local',
        commit: process.env.GITHUB_SHA?.substring(0, 8) || 'unknown'
      };
      const chromeError = new Error(process.argv[4] || 'Chrome Web Store upload failed');
      issueManager.createChromeStoreFailureIssue(chromeStoreInfo, chromeError);
      break;

    case 'test-failure':
      const testInfo = {
        buildNumber: process.env.GITHUB_RUN_NUMBER || 'local',
        commit: process.env.GITHUB_SHA?.substring(0, 8) || 'unknown'
      };
      const testResults = {
        total: 10,
        passed: 7,
        failed: 3,
        failures: [
          { test: 'Chrome compatibility test', file: 'test/browser-compatibility.test.js', error: 'Extension failed to load' },
          { test: 'Form detection test', file: 'test/form-detection.test.js', error: 'Form not detected' },
          { test: 'Storage test', file: 'test/storage.test.js', error: 'Storage access denied' }
        ]
      };
      issueManager.createTestFailureIssue(testResults, testInfo);
      break;

    default:
      console.log('Usage: node github-issue-manager.js <command> [args]');
      console.log('Commands:');
      console.log('  deployment-failure [version] [error] - Create deployment failure issue');
      console.log('  chrome-store-failure [version] [error] - Create Chrome Web Store failure issue');
      console.log('  test-failure - Create test failure issue');
      process.exit(1);
  }
}

module.exports = GitHubIssueManager;