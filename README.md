# Job Application Autofill Extension

A powerful Chrome/Brave browser extension that acts as an instant autofill assistant for job applications, Google Forms, and similar online forms. Save time by storing your commonly used details and filling them into any matching form fields with a single click or keyboard shortcut.

![Extension Demo](https://img.shields.io/badge/Chrome-Extension-green?logo=googlechrome)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)
![Browser Support](https://img.shields.io/badge/Browsers-Chrome%20%7C%20Brave%20%7C%20Edge-orange)
![Tests](https://img.shields.io/badge/Tests-97%20Passing-brightgreen)

## 🚀 Features

### Core Functionality

- **Instant Autofill**: Fill forms with a single click or keyboard shortcut (Alt+Shift+F)
- **Smart Field Detection**: Advanced algorithm matches form fields using multiple strategies
- **Cross-Device Sync**: Data syncs across all your devices using Chrome storage
- **Multiple Profiles**: Create different profiles for various application types

### Supported Data Fields

- Full Name
- College/University Email ID
- College Registration/Student Number
- Phone Number / Mobile Number
- **Gender/Sex** (Smart Selection)
- **Campus/University** (Smart Selection)
- Academic Marks (10th, 12th, UG CGPA)
- LeetCode Profile URL
- LinkedIn Profile URL
- GitHub Profile URL
- Resume Google Drive Link
- Portfolio Website URL
- Custom additional fields (unlimited key-value pairs)

### Advanced Features

- **Smart Field Selection**: Intelligent dropdown option selection for gender and campus fields
- **Multi-Step Form Support**: Handles complex application forms
- **Domain Blacklisting**: Disable autofill on specific websites
- **Password Protection**: Secure your data with password encryption
- **Automatic Autofill**: Optional auto-fill when forms are detected
- **Toast Notifications**: Visual feedback for successful operations
- **Performance Optimized**: Fast field detection with caching

## 🎯 Supported Websites

- Google Forms
- Common job portals (LinkedIn, Indeed, Glassdoor, etc.)
- Internship application sites
- College form portals
- University application systems
- Hackathon registration forms
- Any HTML form with standard field patterns

## 📦 Installation

### From Chrome Web Store (Recommended)

_Coming soon - extension will be published to Chrome Web Store_

### Manual Installation (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension icon will appear in your browser toolbar

### For Brave Browser

1. Open Brave and navigate to `brave://extensions/`
2. Follow the same steps as Chrome installation

### For Microsoft Edge

1. Open Edge and navigate to `edge://extensions/`
2. Follow the same steps as Chrome installation

## 🧠 Smart Field Selection

The extension features intelligent field detection and selection logic for common form fields, especially useful for Indian students applying to various institutions.

### Gender/Sex Field Intelligence

The extension automatically handles gender fields with smart selection logic:

**For Text Input Fields:**
- Fills "Male" as the default value

**For Dropdown/Select Fields:**
- **Primary Match**: Looks for "Male" option first
- **Fallback Patterns**: Intelligently selects from:
  - "M" (abbreviation)
  - "man" (alternative wording)
  - "boy" (informal option)

**Detection Keywords**: Recognizes fields labeled as:
- "gender", "sex", "gender identity", "sex identity"

### Campus/University Field Intelligence

Specifically designed for VIT students with smart campus selection:

**For Text Input Fields:**
- Fills "VIT-AP" as the default value

**For Dropdown/Select Fields:**
- **Primary Match**: Looks for "VIT-AP" option first
- **Smart Patterns**: Intelligently selects from:
  - "VIT-Amaravathi" (full name)
  - "VIT AP" (space variant)
  - "amaravathi" (location only)
  - "ap" (state abbreviation)
  - "vit_ap" (underscore variant)

**Detection Keywords**: Recognizes fields labeled as:
- "campus", "college", "university", "institution", "branch", "location"

### How Smart Selection Works

1. **Field Detection**: Extension scans form fields using multiple strategies
2. **Pattern Matching**: Matches field labels against known patterns
3. **Option Analysis**: For dropdowns, analyzes all available options
4. **Intelligent Selection**: Chooses the best matching option using priority rules
5. **Fallback Logic**: Uses partial matching if exact matches aren't found

### Examples

**Gender Field Examples:**
```html
<!-- These will all be handled intelligently -->
<select name="gender">
  <option value="Male">Male</option>     <!-- ✅ Selected -->
  <option value="Female">Female</option>
</select>

<select name="sex">
  <option value="M">M</option>           <!-- ✅ Selected -->
  <option value="F">F</option>
</select>

<input type="text" name="gender">        <!-- ✅ Filled with "Male" -->
```

**Campus Field Examples:**
```html
<!-- These will all be handled intelligently -->
<select name="campus">
  <option value="VIT-AP">VIT-AP</option>           <!-- ✅ Selected -->
  <option value="VIT Chennai">VIT Chennai</option>
</select>

<select name="university">
  <option value="amaravathi">Amaravathi</option>    <!-- ✅ Selected -->
  <option value="chennai">Chennai</option>
</select>

<input type="text" name="campus">                  <!-- ✅ Filled with "VIT-AP" -->
```

## 🔧 Usage

### Setting Up Your Profile

1. Click the extension icon in your browser toolbar
2. Fill in your personal information in the popup form
3. Add any custom fields you need for specific applications
4. Click "Save Settings" to store your data

### Using Autofill

**Method 1: Click Button**

1. Navigate to any form page
2. Click the extension icon
3. Click "Autofill Now" button

**Method 2: Keyboard Shortcut**

1. Navigate to any form page
2. Press `Alt+Shift+F` to instantly fill the form

### Managing Profiles

1. Use the profile dropdown to switch between profiles
2. Click "New" to create additional profiles
3. Click "Manage" to rename or delete profiles

### Security Settings

- Enable password protection for sensitive data
- Add domains to blacklist to disable autofill on specific sites
- Toggle automatic autofill on page load

## 🛠️ Development

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/job-application-autofill.git
cd job-application-autofill

# Install dependencies
npm install

# Run tests
npm test

# Run browser compatibility tests
npm run test:cross-browser

# Validate browser compatibility
node validate-browser-compatibility.js
```

### Project Structure

```
job-application-autofill/
├── manifest.json          # Extension manifest (Manifest V3)
├── popup.html             # Extension popup interface
├── popup.js               # Popup logic and UI handling
├── content.js             # Content script for form detection
├── background.js          # Background service worker
├── storage.js             # Storage utility functions
├── style.css              # Popup styling
├── icons/                 # Extension icons
├── test/                  # Test files
└── docs/                  # Documentation
```

### Testing

The extension includes comprehensive test coverage:

- **97 automated tests** covering all functionality
- **Cross-browser compatibility** tests for Chrome, Brave, and Edge
- **Performance monitoring** and optimization tests
- **Security validation** tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:browser-compatibility
npm run test:cross-browser

# Run tests in watch mode
npm run test:watch
```

## 🔒 Privacy & Security

- **Local Storage Only**: All data remains in your browser, never sent to external servers
- **Password Protection**: Optional password encryption for sensitive data
- **Secure Validation**: Input validation and sanitization for all data
- **No Tracking**: Extension doesn't collect or transmit any personal information
- **Open Source**: Full source code available for security review

## 🌐 Browser Compatibility

| Browser | Version | Status             |
| ------- | ------- | ------------------ |
| Chrome  | 88+     | ✅ Fully Supported |
| Brave   | 1.20+   | ✅ Fully Supported |
| Edge    | 88+     | ✅ Fully Supported |

**Manifest V3 Compliance**: This extension uses the latest Manifest V3 standard for enhanced security and performance.

## 📊 Performance

- **Fast Field Detection**: < 50ms for 50+ form fields
- **Efficient Storage**: < 25ms for typical profile data operations
- **Low Memory Usage**: ~2-3MB typical usage
- **Optimized Caching**: Smart caching reduces repeated computations

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and patterns
- Add tests for new functionality
- Update documentation as needed
- Ensure browser compatibility across Chrome, Brave, and Edge
- Use conventional commit format for automatic changelog generation

### Automated Release Process

This project uses automated changelog generation and release management:

```bash
# Generate changelog automatically
npm run changelog:auto

# Preview changelog changes
npm run changelog:dry-run

# Manual version release
npm run version:release -- 1.2.3

# Generate release notes
npm run release:notes
```

**Commit Message Format**: Use conventional commits for automatic categorization:
- `feat:` for new features
- `fix:` for bug fixes  
- `docs:` for documentation
- `test:` for tests
- `ci:` for CI/CD changes

See [Changelog Automation Guide](docs/CHANGELOG_AUTOMATION.md) for detailed information.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔧 Troubleshooting

### Smart Field Issues

**Gender field not selecting correctly:**
- Check if the dropdown has "Male", "M", or similar options
- Verify the field is detected (check console logs with debug mode)
- Some forms may use non-standard option values

**Campus field not selecting VIT-AP:**
- Ensure the dropdown contains VIT-related options
- Check for variations like "VIT-Amaravathi", "VIT AP", or "amaravathi"
- Some forms may use different naming conventions

**Form fields not being detected:**
- Refresh the page and try again
- Check if the form loads dynamically (wait a few seconds)
- Some forms may use non-standard field naming

### General Issues

**Extension not working:**
1. Ensure the extension is enabled in `chrome://extensions/`
2. Refresh the page after enabling the extension
3. Check if the website is in your blacklist

**Data not saving:**
1. Check if you have sufficient storage space
2. Ensure you clicked "Save Settings" after making changes
3. Try disabling and re-enabling the extension

**Keyboard shortcut not working:**
1. Verify `Alt+Shift+F` is not conflicting with other shortcuts
2. Try clicking the "Autofill Now" button instead
3. Check if the page has focus (click on the page first)

### Debug Mode

Enable debug mode to see detailed logs:
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Use the extension - you'll see detailed field detection logs

## 🐛 Bug Reports & Feature Requests

Please use the [GitHub Issues](https://github.com/yourusername/job-application-autofill/issues) page to:

- Report bugs
- Request new features
- Ask questions about usage
- Provide feedback

## 📚 Documentation

### User Documentation
- [Installation Guide](docs/INSTALLATION.md) - Comprehensive setup instructions
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md) - Solutions for common issues
- [Quick Start Guide](QUICK_START.md) - Get up and running quickly

### Developer Documentation
- [API Documentation](docs/API.md) - Technical API reference
- [Contributing Guidelines](CONTRIBUTING.md) - How to contribute to the project
- [Debugging Guide](DEBUGGING_GUIDE.md) - Field matching and technical debugging
- [Chrome Web Store Setup](docs/CHROME_WEB_STORE_SETUP.md) - Auto-update deployment guide
- [Security Best Practices](docs/SECURITY_BEST_PRACTICES.md) - Security guidelines and credential management

### Project Information
- [Browser Compatibility Report](BROWSER_COMPATIBILITY.md) - Supported browsers and features
- [Changelog](CHANGELOG.md) - Version history and updates

## 🙏 Acknowledgments

- Thanks to all contributors who help improve this extension
- Inspired by the need to streamline job application processes
- Built with modern web extension APIs and best practices

## 📈 Roadmap

- [ ] Chrome Web Store publication
- [ ] Firefox support (Manifest V2 compatibility)
- [ ] Import/Export profiles functionality
- [ ] Advanced form field mapping
- [ ] Integration with popular job boards
- [ ] Mobile browser support

---

**Made with ❤️ for job seekers everywhere**

_Star this repository if you find it helpful!_
