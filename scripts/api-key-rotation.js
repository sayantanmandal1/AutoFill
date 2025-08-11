#!/usr/bin/env node

/**
 * API Key Rotation Manager
 * 
 * This script provides automated procedures for rotating API keys and credentials
 * used in the Chrome Web Store deployment pipeline.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { google } = require('googleapis');

class APIKeyRotationManager {
  constructor() {
    this.rotationLog = [];
    this.backupPath = path.join(process.cwd(), '.credential-backups');
    
    // Ensure backup directory exists
    if (!fs.existsSync(this.backupPath)) {
      fs.mkdirSync(this.backupPath, { recursive: true });
    }
  }

  /**
   * Check if credentials need rotation based on age and usage
   * @returns {Object} Rotation status for each credential type
   */
  checkRotationNeeds() {
    const now = new Date();
    const rotationNeeds = {
      timestamp: now.toISOString(),
      checks: []
    };

    // Check Chrome Web Store refresh token (should rotate every 6 months)
    rotationNeeds.checks.push({
      credential: 'CHROME_REFRESH_TOKEN',
      type: 'oauth_refresh_token',
      recommendedInterval: '6 months',
      priority: 'high',
      reason: 'OAuth refresh tokens should be rotated regularly for security',
      rotationMethod: 'oauth_flow',
      needsRotation: true, // Always recommend rotation for security
      lastRotated: 'unknown' // Would need to track this separately
    });

    // Check SMTP credentials (should rotate every 3-6 months)
    if (process.env.SMTP_PASS) {
      rotationNeeds.checks.push({
        credential: 'SMTP_PASS',
        type: 'password',
        recommendedInterval: '3-6 months',
        priority: 'medium',
        reason: 'Email passwords should be rotated regularly',
        rotationMethod: 'manual_update',
        needsRotation: true,
        lastRotated: 'unknown'
      });
    }

    // Check Slack webhook (rotate if compromised or annually)
    if (process.env.SLACK_WEBHOOK_URL) {
      rotationNeeds.checks.push({
        credential: 'SLACK_WEBHOOK_URL',
        type: 'webhook_url',
        recommendedInterval: '12 months or if compromised',
        priority: 'low',
        reason: 'Webhook URLs should be regenerated if compromised',
        rotationMethod: 'regenerate_webhook',
        needsRotation: false, // Only if compromised
        lastRotated: 'unknown'
      });
    }

    // Check GitHub token (if used for API access)
    rotationNeeds.checks.push({
      credential: 'GITHUB_TOKEN',
      type: 'personal_access_token',
      recommendedInterval: '12 months',
      priority: 'medium',
      reason: 'GitHub tokens should be rotated annually',
      rotationMethod: 'regenerate_token',
      needsRotation: false, // GitHub Actions provides this automatically
      lastRotated: 'automatic'
    });

    return rotationNeeds;
  }

  /**
   * Generate new OAuth2 refresh token for Chrome Web Store API
   * @returns {Object} Instructions for manual OAuth flow
   */
  generateOAuthRotationInstructions() {
    const clientId = process.env.CHROME_CLIENT_ID;
    
    if (!clientId) {
      throw new Error('CHROME_CLIENT_ID not found in environment variables');
    }

    const scopes = 'https://www.googleapis.com/auth/chromewebstore';
    const authUrl = `https://accounts.google.com/o/oauth2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=urn:ietf:wg:oauth:2.0:oob&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent`;

    return {
      step: 'oauth_refresh_token_rotation',
      instructions: [
        {
          step: 1,
          action: 'Visit the OAuth2 authorization URL',
          url: authUrl,
          description: 'This will prompt you to authorize the application'
        },
        {
          step: 2,
          action: 'Copy the authorization code',
          description: 'After authorization, you will receive a code'
        },
        {
          step: 3,
          action: 'Exchange code for refresh token',
          command: `node scripts/api-key-rotation.js exchange-code <AUTHORIZATION_CODE>`,
          description: 'Use this script to exchange the code for a new refresh token'
        },
        {
          step: 4,
          action: 'Update GitHub Secrets',
          description: 'Replace CHROME_REFRESH_TOKEN with the new token in GitHub repository secrets'
        },
        {
          step: 5,
          action: 'Test new credentials',
          command: 'node scripts/credential-manager.js test',
          description: 'Verify the new refresh token works correctly'
        }
      ],
      securityNotes: [
        'Perform this rotation in a secure environment',
        'Delete the authorization code after use',
        'Verify the old token is invalidated',
        'Test the new token before deploying'
      ]
    };
  }

  /**
   * Exchange OAuth authorization code for refresh token
   * @param {string} authCode - Authorization code from OAuth flow
   * @returns {Promise<Object>} New refresh token and credentials
   */
  async exchangeAuthCodeForToken(authCode) {
    try {
      const clientId = process.env.CHROME_CLIENT_ID;
      const clientSecret = process.env.CHROME_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error('Missing CHROME_CLIENT_ID or CHROME_CLIENT_SECRET');
      }

      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        'urn:ietf:wg:oauth:2.0:oob'
      );

      const { tokens } = await oauth2Client.getToken(authCode);

      if (!tokens.refresh_token) {
        throw new Error('No refresh token received. Make sure to include prompt=consent in the OAuth URL');
      }

      // Create backup of current token
      await this.backupCurrentCredentials();

      const result = {
        success: true,
        newRefreshToken: tokens.refresh_token,
        accessToken: tokens.access_token,
        expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        tokenType: tokens.token_type,
        rotationTimestamp: new Date().toISOString()
      };

      // Log the rotation
      this.logRotation('CHROME_REFRESH_TOKEN', 'oauth_exchange', result.rotationTimestamp);

      return result;

    } catch (error) {
      return {
        success: false,
        error: error.message,
        troubleshooting: [
          'Ensure the authorization code is correct and not expired',
          'Verify CHROME_CLIENT_ID and CHROME_CLIENT_SECRET are correct',
          'Make sure the OAuth consent screen includes prompt=consent',
          'Check that the Chrome Web Store API is enabled in Google Cloud Console'
        ]
      };
    }
  }

  /**
   * Backup current credentials before rotation
   * @returns {Promise<string>} Path to backup file
   */
  async backupCurrentCredentials() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupPath, `credentials-backup-${timestamp}.json`);

    const credentialsToBackup = {
      timestamp,
      credentials: {}
    };

    // Backup current credential metadata (not the actual secrets)
    const credentialKeys = [
      'CHROME_CLIENT_ID',
      'CHROME_EXTENSION_ID',
      'EMAIL_NOTIFICATIONS_ENABLED',
      'SLACK_NOTIFICATIONS_ENABLED'
    ];

    for (const key of credentialKeys) {
      if (process.env[key]) {
        credentialsToBackup.credentials[key] = {
          present: true,
          length: process.env[key].length,
          hash: crypto.createHash('sha256').update(process.env[key]).digest('hex').substring(0, 8)
        };
      }
    }

    // For sensitive credentials, only store metadata
    const sensitiveKeys = [
      'CHROME_CLIENT_SECRET',
      'CHROME_REFRESH_TOKEN',
      'SMTP_PASS',
      'SLACK_WEBHOOK_URL'
    ];

    for (const key of sensitiveKeys) {
      if (process.env[key]) {
        credentialsToBackup.credentials[key] = {
          present: true,
          length: process.env[key].length,
          hash: crypto.createHash('sha256').update(process.env[key]).digest('hex').substring(0, 8),
          note: 'Sensitive credential - only metadata backed up'
        };
      }
    }

    fs.writeFileSync(backupFile, JSON.stringify(credentialsToBackup, null, 2));
    console.log(`✅ Credentials metadata backed up to ${backupFile}`);
    
    return backupFile;
  }

  /**
   * Generate rotation checklist for manual processes
   * @returns {Object} Comprehensive rotation checklist
   */
  generateRotationChecklist() {
    return {
      title: 'API Key Rotation Checklist',
      timestamp: new Date().toISOString(),
      sections: [
        {
          title: 'Pre-Rotation Preparation',
          tasks: [
            {
              task: 'Backup current credential metadata',
              command: 'node scripts/api-key-rotation.js backup',
              critical: true
            },
            {
              task: 'Validate current credentials are working',
              command: 'node scripts/credential-manager.js test',
              critical: true
            },
            {
              task: 'Schedule maintenance window if needed',
              manual: true,
              critical: false
            },
            {
              task: 'Notify team of planned rotation',
              manual: true,
              critical: false
            }
          ]
        },
        {
          title: 'Chrome Web Store API Rotation',
          tasks: [
            {
              task: 'Generate OAuth authorization URL',
              command: 'node scripts/api-key-rotation.js oauth-instructions',
              critical: true
            },
            {
              task: 'Complete OAuth flow and get authorization code',
              manual: true,
              critical: true
            },
            {
              task: 'Exchange authorization code for new refresh token',
              command: 'node scripts/api-key-rotation.js exchange-code <CODE>',
              critical: true
            },
            {
              task: 'Update CHROME_REFRESH_TOKEN in GitHub Secrets',
              manual: true,
              critical: true
            },
            {
              task: 'Test new refresh token',
              command: 'node scripts/credential-manager.js test',
              critical: true
            }
          ]
        },
        {
          title: 'Email/SMTP Credentials Rotation',
          tasks: [
            {
              task: 'Generate new app password in email provider',
              manual: true,
              critical: true,
              note: 'For Gmail: Google Account > Security > App passwords'
            },
            {
              task: 'Update SMTP_PASS in GitHub Secrets',
              manual: true,
              critical: true
            },
            {
              task: 'Test email notifications',
              command: 'node scripts/email-notification-service.js test',
              critical: true
            }
          ]
        },
        {
          title: 'Slack Webhook Rotation (if compromised)',
          tasks: [
            {
              task: 'Regenerate webhook URL in Slack app settings',
              manual: true,
              critical: true
            },
            {
              task: 'Update SLACK_WEBHOOK_URL in GitHub Secrets',
              manual: true,
              critical: true
            },
            {
              task: 'Test Slack notifications',
              command: 'node scripts/notification-manager.js test',
              critical: true
            }
          ]
        },
        {
          title: 'Post-Rotation Verification',
          tasks: [
            {
              task: 'Run comprehensive credential validation',
              command: 'node scripts/credential-manager.js report',
              critical: true
            },
            {
              task: 'Test full CI/CD pipeline with new credentials',
              manual: true,
              critical: true,
              note: 'Create a test release or trigger workflow manually'
            },
            {
              task: 'Update rotation log and schedule next rotation',
              command: 'node scripts/api-key-rotation.js log-rotation',
              critical: false
            },
            {
              task: 'Clean up backup files older than 90 days',
              command: 'node scripts/api-key-rotation.js cleanup-backups',
              critical: false
            }
          ]
        }
      ],
      emergencyContacts: [
        'Repository administrators for GitHub Secrets access',
        'Google Cloud Console administrators for OAuth credentials',
        'Email provider administrators for SMTP credentials'
      ],
      rollbackProcedure: [
        'Restore previous credentials from GitHub Secrets history',
        'Test restored credentials immediately',
        'Investigate rotation failure cause',
        'Schedule retry with fixes'
      ]
    };
  }

  /**
   * Log credential rotation activity
   * @param {string} credential - Credential that was rotated
   * @param {string} method - Rotation method used
   * @param {string} timestamp - When rotation occurred
   */
  logRotation(credential, method, timestamp) {
    const logEntry = {
      credential,
      method,
      timestamp,
      success: true
    };

    this.rotationLog.push(logEntry);

    // Save to file for persistence
    const logFile = path.join(this.backupPath, 'rotation-log.json');
    let existingLog = [];
    
    if (fs.existsSync(logFile)) {
      try {
        existingLog = JSON.parse(fs.readFileSync(logFile, 'utf8'));
      } catch (error) {
        console.warn('Could not read existing rotation log, starting fresh');
      }
    }

    existingLog.push(logEntry);
    fs.writeFileSync(logFile, JSON.stringify(existingLog, null, 2));
    
    console.log(`✅ Logged rotation of ${credential} using ${method}`);
  }

  /**
   * Clean up old backup files
   * @param {number} maxAgeDays - Maximum age of backup files to keep
   */
  cleanupOldBackups(maxAgeDays = 90) {
    if (!fs.existsSync(this.backupPath)) {
      console.log('No backup directory found');
      return;
    }

    const files = fs.readdirSync(this.backupPath);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(this.backupPath, file);
      const stats = fs.statSync(filePath);

      if (stats.mtime < cutoffDate && file.startsWith('credentials-backup-')) {
        fs.unlinkSync(filePath);
        deletedCount++;
        console.log(`🗑️  Deleted old backup: ${file}`);
      }
    }

    console.log(`✅ Cleanup complete. Deleted ${deletedCount} old backup files.`);
  }

  /**
   * Generate rotation schedule recommendations
   * @returns {Object} Recommended rotation schedule
   */
  generateRotationSchedule() {
    const now = new Date();
    const schedule = {
      generatedAt: now.toISOString(),
      recommendations: []
    };

    // Chrome Web Store refresh token - every 6 months
    const chromeRotation = new Date(now);
    chromeRotation.setMonth(chromeRotation.getMonth() + 6);
    schedule.recommendations.push({
      credential: 'CHROME_REFRESH_TOKEN',
      nextRotation: chromeRotation.toISOString(),
      frequency: 'Every 6 months',
      priority: 'High',
      automated: false,
      calendarReminder: true
    });

    // SMTP password - every 3 months
    if (process.env.SMTP_PASS) {
      const smtpRotation = new Date(now);
      smtpRotation.setMonth(smtpRotation.getMonth() + 3);
      schedule.recommendations.push({
        credential: 'SMTP_PASS',
        nextRotation: smtpRotation.toISOString(),
        frequency: 'Every 3 months',
        priority: 'Medium',
        automated: false,
        calendarReminder: true
      });
    }

    // Slack webhook - annually or if compromised
    if (process.env.SLACK_WEBHOOK_URL) {
      const slackRotation = new Date(now);
      slackRotation.setFullYear(slackRotation.getFullYear() + 1);
      schedule.recommendations.push({
        credential: 'SLACK_WEBHOOK_URL',
        nextRotation: slackRotation.toISOString(),
        frequency: 'Annually or if compromised',
        priority: 'Low',
        automated: false,
        calendarReminder: true
      });
    }

    return schedule;
  }
}

