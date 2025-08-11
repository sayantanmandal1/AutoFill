# Contributing to Job Application Autofill Extension

Thank you for your interest in contributing to the Job Application Autofill Extension! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Bugs
1. **Check existing issues** first to avoid duplicates
2. **Use the bug report template** when creating new issues
3. **Provide detailed information**:
   - Browser version and type (Chrome/Brave/Edge)
   - Extension version
   - Steps to reproduce the issue
   - Expected vs actual behavior
   - Screenshots if applicable

### Suggesting Features
1. **Check existing feature requests** to avoid duplicates
2. **Use the feature request template**
3. **Provide clear use cases** and benefits
4. **Consider implementation complexity** and browser compatibility

### Code Contributions

#### Prerequisites
- Node.js (v14 or higher)
- Git
- Basic knowledge of JavaScript, HTML, CSS
- Understanding of Chrome Extension APIs

#### Development Setup

**Step 1: Environment Prerequisites**
```bash
# Check Node.js version (v14+ required)
node --version

# Check npm version (v6+ required)
npm --version

# Check Git version
git --version

# Install recommended tools
npm install -g vitest  # For running tests
npm install -g eslint  # For code linting
```

**Step 2: Repository Setup**
```bash
# Fork the repository on GitHub first, then clone your fork
git clone https://github.com/yourusername/job-application-autofill.git
cd job-application-autofill

# Add upstream remote for syncing
git remote add upstream https://github.com/originalowner/job-application-autofill.git

# Install dependencies
npm install

# Verify installation
npm run validate
```

**Step 3: Browser Extension Setup**
```bash
# Load extension in Chrome for development
# 1. Open Chrome → chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked" → select project folder
# 4. Extension should appear in toolbar

# For other browsers:
# Brave: brave://extensions/
# Edge: edge://extensions/
```

**Step 4: Development Verification**
```bash
# Run all tests to ensure everything works
npm test

# Run cross-browser compatibility tests
npm run test:cross-browser

# Run linting
npm run lint

# Start development server (if applicable)
npm run dev
```

**Step 5: IDE Setup (Recommended)**
- **VS Code Extensions**:
  - ESLint
  - Prettier
  - Chrome Extension Development
  - JavaScript (ES6) code snippets
- **Settings**: Use project's `.vscode/settings.json` if available

#### Making Changes
1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Follow coding standards**:
   - Use consistent indentation (2 spaces)
   - Add comments for complex logic
   - Follow existing naming conventions
   - Use meaningful variable and function names

3. **Write tests** for new functionality:
   ```bash
   # Run tests during development
   npm run test:watch
   
   # Run browser compatibility tests
   npm run test:cross-browser
   ```

4. **Test across browsers**:
   - Chrome (latest)
   - Brave (latest)
   - Edge (latest)

5. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

#### Commit Message Guidelines
Use conventional commit format:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `test:` for test additions/modifications
- `refactor:` for code refactoring
- `style:` for formatting changes
- `chore:` for maintenance tasks

Examples:
```
feat: add support for multi-step forms
fix: resolve field detection issue on Google Forms
docs: update installation instructions
test: add cross-browser compatibility tests
```

#### Pull Request Process
1. **Update documentation** if needed
2. **Ensure all tests pass**:
   ```bash
   npm test
   npm run test:cross-browser
   ```
3. **Update the README** if you've added new features
4. **Create a pull request** with:
   - Clear title and description
   - Reference to related issues
   - Screenshots for UI changes
   - Test results

## 📋 Code Style Guidelines

### JavaScript
- Use ES6+ features where appropriate
- Prefer `const` and `let` over `var`
- Use arrow functions for short functions
- Add JSDoc comments for public functions
- Handle errors gracefully with try-catch blocks

```javascript
/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
```

### HTML
- Use semantic HTML elements
- Include proper accessibility attributes
- Keep markup clean and well-indented
- Use meaningful class and ID names

### CSS
- Use consistent naming conventions (kebab-case)
- Group related properties together
- Use CSS custom properties for repeated values
- Ensure responsive design principles

## 🧪 Testing Guidelines

### Writing Tests
- Write tests for all new functionality
- Include edge cases and error scenarios
- Use descriptive test names
- Group related tests in describe blocks

```javascript
describe('Email Validation', () => {
  it('should return true for valid email addresses', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
  });

  it('should return false for invalid email addresses', () => {
    expect(isValidEmail('invalid-email')).toBe(false);
  });
});
```

