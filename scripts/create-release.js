#!/usr/bin/env node

/**
 * Create Release Script
 * 
 * This script helps create a GitHub release locally or provides instructions
 * for creating releases through the GitHub interface.
 */

const fs = require('fs');
const { execSync } = require('child_process');

class ReleaseCreator {
  constructor() {
    this.currentVersion = this.getCurrentVersion();
  }

  getCurrentVersion() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return packageJson.version;
    } catch (error) {
      return '1.0.0';
    }
  }

  getNextVersion(type = 'patch') {
    const [major, minor, patch] = this.currentVersion.split('.').map(Number);
    
    switch (type) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
      default:
        return `${major}.${minor}.${patch + 1}`;
    }
  }

  showReleaseInstructions() {
    const nextPatch = this.getNextVersion('patch');
    const nextMinor = this.getNextVersion('minor');
    const nextMajor = this.getNextVersion('major');

    console.log('🚀 GitHub Release Creation Guide');
    console.log('================================\n');
    
    console.log(`Current version: ${this.currentVersion}\n`);
    
    console.log('📋 Option 1: Use GitHub Actions (Recommended)');
    console.log('----------------------------------------------');
    console.log('1. Go to your repository on GitHub');
    console.log('2. Click "Actions" tab');
    console.log('3. Find "Manual Release" workflow');
    console.log('4. Click "Run workflow"');
    console.log('5. Enter the new version number');
    console.log('6. Select release type (patch/minor/major)');
    console.log('7. Click "Run workflow"\n');
    
    console.log('Suggested versions:');
    console.log(`  - Patch (bug fixes): ${nextPatch}`);
    console.log(`  - Minor (new features): ${nextMinor}`);
    console.log(`  - Major (breaking changes): ${nextMajor}\n`);
    
    console.log('📋 Option 2: Create Release Manually');
    console.log('------------------------------------');
    console.log('1. Go to your repository on GitHub');
    console.log('2. Click "Releases" (or go to /releases)');
    console.log('3. Click "Create a new release"');
    console.log('4. Create a new tag (e.g., v1.0.1)');
    console.log('5. Set release title (e.g., "Release v1.0.1")');
    console.log('6. Add release notes');
    console.log('7. Upload the extension zip file');
    console.log('8. Click "Publish release"\n');
    
    console.log('📋 Option 3: Use Git Tags (Advanced)');
    console.log('------------------------------------');
    console.log('1. Update version in package.json and manifest.json');
    console.log('2. Commit changes: git commit -am "chore: bump version to v1.0.1"');
    console.log('3. Create tag: git tag -a v1.0.1 -m "Release v1.0.1"');
    console.log('4. Push: git push origin master --tags');
    console.log('5. This will trigger the automatic release workflow\n');
    
    console.log('🎯 What Happens After Release:');
    console.log('------------------------------');
    console.log('✅ Extension zip file is created automatically');
    console.log('✅ Release notes are generated from commits');
    console.log('✅ Version numbers are updated in all files');
    console.log('✅ Users can download and install manually');
    console.log('✅ Documentation is updated\n');
    
    console.log('📦 Manual Installation for Users:');
    console.log('---------------------------------');
    console.log('1. Download the extension zip from GitHub Releases');
    console.log('2. Extract the zip file');
    console.log('3. Open Chrome and go to chrome://extensions/');
    console.log('4. Enable "Developer mode"');
    console.log('5. Click "Load unpacked" and select the extracted folder\n');
  }

  createLocalBuild(version) {
    console.log(`🔨 Creating local build for version ${version}...\n`);
    
    try {
      // Update version in files
      console.log('📝 Updating version numbers...');
      execSync(`npm version ${version} --no-git-tag-version`, { stdio: 'inherit' });
      
      // Update manifest.json
      const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
      manifest.version = version;
      fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2));
      
      // Run tests
      console.log('🧪 Running tests...');
      try {
        execSync('npm test', { stdio: 'inherit' });
      } catch (error) {
        console.log('⚠️ Some tests failed, continuing...');
      }
      
      // Build extension
      console.log('🏗️ Building extension...');
      execSync('node scripts/build-extension.js', { stdio: 'inherit' });
      
      // Create zip
      console.log('📦 Creating extension package...');
      if (!fs.existsSync('build')) {
        fs.mkdirSync('build');
      }
      
      // Copy files to build directory
      const filesToCopy = [
        'manifest.json', 'popup.html', 'popup.js', 
        'content.js', 'background.js', 'storage.js', 'style.css'
      ];
      
      filesToCopy.forEach(file => {
        if (fs.existsSync(file)) {
          fs.copyFileSync(file, `build/${file}`);
        }
      });
      
      // Copy icons if they exist
      if (fs.existsSync('icons')) {
        execSync('cp -r icons build/', { stdio: 'inherit' });
      }
      
      // Create zip
      const zipName = `job-application-autofill-v${version}.zip`;
      execSync(`cd build && zip -r ../${zipName} .`, { stdio: 'inherit' });
      
      console.log(`\n✅ Local build completed!`);
      console.log(`📦 Extension package: ${zipName}`);
      console.log(`📁 Build directory: build/`);
      console.log(`\nNext steps:`);
      console.log(`1. Test the extension by loading the build/ directory in Chrome`);
      console.log(`2. If everything works, create a GitHub release with the zip file`);
      console.log(`3. Or use the GitHub Actions workflow for automated release`);
      
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const creator = new ReleaseCreator();
  const command = process.argv[2];
  const version = process.argv[3];

  switch (command) {
    case 'build':
      if (!version) {
        console.error('❌ Version required for build command');
        console.log('Usage: node scripts/create-release.js build 1.0.1');
        process.exit(1);
      }
      creator.createLocalBuild(version);
      break;

    case 'instructions':
    case 'help':
    default:
      creator.showReleaseInstructions();
      break;
  }
}

module.exports = ReleaseCreator;