# API Documentation

This document provides comprehensive API documentation for the Job Application Autofill Chrome Extension.

Generated on: 2025-08-10

## Table of Contents

- [Storage API](#storage-api)
- [Content API](#content-api)
- [Background API](#background-api)
- [Popup API](#popup-api)

---

## Storage API

Source file: `storage.js`

### PasswordManager

Storage utility functions for Job Application Autofill Extension Handles chrome.storage.sync operations with data validation / /** Password utility functions for secure password handling

### StorageManager

Storage utility class for managing extension data

### Functions

#### `hashPassword(password)`

Hash a password using SHA-256

**Parameters:**

- `password` (`string`) - Plain text password

**Returns:** `Promise<string>` - Hashed password

#### `verifyPassword(password, hash)`

Verify a password against a hash

**Parameters:**

- `password` (`string`) - Plain text password
- `hash` (`string`) - Stored password hash

**Returns:** `Promise<boolean>` - True if password matches

#### `generateSalt()`

Generate a random salt for additional security

**Returns:** `string` - Random salt string

#### `hashPasswordWithSalt(password, salt)`

Hash password with salt

**Parameters:**

- `password` (`string`) - Plain text password
- `salt` (`string`) - Salt string

**Returns:** `Promise<string>` - Salted hash

#### `initialize()`

Initialize storage with default data structure if not exists

**Returns:** `Promise<Object>` - The initialized data structure

#### `getAllData()`

Get all stored data

**Returns:** `Promise<Object>` - Complete data structure

#### `getActiveProfile()`

Get active profile data

**Returns:** `Promise<Object>` - Active profile data

#### `saveProfile(profileId, profileData)`

Save profile data

**Parameters:**

- `profileId` (`string`) - Profile identifier
- `profileData` (`Object`) - Profile data to save

**Returns:** `Promise<void>` - 

#### `getSettings()`

Get settings

**Returns:** `Promise<Object>` - Settings object

#### `saveSettings(settings)`

Save settings

**Parameters:**

- `settings` (`Object`) - Settings to save

**Returns:** `Promise<void>` - 

#### `validateAndMergeData(data)`

Validate and merge data with defaults

**Parameters:**

- `data` (`Object`) - Data to validate

**Returns:** `Object` - Validated and merged data

#### `validateProfileData(profileData)`

Validate profile data

**Parameters:**

- `profileData` (`Object`) - Profile data to validate

**Returns:** `Object` - Validated profile data

**Throws:** `Error` - If validation fails

#### `isValidEmail(email)`

Validate email format

**Parameters:**

- `email` (`string`) - Email to validate

**Returns:** `boolean` - True if valid

#### `isValidUrl(url)`

Validate URL format

**Parameters:**

- `url` (`string`) - URL to validate

**Returns:** `boolean` - True if valid

#### `isValidPhone(phone)`

Validate phone number format

**Parameters:**

- `phone` (`string`) - Phone number to validate

**Returns:** `boolean` - True if valid

#### `validateSettings(settings)`

Validate settings data

**Parameters:**

- `settings` (`Object`) - Settings to validate

**Returns:** `Object` - Validated settings

**Throws:** `Error` - If validation fails

#### `isValidDomain(domain)`

Validate domain format

**Parameters:**

- `domain` (`string`) - Domain to validate

**Returns:** `boolean` - True if valid

#### `setupPassword(password)`

Set up password protection

**Parameters:**

- `password` (`string`) - New password

**Returns:** `Promise<void>` - 

#### `changePassword(currentPassword, newPassword)`

Change password

**Parameters:**

- `currentPassword` (`string`) - Current password
- `newPassword` (`string`) - New password

**Returns:** `Promise<boolean>` - True if password changed successfully

#### `verifyPassword(password)`

Verify password for access

**Parameters:**

- `password` (`string`) - Password to verify

**Returns:** `Promise<boolean>` - True if password is correct

#### `disablePasswordProtection(currentPassword)`

Disable password protection

**Parameters:**

- `currentPassword` (`string`) - Current password for verification

**Returns:** `Promise<boolean>` - True if disabled successfully

#### `clearAll()`

Clear all data (for testing purposes)

**Returns:** `Promise<void>` - 


---

## Content API

Source file: `content.js`

### AutofillManager

Content script for Job Application Autofill extension - Google Forms Optimized Handles form detection, field matching, and autofill operations across different form types / /** Main autofill manager class that handles form detection and filling operations Supports both Google Forms and standard HTML forms with intelligent field matching

### Functions

#### `constructor()()`

Initialize the AutofillManager with debug mode and message listener

#### `isDebugMode()`

Check if debug mode is enabled via localStorage

**Returns:** `boolean` - True if debug mode is enabled

#### `log(message, data`

Log debug messages when debug mode is enabled

**Parameters:**

- `message` (`string`) - The message to log
- `data` (`*`) - Optional data to log alongside the message

#### `setupMessageListener()`

Set up Chrome extension message listener for autofill requests Listens for 'autofill' action messages from the extension popup

#### `performAutofill(data)`

Perform the main autofill operation on the current page

**Parameters:**

- `data` (`Object`) - User profile data containing form field values

**Returns:** `Promise<Object>` - Result object with filledCount and message

**Throws:** `Error` - If autofill operation fails

#### `isGoogleForm()`

Detect if the current page is a Google Form

**Returns:** `boolean` - True if the current page is a Google Form

#### `detectGoogleFormFields()`

Detect and extract form fields from Google Forms Uses Google Forms specific selectors and DOM structure

**Returns:** `Array<Object>` - Array of field information objects

#### `detectStandardFormFields()`

Detect and extract form fields from standard HTML forms

**Returns:** `Array<Object>` - Array of field information objects

#### `isGoogleFormFieldFillable(element)`

Check if a Google Form field element can be filled

**Parameters:**

- `element` (`HTMLElement`) - The form field element to check

**Returns:** `boolean` - True if the field can be filled

#### `isFieldFillable(element)`

Check if a standard form field element can be filled

**Parameters:**

- `element` (`HTMLElement`) - The form field element to check

**Returns:** `boolean` - True if the field can be filled

#### `extractGoogleFormFieldInfo(element)`

Extract field information from Google Form elements Uses multiple strategies to identify field labels and context

**Parameters:**

- `element` (`HTMLElement`) - The form field element

**Returns:** `Object` - Field information object with element, type, labels, and searchText

#### `extractFieldInfo(element)`

Extract field information from standard HTML form elements

**Parameters:**

- `element` (`HTMLElement`) - The form field element

**Returns:** `Object` - Field information object with element, type, labels, and searchText

#### `findNearbyText(element)`

Find nearby text content that might serve as field labels Searches through previous siblings and parent elements

**Parameters:**

- `element` (`HTMLElement`) - The form field element

**Returns:** `string` - Combined nearby text content

#### `matchFieldsToData(fields, data)`

Match detected form fields to user profile data using intelligent pattern matching

**Parameters:**

- `fields` (`Array<Object>`) - Array of detected form field objects
- `data` (`Object`) - User profile data object

**Returns:** `Array<Object>` - Array of matched field-data pairs with confidence scores

**Throws:** `Error` - If no matches are found

#### `fillFields(matches, isGoogleForm)`

Fill form fields with matched data values

**Parameters:**

- `matches` (`Array<Object>`) - Array of field-data matches
- `isGoogleForm` (`boolean`) - Whether this is a Google Form

**Returns:** `number` - Number of successfully filled fields

#### `fillGoogleFormField(element, value)`

Fill a Google Form field with the specified value Uses Google Forms specific event handling for proper form state updates

**Parameters:**

- `element` (`HTMLElement`) - The form field element to fill
- `value` (`string`) - The value to fill into the field

**Returns:** `boolean` - True if the field was successfully filled

#### `fillStandardField(element, value)`

Fill a standard HTML form field with the specified value

**Parameters:**

- `element` (`HTMLElement`) - The form field element to fill
- `value` (`string`) - The value to fill into the field

**Returns:** `boolean` - True if the field was successfully filled

#### `fillSelectField(element, value, dataKey)`

Fill a select dropdown field with intelligent option matching Includes special handling for gender and campus fields with smart pattern matching

**Parameters:**

- `element` (`HTMLSelectElement`) - The select element to fill
- `value` (`string`) - The value to match against select options
- `dataKey` (`string`) - The data key to determine special handling logic

**Returns:** `boolean` - True if an option was successfully selected

#### `showToast(message, type`

Display a toast notification to the user

**Parameters:**

- `message` (`string`) - The message to display
- `type` (`string`) - The type of toast ('success', 'error', 'warning', 'info')


---

## Background API

Source file: `background.js`

*No documented public methods found.*

## Popup API

Source file: `popup.js`

*No documented public methods found.*

## Usage Examples

### Basic Storage Operations

```javascript
// Initialize storage
const data = await StorageManager.initialize();

// Get active profile
const profile = await StorageManager.getActiveProfile();

// Save profile data
await StorageManager.saveProfile('default', {
    name: 'My Profile',
    data: {
        fullName: 'John Doe',
        email: 'john@example.com'
    }
});

// Get settings
const settings = await StorageManager.getSettings();

// Update settings
await StorageManager.saveSettings({
    autoFillEnabled: true,
    blacklistedDomains: ['example.com']
});
```

### Password Protection

```javascript
// Set up password protection
await StorageManager.setupPassword('mySecurePassword');

// Verify password
const isValid = await StorageManager.verifyPassword('mySecurePassword');

// Change password
const success = await StorageManager.changePassword('oldPassword', 'newPassword');

// Disable password protection
await StorageManager.disablePasswordProtection('currentPassword');
```

### Content Script Integration

```javascript
// The content script automatically handles autofill requests
// Send autofill message from popup or background script
chrome.tabs.sendMessage(tabId, {
    action: 'autofill',
    data: profileData
}, (response) => {
    if (response.success) {
        console.log(`Filled ${response.result.filledCount} fields`);
    }
});
```

## Error Handling

All API methods include proper error handling. Always wrap calls in try-catch blocks:

```javascript
try {
    const profile = await StorageManager.getActiveProfile();
    // Use profile data
} catch (error) {
    console.error('Failed to get profile:', error.message);
    // Handle error appropriately
}
```

## Browser Compatibility

This API is compatible with:
- Chrome 88+
- Edge 88+
- Brave (Chromium-based versions)

## Security Considerations

- All passwords are hashed using SHA-256 with salt
- Sensitive data is stored using Chrome's secure storage API
- Input validation is performed on all user data
- XSS protection is implemented in content scripts

---

*This documentation is automatically generated from JSDoc comments in the source code.*
