# Chrome Extension Monitoring System

This document describes the comprehensive monitoring and notification system for the Chrome Extension CI/CD pipeline.

## Overview

The monitoring system provides:
- **Real-time monitoring** of Chrome Web Store extension status
- **Automated notifications** for deployment success/failure
- **Issue tracking** with automatic GitHub issue creation
- **Email alerts** for critical events
- **Monitoring dashboard** with comprehensive reporting

## Components

### 1. Notification Manager (`scripts/notification-manager.js`)

Handles all types of notifications including:
- Deployment success/failure notifications
- Slack notifications (configurable)
- Email notifications (configurable)
- GitHub issue creation data preparation

**Usage:**
```bash
# Send success notification
npm run notify:success [version]

# Send failure notification
npm run notify:failure [version] [error]

# Monitor Chrome Web Store status
node scripts/notification-manager.js monitor [extensionId]
```

### 2. GitHub Issue Manager (`scripts/github-issue-manager.js`)

Automatically creates GitHub issues for:
- Deployment failures
- Chrome Web Store upload failures
- Test failures
- Critical monitoring alerts

**Usage:**
```bash
# Create deployment failure issue
npm run issues:deployment-failure [version] [error]

# Create Chrome Web Store failure issue
npm run issues:chrome-store-failure [version] [error]

# Create test failure issue
npm run issues:test-failure
```

### 3. Chrome Web Store Monitor (`scripts/chrome-store-monitor.js`)

Monitors Chrome Web Store status and detects:
- Extension status changes (published, rejected, suspended)
- User statistics changes
- Rating changes
- Policy violations

**Usage:**
```bash
# Perform single monitoring check
npm run monitor:check

# Start continuous monitoring
npm run monitor:start

# Display latest status
npm run monitor:status
```

### 4. Email Notification Service (`scripts/email-notification-service.js`)

Sends HTML and text email notifications for:
- Deployment success/failure
- Critical Chrome Web Store alerts
- Daily monitoring summaries

**Usage:**
```bash
# Send deployment success email
npm run email:success [version]

# Send deployment failure email
npm run email:failure [version] [error]

# Send critical alert email
npm run email:critical [extensionId]

# Send monitoring summary email
npm run email:summary
```

### 5. Monitoring Dashboard (`scripts/monitoring-dashboard.js`)

Generates comprehensive monitoring reports:
- HTML dashboard with visual metrics
- Markdown reports for documentation
- Trend analysis and recommendations

**Usage:**
```bash
# Generate monitoring dashboard
npm run monitor:dashboard
```

## GitHub Actions Integration

### CI/CD Pipeline (`.github/workflows/ci-cd.yml`)

Enhanced with monitoring features:
- Success/failure notifications
- Automatic issue creation for failures
- Test result monitoring
- Email notifications

### Chrome Web Store Deployment (`.github/workflows/chrome-store-deploy.yml`)

Includes:
- Deployment success notifications
- Chrome Web Store failure handling
- Post-deployment monitoring

### Monitoring Workflow (`.github/workflows/monitoring.yml`)

Dedicated monitoring workflow that:
- Runs every 30 minutes
- Checks Chrome Web Store status
- Detects critical issues
- Sends daily summaries
- Creates GitHub issues for critical problems

## Configuration

### Environment Variables