// CLI interface
if (require.main === module) {
  const manager = new APIKeyRotationManager();
  const command = process.argv[2];

  switch (command) {
    case 'check':
      console.log('🔍 Checking rotation needs...\n');
      const needs = manager.checkRotationNeeds();
      console.log(JSON.stringify(needs, null, 2));
      break;

    case 'oauth-instructions':
      console.log('🔐 OAuth2 Refresh Token Rotation Instructions:\n');
      try {
        const instructions = manager.generateOAuthRotationInstructions();
        console.log(JSON.stringify(instructions, null, 2));
      } catch (error) {
        console.error('❌ Error generating instructions:', error.message);
        process.exit(1);
      }
      break;

    case 'exchange-code':
      const authCode = process.argv[3];
      if (!authCode) {
        console.error('❌ Authorization code required');
        console.log('Usage: node api-key-rotation.js exchange-code <AUTHORIZATION_CODE>');
        process.exit(1);
      }
      
      console.log('🔄 Exchanging authorization code for refresh token...\n');
      manager.exchangeAuthCodeForToken(authCode)
        .then(result => {
          if (result.success) {
            console.log('✅ Token exchange successful!');
            console.log(`New refresh token: ${result.newRefreshToken}`);
            console.log(`Expires: ${result.expiryDate || 'No expiry'}`);
            console.log('\n⚠️  IMPORTANT: Update CHROME_REFRESH_TOKEN in GitHub Secrets immediately');
          } else {
            console.log('❌ Token exchange failed:', result.error);
            if (result.troubleshooting) {
              console.log('\nTroubleshooting:');
              result.troubleshooting.forEach(tip => console.log(`  - ${tip}`));
            }
          }
        })
        .catch(error => {
          console.error('❌ Exchange failed:', error.message);
          process.exit(1);
        });
      break;

    case 'backup':
      console.log('💾 Backing up current credentials...\n');
      manager.backupCurrentCredentials()
        .then(backupPath => {
          console.log(`✅ Backup completed: ${backupPath}`);
        })
        .catch(error => {
          console.error('❌ Backup failed:', error.message);
          process.exit(1);
        });
      break;

    case 'checklist':
      console.log('📋 Rotation Checklist:\n');
      const checklist = manager.generateRotationChecklist();
      console.log(JSON.stringify(checklist, null, 2));
      break;

    case 'schedule':
      console.log('📅 Rotation Schedule:\n');
      const schedule = manager.generateRotationSchedule();
      console.log(JSON.stringify(schedule, null, 2));
      break;

    case 'cleanup-backups':
      const maxAge = parseInt(process.argv[3]) || 90;
      console.log(`🧹 Cleaning up backups older than ${maxAge} days...\n`);
      manager.cleanupOldBackups(maxAge);
      break;

    case 'log-rotation':
      const credential = process.argv[3];
      const method = process.argv[4] || 'manual';
      if (!credential) {
        console.error('❌ Credential name required');
        console.log('Usage: node api-key-rotation.js log-rotation <CREDENTIAL_NAME> [METHOD]');
        process.exit(1);
      }
      manager.logRotation(credential, method, new Date().toISOString());
      break;

    default:
      console.log(`
API Key Rotation Manager

Usage: node api-key-rotation.js <command>

Commands:
  check                    Check which credentials need rotation
  oauth-instructions       Generate OAuth2 flow instructions for Chrome Web Store
  exchange-code <code>     Exchange OAuth authorization code for refresh token
  backup                   Backup current credential metadata
  checklist               Generate comprehensive rotation checklist
  schedule                Generate rotation schedule recommendations
  cleanup-backups [days]  Clean up backup files older than specified days (default: 90)
  log-rotation <cred>     Log a credential rotation event

Examples:
  node api-key-rotation.js check
  node api-key-rotation.js oauth-instructions
  node api-key-rotation.js exchange-code 4/0AX4XfWh...
  node api-key-rotation.js cleanup-backups 30
      `);
      break;
  }
}

module.exports = APIKeyRotationManager;