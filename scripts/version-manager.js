#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Version Manager for Chrome Extension
 * Handles version updates across manifest.json, package.json, and git tags
 */
class VersionManager {
  constructor() {
    this.manifestPath = path.resolve('manifest.json');
    this.packagePath = path.resolve('package.json');
  }

  /**
   * Get current version from manifest.json
   */
  getCurrentVersion() {
    if (!fs.existsSync(this.manifestPath)) {
      throw new Error('manifest.json not found');
    }

    const manifest = JSON.parse(fs.readFileSync(this.manifestPath, 'utf8'));
    return manifest.version;
  }

  /**
   * Update version in manifest.json
   * @param {string} version - New version string
   */
  updateManifestVersion(version) {
    console.log(`📝 Updating manifest.json version to ${version}`);

    if (!fs.existsSync(this.manifestPath)) {
      throw new Error('manifest.json not found');
    }

    const manifest = JSON.parse(fs.readFileSync(this.manifestPath, 'utf8'));
    manifest.version = version;

    fs.writeFileSync(this.manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    console.log('✅ manifest.json updated');
  }

  /**
   * Update version in package.json
   * @param {string} version - New version string
   */
  updatePackageVersion(version) {
    console.log(`📝 Updating package.json version to ${version}`);

    if (!fs.existsSync(this.packagePath)) {
      console.log('⚠️ package.json not found, skipping');
      return;
    }

    const packageData = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
    packageData.version = version;

    fs.writeFileSync(this.packagePath, JSON.stringify(packageData, null, 2) + '\n');
    console.log('✅ package.json updated');
  }

  /**
   * Update version in all files
   * @param {string} version - New version string
   */
  updateAllVersions(version) {
    console.log(`🔄 Updating all version references to ${version}`);

    this.updateManifestVersion(version);
    this.updatePackageVersion(version);

    console.log('✅ All versions updated');
  }

  /**
   * Validate semantic version format
   * @param {string} version - Version string to validate
   */
  validateVersion(version) {
    const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
    
    if (!semverRegex.test(version)) {
      throw new Error(`Invalid semantic version format: ${version}`);
    }

    return true;
  }

  /**
   * Increment version based on type
   * @param {string} type - Version increment type (major, minor, patch)
   * @param {string} currentVersion - Current version (optional)
   */
  incrementVersion(type, currentVersion = null) {
    const version = currentVersion || this.getCurrentVersion();
    this.validateVersion(version);

    const [major, minor, patch] = version.split('.').map(Number);

    let newVersion;
    switch (type) {
      case 'major':
        newVersion = `${major + 1}.0.0`;
        break;
      case 'minor':
        newVersion = `${major}.${minor + 1}.0`;
        break;
      case 'patch':
        newVersion = `${major}.${minor}.${patch + 1}`;
        break;
      default:
        throw new Error(`Invalid increment type: ${type}. Use major, minor, or patch`);
    }

    console.log(`📈 Incrementing ${type} version: ${version} → ${newVersion}`);
    return newVersion;
  }

  /**
   * Get version from git tag
   */
  getVersionFromGitTag() {
    try {
      const tag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
      return tag.replace(/^v/, ''); // Remove 'v' prefix if present
    } catch (error) {
      console.log('⚠️ No git tags found');
      return null;
    }
  }

  /**
   * Create git tag for version
   * @param {string} version - Version to tag
   * @param {string} message - Tag message (optional)
   */
  createGitTag(version, message = null) {
    const tagName = `v${version}`;
    const tagMessage = message || `Release version ${version}`;

    console.log(`🏷️ Creating git tag: ${tagName}`);

    try {
      execSync(`git tag -a ${tagName} -m "${tagMessage}"`, { stdio: 'inherit' });
      console.log(`✅ Git tag created: ${tagName}`);
      return tagName;
    } catch (error) {
      throw new Error(`Failed to create git tag: ${error.message}`);
    }
  }

  /**
   * Generate changelog from git commits
   * @param {string} fromTag - Starting tag (optional)
   * @param {string} toTag - Ending tag (optional, defaults to HEAD)
   */
  generateChangelog(fromTag = null, toTag = 'HEAD') {
    console.log('📋 Generating changelog from git commits...');

    try {
      let gitCommand;
      if (fromTag) {
        gitCommand = `git log ${fromTag}..${toTag} --oneline --pretty=format:"- %s (%h)"`;
      } else {
        gitCommand = `git log --oneline --pretty=format:"- %s (%h)" -10`; // Last 10 commits
      }

      const changelog = execSync(gitCommand, { encoding: 'utf8' }).trim();
      
      if (!changelog) {
        console.log('⚠️ No commits found for changelog');
        return '';
      }

      console.log('✅ Changelog generated');
      return changelog;
    } catch (error) {
      console.log('⚠️ Failed to generate changelog:', error.message);
      return '';
    }
  }

  /**
   * Update CHANGELOG.md file
   * @param {string} version - Version being released
   * @param {string} changelog - Changelog content
   */
  updateChangelogFile(version, changelog) {
    const changelogPath = path.resolve('CHANGELOG.md');
    const date = new Date().toISOString().split('T')[0];
    
    console.log(`📝 Updating CHANGELOG.md for version ${version}`);

    let existingContent = '';
    if (fs.existsSync(changelogPath)) {
      existingContent = fs.readFileSync(changelogPath, 'utf8');
    } else {
      existingContent = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
    }

    const newEntry = `## [${version}] - ${date}\n\n${changelog}\n\n`;
    
    // Insert new entry after the header
    const lines = existingContent.split('\n');
    const headerEndIndex = lines.findIndex(line => line.startsWith('## '));
    
    if (headerEndIndex === -1) {
      // No existing entries, add after header
      const headerLines = lines.slice(0, 3); // Keep title and description
      const newContent = [...headerLines, '', newEntry, ...lines.slice(3)].join('\n');
      fs.writeFileSync(changelogPath, newContent);
    } else {
      // Insert before first existing entry
      const beforeEntry = lines.slice(0, headerEndIndex);
      const afterEntry = lines.slice(headerEndIndex);
      const newContent = [...beforeEntry, newEntry, ...afterEntry].join('\n');
      fs.writeFileSync(changelogPath, newContent);
    }

    console.log('✅ CHANGELOG.md updated');
  }

  /**
   * Complete release workflow
   * @param {string} version - Version to release
   * @param {Object} options - Release options
   */
  async performRelease(version, options = {}) {
    const {
      incrementType = null,
      createTag = true,
      updateChangelog = true,
      tagMessage = null
    } = options;

    console.log(`🚀 Starting release workflow for version ${version}`);

    try {
      // Increment version if type specified
      if (incrementType) {
        version = this.incrementVersion(incrementType);
      }

      // Validate version
      this.validateVersion(version);

      // Update version files
      this.updateAllVersions(version);

      // Generate and update changelog
      if (updateChangelog) {
        const lastTag = this.getVersionFromGitTag();
        const changelog = this.generateChangelog(lastTag ? `v${lastTag}` : null);
        if (changelog) {
          this.updateChangelogFile(version, changelog);
        }
      }

      // Create git tag
      if (createTag) {
        this.createGitTag(version, tagMessage);
      }

      console.log(`🎉 Release ${version} completed successfully!`);
      
      return {
        version,
        success: true,
        files: ['manifest.json', 'package.json', 'CHANGELOG.md'].filter(file => 
          fs.existsSync(path.resolve(file))
        )
      };

    } catch (error) {
      console.error(`❌ Release failed: ${error.message}`);
      throw error;
    }
  }
}

// CLI interface
function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'current':
      const vm = new VersionManager();
      console.log(vm.getCurrentVersion());
      break;
      
