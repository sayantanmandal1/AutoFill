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
- LeetCode Profile URL
- LinkedIn Profile URL
- GitHub Profile URL
- Resume Google Drive Link
- Portfolio Website URL
- Custom additional fields (unlimited key-value pairs)

### Advanced Features

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

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Bug Reports & Feature Requests

Please use the [GitHub Issues](https://github.com/yourusername/job-application-autofill/issues) page to:

- Report bugs
- Request new features
- Ask questions about usage
- Provide feedback

## 📚 Documentation

- [Browser Compatibility Report](BROWSER_COMPATIBILITY.md)
- [API Documentation](docs/API.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

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
