# Automated Changelog Generation

This document describes the automated changelog generation system implemented for the Job Application Autofill Extension.

## Overview

The changelog automation system automatically generates and maintains the `CHANGELOG.md` file based on git commit messages, following conventional commit standards and semantic versioning principles.

## Features

### 🤖 Automated Generation
- **Commit Analysis**: Parses git commits using conventional commit format
- **Semantic Versioning**: Automatically determines version bumps based on commit types
- **Categorization**: Groups changes by type (features, fixes, breaking changes, etc.)
- **Rich Formatting**: Generates well-formatted changelog entries with links and metadata

### 🔄 CI/CD Integration
- **GitHub Actions**: Automatically runs on version tags and releases
- **Release Workflow**: Integrated into the release process
- **Pull Request Comments**: Notifies contributors when their changes are included

### 📋 Multiple Output Formats
- **Changelog File**: Updates `CHANGELOG.md` with structured entries
- **Release Notes**: Generates GitHub release notes
- **Summary Reports**: Provides deployment summaries

## Usage

### Command Line Interface

#### Generate Changelog
```bash
# Generate changelog for specific version
npm run changelog:generate -- --version=1.2.3

# Auto-determine version from commits
npm run changelog:auto

# Preview changes without writing
npm run changelog:dry-run

# Generate from specific tag
node scripts/changelog-generator.js generate --version=1.2.3 --from=v1.0.0
```

#### Version Management
```bash
# Show current version
node scripts/version-manager.js current

# Update version in all files
node scripts/version-manager.js update 1.2.3

# Increment version
node scripts/version-manager.js increment patch|minor|major

# Complete release workflow
node scripts/version-manager.js release 1.2.3
```

#### Release Notes
```bash
# Generate release notes for GitHub
npm run release:notes -- --version=1.2.3
```

### GitHub Actions Integration

#### Automatic Triggers
- **Version Tags**: Automatically runs when version tags (v*.*.*) are pushed
- **Manual Dispatch**: Can be triggered manually with custom parameters
- **Release Events**: Integrated into the main release workflow

#### Workflow Files
- `.github/workflows/changelog-automation.yml` - Dedicated changelog generation
- `.github/workflows/ci-cd.yml` - Main CI/CD pipeline with changelog integration

## Commit Message Format

The system supports conventional commit format for better categorization:

### Standard Format
```
type(scope): description

[optional body]

[optional footer]
```

### Supported Types
- `feat`: New features (minor version bump)
- `fix`: Bug fixes (patch version bump)
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions or modifications
- `build`: Build system changes
- `ci`: CI/CD configuration changes
- `chore`: Maintenance tasks

### Breaking Changes
- Add `!` after type: `feat!: breaking change`
- Include `BREAKING CHANGE:` in footer
- Results in major version bump

### Examples
```bash
# Feature addition
git commit -m "feat(autofill): add smart field detection for campus selection"

# Bug fix
git commit -m "fix(storage): resolve data sync issue across browser tabs"

# Breaking change
git commit -m "feat!: redesign storage API with new interface"

# Documentation
git commit -m "docs: update installation guide with new requirements"
```

## Changelog Format

