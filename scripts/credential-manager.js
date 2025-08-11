#!/usr/bin/env node

/**
 * Chrome Web Store API Credential Manager
 * 
 * This script manages secure storage and validation of Chrome Web Store API credentials.
 * It provides utilities for credential validation, rotation, and secure handling.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { google } = require('googleapis');

class CredentialManager {
    constructor() {
        this.requiredCredentials = [
            'CHROME_CLIENT_ID',
            'CHROME_CLIENT_SECRET',
            'CHROME_REFRESH_TOKEN',
            'CHROME_EXTENSION_ID'
        ];

        this.optionalCredentials = [
            'EMAIL_NOTIFICATIONS_ENABLED',
            'EMAIL_RECIPIENTS_DEPLOYMENT',
            'EMAIL_RECIPIENTS_CRITICAL',
            'SMTP_HOST',
            'SMTP_USER',
            'SMTP_PASS',
            'SLACK_NOTIFICATIONS_ENABLED',
            'SLACK_WEBHOOK_URL',
            'GITHUB_ISSUE_ASSIGNEES'
        ];
    }

    /**
     * Validate that all required credentials are present
     * @returns {Object} Validation result with status and missing credentials
     */
    validateCredentials() {
        const missing = [];
        const present = [];
        const warnings = [];

        // Check required credentials
        for (const credential of this.requiredCredentials) {
            if (process.env[credential]) {
                present.push(credential);

                // Additional validation for specific credentials
                if (credential === 'CHROME_CLIENT_ID' && !this.isValidClientId(process.env[credential])) {
                    warnings.push(`${credential} format appears invalid`);
                }
                if (credential === 'CHROME_EXTENSION_ID' && !this.isValidExtensionId(process.env[credential])) {
                    warnings.push(`${credential} format appears invalid`);
                }
            } else {
                missing.push(credential);
            }
        }

        // Check optional credentials
        const optionalPresent = [];
        for (const credential of this.optionalCredentials) {
            if (process.env[credential]) {
                optionalPresent.push(credential);
            }
        }

        return {
            valid: missing.length === 0,
            required: {
                present,
                missing
            },
            optional: {
                present: optionalPresent
            },
            warnings,
            summary: `${present.length}/${this.requiredCredentials.length} required credentials present`
        };
    }

    /**
     * Test Chrome Web Store API credentials by attempting authentication
     * @returns {Promise<Object>} Test result with authentication status
     */
    async testChromeStoreCredentials() {
        try {
            const validation = this.validateCredentials();
            if (!validation.valid) {
                return {
                    success: false,
                    error: 'Missing required credentials',
                    details: validation
                };
            }

            const oauth2Client = new google.auth.OAuth2(
                process.env.CHROME_CLIENT_ID,
                process.env.CHROME_CLIENT_SECRET,
                'urn:ietf:wg:oauth:2.0:oob'
            );

            oauth2Client.setCredentials({
                refresh_token: process.env.CHROME_REFRESH_TOKEN
            });

            // Test token refresh
            const { credentials } = await oauth2Client.refreshAccessToken();

            if (!credentials.access_token) {
                throw new Error('Failed to obtain access token');
            }

            // Test Chrome Web Store API access
            const webstore = google.chromewebstore({ version: 'v1.1', auth: oauth2Client });

            // Attempt to get extension info (this validates both token and extension ID)
            try {
                await webstore.items.get({
                    itemId: process.env.CHROME_EXTENSION_ID,
                    projection: 'DRAFT'
                });
            } catch (apiError) {
                // If we get a 404, the extension ID might be wrong
                // If we get 403, we might not have permission
                // If we get 401, the credentials are invalid
                if (apiError.code === 404) {
                    return {
                        success: false,
                        error: 'Extension not found - check CHROME_EXTENSION_ID',
                        details: { statusCode: apiError.code, message: apiError.message }
                    };
                } else if (apiError.code === 403) {
                    return {
                        success: false,
                        error: 'Access denied - check API permissions',
                        details: { statusCode: apiError.code, message: apiError.message }
                    };
                } else {
                    throw apiError;
                }
            }

            return {
                success: true,
                message: 'Chrome Web Store API credentials are valid',
                tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null
            };

        } catch (error) {
            return {
                success: false,
                error: 'Chrome Web Store API test failed',
                details: {
                    message: error.message,
                    code: error.code
                }
            };
        }
    }

    /**
     * Generate a credential rotation report
     * @returns {Object} Report with credential status and rotation recommendations
     */
    generateRotationReport() {
        const validation = this.validateCredentials();
        const report = {
            timestamp: new Date().toISOString(),
            credentialStatus: validation,
            rotationRecommendations: []
        };

        // Check for credentials that should be rotated
        if (validation.valid) {
            report.rotationRecommendations.push({
                credential: 'CHROME_REFRESH_TOKEN',
                reason: 'Refresh tokens should be rotated every 6 months',
                priority: 'medium',
                action: 'Generate new refresh token from Google OAuth2 playground'
            });

            report.rotationRecommendations.push({
                credential: 'SMTP_PASS',
                reason: 'Email passwords should be rotated regularly',
                priority: 'medium',
                action: 'Update SMTP password in email provider settings'
            });

            report.rotationRecommendations.push({
                credential: 'SLACK_WEBHOOK_URL',
                reason: 'Webhook URLs should be regenerated if compromised',
                priority: 'low',
                action: 'Regenerate webhook URL in Slack app settings'
            });
        }

        return report;
    }

    /**
     * Validate Chrome Client ID format
     * @param {string} clientId - The client ID to validate
     * @returns {boolean} True if format appears valid
     */
    isValidClientId(clientId) {
        // Chrome OAuth2 client IDs typically end with .apps.googleusercontent.com
        return /^[0-9]+-[a-zA-Z0-9]+\.apps\.googleusercontent\.com$/.test(clientId);
    }

    /**
     * Validate Chrome Extension ID format
     * @param {string} extensionId - The extension ID to validate
     * @returns {boolean} True if format appears valid
     */
    isValidExtensionId(extensionId) {
        // Chrome extension IDs are 32 character lowercase letters
        return /^[a-p]{32}$/.test(extensionId);
    }

    /**
     * Create a secure credential template for GitHub Secrets
     * @returns {Object} Template with credential descriptions and security notes
     */
    createCredentialTemplate() {
        return {
            required: {
                CHROME_CLIENT_ID: {
                    description: 'Chrome Web Store API OAuth2 Client ID',
                    format: 'xxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com',
                    source: 'Google Cloud Console > APIs & Services > Credentials',
                    security: 'Not sensitive, but should be kept private'
                },
                CHROME_CLIENT_SECRET: {
                    description: 'Chrome Web Store API OAuth2 Client Secret',
                    format: 'GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
                    source: 'Google Cloud Console > APIs & Services > Credentials',
                    security: 'HIGHLY SENSITIVE - Never expose in logs or code'
                },
                CHROME_REFRESH_TOKEN: {
                    description: 'OAuth2 Refresh Token for Chrome Web Store API',
                    format: '1//xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
                    source: 'Google OAuth2 Playground or manual OAuth flow',
                    security: 'HIGHLY SENSITIVE - Rotate every 6 months'
                },
                CHROME_EXTENSION_ID: {
                    description: 'Chrome Web Store Extension ID',
                    format: 'abcdefghijklmnopqrstuvwxyzabcdef',
                    source: 'Chrome Web Store Developer Dashboard',
                    security: 'Not sensitive, but should be accurate'
                }
            },
            optional: {
                EMAIL_NOTIFICATIONS_ENABLED: {
                    description: 'Enable email notifications for deployments',
                    format: 'true|false',
                    default: 'false'
                },
                EMAIL_RECIPIENTS_DEPLOYMENT: {
                    description: 'Email addresses for deployment notifications',
                    format: 'email1@example.com,email2@example.com'
                },
                EMAIL_RECIPIENTS_CRITICAL: {
                    description: 'Email addresses for critical failure notifications',
                    format: 'email1@example.com,email2@example.com'
                },
                SMTP_HOST: {
                    description: 'SMTP server hostname for email notifications',
                    format: 'smtp.gmail.com'
                },
                SMTP_USER: {
                    description: 'SMTP username for email notifications',
                    format: 'username@gmail.com'
                },
                SMTP_PASS: {
                    description: 'SMTP password or app password',
                    format: 'password or app-specific password',
                    security: 'SENSITIVE - Use app passwords when possible'
                },
                SLACK_NOTIFICATIONS_ENABLED: {
                    description: 'Enable Slack notifications for deployments',
                    format: 'true|false',
                    default: 'false'
                },
                SLACK_WEBHOOK_URL: {
                    description: 'Slack webhook URL for notifications',
                    format: 'https://hooks.slack.com/services/...',
                    security: 'SENSITIVE - Regenerate if compromised'
                },
                GITHUB_ISSUE_ASSIGNEES: {
                    description: 'GitHub usernames to assign to auto-created issues',
                    format: 'username1,username2'
                }
            },
            securityNotes: [
                'Store all credentials as GitHub Repository Secrets',
                'Never commit credentials to version control',
                'Rotate sensitive credentials every 6 months',
                'Use principle of least privilege for API access',
                'Monitor credential usage and access logs',
                'Implement credential expiry monitoring'
            ]
        };
    }

    /**
     * Export credential validation report
     * @param {string} outputPath - Path to save the report
     */
    async exportValidationReport(outputPath = 'credential-validation-report.json') {
        try {
            const validation = this.validateCredentials();
            const rotationReport = this.generateRotationReport();
            const template = this.createCredentialTemplate();

            // Test Chrome Store credentials if they're present
            let chromeStoreTest = null;
            if (validation.valid) {
                console.log('Testing Chrome Web Store API credentials...');
                chromeStoreTest = await this.testChromeStoreCredentials();
            }

            const report = {
                timestamp: new Date().toISOString(),
                validation,
                chromeStoreTest,
                rotationReport,
                template,
                recommendations: this.generateSecurityRecommendations(validation, chromeStoreTest)
            };

            fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
            console.log(`✅ Credential validation report exported to ${outputPath}`);

            return report;
        } catch (error) {
            console.error('❌ Failed to export validation report:', error.message);
            throw error;
        }
    }

    /**
     * Generate security recommendations based on validation results
     * @param {Object} validation - Credential validation results
     * @param {Object} chromeStoreTest - Chrome Store API test results
     * @returns {Array} Array of security recommendations
     */
    generateSecurityRecommendations(validation, chromeStoreTest) {
        const recommendations = [];

        if (!validation.valid) {
            recommendations.push({
                priority: 'high',
                category: 'missing_credentials',
                message: 'Configure missing required credentials in GitHub Secrets',
                action: `Add the following secrets: ${validation.required.missing.join(', ')}`
            });
        }

        if (validation.warnings.length > 0) {
            recommendations.push({
                priority: 'medium',
                category: 'credential_format',
                message: 'Some credentials have format warnings',
                action: `Review and fix: ${validation.warnings.join(', ')}`
            });
        }

        if (chromeStoreTest && !chromeStoreTest.success) {
            recommendations.push({
                priority: 'high',
                category: 'api_access',
                message: 'Chrome Web Store API credentials are not working',
                action: chromeStoreTest.error
            });
        }

        if (validation.optional.present.length === 0) {
            recommendations.push({
                priority: 'low',
                category: 'monitoring',
                message: 'No notification credentials configured',
                action: 'Consider setting up email or Slack notifications for deployment monitoring'
            });
        }

        // Always recommend regular rotation
        recommendations.push({
            priority: 'medium',
            category: 'rotation',
            message: 'Implement regular credential rotation',
            action: 'Set up calendar reminders to rotate sensitive credentials every 6 months'
        });

        return recommendations;
    }
}

