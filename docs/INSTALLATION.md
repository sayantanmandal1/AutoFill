# Installation Guide

This guide provides detailed instructions for installing the Job Application Autofill Extension on different browsers and platforms.

## Table of Contents
- [System Requirements](#system-requirements)
- [Chrome Installation](#chrome-installation)
- [Brave Browser Installation](#brave-browser-installation)
- [Microsoft Edge Installation](#microsoft-edge-installation)
- [Developer Installation](#developer-installation)
- [Troubleshooting](#troubleshooting)
- [Uninstallation](#uninstallation)

## System Requirements

### Supported Browsers
| Browser | Minimum Version | Recommended Version |
|---------|----------------|-------------------|
| Google Chrome | 88.0 | Latest |
| Brave Browser | 1.20 | Latest |
| Microsoft Edge | 88.0 | Latest |

### Operating Systems
- Windows 10/11
- macOS 10.14+
- Linux (Ubuntu 18.04+, other distributions)

### Hardware Requirements
- RAM: 4GB minimum, 8GB recommended
- Storage: 10MB free space
- Internet connection (for initial setup and sync)

## Chrome Installation

### Method 1: Chrome Web Store (Recommended)
*Coming soon - extension will be published to Chrome Web Store*

1. Open Google Chrome
2. Navigate to the Chrome Web Store
3. Search for "Job Application Autofill"
4. Click "Add to Chrome"
5. Confirm by clicking "Add extension"

### Method 2: Manual Installation (Developer Mode)

1. **Download the Extension**
   - Download the latest release from GitHub
   - Extract the ZIP file to a folder

2. **Enable Developer Mode**
   - Open Chrome and navigate to `chrome://extensions/`
   - Toggle "Developer mode" in the top right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the extracted extension folder
   - The extension icon will appear in your toolbar

4. **Verify Installation**
   - Look for the extension icon in the browser toolbar
   - Click the icon to open the popup interface
   - You should see the settings form

## Brave Browser Installation

Brave uses the same extension system as Chrome, so the installation process is identical.

### Using Chrome Web Store
1. Open Brave Browser
2. Navigate to the Chrome Web Store
3. Search for "Job Application Autofill"
4. Click "Add to Brave"
5. Confirm the installation

### Manual Installation
1. **Access Extensions**
   - Open Brave and navigate to `brave://extensions/`
   - Enable "Developer mode"

2. **Load Extension**
   - Click "Load unpacked"
   - Select the extension folder
   - Verify the extension appears in your toolbar

### Brave-Specific Notes
- The extension respects Brave's privacy settings
- Brave Shields may initially block the extension - this is normal
- The extension works with Brave's built-in ad blocker

## Microsoft Edge Installation

### Method 1: Microsoft Edge Add-ons Store
*Coming soon - extension will be published to Edge Add-ons*

1. Open Microsoft Edge
2. Navigate to Microsoft Edge Add-ons
3. Search for "Job Application Autofill"
4. Click "Get"
5. Confirm installation

### Method 2: Chrome Web Store
Edge supports Chrome extensions:

1. Open Edge and navigate to Chrome Web Store
2. Click "Allow extensions from other stores"
3. Search for and install the extension
4. Confirm when prompted

### Method 3: Manual Installation
1. **Access Extensions**
   - Navigate to `edge://extensions/`
   - Enable "Developer mode"

2. **Load Extension**
   - Click "Load unpacked"
   - Select the extension folder
   - Verify installation

## Developer Installation

For developers who want to modify or contribute to the extension:

### Prerequisites
```bash
# Install Node.js and npm
node --version  # Should be v14+
npm --version   # Should be v6+

# Install Git
git --version
```

### Setup Process
1. **Clone Repository**
   ```bash
   git clone https://github.com/yourusername/job-application-autofill.git
   cd job-application-autofill
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Tests**
   ```bash
   npm test
   npm run test:cross-browser
   ```

4. **Load in Browser**
   - Follow manual installation steps above
   - Point to the cloned repository folder

### Development Commands
```bash
# Run tests in watch mode
npm run test:watch

# Validate browser compatibility
node validate-browser-compatibility.js

# Run specific test suites
npm run test:browser-compatibility
```

## Post-Installation Setup

### Initial Configuration
1. **Click Extension Icon**
   - Look for the extension icon in your browser toolbar
   - If not visible, click the puzzle piece icon and pin the extension

2. **Set Up Your Profile**
   - Fill in your personal information
   - Add custom fields as needed
   - Click "Save Settings"

3. **Configure Settings**
   - Enable/disable automatic autofill
   - Set up password protection (optional)
   - Add blacklisted domains if needed

### Testing the Extension
1. **Navigate to a Form**
   - Go to any website with a form (e.g., Google Forms)
   - Try a job application site

2. **Test Autofill**
   - Click the extension icon and press "Autofill Now"
   - Or use the keyboard shortcut: `Alt+Shift+F`

3. **Verify Results**
   - Check that fields are filled correctly
   - Look for the success toast notification

## Troubleshooting

### Common Issues

#### Extension Not Appearing
**Problem**: Extension icon not visible in toolbar
**Solution**: 
- Click the puzzle piece icon (Extensions menu)
- Find "Job Application Autofill" and click the pin icon
- The extension should now appear in the toolbar

#### Autofill Not Working
**Problem**: Forms not being filled
**Solutions**:
1. Check if the website is blacklisted
2. Refresh the page and try again
3. Verify that profile data is saved
4. Check browser console for errors (F12 → Console)

#### Storage Sync Issues
**Problem**: Data not syncing across devices
**Solutions**:
1. Ensure you're signed into the same browser account
2. Check internet connection
3. Try manually syncing browser data
4. Extension will fallback to local storage if sync fails

#### Permission Errors
**Problem**: Extension requesting unexpected permissions
**Solution**: 
- The extension only requests: storage, activeTab, scripting
- These are necessary for core functionality
- No additional permissions should be requested

### Browser-Specific Issues

#### Chrome Issues
- **Manifest V3 Warnings**: Normal for new extension format
- **Storage Quota**: Chrome has generous storage limits
- **Performance**: Should work smoothly on Chrome 88+

#### Brave Issues
- **Brave Shields**: May initially block extension features
- **Privacy Settings**: Extension respects Brave's privacy mode
- **Compatibility**: 100% compatible with Chrome extensions

#### Edge Issues
- **Chrome Store Extensions**: May show compatibility warnings
- **Sync Differences**: Edge sync works differently than Chrome
- **Performance**: Identical to Chrome performance

### Debug Mode
Enable debug mode for detailed logging:

1. **Open Browser Console** (F12)
2. **Set Debug Flag**:
   ```javascript
   localStorage.setItem('autofill_debug', 'true');
   ```
3. **Reload Extension**
4. **Check Console** for detailed logs

### Getting Help
If you encounter issues not covered here:

1. **Check GitHub Issues**: Look for similar problems
2. **Create New Issue**: Provide detailed information:
   - Browser version and type
   - Extension version
   - Steps to reproduce
   - Console error messages
   - Screenshots if applicable

## Uninstallation

### Chrome/Brave
1. Navigate to `chrome://extensions/` or `brave://extensions/`
2. Find "Job Application Autofill"
3. Click "Remove"
4. Confirm removal

### Edge
1. Navigate to `edge://extensions/`
2. Find "Job Application Autofill"
3. Click "Remove"
4. Confirm removal

### Data Cleanup
The extension stores data in browser storage, which is automatically removed when you uninstall. However, if you want to manually clear data:

1. **Open Browser Console** (F12)
2. **Clear Extension Data**:
   ```javascript
   chrome.storage.sync.clear();
   chrome.storage.local.clear();
   ```

## Security Considerations

### Permissions Explained
- **storage**: Save your profile data locally
- **activeTab**: Access the current tab to fill forms
- **scripting**: Inject content script for form detection

### Data Privacy
- All data stays in your browser
- No information is sent to external servers
- Optional password protection available
- Data syncs through browser's built-in sync (if enabled)

### Safe Usage
- Only use on trusted websites
- Review filled data before submitting forms
- Use password protection for sensitive information
- Regularly update the extension

---

For additional help, see our [FAQ](FAQ.md) or [Contributing Guide](../CONTRIBUTING.md).