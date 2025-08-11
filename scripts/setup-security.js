#!/usr/bin/env node

/**
 * Security Setup Script
 * 
 * This script helps set up the security environment for the Chrome Extension
 * deployment pipeline, including credential validation and security configuration.
 */

const fs = require('fs');
const path = require('path');
const CredentialManager = require('./credential-manager');
const APIKeyRotationManager = require('./api-key-rotation');

class SecuritySetup {
  constructor() {
    this.credentialManager = new CredentialManager();
    this.rotationManager = new APIKeyRotationManager();
    this.setupComplete = false;
  }

  /**
   * Run complete security setup process
   */
  async runSetup() {
    console.log('🔐 Chrome Extension Security Setup\n');
    console.log('This script will help you set up security for your deployment pipeline.\n');

    try {
      // Step 1: Validate current environment
      console.log('Step 1: Validating current environment...');
      const validation = this.credentialManager.validateCredentials();
      this.displayValidationResults(validation);

      // Step 2: Test Chrome Web Store credentials if available
      if (validation.valid) {
        console.log('\nStep 2: Testing Chrome Web Store API credentials...');
        const apiTest = await this.credentialManager.testChromeStoreCredentials();
        this.displayAPITestResults(apiTest);
      } else {
        console.log('\nStep 2: Skipping API test - missing required credentials');
        this.displayCredentialSetupInstructions();
      }

      // Step 3: Check security configuration files
      console.log('\nStep 3: Checking security configuration files...');
      this.checkSecurityFiles();

      // Step 4: Generate security reports
      console.log('\nStep 4: Generating security reports...');
      await this.generateSecurityReports();

      // Step 5: Display next steps
      console.log('\nStep 5: Next steps and recommendations...');
      this.displayNextSteps(validation);

      this.setupComplete = true;
      console.log('\n✅ Security setup completed successfully!');

    } catch (error) {
      console.error('\n❌ Security setup failed:', error.message);
      console.log('\nTroubleshooting:');
      console.log('- Ensure all required dependencies are installed (npm ci)');
      console.log('- Check that you have proper permissions');
      console.log('- Review the error message above for specific issues');
      process.exit(1);
    }
  }

  /**
   * Display credential validation results
   */
  displayValidationResults(validation) {
    console.log(`\nCredential Validation Results:`);
    console.log(`Status: ${validation.valid ? '✅ Valid' : '❌ Invalid'}`);
    console.log(`Summary: ${validation.summary}`);

    if (validation.required.present.length > 0) {
      console.log(`\n✅ Present required credentials:`);
      validation.required.present.forEach(cred => console.log(`  - ${cred}`));
    }

    if (validation.required.missing.length > 0) {
      console.log(`\n❌ Missing required credentials:`);
      validation.required.missing.forEach(cred => console.log(`  - ${cred}`));
    }

    if (validation.warnings.length > 0) {
      console.log(`\n⚠️  Warnings:`);
      validation.warnings.forEach(warning => console.log(`  - ${warning}`));
    }

    if (validation.optional.present.length > 0) {
      console.log(`\n📋 Optional credentials present:`);
      validation.optional.present.forEach(cred => console.log(`  - ${cred}`));
    }
  }

  /**
   * Display API test results
   */
  displayAPITestResults(apiTest) {
    if (apiTest.success) {
      console.log('✅ Chrome Web Store API credentials are working correctly');
      if (apiTest.tokenExpiry) {
        console.log(`Token expires: ${apiTest.tokenExpiry.toISOString()}`);
      }
    } else {
      console.log('❌ Chrome Web Store API test failed:', apiTest.error);
      if (apiTest.details) {
        console.log('Details:', JSON.stringify(apiTest.details, null, 2));
      }
    }
  }

  /**
   * Display credential setup instructions
   */
  displayCredentialSetupInstructions() {
    console.log('\n📋 Credential Setup Instructions:');
    console.log('\nTo set up Chrome Web Store API credentials:');
    console.log('1. Go to Google Cloud Console (https://console.cloud.google.com)');
    console.log('2. Create a new project or select existing project');
    console.log('3. Enable Chrome Web Store API');
    console.log('4. Create OAuth2 credentials (Desktop application type)');
    console.log('5. Generate refresh token using OAuth2 playground');
    console.log('6. Add credentials to GitHub Repository Secrets:');
    console.log('   - CHROME_CLIENT_ID');
    console.log('   - CHROME_CLIENT_SECRET');
    console.log('   - CHROME_REFRESH_TOKEN');
    console.log('   - CHROME_EXTENSION_ID');
    console.log('\nFor detailed instructions, see: docs/CHROME_WEB_STORE_SETUP.md');
  }

  /**
   * Check security configuration files
   */
  checkSecurityFiles() {
    const securityFiles = [
      { path: '.audit-ci.json', description: 'Dependency audit configuration' },
      { path: 'docs/SECURITY_BEST_PRACTICES.md', description: 'Security documentation' },
      { path: '.github/workflows/ci-cd.yml', description: 'CI/CD pipeline with security scanning' },
      { path: 'scripts/credential-manager.js', description: 'Credential management script' },
      { path: 'scripts/api-key-rotation.js', description: 'API key rotation script' }
    ];

    console.log('\nSecurity Configuration Files:');
    for (const file of securityFiles) {
      const exists = fs.existsSync(file.path);
      console.log(`${exists ? '✅' : '❌'} ${file.path} - ${file.description}`);
    }
  }

