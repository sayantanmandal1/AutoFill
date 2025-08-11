# Comprehensive Troubleshooting Guide

This guide covers common issues and solutions for the Job Application Autofill Extension. For field-specific debugging, also see the [Debugging Guide](../DEBUGGING_GUIDE.md).

## 🚨 Quick Fixes

### Extension Not Working At All
1. **Check Extension Status**: Go to `chrome://extensions/` and ensure extension is enabled
2. **Reload Extension**: Click the reload button on the extension card
3. **Restart Browser**: Close and reopen your browser
4. **Clear Browser Cache**: Clear cache and cookies, then reload the page

### Autofill Button Not Responding
1. **Refresh Page**: Reload the webpage and try again
2. **Check Profile Data**: Ensure your profile information is saved
3. **Try Keyboard Shortcut**: Use `Alt+Shift+F` instead of the button
4. **Wait for Page Load**: Some forms load dynamically - wait 3-5 seconds

## 🔧 Installation Issues

### Extension Won't Install
**Problem**: "Package is invalid" or installation fails

**Solutions**:
1. **Download Fresh Copy**: Re-download the extension files
2. **Check File Integrity**: Ensure all files are present and not corrupted
3. **Disable Antivirus**: Temporarily disable antivirus during installation
4. **Use Different Browser**: Try installing in a different browser first
5. **Clear Extension Cache**: 
   ```bash
   # Windows
   %LOCALAPPDATA%\Google\Chrome\User Data\Default\Extensions
   
   # Mac
   ~/Library/Application Support/Google/Chrome/Default/Extensions
   
   # Linux
   ~/.config/google-chrome/Default/Extensions
   ```

### Extension Disappears After Browser Restart
**Problem**: Extension not persisting between browser sessions

**Solutions**:
1. **Check Developer Mode**: Ensure developer mode stays enabled
2. **Pin Extension**: Click puzzle piece icon → pin the extension
3. **Disable Extension Management**: Check if corporate policies are removing extensions
4. **Install from Store**: Use Chrome Web Store version when available

### Permission Errors During Installation
**Problem**: Browser blocks extension installation

**Solutions**:
1. **Enable Developer Mode**: Required for manual installation
2. **Check Corporate Policies**: Some organizations block extension installation
3. **Use Incognito Mode**: Try installing in incognito mode first
4. **Update Browser**: Ensure you're using a supported browser version

## 📝 Form Detection Issues

### No Forms Detected
**Problem**: Extension says "No fillable form fields found"

**Solutions**:
1. **Wait for Dynamic Content**: Some forms load after page load
2. **Check Form Structure**: Ensure page actually contains form elements
3. **Scroll Down**: Some forms are below the fold
4. **Enable Debug Mode**: See what fields are actually detected
   ```javascript
   localStorage.setItem('autofill_debug', 'true');
   ```

### Wrong Fields Being Filled
**Problem**: Extension fills incorrect form fields

**Solutions**:
1. **Review Field Mappings**: Check which fields are being matched
2. **Add Custom Fields**: Create specific mappings for problematic sites
3. **Use Blacklist**: Add problematic domains to blacklist
4. **Report Issue**: Create GitHub issue with specific website details

### Smart Field Selection Not Working
**Problem**: Gender/campus dropdowns not selecting correctly

**Solutions**:
1. **Check Available Options**: Inspect dropdown to see available choices
2. **Add Custom Mappings**: Map specific field names to your data
3. **Update Field Patterns**: Extension may need new selection patterns
4. **Manual Override**: Fill these fields manually after autofill

## 💾 Data Storage Issues

### Profile Data Not Saving
**Problem**: Settings don't persist after closing popup

**Solutions**:
1. **Click Save Button**: Ensure you click "Save Settings" before closing
2. **Check Storage Permissions**: Extension needs storage permission
3. **Clear Storage and Retry**:
   ```javascript
   chrome.storage.sync.clear();
   chrome.storage.local.clear();
   ```
4. **Check Storage Quota**: Browser may be out of storage space
5. **Disable Sync**: Try using local storage only

### Data Not Syncing Across Devices
**Problem**: Profile data doesn't appear on other devices

