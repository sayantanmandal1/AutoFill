/**
 * Playwright Global Setup
 * Prepares extension build and test environment
 */

import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalSetup() {
  console.log('🚀 Setting up browser compatibility test environment...');

  // Ensure build directory exists
  const buildDir = path.join(process.cwd(), 'build');
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  // Copy extension files to build directory for testing
  const extensionFiles = [
    'manifest.json',
    'popup.html',
    'popup.js',
    'content.js',
    'background.js',
    'storage.js',
    'style.css'
  ];

  for (const file of extensionFiles) {
    const srcPath = path.join(process.cwd(), file);
    const destPath = path.join(buildDir, file);
    
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Copied ${file} to build directory`);
    } else {
      console.warn(`⚠️ Warning: ${file} not found, skipping...`);
    }
  }

  // Copy icons directory if it exists
  const iconsDir = path.join(process.cwd(), 'icons');
  const buildIconsDir = path.join(buildDir, 'icons');
  
  if (fs.existsSync(iconsDir)) {
    if (!fs.existsSync(buildIconsDir)) {
      fs.mkdirSync(buildIconsDir, { recursive: true });
    }
    
    const iconFiles = fs.readdirSync(iconsDir);
    for (const iconFile of iconFiles) {
      fs.copyFileSync(
        path.join(iconsDir, iconFile),
        path.join(buildIconsDir, iconFile)
      );
    }
    console.log('✅ Copied icons to build directory');
  }

  // Create test results directory
  const testResultsDir = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(testResultsDir)) {
    fs.mkdirSync(testResultsDir, { recursive: true });
  }

  console.log('✅ Browser compatibility test environment ready');
}

export default globalSetup;