#### Email Configuration
```bash
EMAIL_NOTIFICATIONS_ENABLED=true
EMAIL_RECIPIENTS_DEPLOYMENT=dev@example.com,team@example.com
EMAIL_RECIPIENTS_CRITICAL=admin@example.com,dev@example.com
EMAIL_RECIPIENTS_MONITORING=monitoring@example.com
EMAIL_SENDER_NAME="Chrome Extension CI/CD"
EMAIL_SENDER=noreply@example.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### Slack Configuration
```bash
SLACK_NOTIFICATIONS_ENABLED=true
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
SLACK_CHANNEL=#deployments
```

#### Chrome Web Store Configuration
```bash
CHROME_EXTENSION_ID=your-extension-id
CHROME_CLIENT_ID=your-client-id
CHROME_CLIENT_SECRET=your-client-secret
CHROME_REFRESH_TOKEN=your-refresh-token
```

#### GitHub Configuration
```bash
GITHUB_TOKEN=your-github-token
GITHUB_CREATE_ISSUES=true
GITHUB_ISSUE_ASSIGNEES=username1,username2
```

### GitHub Secrets

Set these secrets in your GitHub repository:

#### Required Secrets
- `CHROME_EXTENSION_ID` - Your Chrome Web Store extension ID
- `CHROME_CLIENT_ID` - Chrome Web Store API client ID
- `CHROME_CLIENT_SECRET` - Chrome Web Store API client secret
- `CHROME_REFRESH_TOKEN` - Chrome Web Store API refresh token

#### Optional Secrets (for enhanced notifications)
- `EMAIL_NOTIFICATIONS_ENABLED` - Enable email notifications (true/false)
- `EMAIL_RECIPIENTS_DEPLOYMENT` - Comma-separated list of deployment notification recipients
- `EMAIL_RECIPIENTS_CRITICAL` - Comma-separated list of critical alert recipients
- `EMAIL_RECIPIENTS_MONITORING` - Comma-separated list of monitoring summary recipients
- `SMTP_HOST` - SMTP server hostname
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password
- `SLACK_NOTIFICATIONS_ENABLED` - Enable Slack notifications (true/false)
- `SLACK_WEBHOOK_URL` - Slack webhook URL
- `GITHUB_ISSUE_ASSIGNEES` - Comma-separated list of GitHub usernames to assign to issues

## Monitoring Features

### Real-time Monitoring
- Extension status monitoring every 30 minutes
- Automatic detection of status changes
- Critical issue alerts within minutes

### Comprehensive Reporting
- HTML dashboard with visual metrics
- Markdown reports for documentation
- Trend analysis and recommendations
- Historical data tracking

### Multi-channel Notifications
- Email notifications with HTML formatting
- Slack notifications (configurable)
- GitHub issue creation
- GitHub Actions workflow notifications

### Issue Management
- Automatic GitHub issue creation for failures
- Detailed error information and troubleshooting steps
- Issue deduplication to prevent spam
- Assignee management

## Monitoring Dashboard

The monitoring dashboard provides:

### Summary Metrics
- Extension status (Published, Rejected, Suspended, etc.)
- Current version information
- User statistics (total users, rating)
- Critical issues and warnings count

### Active Alerts
- Critical issues requiring immediate attention
- System health alerts
- Stale data warnings

### Trend Analysis
- User growth trends
- Rating trends
- Deployment frequency analysis
- Issue frequency tracking

### Recommendations
- Automated recommendations based on monitoring data
- Priority-based action items
- Best practices suggestions

## Troubleshooting

### Common Issues

#### Email Notifications Not Working
1. Check SMTP configuration in GitHub Secrets
2. Verify SMTP credentials are correct
3. Check if email service allows app passwords
4. Review workflow logs for SMTP errors

#### Chrome Web Store Monitoring Failing
1. Verify Chrome Web Store API credentials
2. Check if refresh token has expired
3. Ensure extension ID is correct
4. Review API rate limits

#### GitHub Issues Not Being Created
1. Check GITHUB_TOKEN permissions
2. Verify repository access
3. Review issue creation logs
4. Check if similar issues already exist

### Debugging

#### Enable Debug Logging
Set environment variables for detailed logging:
```bash
DEBUG=true
VERBOSE_LOGGING=true
```

#### Check Monitoring Reports
Review generated files:
- `chrome-store-status-latest.json` - Latest status
- `chrome-store-issues.json` - Detected issues
- `monitoring-error.json` - Error logs
- `notification-summary.json` - Notification status

#### Manual Testing
Test individual components:
```bash
# Test Chrome Web Store monitoring
npm run monitor:check

# Test email notifications
npm run email:success 1.0.0

# Test issue creation
npm run issues:deployment-failure 1.0.0 "Test error"

# Generate dashboard
npm run monitor:dashboard
```

## Best Practices

### Monitoring Configuration
1. Set up email notifications for critical events
2. Configure appropriate recipients for different alert types
3. Use Slack integration for team notifications
4. Set up GitHub issue assignees for faster response

### Issue Management
1. Review and close resolved issues promptly
2. Use issue labels for categorization
3. Set up issue templates for consistency
4. Monitor issue creation frequency

### Performance Optimization
1. Adjust monitoring frequency based on needs
2. Archive old monitoring reports regularly
3. Optimize notification content for clarity
4. Use appropriate alert thresholds

### Security Considerations
1. Rotate API credentials regularly
2. Use encrypted secrets for sensitive data
3. Limit repository access appropriately
4. Monitor for unauthorized access attempts

## Support

For issues with the monitoring system:
1. Check the troubleshooting section above
2. Review GitHub Actions workflow logs
3. Check monitoring reports and error files
4. Create a GitHub issue with detailed information

## Future Enhancements

Planned improvements:
- Integration with additional notification services (Discord, Teams)
- Advanced analytics and reporting
- Machine learning-based anomaly detection
- Mobile app for monitoring alerts
- Integration with external monitoring services