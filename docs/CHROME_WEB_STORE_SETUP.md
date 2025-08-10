# Chrome Web Store Auto-Update Setup Guide

This guide explains how to set up automatic Chrome Web Store updates for your extension using GitHub Actions.

## Overview

The auto-update system works by:
1. **GitHub Release** triggers the deployment workflow
2. **Automated Build** creates the extension package
3. **Version Management** updates version numbers automatically
4. **Chrome Web Store API** uploads and publishes the extension
5. **User Updates** happen automatically via Chrome's update mechanism

## Prerequisites

### 1. Chrome Web Store Developer Account

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay the one-time $5 developer registration fee
3. Create your extension listing (can be unpublished initially)
4. Note your **Extension ID** from the URL or dashboard

### 2. Google Cloud Project Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Chrome Web Store API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Chrome Web Store API"
   - Click "Enable"

### 3. OAuth 2.0 Credentials

1. In Google Cloud Console, go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Desktop application" as application type
4. Name it "Chrome Extension Auto-Deploy"
5. Download the credentials JSON file
6. Note the **Client ID** and **Client Secret**

### 4. Generate Refresh Token

Run this script to generate a refresh token:

```bash
# Install required packages
npm install googleapis

# Create token generation script
cat > generate-refresh-token.js << 'EOF'
const { google } = require('googleapis');
const readline = require('readline');

const CLIENT_ID = 'your-client-id-here';
const CLIENT_SECRET = 'your-client-secret-here';
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';
const SCOPE = 'https://www.googleapis.com/auth/chromewebstore';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Generate auth URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPE,
});

console.log('1. Open this URL in your browser:');
console.log(authUrl);
console.log('\n2. Complete the authorization');
console.log('3. Copy the authorization code and paste it below:');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter authorization code: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('\n✅ Success! Your refresh token:');
    console.log(tokens.refresh_token);
    console.log('\n⚠️ Keep this token secure - it provides access to your Chrome Web Store account!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  rl.close();
});
EOF

# Update the script with your credentials
sed -i 's/your-client-id-here/YOUR_ACTUAL_CLIENT_ID/' generate-refresh-token.js
sed -i 's/your-client-secret-here/YOUR_ACTUAL_CLIENT_SECRET/' generate-refresh-token.js

# Run the script
node generate-refresh-token.js
```

## GitHub Repository Setup

### 1. Add Repository Secrets

Go to your GitHub repository > Settings > Secrets and variables > Actions

Add these secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `CHROME_CLIENT_ID` | OAuth 2.0 Client ID | `123456789-abc.apps.googleusercontent.com` |
| `CHROME_CLIENT_SECRET` | OAuth 2.0 Client Secret | `GOCSPX-abcdefghijklmnop` |
| `CHROME_REFRESH_TOKEN` | OAuth 2.0 Refresh Token | `1//04abcdefghijklmnop...` |
| `CHROME_EXTENSION_ID` | Chrome Web Store Extension ID | `abcdefghijklmnopqrstuvwxyz123456` |

### 2. Repository Settings

1. **Enable GitHub Actions** in repository settings
2. **Set up GitHub Pages** for documentation (optional)
3. **Configure branch protection** for main branch
4. **Enable vulnerability alerts** for security

### 3. Environment Setup (Optional)

For additional security, create a deployment environment:

