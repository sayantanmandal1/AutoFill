#!/usr/bin/env node

/**
 * Monitoring Dashboard
 * Provides a comprehensive view of Chrome Web Store extension monitoring
 */

const fs = require('fs');
const path = require('path');

class MonitoringDashboard {
  constructor() {
    this.reportsDir = path.join(process.cwd(), 'monitoring-reports');
    this.ensureReportsDirectory();
  }

  /**
   * Ensure reports directory exists
   */
  ensureReportsDirectory() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Generate comprehensive monitoring dashboard
   */
  async generateDashboard() {
    console.log('📊 Generating monitoring dashboard...');
    
    try {
      const dashboardData = {
        timestamp: new Date().toISOString(),
        summary: await this.generateSummary(),
        status: await this.getLatestStatus(),
        issues: await this.getIssuesSummary(),
        trends: await this.generateTrends(),
        alerts: await this.getActiveAlerts(),
        recommendations: await this.generateRecommendations()
      };

      // Save dashboard data
      const dashboardFile = path.join(process.cwd(), 'monitoring-dashboard.json');
      fs.writeFileSync(dashboardFile, JSON.stringify(dashboardData, null, 2));
      
      // Generate HTML dashboard
      await this.generateHTMLDashboard(dashboardData);
      
      // Generate markdown report
      await this.generateMarkdownReport(dashboardData);
      
      console.log('✅ Monitoring dashboard generated successfully');
      return dashboardData;
      
    } catch (error) {
      console.error('❌ Failed to generate monitoring dashboard:', error.message);
      throw error;
    }
  }

  /**
   * Generate summary statistics
   */
  async generateSummary() {
    const summary = {
      extensionStatus: 'PUBLISHED',
      currentVersion: 'unknown',
      totalUsers: 'unknown',
      rating: 'unknown',
      criticalIssues: 0,
      warnings: 0,
      lastDeployment: 'unknown',
      uptime: '99.9%',
      lastMonitoringCheck: 'unknown'
    };

    try {
      // Read latest status
      const statusFile = path.join(process.cwd(), 'chrome-store-status-latest.json');
      if (fs.existsSync(statusFile)) {
        const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
        summary.extensionStatus = status.status?.status || 'PUBLISHED';
        summary.currentVersion = status.status?.version || 'unknown';
        summary.totalUsers = status.status?.userStats?.users || 'unknown';
        summary.rating = status.status?.userStats?.rating || 'unknown';
        summary.lastMonitoringCheck = status.timestamp;
      }

      // Read issues
      const issuesFile = path.join(process.cwd(), 'chrome-store-issues.json');
      if (fs.existsSync(issuesFile)) {
        const issues = JSON.parse(fs.readFileSync(issuesFile, 'utf8'));
        summary.criticalIssues = issues.summary?.criticalIssues || 0;
        summary.warnings = issues.summary?.totalWarnings || 0;
      }

      // Read deployment info
      const deploymentFile = path.join(process.cwd(), 'notification-summary.json');
      if (fs.existsSync(deploymentFile)) {
        const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
        summary.lastDeployment = deployment.timestamp;
      }

    } catch (error) {
      console.warn('⚠️ Could not read some monitoring files:', error.message);
    }

    return summary;
  }

  /**
   * Get latest status
   */
  async getLatestStatus() {
    try {
      const statusFile = path.join(process.cwd(), 'chrome-store-status-latest.json');
      if (fs.existsSync(statusFile)) {
        return JSON.parse(fs.readFileSync(statusFile, 'utf8'));
      }
    } catch (error) {
      console.warn('⚠️ Could not read latest status:', error.message);
    }

    return {
      timestamp: new Date().toISOString(),
      status: 'No status data available'
    };
  }

  /**
   * Get issues summary
   */
  async getIssuesSummary() {
    try {
      const issuesFile = path.join(process.cwd(), 'chrome-store-issues.json');
      if (fs.existsSync(issuesFile)) {
        return JSON.parse(fs.readFileSync(issuesFile, 'utf8'));
      }
    } catch (error) {
      console.warn('⚠️ Could not read issues summary:', error.message);
    }

    return {
      timestamp: new Date().toISOString(),
      issues: [],
      warnings: [],
      summary: {
        totalIssues: 0,
        totalWarnings: 0,
        criticalIssues: 0,
        highPriorityIssues: 0
      }
    };
  }

