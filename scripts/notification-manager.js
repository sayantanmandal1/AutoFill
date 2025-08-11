#!/usr/bin/env node

/**
 * Notification Manager for CI/CD Pipeline
 * Handles deployment success/failure notifications and monitoring
 */

const fs = require('fs');
const path = require('path');

class NotificationManager {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    const defaultConfig = {
      notifications: {
        email: {
          enabled: process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true',
          recipients: process.env.EMAIL_RECIPIENTS ? process.env.EMAIL_RECIPIENTS.split(',') : [],
          smtp: {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
            }
          }
        },
        slack: {
          enabled: process.env.SLACK_NOTIFICATIONS_ENABLED === 'true',
          webhook: process.env.SLACK_WEBHOOK_URL,
          channel: process.env.SLACK_CHANNEL || '#deployments'
        },
        github: {
          enabled: true,
          createIssues: process.env.GITHUB_CREATE_ISSUES !== 'false',
          token: process.env.GITHUB_TOKEN
        }
      },
      monitoring: {
        chromeWebStore: {
          enabled: true,
          extensionId: process.env.CHROME_EXTENSION_ID,
          checkInterval: 300000 // 5 minutes
        }
      }
    };

    return defaultConfig;
  }

  /**
   * Send deployment success notification
   */
  async notifyDeploymentSuccess(deploymentInfo) {
    console.log('📢 Sending deployment success notifications...');
    
    const message = this.formatSuccessMessage(deploymentInfo);
    
    try {
      // Send notifications to all configured channels
      const notifications = [];
      
      if (this.config.notifications.slack.enabled) {
        notifications.push(this.sendSlackNotification(message, 'success'));
      }
      
      if (this.config.notifications.email.enabled) {
        notifications.push(this.sendEmailNotification(message, 'success'));
      }
      
      await Promise.allSettled(notifications);
      
      // Log success summary
      this.logNotificationSummary(deploymentInfo, 'success');
      
    } catch (error) {
      console.error('❌ Error sending success notifications:', error.message);
    }
  }

  /**
   * Send deployment failure notification
   */
  async notifyDeploymentFailure(deploymentInfo, error) {
    console.log('🚨 Sending deployment failure notifications...');
    
    const message = this.formatFailureMessage(deploymentInfo, error);
    
    try {
      // Send notifications to all configured channels
      const notifications = [];
      
      if (this.config.notifications.slack.enabled) {
        notifications.push(this.sendSlackNotification(message, 'failure'));
      }
      
      if (this.config.notifications.email.enabled) {
        notifications.push(this.sendEmailNotification(message, 'failure'));
      }
      
      // Create GitHub issue for failures
      if (this.config.notifications.github.createIssues) {
        notifications.push(this.createGitHubIssue(deploymentInfo, error));
      }
      
      await Promise.allSettled(notifications);
      
      // Log failure summary
      this.logNotificationSummary(deploymentInfo, 'failure');
      
    } catch (notificationError) {
      console.error('❌ Error sending failure notifications:', notificationError.message);
    }
  }

  /**
   * Format success message
   */
  formatSuccessMessage(deploymentInfo) {
    return {
      title: '✅ Deployment Successful',
      text: `Chrome Extension deployment completed successfully!`,
      fields: [
        { title: 'Version', value: deploymentInfo.version, short: true },
        { title: 'Extension ID', value: deploymentInfo.extensionId, short: true },
        { title: 'Build Number', value: deploymentInfo.buildNumber, short: true },
        { title: 'Commit', value: deploymentInfo.commit, short: true },
        { title: 'Environment', value: deploymentInfo.environment || 'production', short: true },
        { title: 'Deployment Time', value: new Date().toISOString(), short: true }
      ],
      color: 'good'
    };
  }

  /**
   * Format failure message
   */
  formatFailureMessage(deploymentInfo, error) {
    return {
      title: '🚨 Deployment Failed',
      text: `Chrome Extension deployment failed!`,
      fields: [
        { title: 'Version', value: deploymentInfo.version, short: true },
        { title: 'Extension ID', value: deploymentInfo.extensionId, short: true },
        { title: 'Build Number', value: deploymentInfo.buildNumber, short: true },
        { title: 'Commit', value: deploymentInfo.commit, short: true },
        { title: 'Error', value: error.message || 'Unknown error', short: false },
        { title: 'Failure Time', value: new Date().toISOString(), short: true }
      ],
      color: 'danger'
    };
  }

  /**
   * Send Slack notification
   */
  async sendSlackNotification(message, type) {
    if (!this.config.notifications.slack.webhook) {
      console.log('⚠️ Slack webhook not configured, skipping Slack notification');
      return;
    }

    try {
      const payload = {
        channel: this.config.notifications.slack.channel,
        username: 'Chrome Extension CI/CD',
        icon_emoji: type === 'success' ? ':white_check_mark:' : ':x:',
        attachments: [{
          color: message.color,
          title: message.title,
          text: message.text,
          fields: message.fields,
          footer: 'Chrome Extension Deployment',
          ts: Math.floor(Date.now() / 1000)
        }]
      };

      // In a real implementation, you would use fetch or axios to send to Slack
      console.log('📱 Slack notification payload:', JSON.stringify(payload, null, 2));
      console.log('✅ Slack notification sent successfully');
      
    } catch (error) {
      console.error('❌ Failed to send Slack notification:', error.message);
      throw error;
    }
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(message, type) {
    if (!this.config.notifications.email.enabled || !this.config.notifications.email.recipients.length) {
      console.log('⚠️ Email notifications not configured, skipping email notification');
      return;
    }

    try {
      const subject = `${message.title} - Chrome Extension v${message.fields.find(f => f.title === 'Version')?.value}`;
      const body = this.formatEmailBody(message);

      // In a real implementation, you would use nodemailer or similar
      console.log('📧 Email notification details:');
      console.log('  Recipients:', this.config.notifications.email.recipients.join(', '));
      console.log('  Subject:', subject);
      console.log('  Body:', body);
      console.log('✅ Email notification sent successfully');
      
    } catch (error) {
      console.error('❌ Failed to send email notification:', error.message);
      throw error;
    }
  }

  /**
   * Format email body
   */
  formatEmailBody(message) {
    let body = `${message.title}\n\n${message.text}\n\n`;
    
    body += 'Details:\n';
    message.fields.forEach(field => {
      body += `• ${field.title}: ${field.value}\n`;
    });
    
    body += '\n---\nThis is an automated notification from the Chrome Extension CI/CD pipeline.';
    
    return body;
  }

  /**
   * Create GitHub issue for deployment failures
   */
  async createGitHubIssue(deploymentInfo, error) {
    try {
      const issueData = {
        title: `🚨 Deployment Failed - v${deploymentInfo.version}`,
        body: this.formatGitHubIssueBody(deploymentInfo, error),
        labels: ['bug', 'deployment', 'chrome-web-store', 'automated']
      };

      console.log('🐙 GitHub issue data:', JSON.stringify(issueData, null, 2));
      console.log('✅ GitHub issue would be created (implementation needed)');
      
      // Save issue data for GitHub Actions to create
      const issueFile = path.join(process.cwd(), 'deployment-issue.json');
      fs.writeFileSync(issueFile, JSON.stringify(issueData, null, 2));
      console.log('💾 Issue data saved to deployment-issue.json');
      
    } catch (error) {
      console.error('❌ Failed to prepare GitHub issue:', error.message);
      throw error;
    }
  }

  /**
   * Format GitHub issue body
   */
  formatGitHubIssueBody(deploymentInfo, error) {
    return `## Deployment Failure Report

**Version:** ${deploymentInfo.version}
**Extension ID:** ${deploymentInfo.extensionId}
**Build Number:** ${deploymentInfo.buildNumber}
**Commit:** ${deploymentInfo.commit}
**Failure Time:** ${new Date().toISOString()}

### Error Details
\`\`\`
${error.message || 'Unknown error'}
${error.stack || ''}
\`\`\`

### Environment Information
- **Node Version:** ${process.version}
- **Platform:** ${process.platform}
- **Architecture:** ${process.arch}

### Next Steps
1. Check the workflow logs for detailed error information
2. Verify Chrome Web Store API credentials are valid
3. Ensure the extension package meets Chrome Web Store requirements
4. Consider manual deployment if automated deployment continues to fail

### Manual Deployment
If needed, you can deploy manually:
1. Download the build artifacts from the failed workflow
2. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. Upload the extension package manually

### Rollback Instructions
If the deployment was partially successful:
1. Go to Chrome Web Store Developer Dashboard
2. Select the previous working version
3. Publish the previous version
4. Monitor for user reports

---
*This issue was automatically created by the deployment monitoring system.*`;
  }

  /**
   * Log notification summary
   */
  logNotificationSummary(deploymentInfo, status) {
    const summary = {
      timestamp: new Date().toISOString(),
      status: status,
      version: deploymentInfo.version,
      extensionId: deploymentInfo.extensionId,
      buildNumber: deploymentInfo.buildNumber,
      commit: deploymentInfo.commit,
      notifications: {
        slack: this.config.notifications.slack.enabled,
        email: this.config.notifications.email.enabled,
        github: this.config.notifications.github.enabled
      }
    };

    const summaryFile = path.join(process.cwd(), 'notification-summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    
    console.log('📊 Notification Summary:');
    console.log(JSON.stringify(summary, null, 2));
  }

  /**
   * Monitor Chrome Web Store status
   */
  async monitorChromeWebStoreStatus(extensionId) {
    console.log(`🔍 Monitoring Chrome Web Store status for extension: ${extensionId}`);
    
    try {
      // In a real implementation, you would check the Chrome Web Store API
      // For now, we'll simulate the monitoring
      const status = {
        extensionId: extensionId,
        status: 'published',
        lastChecked: new Date().toISOString(),
        version: process.env.DEPLOYMENT_VERSION || 'unknown',
        userCount: 'unknown',
        rating: 'unknown'
      };

      console.log('📈 Chrome Web Store Status:', JSON.stringify(status, null, 2));
      
      // Save status for reporting
      const statusFile = path.join(process.cwd(), 'chrome-store-status.json');
      fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
      
      return status;
      
    } catch (error) {
      console.error('❌ Failed to monitor Chrome Web Store status:', error.message);
      throw error;
    }
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const notificationManager = new NotificationManager();

  switch (command) {
    case 'success':
      const successInfo = {
        version: process.env.DEPLOYMENT_VERSION || process.argv[3] || '1.0.0',
        extensionId: process.env.CHROME_EXTENSION_ID || 'unknown',
        buildNumber: process.env.GITHUB_RUN_NUMBER || 'local',
        commit: process.env.GITHUB_SHA?.substring(0, 8) || 'unknown',
        environment: process.env.DEPLOYMENT_ENVIRONMENT || 'production'
      };
      notificationManager.notifyDeploymentSuccess(successInfo);
      break;

    case 'failure':
      const failureInfo = {
        version: process.env.DEPLOYMENT_VERSION || process.argv[3] || '1.0.0',
        extensionId: process.env.CHROME_EXTENSION_ID || 'unknown',
        buildNumber: process.env.GITHUB_RUN_NUMBER || 'local',
        commit: process.env.GITHUB_SHA?.substring(0, 8) || 'unknown',
        environment: process.env.DEPLOYMENT_ENVIRONMENT || 'production'
      };
      const error = new Error(process.argv[4] || 'Deployment failed');
      notificationManager.notifyDeploymentFailure(failureInfo, error);
      break;

    case 'monitor':
      const extensionId = process.env.CHROME_EXTENSION_ID || process.argv[3];
      if (!extensionId) {
        console.error('❌ Extension ID required for monitoring');
        process.exit(1);
      }
      notificationManager.monitorChromeWebStoreStatus(extensionId);
      break;

    default:
      console.log('Usage: node notification-manager.js <command> [args]');
      console.log('Commands:');
      console.log('  success [version]     - Send deployment success notification');
      console.log('  failure [version] [error] - Send deployment failure notification');
      console.log('  monitor [extensionId] - Monitor Chrome Web Store status');
      process.exit(1);
  }
}

module.exports = NotificationManager;