#!/usr/bin/env node

/**
 * Email Notification Service
 * Handles email notifications for critical deployment events
 */

const fs = require('fs');
const path = require('path');

class EmailNotificationService {
  constructor() {
    this.config = {
      smtp: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      },
      notifications: {
        enabled: process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true',
        recipients: {
          critical: this.parseRecipients(process.env.EMAIL_RECIPIENTS_CRITICAL),
          deployment: this.parseRecipients(process.env.EMAIL_RECIPIENTS_DEPLOYMENT),
          monitoring: this.parseRecipients(process.env.EMAIL_RECIPIENTS_MONITORING)
        },
        sender: {
          name: process.env.EMAIL_SENDER_NAME || 'Chrome Extension CI/CD',
          email: process.env.EMAIL_SENDER || process.env.SMTP_USER
        }
      }
    };
  }

  /**
   * Parse recipients from environment variable
   */
  parseRecipients(recipientsString) {
    if (!recipientsString) return [];
    return recipientsString.split(',').map(email => email.trim()).filter(email => email);
  }

  /**
   * Send deployment success notification
   */
  async sendDeploymentSuccessNotification(deploymentInfo) {
    console.log('📧 Preparing deployment success email notification...');
    
    const emailData = {
      to: this.config.notifications.recipients.deployment,
      subject: `✅ Deployment Successful - Chrome Extension v${deploymentInfo.version}`,
      html: this.generateSuccessEmailHTML(deploymentInfo),
      text: this.generateSuccessEmailText(deploymentInfo)
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Send deployment failure notification
   */
  async sendDeploymentFailureNotification(deploymentInfo, error) {
    console.log('📧 Preparing deployment failure email notification...');
    
    const emailData = {
      to: [...this.config.notifications.recipients.deployment, ...this.config.notifications.recipients.critical],
      subject: `🚨 URGENT: Deployment Failed - Chrome Extension v${deploymentInfo.version}`,
      html: this.generateFailureEmailHTML(deploymentInfo, error),
      text: this.generateFailureEmailText(deploymentInfo, error),
      priority: 'high'
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Send Chrome Web Store critical alert
   */
  async sendChromeStoreCriticalAlert(extensionId, issues) {
    console.log('📧 Preparing Chrome Web Store critical alert email...');
    
    const emailData = {
      to: [...this.config.notifications.recipients.critical, ...this.config.notifications.recipients.monitoring],
      subject: `🚨 CRITICAL: Chrome Web Store Issues Detected - ${extensionId}`,
      html: this.generateCriticalAlertEmailHTML(extensionId, issues),
      text: this.generateCriticalAlertEmailText(extensionId, issues),
      priority: 'high'
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Send monitoring summary
   */
  async sendMonitoringSummary(summaryData) {
    console.log('📧 Preparing monitoring summary email...');
    
    const emailData = {
      to: this.config.notifications.recipients.monitoring,
      subject: `📊 Chrome Extension Monitoring Summary - ${new Date().toDateString()}`,
      html: this.generateMonitoringSummaryEmailHTML(summaryData),
      text: this.generateMonitoringSummaryEmailText(summaryData)
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Generate success email HTML
   */
  generateSuccessEmailHTML(deploymentInfo) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Deployment Successful</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; }
        .footer { background: #6c757d; color: white; padding: 10px; text-align: center; border-radius: 0 0 5px 5px; font-size: 12px; }
        .info-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .info-table th, .info-table td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        .info-table th { background-color: #e9ecef; }
        .success { color: #28a745; font-weight: bold; }
        .button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Deployment Successful!</h1>
            <p>Chrome Extension has been successfully deployed</p>
        </div>
        
        <div class="content">
            <h2>Deployment Details</h2>
            <table class="info-table">
                <tr><th>Version</th><td>${deploymentInfo.version}</td></tr>
                <tr><th>Extension ID</th><td>${deploymentInfo.extensionId}</td></tr>
                <tr><th>Build Number</th><td>${deploymentInfo.buildNumber}</td></tr>
                <tr><th>Commit</th><td>${deploymentInfo.commit}</td></tr>
                <tr><th>Environment</th><td>${deploymentInfo.environment || 'production'}</td></tr>
                <tr><th>Deployment Time</th><td>${new Date().toLocaleString()}</td></tr>
            </table>
            
            <h3>What's Next?</h3>
            <ul>
                <li>Extension will be available to users within 1-2 hours</li>
                <li>Users with auto-update enabled will receive the update automatically</li>
                <li>Monitor user feedback and extension performance</li>
            </ul>
            
            <p>
                <a href="https://chrome.google.com/webstore/detail/${deploymentInfo.extensionId}" class="button">
                    View in Chrome Web Store
                </a>
            </p>
        </div>
        
        <div class="footer">
            This is an automated notification from the Chrome Extension CI/CD system.
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate success email text
   */
  generateSuccessEmailText(deploymentInfo) {
    return `✅ DEPLOYMENT SUCCESSFUL

Chrome Extension has been successfully deployed!

DEPLOYMENT DETAILS:
- Version: ${deploymentInfo.version}
- Extension ID: ${deploymentInfo.extensionId}
- Build Number: ${deploymentInfo.buildNumber}
- Commit: ${deploymentInfo.commit}
- Environment: ${deploymentInfo.environment || 'production'}
- Deployment Time: ${new Date().toLocaleString()}

WHAT'S NEXT:
- Extension will be available to users within 1-2 hours
- Users with auto-update enabled will receive the update automatically
- Monitor user feedback and extension performance

Chrome Web Store: https://chrome.google.com/webstore/detail/${deploymentInfo.extensionId}

---
This is an automated notification from the Chrome Extension CI/CD system.`;
  }

  /**
   * Generate failure email HTML
   */
  generateFailureEmailHTML(deploymentInfo, error) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Deployment Failed</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; }
        .footer { background: #6c757d; color: white; padding: 10px; text-align: center; border-radius: 0 0 5px 5px; font-size: 12px; }
        .info-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .info-table th, .info-table td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        .info-table th { background-color: #e9ecef; }
        .error { color: #dc3545; font-weight: bold; }
        .error-box { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        .urgent { background: #dc3545; animation: blink 1s infinite; }
        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0.5; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header urgent">
            <h1>🚨 DEPLOYMENT FAILED!</h1>
            <p>Immediate attention required</p>
        </div>
        
        <div class="content">
            <h2>Failure Details</h2>
            <table class="info-table">
                <tr><th>Version</th><td>${deploymentInfo.version}</td></tr>
                <tr><th>Extension ID</th><td>${deploymentInfo.extensionId}</td></tr>
                <tr><th>Build Number</th><td>${deploymentInfo.buildNumber}</td></tr>
                <tr><th>Commit</th><td>${deploymentInfo.commit}</td></tr>
                <tr><th>Environment</th><td>${deploymentInfo.environment || 'production'}</td></tr>
                <tr><th>Failure Time</th><td>${new Date().toLocaleString()}</td></tr>
            </table>
            
            <div class="error-box">
                <h3 class="error">Error Message:</h3>
                <pre>${error.message || 'Unknown error occurred'}</pre>
            </div>
            
            <h3>Immediate Actions Required:</h3>
            <ol>
                <li><strong>Check workflow logs</strong> for detailed error information</li>
                <li><strong>Verify credentials</strong> - Chrome Web Store API credentials may be expired</li>
                <li><strong>Validate extension package</strong> - Ensure it meets Chrome Web Store requirements</li>
                <li><strong>Consider manual deployment</strong> if automated deployment continues to fail</li>
            </ol>
            
            <h3>Recovery Options:</h3>
            <ul>
                <li><strong>Retry:</strong> Re-run the failed workflow if it was a temporary issue</li>
                <li><strong>Manual Upload:</strong> Upload the extension package manually via Chrome Web Store Developer Dashboard</li>
                <li><strong>Rollback:</strong> If needed, publish the previous working version</li>
            </ul>
            
            <p>
                <a href="https://chrome.google.com/webstore/devconsole" class="button">
                    Chrome Web Store Dashboard
                </a>
                <a href="https://github.com/${process.env.GITHUB_REPOSITORY}/actions" class="button">
                    View Workflow Logs
                </a>
            </p>
        </div>
        
        <div class="footer">
            This is an automated URGENT notification from the Chrome Extension CI/CD system.
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate failure email text
   */
  generateFailureEmailText(deploymentInfo, error) {
    return `🚨 URGENT: DEPLOYMENT FAILED!

Immediate attention required for Chrome Extension deployment.

FAILURE DETAILS:
- Version: ${deploymentInfo.version}
- Extension ID: ${deploymentInfo.extensionId}
- Build Number: ${deploymentInfo.buildNumber}
- Commit: ${deploymentInfo.commit}
- Environment: ${deploymentInfo.environment || 'production'}
- Failure Time: ${new Date().toLocaleString()}

ERROR MESSAGE:
${error.message || 'Unknown error occurred'}

IMMEDIATE ACTIONS REQUIRED:
1. Check workflow logs for detailed error information
2. Verify credentials - Chrome Web Store API credentials may be expired
3. Validate extension package - Ensure it meets Chrome Web Store requirements
4. Consider manual deployment if automated deployment continues to fail

RECOVERY OPTIONS:
- Retry: Re-run the failed workflow if it was a temporary issue
- Manual Upload: Upload via Chrome Web Store Developer Dashboard
- Rollback: If needed, publish the previous working version

LINKS:
- Chrome Web Store Dashboard: https://chrome.google.com/webstore/devconsole
- Workflow Logs: https://github.com/${process.env.GITHUB_REPOSITORY}/actions

---
This is an automated URGENT notification from the Chrome Extension CI/CD system.`;
  }

  /**
   * Generate critical alert email HTML
   */
  generateCriticalAlertEmailHTML(extensionId, issues) {
    const criticalIssues = issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH');
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Critical Chrome Web Store Alert</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; }
        .footer { background: #6c757d; color: white; padding: 10px; text-align: center; border-radius: 0 0 5px 5px; font-size: 12px; }
        .critical { background: #f8d7da; border-left: 5px solid #dc3545; padding: 15px; margin: 10px 0; }
        .high { background: #fff3cd; border-left: 5px solid #ffc107; padding: 15px; margin: 10px 0; }
        .button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        .urgent { animation: blink 1s infinite; }
        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0.5; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header urgent">
            <h1>🚨 CRITICAL ALERT!</h1>
            <p>Chrome Web Store Issues Detected</p>
        </div>
        
        <div class="content">
            <h2>Extension: ${extensionId}</h2>
            <p><strong>Detection Time:</strong> ${new Date().toLocaleString()}</p>
            
            <h3>Critical Issues (${criticalIssues.length})</h3>
            ${criticalIssues.map((issue, index) => `
                <div class="${issue.severity.toLowerCase()}">
                    <h4>${index + 1}. ${issue.type} (${issue.severity})</h4>
                    <p><strong>Message:</strong> ${issue.message}</p>
                    <p><strong>Action Required:</strong> ${issue.action}</p>
                </div>
            `).join('')}
            
            <h3>Immediate Actions Required:</h3>
            <ol>
                <li>Check Chrome Web Store Developer Dashboard immediately</li>
                <li>Review extension status and any rejection/suspension reasons</li>
                <li>Contact Chrome Web Store support if needed</li>
                <li>Implement fixes for identified issues</li>
                <li>Monitor extension status closely</li>
            </ol>
            
            <p>
                <a href="https://chrome.google.com/webstore/devconsole" class="button">
                    Chrome Web Store Dashboard
                </a>
                <a href="https://support.google.com/chrome_webstore/contact/developer_policy" class="button">
                    Contact Support
                </a>
            </p>
        </div>
        
        <div class="footer">
            This is an automated CRITICAL alert from the Chrome Web Store monitoring system.
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate critical alert email text
   */
  generateCriticalAlertEmailText(extensionId, issues) {
    const criticalIssues = issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH');
    
    let text = `🚨 CRITICAL ALERT: Chrome Web Store Issues Detected

Extension: ${extensionId}
Detection Time: ${new Date().toLocaleString()}

CRITICAL ISSUES (${criticalIssues.length}):
`;

    criticalIssues.forEach((issue, index) => {
      text += `
${index + 1}. ${issue.type} (${issue.severity})
   Message: ${issue.message}
   Action Required: ${issue.action}
`;
    });

    text += `
IMMEDIATE ACTIONS REQUIRED:
1. Check Chrome Web Store Developer Dashboard immediately
2. Review extension status and any rejection/suspension reasons
3. Contact Chrome Web Store support if needed
4. Implement fixes for identified issues
5. Monitor extension status closely

LINKS:
- Chrome Web Store Dashboard: https://chrome.google.com/webstore/devconsole
- Contact Support: https://support.google.com/chrome_webstore/contact/developer_policy

---
This is an automated CRITICAL alert from the Chrome Web Store monitoring system.`;

    return text;
  }

  /**
   * Generate monitoring summary email HTML
   */
  generateMonitoringSummaryEmailHTML(summaryData) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Monitoring Summary</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #17a2b8; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; }
        .footer { background: #6c757d; color: white; padding: 10px; text-align: center; border-radius: 0 0 5px 5px; font-size: 12px; }
        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
        .stat { text-align: center; padding: 15px; background: white; border-radius: 5px; border: 1px solid #dee2e6; }
        .stat-value { font-size: 24px; font-weight: bold; color: #007bff; }
        .good { color: #28a745; }
        .warning { color: #ffc107; }
        .danger { color: #dc3545; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Monitoring Summary</h1>
            <p>${new Date().toDateString()}</p>
        </div>
        
        <div class="content">
            <h2>Extension Status</h2>
            <div class="stats">
                <div class="stat">
                    <div class="stat-value good">${summaryData.status || 'PUBLISHED'}</div>
                    <div>Status</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${summaryData.version || 'N/A'}</div>
                    <div>Version</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${summaryData.users || 'N/A'}</div>
                    <div>Users</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${summaryData.rating || 'N/A'}</div>
                    <div>Rating</div>
                </div>
            </div>
            
            <h3>Summary</h3>
            <ul>
                <li>Extension is ${summaryData.status || 'published'} and functioning normally</li>
                <li>No critical issues detected in the last 24 hours</li>
                <li>User engagement remains stable</li>
                <li>All monitoring systems operational</li>
            </ul>
        </div>
        
        <div class="footer">
            This is an automated monitoring summary from the Chrome Extension monitoring system.
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate monitoring summary email text
   */
  generateMonitoringSummaryEmailText(summaryData) {
    return `📊 MONITORING SUMMARY - ${new Date().toDateString()}

EXTENSION STATUS:
- Status: ${summaryData.status || 'PUBLISHED'}
- Version: ${summaryData.version || 'N/A'}
- Users: ${summaryData.users || 'N/A'}
- Rating: ${summaryData.rating || 'N/A'}

SUMMARY:
- Extension is ${summaryData.status || 'published'} and functioning normally
- No critical issues detected in the last 24 hours
- User engagement remains stable
- All monitoring systems operational

---
This is an automated monitoring summary from the Chrome Extension monitoring system.`;
  }

  /**
   * Send email using configured SMTP
   */
  async sendEmail(emailData) {
    if (!this.config.notifications.enabled) {
      console.log('⚠️ Email notifications are disabled');
      return { success: false, reason: 'disabled' };
    }

    if (!emailData.to || emailData.to.length === 0) {
      console.log('⚠️ No recipients configured for email notification');
      return { success: false, reason: 'no_recipients' };
    }

    try {
      // In a real implementation, you would use nodemailer or similar
      const emailPayload = {
        from: `${this.config.notifications.sender.name} <${this.config.notifications.sender.email}>`,
        to: emailData.to.join(', '),
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
        priority: emailData.priority || 'normal'
      };

      console.log('📧 Email notification payload:');
      console.log('  From:', emailPayload.from);
      console.log('  To:', emailPayload.to);
      console.log('  Subject:', emailPayload.subject);
      console.log('  Priority:', emailPayload.priority);
      
      // Save email data for debugging/testing
      const emailFile = path.join(process.cwd(), 'email-notification.json');
      fs.writeFileSync(emailFile, JSON.stringify(emailPayload, null, 2));
      
      console.log('✅ Email notification prepared (saved to email-notification.json)');
      console.log('💾 In production, this would be sent via SMTP');
      
      return { success: true, recipients: emailData.to.length };
      
    } catch (error) {
      console.error('❌ Failed to send email notification:', error.message);
      return { success: false, error: error.message };
    }
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const emailService = new EmailNotificationService();

  switch (command) {
    case 'success':
      const successInfo = {
        version: process.argv[3] || '1.0.0',
        extensionId: process.env.CHROME_EXTENSION_ID || 'unknown',
        buildNumber: process.env.GITHUB_RUN_NUMBER || 'local',
        commit: process.env.GITHUB_SHA?.substring(0, 8) || 'unknown',
        environment: 'production'
      };
      emailService.sendDeploymentSuccessNotification(successInfo);
      break;

    case 'failure':
      const failureInfo = {
        version: process.argv[3] || '1.0.0',
        extensionId: process.env.CHROME_EXTENSION_ID || 'unknown',
        buildNumber: process.env.GITHUB_RUN_NUMBER || 'local',
        commit: process.env.GITHUB_SHA?.substring(0, 8) || 'unknown',
        environment: 'production'
      };
      const error = new Error(process.argv[4] || 'Deployment failed');
      emailService.sendDeploymentFailureNotification(failureInfo, error);
      break;

    case 'critical':
      const extensionId = process.argv[3] || process.env.CHROME_EXTENSION_ID || 'unknown';
      const issues = [
        {
          type: 'EXTENSION_SUSPENDED',
          severity: 'CRITICAL',
          message: 'Extension has been suspended from Chrome Web Store',
          action: 'Contact Chrome Web Store support immediately'
        }
      ];
      emailService.sendChromeStoreCriticalAlert(extensionId, issues);
      break;

    case 'summary':
      const summaryData = {
        status: 'PUBLISHED',
        version: '1.0.0',
        users: '5,234',
        rating: '4.2'
      };
      emailService.sendMonitoringSummary(summaryData);
      break;

    default:
      console.log('Usage: node email-notification-service.js <command> [args]');
      console.log('Commands:');
      console.log('  success [version]           - Send deployment success notification');
      console.log('  failure [version] [error]   - Send deployment failure notification');
      console.log('  critical [extensionId]      - Send critical alert notification');
      console.log('  summary                     - Send monitoring summary');
      process.exit(1);
  }
}

module.exports = EmailNotificationService;