    case 'update':
      const version = args[1];
      if (!version) {
        console.error('Usage: node version-manager.js update <version>');
        process.exit(1);
      }
      new VersionManager().updateAllVersions(version);
      break;
      
    case 'increment':
      const type = args[1];
      if (!['major', 'minor', 'patch'].includes(type)) {
        console.error('Usage: node version-manager.js increment <major|minor|patch>');
        process.exit(1);
      }
      const manager = new VersionManager();
      const newVersion = manager.incrementVersion(type);
      manager.updateAllVersions(newVersion);
      break;
      
    case 'release':
      const releaseVersion = args[1];
      const releaseType = args[2];
      
      if (!releaseVersion && !releaseType) {
        console.error('Usage: node version-manager.js release <version> OR node version-manager.js release increment <major|minor|patch>');
        process.exit(1);
      }
      
      const releaseManager = new VersionManager();
      if (releaseVersion === 'increment') {
        releaseManager.performRelease(null, { incrementType: releaseType });
      } else {
        releaseManager.performRelease(releaseVersion);
      }
      break;
      
    case 'changelog':
      const fromTag = args[1];
      const toTag = args[2] || 'HEAD';
      const changelogManager = new VersionManager();
      const changelog = changelogManager.generateChangelog(fromTag, toTag);
      console.log(changelog);
      break;
      
    default:
      console.log(`
Version Manager for Chrome Extension

Usage: node version-manager.js <command> [options]

Commands:
  current                    Show current version
  update <version>           Update version in all files
  increment <type>           Increment version (major, minor, patch)
  release <version>          Perform complete release workflow
  release increment <type>   Release with version increment
  changelog [from] [to]      Generate changelog from git commits

Examples:
  node version-manager.js current
  node version-manager.js update 1.2.3
  node version-manager.js increment patch
  node version-manager.js release 1.2.3
  node version-manager.js release increment minor
  node version-manager.js changelog v1.0.0 HEAD
      `);
      break;
  }
}

// Run CLI if called directly
if (require.main === module) {
  parseArgs();
}

module.exports = VersionManager;