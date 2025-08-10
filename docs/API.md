# API Documentation

This document provides detailed information about the internal APIs and architecture of the Job Application Autofill Extension.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Storage API](#storage-api)
- [Content Script API](#content-script-api)
- [Background Script API](#background-script-api)
- [Popup API](#popup-api)
- [Message Passing](#message-passing)
- [Data Structures](#data-structures)
- [Extension APIs Used](#extension-apis-used)

## Architecture Overview

The extension follows a modular architecture with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Popup UI      │    │  Background     │    │  Content Script │
│   (popup.js)    │◄──►│  Service Worker │◄──►│   (content.js)  │
│                 │    │ (background.js) │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────┐
                    │  Storage Layer  │
                    │   (storage.js)  │
                    └─────────────────┘
```

## Storage API

### StorageManager Class

The `StorageManager` class provides a unified interface for data persistence with validation and error handling.

#### Methods

##### `initialize()`
Initializes storage with default data structure.

```javascript
const data = await StorageManager.initialize();
```

**Returns**: `Promise<Object>` - Complete data structure

##### `getAllData()`
Retrieves all stored data with validation.

```javascript
const data = await StorageManager.getAllData();
```

**Returns**: `Promise<Object>` - Validated data structure

##### `getActiveProfile()`
Gets the currently active profile.

```javascript
const profile = await StorageManager.getActiveProfile();
```

**Returns**: `Promise<Object>` - Active profile with ID and data

##### `saveProfile(profileId, profileData)`
Saves profile data with validation.

```javascript
await StorageManager.saveProfile('work-profile', {
  name: 'Work Applications',
  data: {
    fullName: 'John Doe',
    email: 'john@company.com',
    // ... other fields
  }
});
```

**Parameters**:
- `profileId` (string): Unique profile identifier
- `profileData` (Object): Profile data to save

##### `getSettings()`
Retrieves extension settings.

```javascript
const settings = await StorageManager.getSettings();
```

**Returns**: `Promise<Object>` - Settings object

##### `saveSettings(settings)`
Saves extension settings with validation.

```javascript
await StorageManager.saveSettings({
  autoFillEnabled: true,
  blacklistedDomains: ['example.com']
});
```

**Parameters**:
- `settings` (Object): Settings to save

#### Validation Methods

##### `validateProfileData(profileData)`
Validates profile data structure and content.

```javascript
const validated = StorageManager.validateProfileData(profileData);
```

**Parameters**:
- `profileData` (Object): Data to validate

**Returns**: `Object` - Validated data

**Throws**: `Error` - If validation fails

##### `isValidEmail(email)`
Validates email format.

```javascript
const isValid = StorageManager.isValidEmail('test@example.com');
```

**Parameters**:
- `email` (string): Email to validate

**Returns**: `boolean` - True if valid

##### `isValidUrl(url)`
Validates URL format.

```javascript
const isValid = StorageManager.isValidUrl('https://example.com');
```

**Parameters**:
- `url` (string): URL to validate

**Returns**: `boolean` - True if valid

### PasswordManager Class

Handles password protection functionality.

#### Methods

##### `hashPassword(password)`
Hashes a password using SHA-256.

```javascript
const hash = await PasswordManager.hashPassword('mypassword');
```

**Parameters**:
- `password` (string): Plain text password

**Returns**: `Promise<string>` - Hashed password

##### `verifyPassword(password, hash)`
Verifies a password against a hash.

```javascript
const isValid = await PasswordManager.verifyPassword('mypassword', hash);
```

**Parameters**:
- `password` (string): Plain text password
- `hash` (string): Stored password hash

**Returns**: `Promise<boolean>` - True if password matches

## Content Script API

### AutofillManager Class

Handles form detection and filling on web pages.

#### Methods

##### `performAutofill(data)`
Main autofill operation.

```javascript
const result = await autofillManager.performAutofill({
  fullName: 'John Doe',
  email: 'john@example.com',
  // ... other data
});
```

**Parameters**:
- `data` (Object): Profile data to fill

**Returns**: `Promise<Object>` - Operation result with filled count

##### `detectFormFields()`
Detects fillable form fields on the current page.

```javascript
const fields = autofillManager.detectFormFields();
```

**Returns**: `Array<Object>` - Array of field information objects

##### `matchFieldsToData(formFields, data)`
Matches detected fields to profile data.

```javascript
const matches = autofillManager.matchFieldsToData(fields, data);
```

**Parameters**:
- `formFields` (Array): Detected form fields
- `data` (Object): Profile data

**Returns**: `Array<Object>` - Array of field matches with confidence scores

##### `fillFields(matches)`
Fills form fields with matched data.

```javascript
const filledCount = autofillManager.fillFields(matches);
```

**Parameters**:
- `matches` (Array): Field matches from `matchFieldsToData`

**Returns**: `number` - Number of successfully filled fields

#### Field Detection

The content script uses multiple strategies for field detection:

1. **HTML Attributes**: name, id, placeholder, class
2. **Label Association**: explicit and implicit labels
3. **Proximity Analysis**: nearby text content
4. **Pattern Matching**: job portal specific patterns
5. **Confidence Scoring**: weighted matching algorithm

#### Performance Features

- **Caching**: Field information cached for 5 seconds
- **Batch Processing**: Elements processed in batches of 50
- **Visibility Checks**: Only visible, fillable fields are processed
- **Performance Monitoring**: Detailed timing metrics

## Background Script API

### BackgroundManager Class

Handles keyboard shortcuts and cross-tab communication.

#### Methods

##### `handleAutofillShortcut()`
Processes keyboard shortcut triggers.

```javascript
await backgroundManager.handleAutofillShortcut();
```

##### `shouldAutoFill(tabUrl)`
Determines if automatic autofill should be triggered.

```javascript
const should = await backgroundManager.shouldAutoFill('https://example.com');
```

**Parameters**:
- `tabUrl` (string): URL to check

**Returns**: `Promise<boolean>` - True if autofill should be triggered

## Popup API

### PopupManager Class

Manages the extension popup interface and user interactions.

#### Methods

##### `loadData()`
Loads profile and settings data.

```javascript
await popupManager.loadData();
```

##### `saveData()`
Saves form data with validation.

```javascript
await popupManager.saveData();
```

##### `triggerAutofill()`
Triggers autofill on the active tab.

```javascript
await popupManager.triggerAutofill();
```

##### `switchProfile(profileId)`
Switches to a different profile.

```javascript
popupManager.switchProfile('work-profile');
```

**Parameters**:
- `profileId` (string): Profile to switch to

## Message Passing

The extension uses Chrome's message passing API for communication between components.

### Message Types

#### Autofill Request
```javascript
{
  action: 'autofill',
  data: {
    fullName: 'John Doe',
    email: 'john@example.com',
    // ... profile data
  }
}
```

#### Tab Query Request
```javascript
{
  action: 'getActiveTab'
}
```

#### Domain Blacklist Check
```javascript
{
  action: 'checkDomainBlacklist',
  url: 'https://example.com'
}
```

### Response Format
```javascript
{
  success: boolean,
  data?: any,
  error?: string
}
```

## Data Structures

### Profile Data Structure
```javascript
{
  fullName: string,
  email: string,
  studentNumber: string,
  phone: string,
  leetcodeUrl: string,
  linkedinUrl: string,
  githubUrl: string,
  resumeUrl: string,
  portfolioUrl: string,
  customFields: {
    [key: string]: string
  }
}
```

### Profile Object
```javascript
{
  name: string,
  data: ProfileData
}
```

### Settings Structure
```javascript
{
  activeProfile: string,
  autoFillEnabled: boolean,
  blacklistedDomains: string[],
  passwordProtected: boolean,
  passwordHash: string,
  passwordSalt: string
}
```

### Field Information Object
```javascript
{
  element: HTMLElement,
  name: string,
  id: string,
  placeholder: string,
  type: string,
  labels: string[],
  options: Array<{value: string, text: string}>, // for select elements
  value: string,
  className: string,
  dataAttributes: Object
}
```

### Field Match Object
```javascript
{
  field: FieldInfo,
  dataKey: string,
  value: string,
  confidence: number // 0-1 confidence score
}
```

## Extension APIs Used

### Chrome Storage API
- `chrome.storage.sync.get()`
- `chrome.storage.sync.set()`
- `chrome.storage.local.get()` (fallback)
- `chrome.storage.local.set()` (fallback)

### Chrome Tabs API
- `chrome.tabs.query()`
- `chrome.tabs.sendMessage()`

### Chrome Commands API
- `chrome.commands.onCommand.addListener()`

### Chrome Runtime API
- `chrome.runtime.onMessage.addListener()`
- `chrome.runtime.onInstalled.addListener()`

### Chrome Scripting API
- Used implicitly through content script injection

## Error Handling

All API methods include comprehensive error handling:

1. **Input Validation**: Parameters are validated before processing
2. **Storage Fallbacks**: Automatic fallback from sync to local storage
3. **Network Resilience**: Graceful handling of storage sync failures
4. **User Feedback**: Meaningful error messages for users
5. **Debug Logging**: Detailed logging in debug mode

## Performance Considerations

- **Lazy Loading**: Components loaded only when needed
- **Caching**: Frequently accessed data cached in memory
- **Debouncing**: User input debounced to prevent excessive operations
- **Batch Operations**: Multiple operations batched for efficiency
- **Memory Management**: Automatic cleanup of unused resources

## Security Features

- **Input Sanitization**: All user inputs sanitized and validated
- **CSP Compliance**: No inline scripts or eval usage
- **Permission Minimization**: Only required permissions requested
- **Data Isolation**: Profile data isolated between domains
- **Password Protection**: Optional encryption for sensitive data

---

For more detailed implementation examples, see the source code files and test suite.