The generated changelog follows [Keep a Changelog](https://keepachangelog.com/) format:

### Structure
```markdown
# Changelog

## [1.2.3] - 2025-08-11

### 💥 Breaking Changes
- Major API changes that require user action

### ✨ Features
- New functionality and enhancements

### 🐛 Bug Fixes
- Bug fixes and error corrections

### ⚡ Performance
- Performance improvements

### ♻️ Refactoring
- Code refactoring without functional changes

### 📚 Documentation
- Documentation updates and additions

### 💄 Styling
- Code style and formatting changes

### 🧪 Tests
- Test additions and improvements

### 🔧 Build & CI
- Build system and CI/CD changes

### 🧹 Maintenance
- Maintenance and chore tasks

### 📦 Other Changes
- Miscellaneous changes
```

### Entry Format
Each entry includes:
- **Description**: Clear description of the change
- **Commit Link**: Link to the specific commit
- **Scope**: Optional scope in bold (e.g., **autofill**: description)

## Semantic Versioning

The system automatically determines version increments:

### Version Bump Rules
- **Major (X.0.0)**: Breaking changes (`BREAKING CHANGE` or `!` in commit)
- **Minor (X.Y.0)**: New features (`feat` commits)
- **Patch (X.Y.Z)**: Bug fixes, performance, and other changes

### Version Sources
1. **Manual**: Explicitly specified version
2. **Auto-determined**: Based on commit analysis
3. **Incremental**: Increment from current version

## Configuration

### Environment Variables
```bash
# GitHub token for API access (automatically provided in Actions)
GITHUB_TOKEN=your_token_here
```

### File Locations
- `CHANGELOG.md` - Main changelog file
- `scripts/changelog-generator.js` - Core generator script
- `scripts/version-manager.js` - Version management utilities
- `.github/workflows/changelog-automation.yml` - Automation workflow

## Integration with Release Process

### Automated Release Workflow
1. **Tag Creation**: Developer creates version tag (e.g., `v1.2.3`)
2. **Changelog Generation**: System analyzes commits since last tag
3. **File Updates**: Updates `CHANGELOG.md`, `manifest.json`, `package.json`
4. **Commit & Push**: Commits changes back to repository
5. **Release Notes**: Generates GitHub release notes
6. **Notifications**: Comments on related pull requests

### Manual Release Process
```bash
# Complete release with changelog
npm run version:release -- 1.2.3

# Or step by step
npm run changelog:generate -- --version=1.2.3
git add CHANGELOG.md
git commit -m "docs: update changelog for v1.2.3"
git tag v1.2.3
git push origin main --tags
```

## Troubleshooting

### Common Issues

#### No Commits Found
```bash
# Check git history
git log --oneline -10

# Verify tag exists
git tag -l

# Check from specific commit
node scripts/changelog-generator.js generate --version=1.2.3 --from=abc123
```

#### Version Conflicts
```bash
# Check current version
node scripts/version-manager.js current

# Validate version format
node -e "console.log(/^\d+\.\d+\.\d+$/.test('1.2.3'))"
```

#### Permission Issues
```bash
# Ensure write permissions
ls -la CHANGELOG.md

# Check git configuration
git config --list | grep user
```

### Debug Mode
```bash
# Enable verbose logging
DEBUG=changelog:* node scripts/changelog-generator.js generate --dry-run
```

## Best Practices

### Commit Messages
1. **Use Conventional Format**: Follow `type(scope): description` format
2. **Be Descriptive**: Write clear, concise descriptions
3. **Include Context**: Add scope when relevant
4. **Breaking Changes**: Clearly mark breaking changes

### Version Management
1. **Semantic Versioning**: Follow semver principles strictly
2. **Regular Releases**: Release frequently with smaller changes
3. **Tag Consistency**: Use consistent tag format (`v1.2.3`)
4. **Review Changes**: Always review generated changelog before release

### Automation
1. **Test Locally**: Use dry-run mode to preview changes
2. **Monitor Workflows**: Check GitHub Actions for failures
3. **Backup Strategy**: Keep manual changelog backup for critical releases
4. **Documentation**: Keep this guide updated with changes

## Examples

### Complete Release Example
```bash
# 1. Make changes and commit with conventional format
git commit -m "feat(forms): add support for multi-step form detection"
git commit -m "fix(storage): resolve sync timing issue"
git commit -m "docs: update API documentation"

# 2. Generate changelog and release
npm run version:release -- increment minor

# 3. Verify results
cat CHANGELOG.md
git log --oneline -5
git tag -l | tail -5
```

### Manual Changelog Generation
```bash
# Preview what would be generated
npm run changelog:dry-run

# Generate for specific version range
node scripts/changelog-generator.js generate \
  --version=1.2.3 \
  --from=v1.2.0

# Generate release notes only
npm run release:notes -- --version=1.2.3
```

## Future Enhancements

### Planned Features
- [ ] Custom commit type configuration
- [ ] Multi-language changelog support
- [ ] Integration with issue tracking
- [ ] Automated dependency change detection
- [ ] Performance metrics in changelog
- [ ] Custom changelog templates

### Integration Opportunities
- [ ] Slack/Discord notifications
- [ ] Email release summaries
- [ ] Automated blog post generation
- [ ] Social media announcements
- [ ] Metrics dashboard integration

---

## Support

For issues with changelog automation:

1. **Check Logs**: Review GitHub Actions logs for errors
2. **Test Locally**: Run commands locally to isolate issues
3. **Validate Format**: Ensure commit messages follow conventions
4. **Documentation**: Refer to this guide and inline help
5. **Issues**: Create GitHub issue with detailed error information

---

**Last Updated**: August 11, 2025  
**Version**: 1.0.0  
**Maintainer**: Development Team