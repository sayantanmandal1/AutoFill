#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Building Job Application Autofill Extension...');

// Configuration
const BUILD_DIR = 'build';
const DIST_DIR = 'dist';

// Files to include in the extension build
const EXTENSION_FILES = [
  'manifest.json',
  'popup.html',
  'popup.js',
  'content.js',
  'background.js',
  'storage.js',
  'style.css'
];

// Directories to include
const EXTENSION_DIRS = [
  'icons'
];

// Clean build directories
function cleanBuildDirs() {
  console.log('🧹 Cleaning build directories...');
  
  if (fs.existsSync(BUILD_DIR)) {
    fs.rmSync(BUILD_DIR, { recursive: true, force: true });
  }
  
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  
  fs.mkdirSync(BUILD_DIR, { recursive: true });
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// Copy extension files
function copyExtensionFiles() {
  console.log('📁 Copying extension files...');
  
  // Copy individual files
  EXTENSION_FILES.forEach(file => {
    if (fs.existsSync(file)) {
      const destPath = path.join(BUILD_DIR, file);
      fs.copyFileSync(file, destPath);
      console.log(`  ✅ Copied ${file}`);
    } else {
      console.warn(`  ⚠️  File not found: ${file}`);
    }
  });
  
  // Copy directories
  EXTENSION_DIRS.forEach(dir => {
    if (fs.existsSync(dir)) {
      const destPath = path.join(BUILD_DIR, dir);
      fs.cpSync(dir, destPath, { recursive: true });
      console.log(`  ✅ Copied directory ${dir}`);
    } else {
      console.warn(`  ⚠️  Directory not found: ${dir}`);
    }
  });
}

// Validate manifest.json
function validateManifest() {
  console.log('🔍 Validating manifest.json...');
  
  const manifestPath = path.join(BUILD_DIR, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('manifest.json not found in build directory');
  }
  
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Required fields
  const requiredFields = ['manifest_version', 'name', 'version'];
  requiredFields.forEach(field => {
    if (!manifest[field]) {
      throw new Error(`Missing required field in manifest.json: ${field}`);
    }
  });
  
  // Validate manifest version
  if (manifest.manifest_version !== 3) {
    throw new Error('Extension must use Manifest V3');
  }
  
  console.log(`  ✅ Manifest valid - ${manifest.name} v${manifest.version}`);
  return manifest;
}

// Create extension package
function createPackage(manifest) {
  console.log('📦 Creating extension package...');
  
  const version = manifest.version;
  const packageName = `job-application-autofill-v${version}.zip`;
  const packagePath = path.join(DIST_DIR, packageName);
  
  try {
    // Create zip package
    execSync(`cd ${BUILD_DIR} && zip -r ../${packagePath} .`, { stdio: 'inherit' });
    
    const stats = fs.statSync(packagePath);
    const sizeKB = Math.round(stats.size / 1024);
    
    console.log(`  ✅ Package created: ${packageName} (${sizeKB} KB)`);
    
    return {
      path: packagePath,
      name: packageName,
      size: sizeKB
    };
  } catch (error) {
    throw new Error(`Failed to create package: ${error.message}`);
  }
}

// Generate build info
function generateBuildInfo(manifest, packageInfo) {
  console.log('📋 Generating build info...');
  
  const buildInfo = {
    name: manifest.name,
    version: manifest.version,
    buildTime: new Date().toISOString(),
    buildNumber: process.env.GITHUB_RUN_NUMBER || 'local',
    commit: process.env.GITHUB_SHA || 'unknown',
    branch: process.env.GITHUB_REF_NAME || 'unknown',
    package: {
      name: packageInfo.name,
      size: packageInfo.size,
      path: packageInfo.path
    },
    files: EXTENSION_FILES.filter(file => fs.existsSync(file)),
    directories: EXTENSION_DIRS.filter(dir => fs.existsSync(dir))
  };
  
  const buildInfoPath = path.join(DIST_DIR, 'build-info.json');
  fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));
  
  console.log(`  ✅ Build info saved to ${buildInfoPath}`);
  return buildInfo;
}

// Run tests before build
function runTests() {
  console.log('🧪 Running tests before build...');
  
  try {
    execSync('npm test', { stdio: 'inherit' });
    console.log('  ✅ All tests passed');
  } catch (error) {
    console.error('  ❌ Tests failed');
    throw new Error('Build aborted due to test failures');
  }
}

// Main build function
async function build() {
  try {
    const startTime = Date.now();
    
    // Run tests first (skip in CI if already run)
    if (!process.env.CI) {
      runTests();
    }
    
    // Build steps
    cleanBuildDirs();
    copyExtensionFiles();
    const manifest = validateManifest();
    const packageInfo = createPackage(manifest);
    const buildInfo = generateBuildInfo(manifest, packageInfo);
    
    const buildTime = Date.now() - startTime;
    
    console.log('\n🎉 Build completed successfully!');
    console.log(`📊 Build Summary:`);
    console.log(`   Name: ${buildInfo.name}`);
    console.log(`   Version: ${buildInfo.version}`);
    console.log(`   Package: ${buildInfo.package.name} (${buildInfo.package.size} KB)`);
    console.log(`   Build Time: ${buildTime}ms`);
    console.log(`   Files: ${buildInfo.files.length}`);
    console.log(`   Directories: ${buildInfo.directories.length}`);
    
    if (process.env.CI) {
      console.log(`   Build Number: ${buildInfo.buildNumber}`);
      console.log(`   Commit: ${buildInfo.commit.substring(0, 8)}`);
      console.log(`   Branch: ${buildInfo.branch}`);
    }
    
    return buildInfo;
    
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Run build if called directly
if (require.main === module) {
  build();
}

module.exports = { build };