### Test Categories
1. **Unit Tests**: Test individual functions and components
2. **Integration Tests**: Test component interactions
3. **Browser Compatibility Tests**: Ensure cross-browser functionality
4. **Performance Tests**: Validate performance requirements

## 🔒 Security Considerations

### Data Handling
- Never log sensitive user data
- Validate all user inputs
- Use secure storage practices
- Follow principle of least privilege

### Extension Security
- Minimize required permissions
- Validate all external inputs
- Use Content Security Policy
- Avoid eval() and innerHTML with user data

## 📚 Documentation

### Code Documentation
- Add JSDoc comments for all public functions
- Include parameter types and return values
- Provide usage examples for complex functions
- Document any browser-specific behavior

### User Documentation
- Update README.md for new features
- Include screenshots for UI changes
- Provide clear installation instructions
- Document configuration options

## 🐛 Debugging

### Development Tools
- Use browser developer tools for debugging
- Enable extension debug mode for detailed logging
- Use performance profiling for optimization
- Test with various form types and websites

### Common Issues
- **Content script not loading**: Check manifest permissions
- **Storage errors**: Verify chrome.storage API usage
- **Cross-browser issues**: Test on all supported browsers
- **Performance problems**: Use performance monitoring tools

## 📦 Release Process

### Version Numbering
Follow semantic versioning (semver):
- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features, backward compatible
- **Patch** (0.0.1): Bug fixes, backward compatible

### Release Checklist
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Version number bumped
- [ ] Changelog updated
- [ ] Browser compatibility verified
- [ ] Performance benchmarks met

## 🎯 Project Goals

### Primary Objectives
- Provide reliable autofill functionality
- Maintain excellent user experience
- Ensure cross-browser compatibility
- Protect user privacy and security

### Quality Standards
- 90%+ test coverage
- < 50ms form detection time
- Support for major browsers
- Zero security vulnerabilities

## 🔄 Development Workflow

### Daily Development Process
```bash
# Start your development session
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name

# Make changes and test frequently
npm run test:watch  # Runs tests in watch mode

# Before committing
npm run lint:fix    # Fix linting issues
npm test           # Run all tests
npm run validate   # Run full validation

# Commit and push
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature-name
```

### Testing Your Changes
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Cross-browser tests (requires browsers installed)
npm run test:cross-browser

# Performance tests
npm run test:performance

# Manual testing checklist:
# 1. Load extension in browser
# 2. Test on Google Forms
# 3. Test on job application sites
# 4. Test keyboard shortcuts
# 5. Test data persistence
# 6. Test across different browsers
```

### Code Quality Checks
```bash
# Linting
npm run lint
npm run lint:fix

# Type checking (if using TypeScript)
npm run type-check

# Security audit
npm audit
npm audit fix

# Bundle analysis
npm run analyze
```

### Debugging Development Issues
```bash
# Enable debug mode in browser console
localStorage.setItem('autofill_debug', 'true');

# Check extension loading
chrome.runtime.getManifest()

# Monitor extension messages
chrome.runtime.onMessage.addListener(console.log);

# Test content script injection
console.log('Content script loaded:', typeof AutofillManager !== 'undefined');
```

## 📞 Getting Help

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Code Reviews**: Pull request discussions
- **Discord/Slack**: Real-time development chat (if available)

### Development Resources
- **Extension APIs**:
  - [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
  - [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
  - [Web Extension APIs](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- **Testing Resources**:
  - [Vitest Documentation](https://vitest.dev/)
  - [Playwright Testing](https://playwright.dev/)
  - [Chrome Extension Testing](https://developer.chrome.com/docs/extensions/mv3/tut_debugging/)
- **JavaScript/Web Development**:
  - [MDN Web Docs](https://developer.mozilla.org/)
  - [JavaScript.info](https://javascript.info/)
  - [Web APIs](https://developer.mozilla.org/en-US/docs/Web/API)

### Getting Unstuck
1. **Check Documentation**: Review all docs in the `/docs` folder
2. **Search Issues**: Look for similar problems in GitHub issues
3. **Debug Mode**: Enable debug logging to understand what's happening
4. **Ask Questions**: Create a GitHub discussion for help
5. **Pair Programming**: Request code review or pair programming session

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- GitHub contributor graphs

## 📝 License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to make job applications easier for everyone! 🚀