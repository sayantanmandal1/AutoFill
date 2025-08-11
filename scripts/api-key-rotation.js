#!/usr/bin/env node

/**
 * API Key Rotation Script
 * 
 * This script helps rotate API keys and credentials used in the Chrome Extension
 * CI/CD pipeline, including Chrome Web Store API credentials and GitHub tokens.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class APIKeyRotationManager {
  constructor() {
    this.rotationConfig = {
      rotationIntervalDays: 90,
      backupRetentionDays: 30,
      notificationEmail: process.env.NOTIFICATION_EMAIL || null,
      dryRun: process.env.DRY_RUN === 'true'
    };
    
    this.keyTypes = {
      CHROME_CLIENT_ID: {
        description: 'Google OAuth Client ID for Chrome Web Store API',
        rotationRequired: true,
        backupRequired: false
      },
      CHROME_CLIENT_SECRET: {
        description: 'Google OAuth Client Secret',
        rotationRequired: true,
        backupRequired: false
      },
      CHROME_REFRESH_TOKEN: {
        description: 'OAuth Refresh Token for Chrome Web Store API',
        rotationRequired: true,
        backupRequired: false
      },
      GITHUB_TOKEN: {
        description: 'GitHub Personal Access Token (if used)',
        rotationRequired: false,
        backupRequired: false
      }
    };
  }

  /**
   * Check if API keys need rotation based on last rotation date
   * @returns {Promise<Object>} Rotation status and recommendations
   */
  async checkRotationStatus() {
    try {
      const rotationHistoryPath = path.join(__dirname, '..', '.rotation-history.json');
      let rotationHistory = {};
      
      if (fs.existsSync(rotationHistoryPath)) {
        rotationHistory = JSON.parse(fs.readFileSync(rotationHistoryPath, 'utf8'));
      }

      const currentDate = new Date();
      const rotationResults = {};
      
      Object.keys(this.keyTypes).forEach(keyType => {
        const lastRotation = rotationHistory[keyType] ? new Date(rotationHistory[keyType].lastRotated) : null;
        const daysSinceRotation = lastRotation ? Math.floor((currentDate - lastRotation) / (1000 * 60 * 60 * 24)) : null;
        
        rotationResults[keyType] = {
          ...this.keyTypes[keyType],
          lastRotated: lastRotation,
          daysSinceRotation: daysSinceRotation,
          needsRotation: daysSinceRotation === null || daysSinceRotation >= this.rotationConfig.rotationIntervalDays,
          urgentRotation: daysSinceRotation !== null && daysSinceRotation >= (this.rotationConfig.rotationIntervalDays + 30)
        };
      });

      return {
        rotationDate: currentDate.toISOString(),
        rotationInterval: this.rotationConfig.rotationIntervalDays,
        keys: rotationResults,
        summary: {
          totalKeys: Object.keys(this.keyTypes).length,
          needsRotation: Object.values(rotationResults).filter(key => key.needsRotation).length,
          urgentRotation: Object.values(rotationResults).filter(key => key.urgentRotation).length
        }
      };
    } catch (error) {
      console.error('Failed to check rotation status:', error);
      throw new Error(`Rotation status check failed: ${error.message}`);
    }
  }

  /**
   * Generate rotation instructions for manual key rotation
   * @param {Array<string>} keyTypes - Types of keys to rotate
   * @returns {Object} Detailed rotation instructions
   */
  generateRotationInstructions(keyTypes = null) {
    const keysToRotate = keyTypes || Object.keys(this.keyTypes).filter(key => this.keyTypes[key].rotationRequired);
    
    const instructions = {
      overview: 'API Key Rotation Instructions',
      estimatedTime: '30-45 minutes',
      prerequisites: [
        'Access to Google Cloud Console',
        'GitHub repository admin access',
        'Chrome Web Store Developer Dashboard access'
      ],
      steps: []
    };

    keysToRotate.forEach(keyType => {
      switch (keyType) {
        case 'CHROME_CLIENT_ID':
        case 'CHROME_CLIENT_SECRET':
          instructions.steps.push({
            keyType: keyType,
            title: `Rotate ${keyType}`,
            steps: [
              '1. Go to Google Cloud Console (https://console.cloud.google.com/)',
              '2. Navigate to APIs & Services > Credentials',
              '3. Find your OAuth 2.0 Client ID for Chrome Web Store',
              '4. Click "Edit" or create a new OAuth client',
              '5. Note down the new Client ID and Client Secret',
              '6. Update GitHub repository secrets with new values',
              '7. Test the new credentials with a test deployment'
            ],
            githubSecrets: [keyType],
            testCommand: 'npm run test:chrome-store-api'
          });
          break;
          
        case 'CHROME_REFRESH_TOKEN':
          instructions.steps.push({
            keyType: keyType,
            title: 'Rotate Chrome Web Store Refresh Token',
            steps: [
              '1. Use the new Client ID and Secret from previous step',
              '2. Run the OAuth flow to get a new refresh token:',
              '   - Go to: https://accounts.google.com/o/oauth2/auth?response_type=code&scope=https://www.googleapis.com/auth/chromewebstore&client_id=YOUR_CLIENT_ID&redirect_uri=urn:ietf:wg:oauth:2.0:oob',
              '3. Authorize the application and copy the authorization code',
              '4. Exchange the code for a refresh token using curl or Postman',
              '5. Update the CHROME_REFRESH_TOKEN GitHub secret',
              '6. Test the token with a test API call'
            ],
            githubSecrets: ['CHROME_REFRESH_TOKEN'],
            testCommand: 'npm run test:chrome-store-upload'
          });
          break;
          
        case 'GITHUB_TOKEN':
          instructions.steps.push({
            keyType: keyType,
            title: 'Rotate GitHub Personal Access Token',
            steps: [
              '1. Go to GitHub Settings > Developer settings > Personal access tokens',
              '2. Click "Generate new token (classic)"',
              '3. Set appropriate scopes (repo, workflow, write:packages)',
              '4. Generate and copy the new token',
              '5. Update any GitHub secrets or environment variables',
              '6. Revoke the old token'
            ],
            githubSecrets: ['GITHUB_TOKEN'],
            testCommand: 'npm run test:github-api'
          });
          break;
      }
    });

    instructions.postRotationSteps = [
      '1. Run full CI/CD pipeline test',
      '2. Verify Chrome Web Store deployment works',
      '3. Update rotation history',
      '4. Schedule next rotation reminder',
      '5. Document any issues encountered'
    ];

    return instructions;
  }

  /**
   * Record successful key rotation
   * @param {string} keyType - Type of key that was rotated
   * @param {Object} metadata - Additional metadata about the rotation
   */
  async recordRotation(keyType, metadata = {}) {
    try {
      const rotationHistoryPath = path.join(__dirname, '..', '.rotation-history.json');
      let rotationHistory = {};
      
      if (fs.existsSync(rotationHistoryPath)) {
        rotationHistory = JSON.parse(fs.readFileSync(rotationHistoryPath, 'utf8'));
      }

      rotationHistory[keyType] = {
        lastRotated: new Date().toISOString(),
        rotatedBy: process.env.USER || 'automated',
        rotationId: crypto.randomUUID(),
        metadata: metadata
      };

      fs.writeFileSync(rotationHistoryPath, JSON.stringify(rotationHistory, null, 2));
      
      console.log(`✅ Recorded rotation for ${keyType}`);
      return rotationHistory[keyType];
    } catch (error) {
      console.error(`Failed to record rotation for ${keyType}:`, error);
      throw error;
    }
  }

  /**
   * Validate that rotated keys are working correctly
   * @param {Array<string>} keyTypes - Types of keys to validate
   * @returns {Promise<Object>} Validation results
   */
  async validateRotatedKeys(keyTypes) {
    const validationResults = {};
    
    for (const keyType of keyTypes) {
      try {
        switch (keyType) {
          case 'CHROME_CLIENT_ID':
          case 'CHROME_CLIENT_SECRET':
          case 'CHROME_REFRESH_TOKEN':
            validationResults[keyType] = await this.validateChromeStoreCredentials();
            break;
            
          case 'GITHUB_TOKEN':
            validationResults[keyType] = await this.validateGitHubToken();
            break;
            
          default:
            validationResults[keyType] = { valid: false, error: 'Unknown key type' };
        }
      } catch (error) {
        validationResults[keyType] = { valid: false, error: error.message };
      }
    }

    return validationResults;
  }

  /**
   * Validate Chrome Web Store API credentials
   * @returns {Promise<Object>} Validation result
   */
  async validateChromeStoreCredentials() {
    // This would make an actual API call to validate credentials
    // For now, return a mock validation
    return {
      valid: true,
      message: 'Chrome Web Store credentials validation would be performed here',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Validate GitHub token
   * @returns {Promise<Object>} Validation result
   */
  async validateGitHubToken() {
    // This would make an actual API call to validate the token
    // For now, return a mock validation
    return {
      valid: true,
      message: 'GitHub token validation would be performed here',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate rotation report
   * @returns {Promise<Object>} Comprehensive rotation report
   */
  async generateRotationReport() {
    try {
      const rotationStatus = await this.checkRotationStatus();
      const instructions = this.generateRotationInstructions();
      
      const report = {
        reportDate: new Date().toISOString(),
        rotationConfig: this.rotationConfig,
        rotationStatus: rotationStatus,
        rotationInstructions: instructions,
        recommendations: this.generateRecommendations(rotationStatus),
        nextSteps: this.generateNextSteps(rotationStatus)
      };

      // Save report to file
      const reportPath = path.join(__dirname, '..', `rotation-report-${Date.now()}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      
      console.log(`📊 Rotation report saved to: ${reportPath}`);
      return report;
    } catch (error) {
      console.error('Failed to generate rotation report:', error);
      throw error;
    }
  }

  /**
   * Generate recommendations based on rotation status
   * @param {Object} rotationStatus - Current rotation status
   * @returns {Array<string>} List of recommendations
   */
  generateRecommendations(rotationStatus) {
    const recommendations = [];
    
    if (rotationStatus.summary.urgentRotation > 0) {
      recommendations.push('🚨 URGENT: Some keys are overdue for rotation and should be rotated immediately');
    }
    
    if (rotationStatus.summary.needsRotation > 0) {
      recommendations.push(`📅 ${rotationStatus.summary.needsRotation} key(s) need rotation within the next 30 days`);
    }
    
    recommendations.push('🔄 Set up automated reminders for key rotation');
    recommendations.push('📝 Document the rotation process for team members');
    recommendations.push('🧪 Test rotated keys in a staging environment before production use');
    recommendations.push('📊 Monitor API usage after rotation to ensure everything works correctly');
    
    return recommendations;
  }

  /**
   * Generate next steps based on rotation status
   * @param {Object} rotationStatus - Current rotation status
   * @returns {Array<string>} List of next steps
   */
  generateNextSteps(rotationStatus) {
    const nextSteps = [];
    
    const urgentKeys = Object.entries(rotationStatus.keys)
      .filter(([_, keyInfo]) => keyInfo.urgentRotation)
      .map(([keyType, _]) => keyType);
      
    const needsRotationKeys = Object.entries(rotationStatus.keys)
      .filter(([_, keyInfo]) => keyInfo.needsRotation && !keyInfo.urgentRotation)
      .map(([keyType, _]) => keyType);

    if (urgentKeys.length > 0) {
      nextSteps.push(`1. IMMEDIATE: Rotate these keys: ${urgentKeys.join(', ')}`);
    }
    
    if (needsRotationKeys.length > 0) {
      nextSteps.push(`2. SOON: Schedule rotation for: ${needsRotationKeys.join(', ')}`);
    }
    
    nextSteps.push('3. Review and update rotation procedures');
    nextSteps.push('4. Set up monitoring for key expiration');
    nextSteps.push('5. Schedule next rotation review');
    
    return nextSteps;
  }

  /**
   * Run the complete rotation check and generate report
   */
  async runRotationCheck() {
    try {
      console.log('🔑 Starting API key rotation check...\n');
      
      const report = await this.generateRotationReport();
      
      console.log('📋 Rotation Status Summary:');
      console.log(`  Total keys: ${report.rotationStatus.summary.totalKeys}`);
      console.log(`  Need rotation: ${report.rotationStatus.summary.needsRotation}`);
      console.log(`  Urgent rotation: ${report.rotationStatus.summary.urgentRotation}\n`);
      
      if (report.recommendations.length > 0) {
        console.log('💡 Recommendations:');
        report.recommendations.forEach(rec => console.log(`  ${rec}`));
        console.log('');
      }
      
      if (report.nextSteps.length > 0) {
        console.log('📝 Next Steps:');
        report.nextSteps.forEach(step => console.log(`  ${step}`));
        console.log('');
      }
      
      console.log('✅ Rotation check completed successfully!');
      return report;
      
    } catch (error) {
      console.error('❌ Rotation check failed:', error.message);
      throw error;
    }
  }
}

// Run rotation check if called directly
if (require.main === module) {
  const rotationManager = new APIKeyRotationManager();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'check':
      rotationManager.runRotationCheck()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'instructions':
      const keyTypes = process.argv.slice(3);
      const instructions = rotationManager.generateRotationInstructions(keyTypes.length > 0 ? keyTypes : null);
      console.log(JSON.stringify(instructions, null, 2));
      break;
      
    case 'record':
      const keyType = process.argv[3];
      if (!keyType) {
        console.error('Usage: node api-key-rotation.js record <keyType>');
        process.exit(1);
      }
      rotationManager.recordRotation(keyType)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    default:
      console.log('Usage: node api-key-rotation.js <command>');
      console.log('Commands:');
      console.log('  check                    - Check rotation status and generate report');
      console.log('  instructions [keyTypes]  - Generate rotation instructions');
      console.log('  record <keyType>         - Record successful rotation');
      process.exit(1);
  }
}

module.exports = APIKeyRotationManager;