**Solutions**:
1. **Check Browser Sync**: Ensure browser sync is enabled and working
2. **Sign Into Same Account**: Use same Google/Microsoft account on all devices
3. **Manual Sync**: Force browser sync in browser settings
4. **Check Network**: Ensure stable internet connection
5. **Use Local Storage**: Extension falls back to local storage automatically

### Lost Profile Data
**Problem**: All profile data disappeared

**Solutions**:
1. **Check Browser Storage**:
   ```javascript
   chrome.storage.sync.get(null, console.log);
   chrome.storage.local.get(null, console.log);
   ```
2. **Restore from Backup**: If you have exported data, re-import it
3. **Check Browser Updates**: Recent browser updates may have cleared data
4. **Recreate Profile**: Unfortunately, may need to re-enter data

## 🌐 Browser-Specific Issues

### Google Chrome Issues

#### Extension Blocked by Enterprise Policy
**Problem**: "This extension is blocked by administrator"

**Solutions**:
1. **Contact IT Department**: Request extension to be whitelisted
2. **Use Personal Browser**: Install on personal Chrome profile
3. **Use Different Browser**: Try Brave or Edge instead
4. **Portable Browser**: Use portable Chrome version

#### Manifest V3 Warnings
**Problem**: Console shows Manifest V3 warnings

**Solutions**:
- **Ignore Warnings**: These are normal for new extension format
- **Update Browser**: Ensure Chrome is up to date
- **No Action Needed**: Warnings don't affect functionality

### Brave Browser Issues

#### Brave Shields Blocking Extension
**Problem**: Extension features not working due to Brave Shields

**Solutions**:
1. **Allow Extension**: Click Brave Shields → allow extension
2. **Disable Shields**: Temporarily disable for specific sites
3. **Check Privacy Settings**: Adjust Brave's privacy settings
4. **Update Brave**: Ensure latest version is installed

#### Sync Issues with Brave
**Problem**: Data not syncing in Brave browser

**Solutions**:
1. **Enable Brave Sync**: Set up Brave's sync feature
2. **Use Chrome Sync**: Sign into Google account for Chrome sync
3. **Manual Backup**: Export/import data manually
4. **Local Storage Only**: Disable sync and use local storage

### Microsoft Edge Issues

#### Chrome Web Store Extensions Warning
**Problem**: Edge shows warnings about Chrome extensions

**Solutions**:
- **Allow Extensions**: Click "Allow extensions from other stores"
- **Ignore Warnings**: Safe to proceed with installation
- **Use Edge Add-ons**: Wait for Edge Add-ons store version

#### Edge Sync Differences
**Problem**: Data syncing differently than expected

**Solutions**:
1. **Use Microsoft Account**: Sign into Microsoft account for Edge sync
2. **Check Sync Settings**: Verify extensions are included in sync
3. **Manual Sync**: Force sync in Edge settings
4. **Use Local Storage**: Disable sync if problematic

## 🔐 Security and Privacy Issues

### Extension Requesting Unexpected Permissions
**Problem**: Extension asks for permissions not listed in documentation

**Solutions**:
1. **Verify Extension Source**: Ensure you downloaded from official source
2. **Check Permissions**: Extension should only request:
   - `storage` (save your data)
   - `activeTab` (access current tab)
   - `scripting` (inject content script)
3. **Don't Grant Extra Permissions**: Deny any additional permission requests
4. **Reinstall Extension**: Download fresh copy if permissions seem wrong

### Data Privacy Concerns
**Problem**: Worried about data security

**Solutions**:
1. **Review Privacy Policy**: All data stays local in your browser
2. **Enable Password Protection**: Add password protection in settings
3. **Check Network Activity**: Extension makes no external network requests
4. **Audit Source Code**: Extension is open source - review the code
5. **Use Incognito Mode**: Test extension behavior in incognito mode

### Suspicious Extension Behavior
**Problem**: Extension behaving unexpectedly

**Solutions**:
1. **Check Extension Source**: Verify you installed the official version
2. **Review Permissions**: Check what permissions are granted
3. **Monitor Network**: Use browser dev tools to monitor network requests
4. **Disable Extension**: Immediately disable if behavior is suspicious
5. **Report Security Issue**: Create GitHub security issue if needed

