# Quick Start Guide

Get your Job Application Autofill Extension up and running in minutes!

## 🚀 Push to GitHub (Quick Steps)

### Option 1: Use the Setup Script (Recommended)

**Windows:**
```cmd
scripts\setup-git.bat
```

**Mac/Linux:**
```bash
chmod +x scripts/setup-git.sh
./scripts/setup-git.sh
```

### Option 2: Manual Git Setup

1. **Initialize Git repository:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Job Application Autofill Extension v1.0.0"
   ```

2. **Create GitHub repository:**
   - Go to [GitHub](https://github.com)
   - Click "New repository"
   - Name it: `job-application-autofill`
   - Don't initialize with README (we already have one)
   - Click "Create repository"

3. **Connect and push:**
   ```bash
   git remote add origin https://github.com/yourusername/job-application-autofill.git
   git branch -M main
   git push -u origin main
   ```

## 📝 Before You Push

1. **Update README.md:**
   - Replace `yourusername` with your actual GitHub username
   - Update author information

2. **Update package.json:**
   - Change the repository URL
   - Update author name and email

3. **Test everything works:**
   ```bash
   npm test
   npm run validate
   ```

## 🎯 After Pushing to GitHub

### Create a Release
1. Go to your GitHub repository
2. Click "Releases" → "Create a new release"
3. Tag: `v1.0.0`
4. Title: `Job Application Autofill Extension v1.0.0`
5. Description: Copy from CHANGELOG.md
6. Attach the extension files as a ZIP

### Set Up GitHub Pages (Optional)
1. Go to repository Settings
2. Scroll to "Pages"
3. Source: "Deploy from a branch"
4. Branch: `main`, folder: `/docs`
5. Your docs will be available at: `https://yourusername.github.io/job-application-autofill`

### Enable Issues and Discussions
1. Go to repository Settings
2. Scroll to "Features"
3. Enable "Issues" and "Discussions"

## 🔧 Development Workflow

### Making Changes
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make your changes
# ... edit files ...

# Test changes
npm test

# Commit and push
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature
```

### Create Pull Request
1. Go to GitHub repository
2. Click "Compare & pull request"
3. Fill in description
4. Click "Create pull request"

## 📦 Extension Installation

### For Users
1. Download the latest release ZIP
2. Extract to a folder
3. Open Chrome → Extensions → Developer mode
4. Click "Load unpacked" → Select folder

### For Developers
```bash
git clone https://github.com/yourusername/job-application-autofill.git
cd job-application-autofill
npm install
npm test
```

## 🛠️ Useful Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Validate browser compatibility
npm run validate

# Run cross-browser tests
npm run test:cross-browser

# Set up git (if not done already)
npm run setup-git
```

## 📚 Important Files

- `manifest.json` - Extension configuration
- `popup.html/js` - Extension interface
- `content.js` - Form detection and filling
- `background.js` - Keyboard shortcuts and messaging
- `storage.js` - Data management
- `test/` - Comprehensive test suite

## 🔒 Security Notes

- All data stays local in browser
- No external API calls
- Optional password protection
- Open source for transparency

## 🎉 You're Ready!

Your extension is now:
- ✅ Version controlled with Git
- ✅ Hosted on GitHub
- ✅ Documented and tested
- ✅ Ready for users
- ✅ Ready for contributions

## 🆘 Need Help?

- Check [INSTALLATION.md](docs/INSTALLATION.md) for detailed setup
- See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines
- Review [API.md](docs/API.md) for technical details
- Open an issue on GitHub for problems

---

**Happy coding! 🚀**