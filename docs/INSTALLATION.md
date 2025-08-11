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

### Step 1: Initial Configuration

**Find and Pin the Extension**
1. Look for the extension icon in your browser toolbar
2. If not visible, click the puzzle piece icon (Extensions menu)
3. Find "Job Application Autofill" and click the pin icon
4. The extension icon should now appear in your toolbar

**Set Up Your Profile**
1. Click the extension icon to open the popup
2. Fill in your personal information:
   - Full Name
   - Email Address
   - Phone Number
   - Academic Information (CGPA, marks)
   - Social Profiles (LinkedIn, GitHub, etc.)
3. Add custom fields for specific applications if needed
4. Click "Save Settings" to store your data

**Configure Extension Settings**
1. **Automatic Autofill**: Enable/disable auto-fill when forms are detected
2. **Password Protection**: Add password protection for sensitive data
3. **Keyboard Shortcut**: Default is `Alt+Shift+F` (can be changed in browser settings)
4. **Blacklisted Domains**: Add websites where you don't want autofill to work

### Step 2: Test the Extension

**Quick Test on Google Forms**
1. Go to [Google Forms](https://forms.google.com) and create a test form
2. Add fields like "Name", "Email", "Phone Number"
3. Open the form and test the extension:
   - Click extension icon → "Autofill Now"
   - Or press `Alt+Shift+F`
4. Verify that fields are filled correctly

**Test on Job Application Sites**
1. Visit a job portal (LinkedIn, Indeed, etc.)
2. Start filling out an application form
3. Use the extension to autofill your information
4. Review filled data before submitting

**Verify Smart Field Selection**
1. Find a form with gender/sex dropdown
2. Use autofill and verify "Male" or "M" is selected correctly
3. Find a form with campus/university dropdown
4. Verify "VIT-AP" or similar options are selected

### Step 3: Advanced Configuration

**Create Multiple Profiles**
1. Click the profile dropdown in the extension popup
2. Click "New Profile" to create additional profiles
3. Set up different profiles for:
   - Different types of applications
   - Different personal information sets
   - Testing purposes

**Set Up Custom Field Mappings**
1. For websites with unique field names, add custom mappings
2. Example: If a site uses "applicant_name" instead of "name"
3. Add custom field: Key = "applicant_name", Value = "Your Name"

**Configure Security Settings**
1. **Password Protection**: Enable if you're on a shared computer
2. **Auto-lock**: Set extension to lock after inactivity
3. **Secure Storage**: All data stays in your browser - no external servers

### Step 4: Browser-Specific Setup

**Chrome-Specific Setup**
1. **Sync Settings**: Sign into Chrome to sync extension data across devices
2. **Permissions**: Review permissions in chrome://extensions/
3. **Shortcuts**: Customize keyboard shortcuts in chrome://extensions/shortcuts

**Brave Browser Setup**
1. **Brave Shields**: Allow extension in Shields settings if needed
2. **Privacy Settings**: Extension respects Brave's privacy mode
3. **Sync**: Use Brave Sync or Chrome sync for data synchronization

**Microsoft Edge Setup**
1. **Extension Source**: Allow extensions from Chrome Web Store if needed
2. **Sync Settings**: Sign into Microsoft account for Edge sync
3. **Security**: Review extension permissions in edge://extensions/

### Step 5: Troubleshooting Initial Setup

**Extension Icon Not Visible**
- Click puzzle piece icon → find extension → click pin
- Check if extension is enabled in browser settings
- Try reloading the extension

**Autofill Not Working**
- Verify profile data is saved (click extension icon to check)
- Try refreshing the webpage
- Check browser console for error messages (F12 → Console)

**Data Not Saving**
- Ensure you clicked "Save Settings" before closing popup
- Check if browser has sufficient storage space
- Try disabling and re-enabling the extension

**Smart Fields Not Working**
- Check if dropdown has expected options (Male, VIT-AP, etc.)
- Add custom field mappings for specific websites
- Enable debug mode to see field detection details

### Step 6: Getting Started Checklist

**Basic Setup Complete**
- [ ] Extension installed and enabled
- [ ] Extension icon pinned to toolbar
- [ ] Profile data entered and saved
- [ ] Basic settings configured
- [ ] Test autofill performed successfully

**Advanced Setup (Optional)**
- [ ] Multiple profiles created if needed
- [ ] Custom field mappings added for specific sites
- [ ] Password protection enabled if desired
- [ ] Blacklisted domains configured
- [ ] Browser sync enabled for cross-device access

**Ready to Use**
- [ ] Tested on Google Forms successfully
- [ ] Tested on at least one job application site
- [ ] Familiar with keyboard shortcut (Alt+Shift+F)
- [ ] Know how to access troubleshooting resources
- [ ] Understand smart field selection features

### Next Steps

**Start Using the Extension**
1. Begin applying to jobs with confidence
2. Use autofill for Google Forms and surveys
3. Customize settings as you discover new needs
4. Report any issues or suggestions on GitHub

**Stay Updated**
1. Extension will auto-update from Chrome Web Store (when available)
2. Check GitHub releases for new features
3. Join community discussions for tips and tricks
4. Contribute feedback to help improve the extension

**Get Help When Needed**
1. Check the [Troubleshooting Guide](TROUBLESHOOTING.md) for common issues
2. Review the [Debugging Guide](../DEBUGGING_GUIDE.md) for technical problems
3. Create GitHub issues for bugs or feature requests
4. Join community discussions for general help

## Troubleshooting

### Common Issues

#### Extension Not Appearing
**Problem**: Extension icon not visible in toolbar
**Solutions**: 
- Click the puzzle piece icon (Extensions menu)
- Find "Job Application Autofill" and click the pin icon
- The extension should now appear in the toolbar
- If still not visible, try disabling and re-enabling the extension
- Check if extension is blocked by corporate policies

#### Autofill Not Working
**Problem**: Forms not being filled
**Solutions**:
1. **Check Profile Data**: Ensure your profile information is saved
   - Click extension icon → verify data is present
   - Try saving profile again if fields are empty
2. **Website Issues**: 
   - Check if the website is in your blacklist
   - Some sites may block autofill functionality
   - Try refreshing the page and waiting for full load
3. **Form Detection Issues**:
   - Wait 2-3 seconds after page load before trying autofill
   - Try clicking directly on a form field first
   - Some dynamic forms load content after initial page load
4. **Debug the Issue**:
   - Open browser console (F12 → Console)
   - Enable debug mode (see Debug Mode section below)
   - Try autofill again and check console messages

#### Smart Field Selection Not Working
**Problem**: Gender or campus fields not selecting correctly
**Solutions**:
1. **Check Available Options**: 
   - Right-click the dropdown → Inspect element
   - Verify options like "Male", "M", "VIT-AP", "VIT-Amaravathi" exist
2. **Manual Override**: Add custom field mappings in extension settings
3. **Report Field Patterns**: If new patterns are needed, create a GitHub issue

#### Storage Sync Issues
**Problem**: Data not syncing across devices
**Solutions**:
1. **Browser Account**: Ensure you're signed into the same browser account
2. **Sync Settings**: Check browser sync settings are enabled
3. **Network Issues**: Verify internet connection is stable
4. **Manual Sync**: Try signing out and back into browser account
5. **Fallback**: Extension automatically uses local storage if sync fails

#### Permission Errors
**Problem**: Extension requesting unexpected permissions
**Solutions**: 
- The extension only requests: `storage`, `activeTab`, `scripting`
- These are necessary for core functionality
- If additional permissions are requested, do not grant them
- Reinstall extension if permissions seem incorrect

#### Keyboard Shortcut Not Working
**Problem**: Alt+Shift+F shortcut not triggering autofill
**Solutions**:
1. **Shortcut Conflicts**: Check if other software uses the same shortcut
2. **Browser Focus**: Ensure the webpage has focus (click on page first)
3. **Extension Permissions**: Verify extension has necessary permissions
4. **Alternative**: Use the "Autofill Now" button instead

#### Performance Issues
**Problem**: Extension running slowly or causing browser lag
**Solutions**:
1. **Clear Extension Data**: Reset extension to defaults
2. **Reduce Profile Size**: Remove unnecessary custom fields
3. **Check Memory Usage**: Close other browser tabs if needed
4. **Update Browser**: Ensure you're using the latest browser version

### Browser-Specific Issues

#### Chrome Issues
- **Manifest V3 Warnings**: Normal for new extension format - can be ignored
- **Storage Quota**: Chrome provides 100KB sync storage + unlimited local storage
- **Performance**: Optimized for Chrome 88+ with best performance
- **Corporate Policies**: Some organizations block extension installation

#### Brave Browser Issues
- **Brave Shields**: May initially block extension features
  - Solution: Allow extension in Shields settings
- **Privacy Settings**: Extension respects Brave's strict privacy mode
- **Ad Blocker**: Built-in ad blocker doesn't interfere with extension
- **Compatibility**: 100% compatible with Chrome extensions

#### Microsoft Edge Issues
- **Chrome Store Extensions**: May show compatibility warnings - safe to ignore
- **Sync Differences**: Edge sync works differently than Chrome sync
- **Performance**: Identical to Chrome performance
- **Enterprise Mode**: May have additional restrictions in corporate environments

### Website-Specific Issues

#### Google Forms
- **Dynamic Loading**: Wait for form to fully load before autofill
- **Multiple Pages**: Extension works on multi-page forms
- **Required Fields**: Some fields may not accept autofill - fill manually

#### LinkedIn
- **React Components**: May require page refresh after profile updates
- **Field Variations**: Uses dynamic field names - extension adapts automatically
- **Premium Features**: Works with both free and premium LinkedIn accounts

#### Job Portal Sites (Indeed, Glassdoor, etc.)
- **Anti-Bot Measures**: Some sites may detect and block autofill
- **Multi-Step Forms**: Extension handles complex application workflows
- **File Uploads**: Cannot automate file uploads - handle manually

### Debug Mode
Enable debug mode for detailed logging:

1. **Open Browser Console** (F12 → Console tab)
2. **Enable Debug Mode**:
   ```javascript
   localStorage.setItem('autofill_debug', 'true');
   ```
3. **Reload the Page**
4. **Try Autofill** and check console for detailed logs
5. **Disable Debug Mode** when done:
   ```javascript
   localStorage.removeItem('autofill_debug');
   ```

### Advanced Troubleshooting

#### Reset Extension to Defaults
If extension is completely broken:
1. **Backup Data**: Export your profile if possible
2. **Clear All Data**:
   ```javascript
   chrome.storage.sync.clear();
   chrome.storage.local.clear();
   ```
3. **Reload Extension**: Go to chrome://extensions/ → reload extension
4. **Reconfigure**: Set up your profile again

#### Check Extension Health
Verify extension is working correctly:
```javascript
// Check if content script is loaded
console.log('Content script loaded:', typeof AutofillManager !== 'undefined');

// Check storage access
chrome.storage.sync.get(null, (data) => {
  console.log('Extension data:', data);
});

// Test field detection
console.log('Detected fields:', document.querySelectorAll('input, select, textarea').length);
```

#### Performance Monitoring
Monitor extension performance:
```javascript
// Check memory usage
console.log('Memory usage:', performance.memory);

// Time autofill operation
console.time('autofill');
// ... perform autofill ...
console.timeEnd('autofill');
```

### Getting Help

#### Self-Help Resources
1. **Documentation**: Check all documentation files in the repository
2. **FAQ**: Review frequently asked questions
3. **Debug Guide**: Use the comprehensive debugging guide
4. **Test Forms**: Try extension on simple test forms first

#### Community Support
1. **GitHub Issues**: Search existing issues for similar problems
2. **GitHub Discussions**: Ask questions and share experiences
3. **Stack Overflow**: Tag questions with `chrome-extension` and `autofill`

#### Reporting Issues
When creating a GitHub issue, include:
1. **Environment Information**:
   - Browser type and version
   - Operating system
   - Extension version
2. **Problem Description**:
   - What you expected to happen
   - What actually happened
   - Steps to reproduce
3. **Technical Details**:
   - Console error messages
   - Screenshots or screen recordings
   - Debug mode output
   - Website URL (if not sensitive)
4. **Attempted Solutions**:
   - What troubleshooting steps you've tried
   - Any workarounds you've found

#### Emergency Workarounds
If extension is completely broken:
1. **Manual Form Filling**: Fill forms manually until issue is resolved
2. **Browser Autofill**: Use browser's built-in autofill as temporary solution
3. **Extension Alternatives**: Consider temporary alternatives while troubleshooting
4. **Previous Version**: Downgrade to previous working version if available

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