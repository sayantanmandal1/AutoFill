#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const ChromeStoreClient = require('./chrome-store-client');

/**
 * Chrome Web Store Upload Script
 * Handles the complete upload and publish workflow
 */

// Configuration
const CONFIG = {
  distDir: 'dist',
  buildDir: 'build',
  packagePattern: /job-application-autofill-v[\d.]+\.zip$/,
  maxRetries: 3,
  retryDelay: 5000 // 5 seconds
};

/**
 * Find the latest extension package
 */
function findExtensionPackage() {
  console.log('🔍 Looking for extension package...');
  
  const distPath = path.resolve(CONFIG.distDir);
  
  if (!fs.existsSync(distPath)) {
    throw new Error(`Distribution directory not found: ${distPath}`);
  }
  
  const files = fs.readdirSync(distPath);
  const packageFiles = files.filter(file => CONFIG.packagePattern.test(file));
  
  if (packageFiles.length === 0) {
    throw new Error(`No extension package found in ${distPath}`);
  }
  
  // Sort by modification time (newest first)
  const packageWithStats = packageFiles.map(file => {
    const filePath = path.join(distPath, file);
    const stats = fs.statSync(filePath);
    return { file, path: filePath, mtime: stats.mtime };
  });
  
  packageWithStats.sort((a, b) => b.mtime - a.mtime);
  
  const latestPackage = packageWithStats[0];
  console.log(`📦 Found package: ${latestPackage.file}`);
  
  return latestPackage.path;
}

/**
 * Validate environment variables
 */
function validateEnvironment() {
  console.log('🔐 Validating environment...');
  
  const requiredVars = [
    'CHROME_CLIENT_ID',
    'CHROME_CLIENT_SECRET',
    'CHROME_REFRESH_TOKEN',
    'CHROME_EXTENSION_ID'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  console.log('✅ Environment validated');
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
async function retryWithBackoff(fn, maxRetries = CONFIG.maxRetries) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      const delay = CONFIG.retryDelay * Math.pow(2, attempt - 1);
      console.log(`⏳ Attempt ${attempt} failed, retrying in ${delay}ms...`);
      console.log(`   Error: ${error.message}`);
      
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Get version from package or manifest
 */
function getVersion() {
  // Try to get version from package.json first
  const packagePath = path.resolve('package.json');
  if (fs.existsSync(packagePath)) {
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    if (packageData.version) {
      return packageData.version;
    }
  }
  
  // Fallback to manifest.json
  const manifestPath = path.resolve('manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return manifestData.version;
  }
  
  // Fallback to git tag or environment
  return process.env.GITHUB_REF_NAME?.replace('v', '') || '1.0.0';
}

/**
 * Create deployment summary
 */
function createDeploymentSummary(result, version, packagePath) {
  const summary = {
    timestamp: new Date().toISOString(),
    version: version,
    package: path.basename(packagePath),
    extensionId: process.env.CHROME_EXTENSION_ID,
    uploaded: result.uploaded,
    published: result.published,
    buildNumber: process.env.GITHUB_RUN_NUMBER || 'local',
    commit: process.env.GITHUB_SHA || 'unknown',
    branch: process.env.GITHUB_REF_NAME || 'unknown'
  };
  
  // Save summary to file
  const summaryPath = path.join(CONFIG.distDir, 'deployment-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  
  return summary;
}

/**
 * Main upload function
 */
async function uploadToWebStore() {
  try {
    console.log('🚀 Starting Chrome Web Store upload process...');
    
    // Validate environment
    validateEnvironment();
    
    // Find extension package
    const packagePath = findExtensionPackage();
    const version = getVersion();
    
    console.log(`📋 Upload Summary:`);
    console.log(`   Version: ${version}`);
    console.log(`   Package: ${path.basename(packagePath)}`);
    console.log(`   Extension ID: ${process.env.CHROME_EXTENSION_ID}`);
    
    if (process.env.CI) {
      console.log(`   Build: ${process.env.GITHUB_RUN_NUMBER || 'unknown'}`);
      console.log(`   Commit: ${(process.env.GITHUB_SHA || 'unknown').substring(0, 8)}`);
    }
    
    // Create Chrome Store client
    const client = new ChromeStoreClient();
    
    // Upload with retry logic
    const result = await retryWithBackoff(async () => {
      return await client.uploadAndPublish(packagePath, {
        publishTarget: process.env.PUBLISH_TARGET || 'default',
        skipPublish: process.env.SKIP_PUBLISH === 'true'
      });
    });
    
    // Create deployment summary
    const summary = createDeploymentSummary(result, version, packagePath);
    
    // Output results
    console.log('\n🎉 Chrome Web Store deployment completed!');
    console.log(`📊 Deployment Summary:`);
    console.log(`   ✅ Uploaded: ${result.uploaded ? 'Yes' : 'No'}`);
    console.log(`   🚀 Published: ${result.published ? 'Yes' : 'No'}`);
    console.log(`   📦 Package: ${summary.package}`);
    console.log(`   🔗 Extension ID: ${summary.extensionId}`);
    
    if (process.env.GITHUB_ACTIONS) {
      // Set GitHub Actions outputs
      console.log(`::set-output name=uploaded::${result.uploaded}`);
      console.log(`::set-output name=published::${result.published}`);
      console.log(`::set-output name=version::${version}`);
      console.log(`::set-output name=extension-id::${summary.extensionId}`);
    }
    
    return summary;
    
  } catch (error) {
    console.error('\n❌ Chrome Web Store upload failed:', error.message);
    
    if (process.env.GITHUB_ACTIONS) {
      console.log(`::set-output name=uploaded::false`);
      console.log(`::set-output name=published::false`);
      console.log(`::set-output name=error::${error.message}`);
    }
    
    process.exit(1);
  }
}

// Command line options
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--skip-publish':
        process.env.SKIP_PUBLISH = 'true';
        break;
      case '--target':
        process.env.PUBLISH_TARGET = args[++i];
        break;
      case '--package':
        options.packagePath = args[++i];
        break;
      case '--help':
        console.log(`
Chrome Web Store Upload Script

Usage: node chrome-store-upload.js [options]

Options:
  --skip-publish    Upload only, don't publish
  --target TARGET   Publish target (default, trustedTesters)
  --package PATH    Specific package path to upload
  --help           Show this help message

Environment Variables:
  CHROME_CLIENT_ID       Chrome Web Store API client ID
  CHROME_CLIENT_SECRET   Chrome Web Store API client secret
  CHROME_REFRESH_TOKEN   OAuth refresh token
  CHROME_EXTENSION_ID    Chrome Web Store extension ID
  PUBLISH_TARGET         Publish target (default: 'default')
  SKIP_PUBLISH          Skip publishing step (default: false)
        `);
        process.exit(0);
        break;
    }
  }
  
  return options;
}

// Run upload if called directly
if (require.main === module) {
  const options = parseArgs();
  uploadToWebStore(options);
}

module.exports = { uploadToWebStore, ChromeStoreClient };