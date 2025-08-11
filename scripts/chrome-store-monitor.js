#!/usr/bin/env node

/**
 * Chrome Web Store Monitor
 * Monitors Chrome Web Store status and extension updates
 */

const fs = require('fs');
const path = require('path');

class ChromeStoreMonitor {
  constructor() {
    this.config = {
      extensionId: process.env.CHROME_EXTENSION_ID,
      clientId: process.env.CHROME_CLIENT_ID,
      clientSecret: process.env.CHROME_CLIENT_SECRET,
      refreshToken: process.env.CHROME_REFRESH_TOKEN,
      checkInterval: parseInt(process.env.MONITOR_INTERVAL) || 300000, // 5 minutes
      maxRetries: 3
    };
    
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Monitor extension status
   */
  async monitorExtensionStatus() {
    console.log(`🔍 Starting Chrome Web Store monitoring for extension: ${this.config.extensionId}`);
    
    try {
      const status = await this.getExtensionStatus();
      await this.saveStatusReport(status);
      await this.checkForIssues(status);
      
      console.log('✅ Monitoring check completed successfully');
      return status;
      
    } catch (error) {
      console.error('❌ Monitoring check failed:', error.message);
      await this.handleMonitoringError(error);
      throw error;
    }
  }

  /**
   * Get extension status from Chrome Web Store API
   */
  async getExtensionStatus() {
    console.log('📊 Fetching extension status from Chrome Web Store API...');
    
    try {
      // Ensure we have a valid access token
      await this.ensureValidToken();
      
      // In a real implementation, you would make an API call to Chrome Web Store
      // For now, we'll simulate the API response
      const status = {
        extensionId: this.config.extensionId,
        status: this.simulateExtensionStatus(),
        version: await this.getCurrentVersion(),
        lastUpdated: new Date().toISOString(),
        publishStatus: this.simulatePublishStatus(),
        reviewStatus: this.simulateReviewStatus(),
        userStats: this.simulateUserStats(),
        errors: [],
        warnings: []
      };

      console.log('📈 Extension status retrieved:', JSON.stringify(status, null, 2));
      return status;
      
    } catch (error) {
      console.error('❌ Failed to get extension status:', error.message);
      throw error;
    }
  }

  /**
   * Simulate extension status (replace with real API call)
   */
  simulateExtensionStatus() {
    const statuses = ['PUBLISHED', 'PENDING_REVIEW', 'REJECTED', 'DRAFT', 'SUSPENDED'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Bias towards PUBLISHED for realistic simulation
    return Math.random() > 0.2 ? 'PUBLISHED' : randomStatus;
  }

  /**
   * Simulate publish status
   */
  simulatePublishStatus() {
    return {
      status: 'PUBLISHED',
      publishedVersion: '1.0.0',
      publishDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      visibility: 'PUBLIC'
    };
  }

  /**
   * Simulate review status
   */
  simulateReviewStatus() {
    return {
      status: 'APPROVED',
      reviewDate: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
      reviewNotes: 'Extension approved for publication'
    };
  }

  /**
   * Simulate user statistics
   */
  simulateUserStats() {
    return {
      users: Math.floor(Math.random() * 10000) + 1000,
      rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0
      ratingCount: Math.floor(Math.random() * 500) + 50,
      weeklyUsers: Math.floor(Math.random() * 5000) + 500
    };
  }

  /**
   * Get current version from manifest
   */
  async getCurrentVersion() {
    try {
      const manifestPath = path.join(process.cwd(), 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        return manifest.version;
      }
      return 'unknown';
    } catch (error) {
      console.warn('⚠️ Could not read version from manifest.json');
      return 'unknown';
    }
  }

  /**
   * Ensure we have a valid access token
   */
  async ensureValidToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return; // Token is still valid
    }

    console.log('🔑 Refreshing Chrome Web Store API access token...');
    
    try {
      // In a real implementation, you would refresh the OAuth token
      // For now, we'll simulate token refresh
      this.accessToken = 'simulated_access_token_' + Date.now();
      this.tokenExpiry = Date.now() + (3600 * 1000); // 1 hour from now
      
      console.log('✅ Access token refreshed successfully');
      
    } catch (error) {
      console.error('❌ Failed to refresh access token:', error.message);
      throw new Error('Authentication failed: Could not refresh access token');
    }
  }

