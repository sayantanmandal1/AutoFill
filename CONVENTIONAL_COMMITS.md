# Conventional Commits Guide

This project uses **Conventional Commits** for automatic version management and changelog generation.

## 🚀 How It Works

When you push commits to the `master` branch, the system automatically:
1. **Analyzes your commit messages**
2. **Determines the version bump type** (major/minor/patch)
3. **Creates a new release** if needed
4. **Generates changelog** from commit messages
5. **Builds and packages** the extension

## 📝 Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types and Version Bumps

| Commit Type | Version Bump | Example |
|-------------|--------------|---------|
| `feat:` | **Minor** (1.0.0 → 1.1.0) | `feat: add autofill for LinkedIn profiles` |
| `fix:` | **Patch** (1.0.0 → 1.0.1) | `fix: resolve form detection on Google Forms` |
| `BREAKING CHANGE:` | **Major** (1.0.0 → 2.0.0) | `feat!: change storage format (BREAKING CHANGE)` |
| `docs:` | **Patch** | `docs: update installation instructions` |
| `style:` | **Patch** | `style: fix popup button alignment` |
| `refactor:` | **Patch** | `refactor: improve field detection algorithm` |
| `test:` | **Patch** | `test: add tests for profile management` |
| `chore:` | **Patch** | `chore: update dependencies` |

## ✅ Good Examples

### Feature Addition (Minor Bump)
```bash
git commit -m "feat: add support for campus field detection

- Automatically detects university/campus fields
- Supports multiple campus name formats
- Includes smart matching algorithm"
```

### Bug Fix (Patch Bump)
```bash
git commit -m "fix: resolve autofill not working on HTTPS sites

The content script wasn't properly injecting on secure sites.
Fixed by updating manifest permissions."
```

### Breaking Change (Major Bump)
```bash
git commit -m "feat!: change profile storage format

BREAKING CHANGE: Profile data structure has changed.
Users will need to re-enter their profile information."
```

### Documentation (Patch Bump)
```bash
git commit -m "docs: add troubleshooting guide for common issues"
```

### Multiple Changes
```bash
git commit -m "feat: add gender field smart selection

- Automatically selects gender from dropdown options
- Supports multiple gender field formats
- Includes fallback for custom gender inputs

fix: improve form detection reliability
test: add comprehensive gender field tests"
```

## 🔄 Automatic Release Process

### When Releases Happen
- **Every push to `master`** is analyzed
- **Release created** if there are new commits since last release
- **No release** if no changes or only non-releasable commits

### What Gets Released
1. **Version bump** based on commit types
2. **Updated files** (package.json, manifest.json)
3. **Generated changelog** from commit messages
4. **Extension package** (.zip file)
5. **GitHub release** with download link

## 🛠️ Manual Release Options

### Option 1: Automatic (Recommended)
Just push commits with conventional format - releases happen automatically!

### Option 2: Trigger Manual Release
1. Go to **Actions** → **Manual Release**
2. Choose release type or leave as "auto"
3. Click **Run workflow**

### Option 3: Force Specific Version
```bash
# Create a commit that forces a specific bump
git commit -m "feat!: major update (BREAKING CHANGE)"  # Major
git commit -m "feat: new feature"                      # Minor  
git commit -m "fix: bug fix"                          # Patch
```

## 📋 Commit Message Tips

### ✅ Do This
- Use present tense: "add feature" not "added feature"
- Be descriptive but concise
- Include scope when relevant: `feat(popup): add new button`
- Use body for detailed explanations
- Reference issues: `fixes #123`

### ❌ Avoid This
- Vague messages: "update stuff", "fix things"
- Past tense: "added", "fixed", "updated"
- Missing type: "new feature" instead of "feat: new feature"
- ALL CAPS (except BREAKING CHANGE)

## 🏷️ Scopes (Optional)

You can add scopes to be more specific:

```bash
feat(popup): add profile selection dropdown
fix(content): resolve form detection on dynamic pages
docs(readme): update installation instructions
test(storage): add encryption tests
chore(deps): update playwright to v1.40
```

Common scopes:
- `popup` - Popup interface changes
- `content` - Content script changes  
- `background` - Background script changes
- `storage` - Data storage changes
- `docs` - Documentation changes
- `test` - Test changes
- `deps` - Dependency changes

## 🎯 Examples by Feature

### Adding New Functionality
```bash
feat: add support for job portal autofill
feat(popup): add dark mode toggle
feat: implement profile import/export
```

### Fixing Bugs
```bash
fix: resolve memory leak in background script
fix(content): handle dynamic form loading
fix: prevent duplicate field detection
```

### Improving Performance
```bash
perf: optimize field detection algorithm
perf(storage): reduce memory usage by 50%
```

### Breaking Changes
```bash
feat!: migrate to Manifest V3

BREAKING CHANGE: Extension now requires Chrome 88+
due to Manifest V3 migration. Users on older versions
need to update their browser.
```

## 📊 Version History

The system maintains a complete version history:
- **Automatic changelog** generation
- **Release notes** from commit messages  
- **Semantic versioning** (major.minor.patch)
- **Git tags** for each release

## 🚀 Getting Started

1. **Write conventional commits** using the format above
2. **Push to master** branch
3. **Watch automatic releases** happen
4. **Check GitHub Releases** for your packaged extension

That's it! The system handles everything else automatically. 🎉