## ⚡ Performance Issues

### Extension Causing Browser Slowdown
**Problem**: Browser becomes slow after installing extension

**Solutions**:
1. **Check Memory Usage**: Monitor extension memory usage
2. **Disable Debug Mode**: Turn off debug logging if enabled
3. **Clear Extension Data**: Reset extension to defaults
4. **Update Browser**: Ensure browser is up to date
5. **Reduce Profile Size**: Remove unnecessary custom fields

### Slow Form Detection
**Problem**: Extension takes too long to detect forms

**Solutions**:
1. **Wait for Page Load**: Ensure page is fully loaded
2. **Check Page Complexity**: Very complex pages may take longer
3. **Disable Other Extensions**: Test with other extensions disabled
4. **Clear Browser Cache**: Clear cache and reload page
5. **Report Performance Issue**: Create GitHub issue with specific site

### High CPU Usage
**Problem**: Extension using too much CPU

**Solutions**:
1. **Check Debug Mode**: Disable debug logging
2. **Monitor Background Processes**: Check if background script is running
3. **Restart Browser**: Close and reopen browser
4. **Update Extension**: Ensure you have the latest version
5. **Report Bug**: Create GitHub issue with performance details

## 🌍 Website-Specific Issues

### Google Forms Issues

#### Forms Not Detected
**Solutions**:
1. **Wait for Full Load**: Google Forms loads dynamically
2. **Scroll Through Form**: Ensure all sections are loaded
3. **Try After Interaction**: Click on a field first, then try autofill
4. **Check Form Type**: Some Google Forms use non-standard elements

#### Multi-Page Forms
**Solutions**:
1. **Fill Each Page**: Extension works on each page separately
2. **Navigate Manually**: Use "Next" buttons to proceed
3. **Save Progress**: Google Forms auto-saves progress

### LinkedIn Issues

#### Profile Fields Not Filling
**Solutions**:
1. **Update Profile First**: Ensure LinkedIn profile is complete
2. **Try After Page Load**: Wait for React components to load
3. **Refresh Page**: LinkedIn's dynamic content may need refresh
4. **Use Manual Fill**: Some LinkedIn fields may need manual entry

#### Application Forms
**Solutions**:
1. **Check Form Type**: LinkedIn uses various form types
2. **Fill Step by Step**: Complete multi-step applications gradually
3. **Save Drafts**: Use LinkedIn's save draft feature

### Job Portal Issues (Indeed, Glassdoor, etc.)

#### Anti-Bot Detection
**Problem**: Site blocks or detects autofill

**Solutions**:
1. **Use Slower Fill**: Add delays between field fills
2. **Manual Interaction**: Click fields manually before autofill
3. **Partial Fill**: Fill some fields manually, others with extension
4. **Different Approach**: Use copy-paste instead of autofill

#### Complex Application Forms
**Solutions**:
1. **Multi-Step Process**: Handle each step separately
2. **Save Progress**: Use site's save feature between steps
3. **Manual Review**: Always review before submitting
4. **Backup Plan**: Have manual data ready as backup

## 🛠️ Advanced Troubleshooting

### Debug Mode Deep Dive
Enable comprehensive debugging:

```javascript
// Enable all debug modes
localStorage.setItem('autofill_debug', 'true');
localStorage.setItem('autofill_verbose', 'true');
localStorage.setItem('autofill_timing', 'true');

// Monitor extension messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Extension message:', message);
});

// Check extension health
console.log('Extension manifest:', chrome.runtime.getManifest());
console.log('Extension ID:', chrome.runtime.id);
```

### Storage Debugging
Check extension storage in detail:

```javascript
// Check all storage
chrome.storage.sync.get(null, (data) => {
  console.log('Sync storage:', data);
});

chrome.storage.local.get(null, (data) => {
  console.log('Local storage:', data);
});

// Check storage quota
chrome.storage.sync.getBytesInUse(null, (bytes) => {
  console.log('Sync storage used:', bytes, 'bytes');
});

// Clear specific data
chrome.storage.sync.remove(['profiles', 'settings']);
```

