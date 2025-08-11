#!/usr/bin/env node

/**
 * Security and Credential Management Setup Script
 * 
 * This script helps set up secure credential management for the Chrome Extension
 * CI/CD pipeline, including GitHub secrets configuration and security best practices.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SecurityManager {
  constructor() {
    this.requiredSecrets = [
      'CHROME_EXTENSION_ID',
      'CHROME_CLIENT_ID', 
      'CHROME_CLIENT_SECRET',
      'CHROME_REFRESH_TOKEN'
    ];
    
    this.securityConfig = {
      apiKeyRotationDays: 90,
      secretsValidationEnabled: true,
      dependencyAuditLevel: 'moderate',
      securityScanEnabled: true
    };
  }

  /**
   * Generate secure configuration template for GitHub secrets
   */
  generateSecretsTemplate() {
    const template = {
      secrets: {
        CHROME_EXTENSION_ID: {
          description: "Chrome Web Store Extension ID",
          required: true,
          example: "abcdefghijklmnopqrstuvwxyz123456",
          setup: "Get from Chrome Web Store Developer Dashboard"
        },
        CHROME_CLIENT_ID: {
          description: "Google OAuth Client ID for Chrome Web Store API",
          required: true,
          example: "123456789-abcdefghijklmnop.apps.googleusercontent.com",
          setup: "Create OAuth credentials in Google Cloud Console"
        },
        CHROME_CLIENT_SECRET: {
          description: "Google OAuth Client Secret",
          required: true,
          sensitive: true,
          setup: "From Google Cloud Console OAuth credentials"
        },
        CHROME_REFRESH_TOKEN: {
          description: "OAuth Refresh Token for Chrome Web Store API",
          required: true,
          sensitive: true,
          setup: "Generate using OAuth flow with Chrome Web Store API scope"
        },
        NOTIFICATION_EMAIL: {
          description: "Email for deployment notifications",
          required: false,
          example: "developer@example.com"
        }
      },
      repositorySecrets: {
        setup: [
          "1. Go to GitHub repository Settings > Secrets and variables > Actions",
          "2. Click 'New repository secret' for each required secret",
          "3. Use the exact secret names listed above",
          "4. Paste the corresponding values from your Chrome Web Store setup"
        ]
      }
    };

    const templatePath = path.join(__dirname, '..', 'GITHUB_SECRETS_TEMPLATE.json');
    fs.writeFileSync(templatePath, JSON.stringify(template, null, 2));
    
    console.log('✅ GitHub secrets template created at:', templatePath);
    return template;
  }

  /**
   * Create security best practices documentation
   */
  createSecurityDocumentation() {
    const securityDoc = `# Security Best Practices

## Overview
This document outlines security best practices for the Job Application Autofill Chrome Extension development and deployment.

## Credential Management

### GitHub Secrets Configuration
All sensitive credentials must be stored as GitHub repository secrets:

- \`CHROME_EXTENSION_ID\`: Your Chrome Web Store extension ID
- \`CHROME_CLIENT_ID\`: Google OAuth client ID
- \`CHROME_CLIENT_SECRET\`: Google OAuth client secret  
- \`CHROME_REFRESH_TOKEN\`: OAuth refresh token

### API Key Rotation
- **Frequency**: Rotate API keys every ${this.securityConfig.apiKeyRotationDays} days
- **Process**: Use the automated rotation script in \`scripts/api-key-rotation.js\`
- **Monitoring**: Set up alerts for key expiration

## Development Security

### Dependency Management
- Run \`npm audit\` regularly to check for vulnerabilities
- Use \`npm audit fix\` to automatically fix issues
- Set audit level to '${this.securityConfig.dependencyAuditLevel}' in CI/CD

### Code Security
- Never commit sensitive data to version control
- Use environment variables for configuration
- Validate all user inputs in the extension
- Implement Content Security Policy (CSP) headers

### Extension Security
- Request minimal permissions in manifest.json
- Validate all external data sources
- Use HTTPS for all API communications
- Implement proper error handling to avoid information leakage

## CI/CD Security

### GitHub Actions Security
- Use pinned action versions (e.g., \`@v4\` instead of \`@main\`)
- Limit workflow permissions to minimum required
- Use \`secrets.GITHUB_TOKEN\` for GitHub API access
- Enable branch protection rules

### Build Security
- Scan dependencies for vulnerabilities before deployment
- Validate extension package integrity
- Use secure build environments
- Implement automated security testing

## Monitoring and Alerting

### Security Monitoring
- Monitor for failed authentication attempts
- Track API usage patterns
- Set up alerts for unusual deployment activity
- Log all security-related events

### Incident Response
1. **Detection**: Automated monitoring alerts
2. **Assessment**: Evaluate security impact
3. **Containment**: Revoke compromised credentials
4. **Recovery**: Deploy fixes and rotate keys
5. **Lessons Learned**: Update security practices

## Compliance

### Data Privacy
- Follow Chrome Web Store privacy policies
- Implement proper data handling practices
- Document data collection and usage
- Provide clear privacy policy to users

### Security Audits
- Conduct regular security reviews
- Perform penetration testing
- Review third-party dependencies
- Update security practices based on findings

## Emergency Procedures

### Credential Compromise
1. Immediately revoke compromised credentials
2. Generate new credentials
3. Update GitHub secrets
4. Redeploy with new credentials
5. Monitor for unauthorized access

### Security Incident
1. Assess the scope of the incident
2. Contain the security breach
3. Notify relevant stakeholders
4. Implement fixes
5. Document lessons learned

## Tools and Resources

### Security Tools
- \`npm audit\`: Dependency vulnerability scanning
- \`eslint-plugin-security\`: Code security linting
- GitHub Security Advisories: Vulnerability notifications
- Dependabot: Automated dependency updates

### Documentation
- [Chrome Extension Security](https://developer.chrome.com/docs/extensions/mv3/security/)
- [GitHub Actions Security](https://docs.github.com/en/actions/security-guides)
- [OAuth 2.0 Security](https://tools.ietf.org/html/rfc6749#section-10)
`;

    const docPath = path.join(__dirname, '..', 'docs', 'SECURITY_BEST_PRACTICES.md');
    fs.writeFileSync(docPath, securityDoc);
    
    console.log('✅ Security documentation created at:', docPath);
    return docPath;
  }

  /**
   * Validate current security configuration
   */
  validateSecuritySetup() {
    const issues = [];
    
    // Check for sensitive files in git
    const gitignorePath = path.join(__dirname, '..', '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignore = fs.readFileSync(gitignorePath, 'utf8');
      const sensitivePatterns = [
        '*.key',
        '*.pem',
        '.env',
        'secrets.json',
        'credentials.json'
      ];
      
      sensitivePatterns.forEach(pattern => {
        if (!gitignore.includes(pattern)) {
          issues.push(`Missing .gitignore pattern: ${pattern}`);
        }
      });
    } else {
      issues.push('Missing .gitignore file');
    }

    // Check package.json for security scripts
    const packagePath = path.join(__dirname, '..', 'package.json');
    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      if (!packageJson.scripts || !packageJson.scripts.audit) {
        issues.push('Missing npm audit script in package.json');
      }
    }

    // Check for security-related dependencies
    const securityDeps = ['eslint-plugin-security'];
    securityDeps.forEach(dep => {
      try {
        require.resolve(dep);
      } catch (error) {
        issues.push(`Missing security dependency: ${dep}`);
      }
    });

    return {
      isSecure: issues.length === 0,
      issues: issues,
      recommendations: this.getSecurityRecommendations(issues)
    };
  }

  /**
   * Get security recommendations based on issues found
   */
  getSecurityRecommendations(issues) {
    const recommendations = [];
    
    if (issues.some(issue => issue.includes('.gitignore'))) {
      recommendations.push('Update .gitignore to exclude sensitive files');
    }
    
    if (issues.some(issue => issue.includes('audit script'))) {
      recommendations.push('Add "audit": "npm audit --audit-level moderate" to package.json scripts');
    }
    
    if (issues.some(issue => issue.includes('security dependency'))) {
      recommendations.push('Install security-related dependencies: npm install --save-dev eslint-plugin-security');
    }
    
    recommendations.push('Set up GitHub repository secrets for Chrome Web Store API');
    recommendations.push('Enable Dependabot for automated security updates');
    recommendations.push('Configure branch protection rules');
    
    return recommendations;
  }

  /**
   * Generate API key rotation reminder
   */
  generateRotationReminder() {
    const rotationDate = new Date();
    rotationDate.setDate(rotationDate.getDate() + this.securityConfig.apiKeyRotationDays);
    
    const reminder = {
      nextRotationDate: rotationDate.toISOString().split('T')[0],
      rotationFrequency: `${this.securityConfig.apiKeyRotationDays} days`,
      keysToRotate: [
        'Chrome Web Store API credentials',
        'Google OAuth tokens',
        'GitHub personal access tokens (if used)'
      ],
      rotationProcess: [
        '1. Generate new credentials in Google Cloud Console',
        '2. Update GitHub repository secrets',
        '3. Test deployment with new credentials',
        '4. Revoke old credentials',
        '5. Update rotation schedule'
      ]
    };

    const reminderPath = path.join(__dirname, '..', 'API_KEY_ROTATION_SCHEDULE.json');
    fs.writeFileSync(reminderPath, JSON.stringify(reminder, null, 2));
    
    console.log('✅ API key rotation reminder created at:', reminderPath);
    return reminder;
  }

  /**
   * Run complete security setup
   */
  async setupSecurity() {
    console.log('🔒 Setting up security and credential management...\n');
    
    try {
      // Generate templates and documentation
      this.generateSecretsTemplate();
      this.createSecurityDocumentation();
      this.generateRotationReminder();
      
      // Validate current setup
      const validation = this.validateSecuritySetup();
      
      console.log('\n📋 Security Validation Results:');
      console.log(`Status: ${validation.isSecure ? '✅ Secure' : '⚠️  Issues Found'}`);
      
      if (validation.issues.length > 0) {
        console.log('\n🚨 Issues Found:');
        validation.issues.forEach(issue => console.log(`  - ${issue}`));
      }
      
      if (validation.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        validation.recommendations.forEach(rec => console.log(`  - ${rec}`));
      }
      
      console.log('\n✅ Security setup completed!');
      console.log('\nNext steps:');
      console.log('1. Review SECURITY_BEST_PRACTICES.md');
      console.log('2. Set up GitHub repository secrets using GITHUB_SECRETS_TEMPLATE.json');
      console.log('3. Configure API key rotation schedule');
      console.log('4. Enable security monitoring and alerts');
      
      return {
        success: true,
        validation: validation
      };
      
    } catch (error) {
      console.error('❌ Security setup failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Run security setup if called directly
if (require.main === module) {
  const securityManager = new SecurityManager();
  securityManager.setupSecurity()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = SecurityManager;