// CLI interface
if (require.main === module) {
    const manager = new CredentialManager();
    const command = process.argv[2];

    switch (command) {
        case 'validate':
            console.log('🔍 Validating credentials...\n');
            const validation = manager.validateCredentials();
            console.log('Validation Results:');
            console.log(`Status: ${validation.valid ? '✅ Valid' : '❌ Invalid'}`);
            console.log(`Summary: ${validation.summary}`);

            if (validation.required.missing.length > 0) {
                console.log(`\n❌ Missing required credentials:`);
                validation.required.missing.forEach(cred => console.log(`  - ${cred}`));
            }

            if (validation.required.present.length > 0) {
                console.log(`\n✅ Present required credentials:`);
                validation.required.present.forEach(cred => console.log(`  - ${cred}`));
            }

            if (validation.warnings.length > 0) {
                console.log(`\n⚠️  Warnings:`);
                validation.warnings.forEach(warning => console.log(`  - ${warning}`));
            }

            if (validation.optional.present.length > 0) {
                console.log(`\n📋 Optional credentials present:`);
                validation.optional.present.forEach(cred => console.log(`  - ${cred}`));
            }
            break;

        case 'test':
            console.log('🧪 Testing Chrome Web Store API credentials...\n');
            manager.testChromeStoreCredentials()
                .then(result => {
                    if (result.success) {
                        console.log('✅', result.message);
                        if (result.tokenExpiry) {
                            console.log(`Token expires: ${result.tokenExpiry.toISOString()}`);
                        }
                    } else {
                        console.log('❌', result.error);
                        if (result.details) {
                            console.log('Details:', JSON.stringify(result.details, null, 2));
                        }
                    }
                })
                .catch(error => {
                    console.error('❌ Test failed:', error.message);
                    process.exit(1);
                });
            break;

        case 'template':
            console.log('📋 Credential Template:\n');
            const template = manager.createCredentialTemplate();
            console.log(JSON.stringify(template, null, 2));
            break;

        case 'report':
            const outputPath = process.argv[3] || 'credential-validation-report.json';
            console.log('📊 Generating comprehensive credential report...\n');
            manager.exportValidationReport(outputPath)
                .then(report => {
                    console.log('\n📋 Report Summary:');
                    console.log(`Credentials valid: ${report.validation.valid ? '✅' : '❌'}`);
                    console.log(`Chrome Store API: ${report.chromeStoreTest?.success ? '✅' : '❌'}`);
                    console.log(`Recommendations: ${report.recommendations.length}`);
                })
                .catch(error => {
                    console.error('❌ Report generation failed:', error.message);
                    process.exit(1);
                });
            break;

        case 'rotation':
            console.log('🔄 Credential Rotation Report:\n');
            const rotationReport = manager.generateRotationReport();
            console.log(JSON.stringify(rotationReport, null, 2));
            break;

        default:
            console.log(`
Chrome Web Store Credential Manager

Usage: node credential-manager.js <command>

Commands:
  validate    Validate that all required credentials are present
  test        Test Chrome Web Store API credentials
  template    Show credential template with descriptions
  report      Generate comprehensive validation report
  rotation    Generate credential rotation recommendations

Examples:
  node credential-manager.js validate
  node credential-manager.js test
  node credential-manager.js report credential-report.json
      `);
            break;
    }
}

module.exports = CredentialManager;