  /**
   * Generate security reports
   */
  async generateSecurityReports() {
    try {
      // Generate credential validation report
      const reportPath = 'security-setup-report.json';
      await this.credentialManager.exportValidationReport(reportPath);
      console.log(`✅ Security report generated: ${reportPath}`);

      // Generate rotation schedule
      const schedule = this.rotationManager.generateRotationSchedule();
      const schedulePath = 'credential-rotation-schedule.json';
      fs.writeFileSync(schedulePath, JSON.stringify(schedule, null, 2));
      console.log(`✅ Rotation schedule generated: ${schedulePath}`);

    } catch (error) {
      console.log(`⚠️  Could not generate all reports: ${error.message}`);
    }
  }

  /**
   * Display next steps based on setup results
   */
  displayNextSteps(validation) {
    console.log('\n📋 Recommended Next Steps:');

    if (!validation.valid) {
      console.log('\n🔴 HIGH PRIORITY:');
      console.log('1. Set up missing Chrome Web Store API credentials');
      console.log('2. Add credentials to GitHub Repository Secrets');
      console.log('3. Test credentials using: node scripts/credential-manager.js test');
    } else {
      console.log('\n🟢 CREDENTIALS CONFIGURED:');
      console.log('1. Review security best practices: docs/SECURITY_BEST_PRACTICES.md');
      console.log('2. Set up credential rotation reminders');
      console.log('3. Configure optional notification credentials');
    }

    console.log('\n🔵 SECURITY MAINTENANCE:');
    console.log('1. Schedule monthly security reviews');
    console.log('2. Set up credential rotation (every 6 months for refresh tokens)');
    console.log('3. Monitor security scan results in CI/CD pipeline');
    console.log('4. Keep dependencies updated regularly');

    console.log('\n🟡 OPTIONAL ENHANCEMENTS:');
    console.log('1. Set up email notifications (SMTP credentials)');
    console.log('2. Configure Slack notifications (webhook URL)');
    console.log('3. Set up monitoring dashboard');
    console.log('4. Configure automated issue creation for failures');

    console.log('\n📚 USEFUL COMMANDS:');
    console.log('- Validate credentials: node scripts/credential-manager.js validate');
    console.log('- Test API access: node scripts/credential-manager.js test');
    console.log('- Check rotation needs: node scripts/api-key-rotation.js check');
    console.log('- Generate OAuth instructions: node scripts/api-key-rotation.js oauth-instructions');
    console.log('- Run security audit: npm audit --audit-level=moderate');
  }

  /**
   * Interactive setup mode
   */
  async interactiveSetup() {
    console.log('🔐 Interactive Security Setup\n');
    
    // This would implement an interactive CLI setup
    // For now, we'll just run the automated setup
    console.log('Running automated setup...\n');
    await this.runSetup();
  }

  /**
   * Validate security environment for CI/CD
   */
  validateCIEnvironment() {
    console.log('🔍 Validating CI/CD Security Environment\n');

    const validation = this.credentialManager.validateCredentials();
    const issues = [];

    // Check required credentials
    if (!validation.valid) {
      issues.push({
        severity: 'critical',
        message: 'Missing required Chrome Web Store API credentials',
        details: validation.required.missing
      });
    }

    // Check for credential format issues
    if (validation.warnings.length > 0) {
      issues.push({
        severity: 'warning',
        message: 'Credential format warnings detected',
        details: validation.warnings
      });
    }

    // Check security files
    const requiredFiles = ['.audit-ci.json', 'docs/SECURITY_BEST_PRACTICES.md'];
    const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
    
    if (missingFiles.length > 0) {
      issues.push({
        severity: 'warning',
        message: 'Missing security configuration files',
        details: missingFiles
      });
    }

    // Display results
    if (issues.length === 0) {
      console.log('✅ CI/CD security environment is properly configured');
      return true;
    } else {
      console.log('❌ CI/CD security environment has issues:');
      issues.forEach(issue => {
        console.log(`\n${issue.severity.toUpperCase()}: ${issue.message}`);
        if (issue.details) {
          issue.details.forEach(detail => console.log(`  - ${detail}`));
        }
      });
      return false;
    }
  }
}

// CLI interface
if (require.main === module) {
  const setup = new SecuritySetup();
  const command = process.argv[2];

  switch (command) {
    case 'run':
    case 'setup':
      setup.runSetup().catch(error => {
        console.error('Setup failed:', error.message);
        process.exit(1);
      });
      break;

    case 'interactive':
      setup.interactiveSetup().catch(error => {
        console.error('Interactive setup failed:', error.message);
        process.exit(1);
      });
      break;

    case 'validate-ci':
      const isValid = setup.validateCIEnvironment();
      process.exit(isValid ? 0 : 1);
      break;

    default:
      console.log(`
Chrome Extension Security Setup

Usage: node setup-security.js <command>

Commands:
  run, setup      Run automated security setup
  interactive     Run interactive security setup
  validate-ci     Validate CI/CD security environment

Examples:
  node scripts/setup-security.js run
  node scripts/setup-security.js interactive
  node scripts/setup-security.js validate-ci
      `);
      break;
  }
}

module.exports = SecuritySetup;