### Network Debugging
Monitor extension network activity:

```javascript
// Check if extension makes any network requests (it shouldn't)
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('Fetch request:', args);
  return originalFetch.apply(this, args);
};

// Monitor XMLHttpRequest
const originalXHR = window.XMLHttpRequest;
window.XMLHttpRequest = function() {
  const xhr = new originalXHR();
  const originalOpen = xhr.open;
  xhr.open = function(method, url) {
    console.log('XHR request:', method, url);
    return originalOpen.apply(this, arguments);
  };
  return xhr;
};
```

### Performance Profiling
Profile extension performance:

```javascript
// Time critical operations
console.time('form-detection');
// ... perform form detection ...
console.timeEnd('form-detection');

// Memory usage monitoring
console.log('Memory usage:', performance.memory);

// Performance marks
performance.mark('autofill-start');
// ... perform autofill ...
performance.mark('autofill-end');
performance.measure('autofill-duration', 'autofill-start', 'autofill-end');
console.log('Performance measures:', performance.getEntriesByType('measure'));
```

## 🆘 Emergency Recovery

### Complete Extension Reset
If extension is completely broken:

```javascript
// Nuclear option - clear everything
chrome.storage.sync.clear();
chrome.storage.local.clear();
localStorage.clear();
sessionStorage.clear();

// Then reload extension
chrome.runtime.reload();
```

### Backup and Restore
Before making major changes:

```javascript
// Backup current data
chrome.storage.sync.get(null, (data) => {
  console.log('Backup this data:', JSON.stringify(data));
  // Copy the output and save it somewhere safe
});

// Restore from backup
const backupData = {/* paste your backup data here */};
chrome.storage.sync.set(backupData, () => {
  console.log('Data restored');
});
```

### Rollback to Previous Version
If new version is problematic:

1. **Download Previous Version**: Get previous release from GitHub
2. **Remove Current Version**: Uninstall current extension
3. **Install Previous Version**: Load previous version manually
4. **Report Issue**: Create GitHub issue about the problem

## 📞 Getting Additional Help

### Before Asking for Help
1. **Try All Relevant Solutions**: Work through this troubleshooting guide
2. **Enable Debug Mode**: Gather debug information
3. **Test in Incognito**: Try extension in incognito mode
4. **Test Different Sites**: Try extension on multiple websites
5. **Check Browser Console**: Look for error messages

### Information to Include When Asking for Help
1. **Environment Details**:
   - Browser type and version
   - Operating system
   - Extension version
   - Website URL (if not sensitive)

2. **Problem Description**:
   - What you expected to happen
   - What actually happened
   - Steps to reproduce the issue

3. **Technical Information**:
   - Console error messages
   - Debug mode output
   - Screenshots or screen recordings
   - Network activity (if relevant)

4. **Troubleshooting Attempted**:
   - What solutions you've tried
   - Results of each attempt
   - Any workarounds you've found

### Where to Get Help
1. **GitHub Issues**: For bugs and technical problems
2. **GitHub Discussions**: For questions and general help
3. **Documentation**: Check all documentation files
4. **Community Forums**: Stack Overflow, Reddit, etc.
5. **Direct Contact**: Maintainer contact information (if available)

---

## 📋 Quick Reference Checklist

### Basic Troubleshooting Steps
- [ ] Extension is enabled in browser
- [ ] Page is fully loaded
- [ ] Profile data is saved
- [ ] No browser console errors
- [ ] Extension has required permissions
- [ ] Browser is up to date
- [ ] Try in incognito mode
- [ ] Test on different website

### Advanced Troubleshooting Steps
- [ ] Enable debug mode
- [ ] Check storage data
- [ ] Monitor network activity
- [ ] Profile performance
- [ ] Test with other extensions disabled
- [ ] Clear browser cache
- [ ] Reset extension to defaults
- [ ] Try different browser

### When to Seek Help
- [ ] Tried all relevant solutions
- [ ] Gathered debug information
- [ ] Can reproduce the issue
- [ ] Have specific error messages
- [ ] Tested in multiple environments

Remember: Most issues can be resolved with basic troubleshooting. Don't hesitate to ask for help if you're stuck!