1. Go to Settings > Environments
2. Create environment named `chrome-web-store`
3. Add protection rules:
   - Required reviewers for production deployments
   - Restrict to specific branches (main, release/*)
4. Add environment secrets (same as repository secrets)

## Usage

### Automatic Deployment (Recommended)

1. **Create a Release**:
   ```bash
   # Tag and push a new version
   git tag v1.2.3
   git push origin v1.2.3
   
   # Or create release via GitHub UI
   ```

2. **GitHub Actions automatically**:
   - Runs all tests
   - Builds the extension
   - Updates version numbers
   - Uploads to Chrome Web Store
   - Publishes for users

### Manual Deployment

Use the workflow dispatch feature:

1. Go to Actions > Chrome Web Store Deployment
2. Click "Run workflow"
3. Enter version number (e.g., `1.2.3`)
4. Choose options:
   - Skip publish (upload only)
   - Publish target (default or trustedTesters)

### Command Line Deployment

```bash
# Install dependencies
npm install

# Build extension
npm run build

# Deploy to Chrome Web Store
npm run chrome-store:upload

# Or with specific options
SKIP_PUBLISH=true npm run chrome-store:upload
PUBLISH_TARGET=trustedTesters npm run chrome-store:upload
```

## Version Management

### Semantic Versioning

The system uses semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

### Automatic Version Updates

When you create a release tag (e.g., `v1.2.3`), the system automatically:

1. Updates `manifest.json` version
2. Updates `package.json` version
3. Generates changelog from git commits
4. Creates GitHub release with notes

### Manual Version Management

```bash
# Check current version
node scripts/version-manager.js current

# Update to specific version
node scripts/version-manager.js update 1.2.3

# Increment version
node scripts/version-manager.js increment patch
node scripts/version-manager.js increment minor
node scripts/version-manager.js increment major

# Complete release workflow
node scripts/version-manager.js release 1.2.3
```

## Chrome Web Store Review Process

### Initial Submission

1. **First submission** requires manual review (1-3 days)
2. **Complete store listing** with descriptions, screenshots
3. **Privacy policy** required if extension handles user data
4. **Permissions justification** for sensitive permissions

### Updates

1. **Minor updates** (bug fixes) are usually auto-approved
2. **Major updates** (new permissions) may require review
3. **Review time** is typically 1-24 hours for updates

### Best Practices

1. **Test thoroughly** before releasing
2. **Use staging environment** for testing
3. **Monitor user feedback** after releases
4. **Keep permissions minimal**
5. **Follow Chrome Web Store policies**

## Troubleshooting

### Common Issues

**Authentication Errors:**
```
Error: Failed to get access token
```
- Check if refresh token is valid
- Regenerate refresh token if expired
- Verify client ID and secret

**Upload Errors:**
```
Error: Upload failed: Invalid manifest
```
- Validate manifest.json format
- Check required fields and permissions
- Ensure version number is higher than current

**Publish Errors:**
```
Error: Publish failed: Under review
```
- Extension is under Chrome Web Store review
- Wait for review completion
- Check developer dashboard for status

### Debug Mode

Enable debug logging:

```bash
# Set debug environment variable
export DEBUG=chrome-store-client

# Run deployment with debug info
npm run chrome-store:upload
```

### Manual Recovery

If automated deployment fails:

1. **Download build artifacts** from GitHub Actions
2. **Go to Chrome Web Store Developer Dashboard**
3. **Upload extension manually**
4. **Check deployment logs** for specific errors

## Security Considerations

### Credential Security

1. **Never commit credentials** to repository
2. **Use GitHub Secrets** for sensitive data
3. **Rotate credentials** periodically
4. **Limit access** to deployment secrets
5. **Monitor access logs** in Google Cloud Console

### Access Control

1. **Restrict repository access** to trusted developers
2. **Use branch protection** for main branch
3. **Require reviews** for deployment changes
4. **Enable audit logging** for security events

### Backup Strategy

1. **Keep local backups** of extension packages
2. **Document recovery procedures**
3. **Test rollback process** regularly
4. **Maintain version history**

## Monitoring and Alerts

### GitHub Actions Monitoring

- **Workflow status** notifications
- **Failed deployment** automatic issue creation
- **Success notifications** to team channels

### Chrome Web Store Monitoring

- **User reviews** and ratings monitoring
- **Download statistics** tracking
- **Error reports** from users
- **Policy compliance** alerts

## Support

### Resources

- [Chrome Web Store Developer Documentation](https://developer.chrome.com/docs/webstore/)
- [Chrome Web Store API Reference](https://developer.chrome.com/docs/webstore/api/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

### Getting Help

1. **Check workflow logs** for detailed error information
2. **Review Chrome Web Store policies** for compliance issues
3. **Contact Chrome Web Store support** for platform issues
4. **Create GitHub issues** for automation problems

---

## Quick Setup Checklist

- [ ] Chrome Web Store developer account created
- [ ] Extension published (can be unlisted initially)
- [ ] Google Cloud project with Chrome Web Store API enabled
- [ ] OAuth 2.0 credentials generated
- [ ] Refresh token obtained
- [ ] GitHub repository secrets configured
- [ ] Test deployment performed
- [ ] Monitoring and alerts set up
- [ ] Team access configured
- [ ] Documentation updated

Once completed, your extension will automatically update in the Chrome Web Store whenever you create a new GitHub release! 🚀