  /**
   * Save status report
   */
  async saveStatusReport(status) {
    const reportDir = path.join(process.cwd(), 'monitoring-reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = path.join(reportDir, `chrome-store-status-${timestamp}.json`);
    
    const report = {
      timestamp: new Date().toISOString(),
      extensionId: this.config.extensionId,
      status: status,
      monitoring: {
        checkInterval: this.config.checkInterval,
        nextCheck: new Date(Date.now() + this.config.checkInterval).toISOString()
      }
    };

    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    // Also save as latest report
    const latestReportFile = path.join(process.cwd(), 'chrome-store-status-latest.json');
    fs.writeFileSync(latestReportFile, JSON.stringify(report, null, 2));
    
    console.log('💾 Status report saved:', reportFile);
  }

  /**
   * Check for issues in the status
   */
  async checkForIssues(status) {
    console.log('🔍 Checking for potential issues...');
    
    const issues = [];
    const warnings = [];

    // Check extension status
    if (status.status === 'REJECTED') {
      issues.push({
        type: 'EXTENSION_REJECTED',
        severity: 'HIGH',
        message: 'Extension has been rejected by Chrome Web Store review',
        action: 'Review rejection reasons and resubmit'
      });
    }

    if (status.status === 'SUSPENDED') {
      issues.push({
        type: 'EXTENSION_SUSPENDED',
        severity: 'CRITICAL',
        message: 'Extension has been suspended from Chrome Web Store',
        action: 'Contact Chrome Web Store support immediately'
      });
    }

    if (status.status === 'PENDING_REVIEW') {
      warnings.push({
        type: 'PENDING_REVIEW',
        severity: 'MEDIUM',
        message: 'Extension is pending review',
        action: 'Monitor review status and wait for approval'
      });
    }

    // Check user statistics
    if (status.userStats.rating < 3.5) {
      warnings.push({
        type: 'LOW_RATING',
        severity: 'MEDIUM',
        message: `Extension rating is low: ${status.userStats.rating}/5.0`,
        action: 'Review user feedback and improve extension quality'
      });
    }

    // Check for version mismatches
    const localVersion = await this.getCurrentVersion();
    if (localVersion !== 'unknown' && status.publishStatus.publishedVersion !== localVersion) {
      warnings.push({
        type: 'VERSION_MISMATCH',
        severity: 'LOW',
        message: `Local version (${localVersion}) differs from published version (${status.publishStatus.publishedVersion})`,
        action: 'Ensure versions are synchronized'
      });
    }

    // Save issues and warnings
    if (issues.length > 0 || warnings.length > 0) {
      await this.saveIssuesReport(issues, warnings);
    }

    // Log results
    if (issues.length > 0) {
      console.log(`🚨 Found ${issues.length} critical issues:`);
      issues.forEach(issue => console.log(`  - ${issue.type}: ${issue.message}`));
    }

    if (warnings.length > 0) {
      console.log(`⚠️ Found ${warnings.length} warnings:`);
      warnings.forEach(warning => console.log(`  - ${warning.type}: ${warning.message}`));
    }

    if (issues.length === 0 && warnings.length === 0) {
      console.log('✅ No issues detected');
    }

    return { issues, warnings };
  }

  /**
   * Save issues report
   */
  async saveIssuesReport(issues, warnings) {
    const issuesReport = {
      timestamp: new Date().toISOString(),
      extensionId: this.config.extensionId,
      issues: issues,
      warnings: warnings,
      summary: {
        totalIssues: issues.length,
        totalWarnings: warnings.length,
        criticalIssues: issues.filter(i => i.severity === 'CRITICAL').length,
        highPriorityIssues: issues.filter(i => i.severity === 'HIGH').length
      }
    };

    const issuesFile = path.join(process.cwd(), 'chrome-store-issues.json');
    fs.writeFileSync(issuesFile, JSON.stringify(issuesReport, null, 2));
    
    console.log('💾 Issues report saved to chrome-store-issues.json');
    
    // Create GitHub issue data for critical issues
    if (issues.some(i => i.severity === 'CRITICAL' || i.severity === 'HIGH')) {
      await this.createCriticalIssueAlert(issues, warnings);
    }
  }

  /**
   * Create critical issue alert
   */
  async createCriticalIssueAlert(issues, warnings) {
    const criticalIssues = issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH');
    
    if (criticalIssues.length === 0) return;

    const alertData = {
      title: `🚨 Critical Chrome Web Store Issues Detected`,
      body: this.generateCriticalIssueBody(criticalIssues, warnings),
      labels: ['bug', 'chrome-web-store', 'critical', 'automated', 'monitoring'],
      assignees: process.env.GITHUB_ISSUE_ASSIGNEES ? 
        process.env.GITHUB_ISSUE_ASSIGNEES.split(',').map(a => a.trim()) : []
    };

    const alertFile = path.join(process.cwd(), 'critical-issue-alert.json');
    fs.writeFileSync(alertFile, JSON.stringify(alertData, null, 2));
    
    console.log('🚨 Critical issue alert created: critical-issue-alert.json');
  }

  /**
   * Generate critical issue body
   */
  generateCriticalIssueBody(issues, warnings) {
    let body = `## 🚨 Critical Chrome Web Store Issues Detected

### Summary
Critical issues have been detected with the Chrome Web Store extension that require immediate attention.

**Extension ID:** ${this.config.extensionId}
**Detection Time:** ${new Date().toISOString()}

### Critical Issues
`;

    issues.forEach((issue, index) => {
      body += `
#### ${index + 1}. ${issue.type} (${issue.severity})
**Message:** ${issue.message}
**Action Required:** ${issue.action}
`;
    });

    if (warnings.length > 0) {
      body += `
### Warnings
`;
      warnings.forEach((warning, index) => {
        body += `
#### ${index + 1}. ${warning.type} (${warning.severity})
**Message:** ${warning.message}
**Recommended Action:** ${warning.action}
`;
      });
    }

    body += `
### Immediate Actions Required
- [ ] Check Chrome Web Store Developer Dashboard
- [ ] Review extension status and any rejection/suspension reasons
- [ ] Contact Chrome Web Store support if needed
- [ ] Implement fixes for identified issues
- [ ] Monitor extension status closely

### Links
- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- [Chrome Web Store Support](https://support.google.com/chrome_webstore/contact/developer_policy)

---
*This alert was automatically generated by the Chrome Web Store monitoring system.*`;

    return body;
  }

  /**
   * Handle monitoring errors
   */
  async handleMonitoringError(error) {
    const errorReport = {
      timestamp: new Date().toISOString(),
      extensionId: this.config.extensionId,
      error: {
        message: error.message,
        stack: error.stack,
        type: error.constructor.name
      },
      context: {
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    const errorFile = path.join(process.cwd(), 'monitoring-error.json');
    fs.writeFileSync(errorFile, JSON.stringify(errorReport, null, 2));
    
    console.log('💾 Error report saved to monitoring-error.json');
  }

  /**
   * Start continuous monitoring
   */
  async startContinuousMonitoring() {
    console.log(`🔄 Starting continuous monitoring (interval: ${this.config.checkInterval}ms)`);
    
    const monitor = async () => {
      try {
        await this.monitorExtensionStatus();
      } catch (error) {
        console.error('❌ Monitoring cycle failed:', error.message);
      }
    };

    // Initial check
    await monitor();
    
    // Set up interval for continuous monitoring
    setInterval(monitor, this.config.checkInterval);
    
    console.log('✅ Continuous monitoring started');
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const monitor = new ChromeStoreMonitor();

  switch (command) {
    case 'check':
      monitor.monitorExtensionStatus()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;

    case 'start':
      monitor.startContinuousMonitoring();
      break;

    case 'status':
      // Read and display latest status
      try {
        const statusFile = path.join(process.cwd(), 'chrome-store-status-latest.json');
        if (fs.existsSync(statusFile)) {
          const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
          console.log('📊 Latest Chrome Web Store Status:');
          console.log(JSON.stringify(status, null, 2));
        } else {
          console.log('⚠️ No status report found. Run "check" command first.');
        }
      } catch (error) {
        console.error('❌ Failed to read status:', error.message);
        process.exit(1);
      }
      break;

    default:
      console.log('Usage: node chrome-store-monitor.js <command>');
      console.log('Commands:');
      console.log('  check  - Perform a single monitoring check');
      console.log('  start  - Start continuous monitoring');
      console.log('  status - Display latest status report');
      process.exit(1);
  }
}

module.exports = ChromeStoreMonitor;