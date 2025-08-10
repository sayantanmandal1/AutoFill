#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

/**
 * Chrome Web Store API Client
 * Handles authentication and API operations for Chrome Web Store
 */
class ChromeStoreClient {
  constructor(options = {}) {
    this.clientId = options.clientId || process.env.CHROME_CLIENT_ID;
    this.clientSecret = options.clientSecret || process.env.CHROME_CLIENT_SECRET;
    this.refreshToken = options.refreshToken || process.env.CHROME_REFRESH_TOKEN;
    this.extensionId = options.extensionId || process.env.CHROME_EXTENSION_ID;
    
    if (!this.clientId || !this.clientSecret || !this.refreshToken) {
      throw new Error('Missing required Chrome Web Store API credentials');
    }
    
    this.oauth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      'urn:ietf:wg:oauth:2.0:oob'
    );
    
    this.oauth2Client.setCredentials({
      refresh_token: this.refreshToken
    });
  }

  /**
   * Get access token using refresh token
   */
  async getAccessToken() {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      return credentials.access_token;
    } catch (error) {
      throw new Error(`Failed to get access token: ${error.message}`);
    }
  }

  /**
   * Upload extension package to Chrome Web Store
   * @param {string} zipFilePath - Path to the extension zip file
   * @param {string} extensionId - Chrome Web Store extension ID
   */
  async uploadExtension(zipFilePath, extensionId = this.extensionId) {
    if (!extensionId) {
      throw new Error('Extension ID is required');
    }

    if (!fs.existsSync(zipFilePath)) {
      throw new Error(`Extension package not found: ${zipFilePath}`);
    }

    console.log(`📤 Uploading extension package: ${zipFilePath}`);
    console.log(`🎯 Extension ID: ${extensionId}`);

    try {
      const accessToken = await this.getAccessToken();
      const zipBuffer = fs.readFileSync(zipFilePath);

      const response = await fetch(
        `https://www.googleapis.com/upload/chromewebstore/v1.1/items/${extensionId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'x-goog-api-version': '2',
            'Content-Type': 'application/zip'
          },
          body: zipBuffer
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`Upload failed: ${result.error?.message || response.statusText}`);
      }

      if (result.uploadState === 'SUCCESS') {
        console.log('✅ Extension uploaded successfully');
        return {
          success: true,
          uploadState: result.uploadState,
          itemError: result.itemError
        };
      } else {
        console.warn('⚠️ Upload completed with warnings:', result.itemError);
        return {
          success: false,
          uploadState: result.uploadState,
          itemError: result.itemError
        };
      }

    } catch (error) {
      console.error('❌ Upload failed:', error.message);
      throw error;
    }
  }

  /**
   * Publish extension to make it available to users
   * @param {string} extensionId - Chrome Web Store extension ID
   * @param {string} target - Publication target ('default' or 'trustedTesters')
   */
  async publishExtension(extensionId = this.extensionId, target = 'default') {
    if (!extensionId) {
      throw new Error('Extension ID is required');
    }

    console.log(`🚀 Publishing extension: ${extensionId}`);
    console.log(`🎯 Target: ${target}`);

    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(
        `https://www.googleapis.com/chromewebstore/v1.1/items/${extensionId}/publish`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'x-goog-api-version': '2',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            target: target
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`Publish failed: ${result.error?.message || response.statusText}`);
      }

      if (result.status && result.status.includes('OK')) {
        console.log('✅ Extension published successfully');
        return {
          success: true,
          status: result.status,
          statusDetail: result.statusDetail
        };
      } else {
        console.warn('⚠️ Publish completed with issues:', result.statusDetail);
        return {
          success: false,
          status: result.status,
          statusDetail: result.statusDetail
        };
      }

    } catch (error) {
      console.error('❌ Publish failed:', error.message);
      throw error;
    }
  }

  /**
   * Get extension information from Chrome Web Store
   * @param {string} extensionId - Chrome Web Store extension ID
   */
  async getExtensionInfo(extensionId = this.extensionId) {
    if (!extensionId) {
      throw new Error('Extension ID is required');
    }

    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(
        `https://www.googleapis.com/chromewebstore/v1.1/items/${extensionId}?projection=DRAFT`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'x-goog-api-version': '2'
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`Failed to get extension info: ${result.error?.message || response.statusText}`);
      }

      return result;

    } catch (error) {
      console.error('❌ Failed to get extension info:', error.message);
      throw error;
    }
  }

  /**
   * Complete upload and publish workflow
   * @param {string} zipFilePath - Path to the extension zip file
   * @param {Object} options - Upload and publish options
   */
  async uploadAndPublish(zipFilePath, options = {}) {
    const {
      extensionId = this.extensionId,
      publishTarget = 'default',
      skipPublish = false
    } = options;

    console.log('🚀 Starting Chrome Web Store deployment...');

    try {
      // Step 1: Upload extension
      const uploadResult = await this.uploadExtension(zipFilePath, extensionId);
      
      if (!uploadResult.success) {
        throw new Error(`Upload failed: ${uploadResult.itemError?.join(', ')}`);
      }

      // Step 2: Publish extension (if not skipped)
      if (!skipPublish) {
        const publishResult = await this.publishExtension(extensionId, publishTarget);
        
        if (!publishResult.success) {
          console.warn('⚠️ Extension uploaded but publish failed:', publishResult.statusDetail);
          return {
            uploaded: true,
            published: false,
            uploadResult,
            publishResult
          };
        }

        console.log('🎉 Extension successfully uploaded and published!');
        return {
          uploaded: true,
          published: true,
          uploadResult,
          publishResult
        };
      } else {
        console.log('✅ Extension uploaded successfully (publish skipped)');
        return {
          uploaded: true,
          published: false,
          uploadResult
        };
      }

    } catch (error) {
      console.error('❌ Chrome Web Store deployment failed:', error.message);
      throw error;
    }
  }
}

module.exports = ChromeStoreClient;