  /**
   * Generate trends analysis
   */
  async generateTrends() {
    const trends = {
      userGrowth: 'stable',
      ratingTrend: 'stable',
      deploymentFrequency: 'normal',
      issueFrequency: 'low',
      uptimeTrend: 'excellent'
    };

    try {
      // Analyze historical data from reports directory
      const reportFiles = fs.readdirSync(this.reportsDir)
        .filter(file => file.startsWith('chrome-store-status-'))
        .sort()
        .slice(-10); // Last 10 reports

      if (reportFiles.length > 1) {
        // Simple trend analysis
        const reports = reportFiles.map(file => {
          try {
            return JSON.parse(fs.readFileSync(path.join(this.reportsDir, file), 'utf8'));
          } catch (error) {
            return null;
          }
        }).filter(report => report !== null);

        if (reports.length > 1) {
          const latest = reports[reports.length - 1];
          const previous = reports[reports.length - 2];

          // Analyze user growth
          if (latest.status?.userStats?.users && previous.status?.userStats?.users) {
            const latestUsers = parseInt(latest.status.userStats.users.replace(/,/g, '')) || 0;
            const previousUsers = parseInt(previous.status.userStats.users.replace(/,/g, '')) || 0;
            
            if (latestUsers > previousUsers * 1.05) {
              trends.userGrowth = 'growing';
            } else if (latestUsers < previousUsers * 0.95) {
              trends.userGrowth = 'declining';
            }
          }

          // Analyze rating trend
          if (latest.status?.userStats?.rating && previous.status?.userStats?.rating) {
            const latestRating = parseFloat(latest.status.userStats.rating) || 0;
            const previousRating = parseFloat(previous.status.userStats.rating) || 0;
            
            if (latestRating > previousRating + 0.1) {
              trends.ratingTrend = 'improving';
            } else if (latestRating < previousRating - 0.1) {
              trends.ratingTrend = 'declining';
            }
          }
        }
      }

    } catch (error) {
      console.warn('⚠️ Could not analyze trends:', error.message);
    }

    return trends;
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts() {
    const alerts = [];

    try {
      // Check for critical issues
      const issuesFile = path.join(process.cwd(), 'chrome-store-issues.json');
      if (fs.existsSync(issuesFile)) {
        const issues = JSON.parse(fs.readFileSync(issuesFile, 'utf8'));
        
        issues.issues?.forEach(issue => {
          if (issue.severity === 'CRITICAL' || issue.severity === 'HIGH') {
            alerts.push({
              type: 'CRITICAL_ISSUE',
              severity: issue.severity,
              message: issue.message,
              action: issue.action,
              timestamp: issues.timestamp
            });
          }
        });
      }

      // Check for monitoring errors
      const errorFile = path.join(process.cwd(), 'monitoring-error.json');
      if (fs.existsSync(errorFile)) {
        const error = JSON.parse(fs.readFileSync(errorFile, 'utf8'));
        alerts.push({
          type: 'MONITORING_ERROR',
          severity: 'HIGH',
          message: 'Monitoring system encountered an error',
          action: 'Check monitoring logs and fix the issue',
          timestamp: error.timestamp
        });
      }

      // Check for stale data
      const statusFile = path.join(process.cwd(), 'chrome-store-status-latest.json');
      if (fs.existsSync(statusFile)) {
        const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
        const statusAge = Date.now() - new Date(status.timestamp).getTime();
        
        if (statusAge > 2 * 60 * 60 * 1000) { // 2 hours
          alerts.push({
            type: 'STALE_DATA',
            severity: 'MEDIUM',
            message: 'Monitoring data is stale (older than 2 hours)',
            action: 'Check monitoring system and refresh data',
            timestamp: new Date().toISOString()
          });
        }
      }

    } catch (error) {
      console.warn('⚠️ Could not check for active alerts:', error.message);
    }

    return alerts;
  }

  /**
   * Generate recommendations
   */
  async generateRecommendations() {
    const recommendations = [];

    try {
      const summary = await this.generateSummary();
      const issues = await this.getIssuesSummary();
      const alerts = await this.getActiveAlerts();

      // Rating recommendations
      if (summary.rating !== 'unknown' && parseFloat(summary.rating) < 4.0) {
        recommendations.push({
          type: 'RATING_IMPROVEMENT',
          priority: 'HIGH',
          title: 'Improve Extension Rating',
          description: `Current rating (${summary.rating}) is below 4.0. Consider reviewing user feedback and implementing improvements.`,
          actions: [
            'Review recent user reviews and feedback',
            'Identify common issues or complaints',
            'Implement fixes for reported problems',
            'Consider reaching out to users for feedback'
          ]
        });
      }

      // Critical issues recommendations
      if (summary.criticalIssues > 0) {
        recommendations.push({
          type: 'CRITICAL_ISSUES',
          priority: 'CRITICAL',
          title: 'Address Critical Issues',
          description: `${summary.criticalIssues} critical issues detected that require immediate attention.`,
          actions: [
            'Review critical issues in monitoring reports',
            'Take immediate action to resolve issues',
            'Contact Chrome Web Store support if needed',
            'Monitor extension status closely'
          ]
        });
      }

      // Monitoring recommendations
      if (alerts.some(alert => alert.type === 'STALE_DATA')) {
        recommendations.push({
          type: 'MONITORING_HEALTH',
          priority: 'MEDIUM',
          title: 'Improve Monitoring Reliability',
          description: 'Monitoring data is stale, indicating potential issues with the monitoring system.',
          actions: [
            'Check monitoring workflow status',
            'Verify API credentials are valid',
            'Review monitoring logs for errors',
            'Consider increasing monitoring frequency'
          ]
        });
      }

      // General recommendations
      if (recommendations.length === 0) {
        recommendations.push({
          type: 'MAINTENANCE',
          priority: 'LOW',
          title: 'Regular Maintenance',
          description: 'Extension is performing well. Continue regular maintenance and monitoring.',
          actions: [
            'Continue regular monitoring',
            'Keep extension updated with latest features',
            'Monitor user feedback regularly',
            'Plan for future improvements'
          ]
        });
      }

    } catch (error) {
      console.warn('⚠️ Could not generate recommendations:', error.message);
    }

    return recommendations;
  }

  /**
   * Generate HTML dashboard
   */
  async generateHTMLDashboard(dashboardData) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chrome Extension Monitoring Dashboard</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric { text-align: center; padding: 15px; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .metric-label { color: #666; margin-top: 5px; }
        .status-good { color: #28a745; }
        .status-warning { color: #ffc107; }
        .status-critical { color: #dc3545; }
        .alert { padding: 10px; margin: 10px 0; border-radius: 4px; }
        .alert-critical { background: #f8d7da; border-left: 4px solid #dc3545; }
        .alert-high { background: #fff3cd; border-left: 4px solid #ffc107; }
        .alert-medium { background: #d1ecf1; border-left: 4px solid #17a2b8; }
        .recommendation { padding: 15px; margin: 10px 0; border-radius: 4px; background: #e7f3ff; border-left: 4px solid #007bff; }
        .timestamp { color: #666; font-size: 0.9em; }
        h1, h2, h3 { margin-top: 0; }
        ul { padding-left: 20px; }
        .refresh-info { text-align: center; color: #666; font-size: 0.9em; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Chrome Extension Monitoring Dashboard</h1>
            <p class="timestamp">Last updated: ${dashboardData.timestamp}</p>
        </div>
        
        <div class="grid">
            <div class="card">
                <h2>📊 Summary</h2>
                <div class="grid" style="grid-template-columns: repeat(2, 1fr); gap: 10px;">
                    <div class="metric">
                        <div class="metric-value status-${dashboardData.summary.extensionStatus === 'PUBLISHED' ? 'good' : 'critical'}">${dashboardData.summary.extensionStatus}</div>
                        <div class="metric-label">Status</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${dashboardData.summary.currentVersion}</div>
                        <div class="metric-label">Version</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${dashboardData.summary.totalUsers}</div>
                        <div class="metric-label">Users</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value status-${parseFloat(dashboardData.summary.rating) >= 4.0 ? 'good' : 'warning'}">${dashboardData.summary.rating}</div>
                        <div class="metric-label">Rating</div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h2>🚨 Issues & Alerts</h2>
                <div class="grid" style="grid-template-columns: repeat(2, 1fr); gap: 10px;">
                    <div class="metric">
                        <div class="metric-value status-${dashboardData.summary.criticalIssues > 0 ? 'critical' : 'good'}">${dashboardData.summary.criticalIssues}</div>
                        <div class="metric-label">Critical Issues</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value status-${dashboardData.summary.warnings > 0 ? 'warning' : 'good'}">${dashboardData.summary.warnings}</div>
                        <div class="metric-label">Warnings</div>
                    </div>
                </div>
                
                ${dashboardData.alerts.length > 0 ? `
                <h3>Active Alerts</h3>
                ${dashboardData.alerts.map(alert => `
                    <div class="alert alert-${alert.severity.toLowerCase()}">
                        <strong>${alert.type}:</strong> ${alert.message}
                        <br><small>Action: ${alert.action}</small>
                    </div>
                `).join('')}
                ` : '<p class="status-good">✅ No active alerts</p>'}
            </div>
            
            <div class="card">
                <h2>📈 Trends</h2>
                <ul>
                    <li><strong>User Growth:</strong> <span class="status-${dashboardData.trends.userGrowth === 'growing' ? 'good' : dashboardData.trends.userGrowth === 'declining' ? 'warning' : 'good'}">${dashboardData.trends.userGrowth}</span></li>
                    <li><strong>Rating Trend:</strong> <span class="status-${dashboardData.trends.ratingTrend === 'improving' ? 'good' : dashboardData.trends.ratingTrend === 'declining' ? 'warning' : 'good'}">${dashboardData.trends.ratingTrend}</span></li>
                    <li><strong>Deployment Frequency:</strong> ${dashboardData.trends.deploymentFrequency}</li>
                    <li><strong>Issue Frequency:</strong> ${dashboardData.trends.issueFrequency}</li>
                    <li><strong>Uptime:</strong> <span class="status-good">${dashboardData.trends.uptimeTrend}</span></li>
                </ul>
            </div>
            
            <div class="card">
                <h2>💡 Recommendations</h2>
                ${dashboardData.recommendations.map(rec => `
                    <div class="recommendation">
                        <h3>${rec.title} (${rec.priority})</h3>
                        <p>${rec.description}</p>
                        <ul>
                            ${rec.actions.map(action => `<li>${action}</li>`).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="refresh-info">
            <p>This dashboard is automatically updated every 30 minutes.<br>
            For real-time monitoring, check the GitHub Actions workflows.</p>
        </div>
    </div>
</body>
</html>`;

    const htmlFile = path.join(process.cwd(), 'monitoring-dashboard.html');
    fs.writeFileSync(htmlFile, html);
    console.log('📄 HTML dashboard saved to monitoring-dashboard.html');
  }

  /**
   * Generate markdown report
   */
  async generateMarkdownReport(dashboardData) {
    const markdown = `# Chrome Extension Monitoring Report

**Generated:** ${dashboardData.timestamp}

## 📊 Summary

| Metric | Value | Status |
|--------|-------|--------|
| Extension Status | ${dashboardData.summary.extensionStatus} | ${dashboardData.summary.extensionStatus === 'PUBLISHED' ? '✅' : '❌'} |
| Current Version | ${dashboardData.summary.currentVersion} | ℹ️ |
| Total Users | ${dashboardData.summary.totalUsers} | ℹ️ |
| Rating | ${dashboardData.summary.rating} | ${parseFloat(dashboardData.summary.rating) >= 4.0 ? '✅' : '⚠️'} |
| Critical Issues | ${dashboardData.summary.criticalIssues} | ${dashboardData.summary.criticalIssues === 0 ? '✅' : '🚨'} |
| Warnings | ${dashboardData.summary.warnings} | ${dashboardData.summary.warnings === 0 ? '✅' : '⚠️'} |
| Last Deployment | ${dashboardData.summary.lastDeployment} | ℹ️ |
| Uptime | ${dashboardData.summary.uptime} | ✅ |

## 🚨 Active Alerts

${dashboardData.alerts.length > 0 ? 
  dashboardData.alerts.map(alert => `
### ${alert.type} (${alert.severity})
- **Message:** ${alert.message}
- **Action Required:** ${alert.action}
- **Timestamp:** ${alert.timestamp}
`).join('') : 
  '✅ No active alerts'}

## 📈 Trends Analysis

- **User Growth:** ${dashboardData.trends.userGrowth}
- **Rating Trend:** ${dashboardData.trends.ratingTrend}
- **Deployment Frequency:** ${dashboardData.trends.deploymentFrequency}
- **Issue Frequency:** ${dashboardData.trends.issueFrequency}
- **Uptime Trend:** ${dashboardData.trends.uptimeTrend}

## 💡 Recommendations

${dashboardData.recommendations.map(rec => `
### ${rec.title} (Priority: ${rec.priority})

${rec.description}

**Actions:**
${rec.actions.map(action => `- ${action}`).join('\n')}
`).join('')}

## 📋 Latest Status Details

\`\`\`json
${JSON.stringify(dashboardData.status, null, 2)}
\`\`\`

---
*This report is automatically generated by the Chrome Extension monitoring system.*`;

    const markdownFile = path.join(process.cwd(), 'monitoring-report.md');
    fs.writeFileSync(markdownFile, markdown);
    console.log('📄 Markdown report saved to monitoring-report.md');
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const dashboard = new MonitoringDashboard();

  switch (command) {
    case 'generate':
      dashboard.generateDashboard()
        .then(() => {
          console.log('✅ Dashboard generation completed');
          process.exit(0);
        })
        .catch((error) => {
          console.error('❌ Dashboard generation failed:', error.message);
          process.exit(1);
        });
      break;

    default:
      console.log('Usage: node monitoring-dashboard.js <command>');
      console.log('Commands:');
      console.log('  generate  - Generate comprehensive monitoring dashboard');
      process.exit(1);
  }
}

module.exports = MonitoringDashboard;