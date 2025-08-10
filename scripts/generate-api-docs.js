#!/usr/bin/env node

/**
 * API Documentation Generator
 * Extracts JSDoc comments from source files and generates markdown documentation
 */

const fs = require('fs');
const path = require('path');

/**
 * Main API documentation generator class
 */
class APIDocGenerator {
    constructor() {
        this.sourceFiles = [
            'storage.js',
            'content.js',
            'background.js',
            'popup.js'
        ];
        this.outputFile = 'docs/API.md';
    }

    /**
     * Generate complete API documentation
     */
    async generateDocs() {
        console.log('🚀 Starting API documentation generation...');
        
        try {
            const apiData = await this.extractAllJSDocComments();
            const markdown = this.generateMarkdown(apiData);
            await this.writeDocumentation(markdown);
            
            console.log('✅ API documentation generated successfully!');
            console.log(`📄 Documentation saved to: ${this.outputFile}`);
        } catch (error) {
            console.error('❌ Error generating API documentation:', error.message);
            process.exit(1);
        }
    }

    /**
     * Extract JSDoc comments from all source files
     * @returns {Object} Extracted API data organized by file
     */
    async extractAllJSDocComments() {
        const apiData = {};
        
        for (const file of this.sourceFiles) {
            if (fs.existsSync(file)) {
                console.log(`📖 Processing ${file}...`);
                apiData[file] = await this.extractJSDocComments(file);
            } else {
                console.warn(`⚠️  File not found: ${file}`);
            }
        }
        
        return apiData;
    }

    /**
     * Extract JSDoc comments from a single file
     * @param {string} filePath - Path to the source file
     * @returns {Array} Array of extracted JSDoc blocks
     */
    async extractJSDocComments(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const jsdocBlocks = [];
        
        // Regex to match JSDoc comments with their associated code
        const jsdocRegex = /\/\*\*([\s\S]*?)\*\/\s*((?:class|function|static|async|\w+\s*[:=]|\w+\s*\(|\w+\s*{)[\s\S]*?)(?=\n\s*(?:\/\*\*|class|function|static|async|\w+\s*[:=]|\w+\s*\(|\w+\s*{|$))/g;
        
        let match;
        while ((match = jsdocRegex.exec(content)) !== null) {
            const [, comment, code] = match;
            const parsedComment = this.parseJSDocComment(comment);
            const codeSignature = this.extractCodeSignature(code);
            
            if (parsedComment.description || parsedComment.params.length > 0) {
                jsdocBlocks.push({
                    ...parsedComment,
                    signature: codeSignature,
                    rawCode: code.split('\n')[0].trim()
                });
            }
        }
        
        return jsdocBlocks;
    }

    /**
     * Parse a JSDoc comment block
     * @param {string} comment - Raw JSDoc comment content
     * @returns {Object} Parsed comment data
     */
    parseJSDocComment(comment) {
        const lines = comment.split('\n').map(line => line.replace(/^\s*\*\s?/, '').trim());
        
        const result = {
            description: '',
            params: [],
            returns: null,
            throws: null,
            example: null,
            since: null,
            deprecated: null
        };
        
        let currentSection = 'description';
        let descriptionLines = [];
        
        for (const line of lines) {
            if (line.startsWith('@param')) {
                currentSection = 'param';
                const paramMatch = line.match(/@param\s+\{([^}]+)\}\s+(\w+)\s*-?\s*(.*)/);
                if (paramMatch) {
                    result.params.push({
                        type: paramMatch[1],
                        name: paramMatch[2],
                        description: paramMatch[3]
                    });
                }
            } else if (line.startsWith('@returns') || line.startsWith('@return')) {
                currentSection = 'returns';
                const returnMatch = line.match(/@returns?\s+\{([^}]+)\}\s*(.*)/);
                if (returnMatch) {
                    result.returns = {
                        type: returnMatch[1],
                        description: returnMatch[2]
                    };
                }
            } else if (line.startsWith('@throws')) {
                currentSection = 'throws';
                const throwsMatch = line.match(/@throws\s+\{([^}]+)\}\s*(.*)/);
                if (throwsMatch) {
                    result.throws = {
                        type: throwsMatch[1],
                        description: throwsMatch[2]
                    };
                }
            } else if (line.startsWith('@example')) {
                currentSection = 'example';
                result.example = '';
            } else if (line.startsWith('@since')) {
                result.since = line.replace('@since', '').trim();
            } else if (line.startsWith('@deprecated')) {
                result.deprecated = line.replace('@deprecated', '').trim();
            } else if (currentSection === 'description' && line) {
                descriptionLines.push(line);
            } else if (currentSection === 'example' && line) {
                result.example += (result.example ? '\n' : '') + line;
            }
        }
        
        result.description = descriptionLines.join(' ').trim();
        
        return result;
    }

    /**
     * Extract code signature from code block
     * @param {string} code - Raw code block
     * @returns {string} Cleaned code signature
     */
    extractCodeSignature(code) {
        const firstLine = code.split('\n')[0].trim();
        
        // Clean up the signature
        let signature = firstLine
            .replace(/^\s*(static\s+)?(async\s+)?/, '') // Remove static/async keywords
            .replace(/\s*{[\s\S]*$/, '') // Remove function body
            .replace(/\s*=\s*.*$/, '') // Remove assignments
            .trim();
        
        // Handle different code patterns
        if (signature.includes('class ')) {
            return signature;
        } else if (signature.includes('constructor')) {
            return signature + '()';
        } else if (!signature.includes('(') && !signature.includes('=')) {
            // Property or method without parentheses
            return signature;
        }
        
        return signature;
    }

    /**
     * Generate markdown documentation from API data
     * @param {Object} apiData - Extracted API data
     * @returns {string} Generated markdown content
     */
    generateMarkdown(apiData) {
        let markdown = `# API Documentation

This document provides comprehensive API documentation for the Job Application Autofill Chrome Extension.

Generated on: ${new Date().toISOString().split('T')[0]}

## Table of Contents

`;

        // Generate table of contents
        Object.keys(apiData).forEach(file => {
            const fileName = path.basename(file, '.js');
            markdown += `- [${fileName.charAt(0).toUpperCase() + fileName.slice(1)} API](#${fileName.toLowerCase()}-api)\n`;
        });

        markdown += '\n---\n\n';

        // Generate documentation for each file
        Object.entries(apiData).forEach(([file, blocks]) => {
            const fileName = path.basename(file, '.js');
            const fileTitle = fileName.charAt(0).toUpperCase() + fileName.slice(1);
            
            markdown += `## ${fileTitle} API\n\n`;
            markdown += `Source file: \`${file}\`\n\n`;

            if (blocks.length === 0) {
                markdown += '*No documented public methods found.*\n\n';
                return;
            }

            // Group by classes
            const classes = {};
            const functions = [];

            blocks.forEach(block => {
                if (block.signature.includes('class ')) {
                    const className = block.signature.match(/class\s+(\w+)/)?.[1];
                    if (className) {
                        classes[className] = classes[className] || [];
                        classes[className].push(block);
                    }
                } else {
                    functions.push(block);
                }
            });

            // Document classes
            Object.entries(classes).forEach(([className, classMethods]) => {
                markdown += `### ${className}\n\n`;
                
                const classDoc = classMethods.find(m => m.signature.includes('class '));
                if (classDoc && classDoc.description) {
                    markdown += `${classDoc.description}\n\n`;
                }

                classMethods.forEach(method => {
                    if (!method.signature.includes('class ')) {
                        markdown += this.generateMethodDoc(method);
                    }
                });
            });

            // Document standalone functions
            if (functions.length > 0) {
                markdown += `### Functions\n\n`;
                functions.forEach(func => {
                    markdown += this.generateMethodDoc(func);
                });
            }

            markdown += '\n---\n\n';
        });

        // Add usage examples
        markdown += this.generateUsageExamples();

        return markdown;
    }

    /**
     * Generate documentation for a single method
     * @param {Object} method - Method documentation data
     * @returns {string} Generated markdown for the method
     */
    generateMethodDoc(method) {
        let doc = `#### \`${method.signature}\`\n\n`;
        
        if (method.deprecated) {
            doc += `> **⚠️ Deprecated:** ${method.deprecated}\n\n`;
        }
        
        if (method.description) {
            doc += `${method.description}\n\n`;
        }

        if (method.params.length > 0) {
            doc += `**Parameters:**\n\n`;
            method.params.forEach(param => {
                doc += `- \`${param.name}\` (\`${param.type}\`) - ${param.description}\n`;
            });
            doc += '\n';
        }

        if (method.returns) {
            doc += `**Returns:** \`${method.returns.type}\` - ${method.returns.description}\n\n`;
        }

        if (method.throws) {
            doc += `**Throws:** \`${method.throws.type}\` - ${method.throws.description}\n\n`;
        }

        if (method.example) {
            doc += `**Example:**\n\n\`\`\`javascript\n${method.example}\n\`\`\`\n\n`;
        }

        if (method.since) {
            doc += `*Since: ${method.since}*\n\n`;
        }

        return doc;
    }

    /**
     * Generate usage examples section
     * @returns {string} Usage examples markdown
     */
    generateUsageExamples() {
        return `## Usage Examples

### Basic Storage Operations

\`\`\`javascript
// Initialize storage
const data = await StorageManager.initialize();

// Get active profile
const profile = await StorageManager.getActiveProfile();

// Save profile data
await StorageManager.saveProfile('default', {
    name: 'My Profile',
    data: {
        fullName: 'John Doe',
        email: 'john@example.com'
    }
});

// Get settings
const settings = await StorageManager.getSettings();

// Update settings
await StorageManager.saveSettings({
    autoFillEnabled: true,
    blacklistedDomains: ['example.com']
});
\`\`\`

### Password Protection

\`\`\`javascript
// Set up password protection
await StorageManager.setupPassword('mySecurePassword');

// Verify password
const isValid = await StorageManager.verifyPassword('mySecurePassword');

// Change password
const success = await StorageManager.changePassword('oldPassword', 'newPassword');

// Disable password protection
await StorageManager.disablePasswordProtection('currentPassword');
\`\`\`

### Content Script Integration

\`\`\`javascript
// The content script automatically handles autofill requests
// Send autofill message from popup or background script
chrome.tabs.sendMessage(tabId, {
    action: 'autofill',
    data: profileData
}, (response) => {
    if (response.success) {
        console.log(\`Filled \${response.result.filledCount} fields\`);
    }
});
\`\`\`

## Error Handling

All API methods include proper error handling. Always wrap calls in try-catch blocks:

\`\`\`javascript
try {
    const profile = await StorageManager.getActiveProfile();
    // Use profile data
} catch (error) {
    console.error('Failed to get profile:', error.message);
    // Handle error appropriately
}
\`\`\`

## Browser Compatibility

This API is compatible with:
- Chrome 88+
- Edge 88+
- Brave (Chromium-based versions)

## Security Considerations

- All passwords are hashed using SHA-256 with salt
- Sensitive data is stored using Chrome's secure storage API
- Input validation is performed on all user data
- XSS protection is implemented in content scripts

---

*This documentation is automatically generated from JSDoc comments in the source code.*
`;
    }

    /**
     * Write documentation to file
     * @param {string} markdown - Generated markdown content
     */
    async writeDocumentation(markdown) {
        // Ensure docs directory exists
        const docsDir = path.dirname(this.outputFile);
        if (!fs.existsSync(docsDir)) {
            fs.mkdirSync(docsDir, { recursive: true });
        }
        
        fs.writeFileSync(this.outputFile, markdown, 'utf8');
    }
}

// Run the generator if called directly
if (require.main === module) {
    const generator = new APIDocGenerator();
    generator.generateDocs().catch(error => {
        console.error('Failed to generate documentation:', error);
        process.exit(1);
    });
}

module.exports = APIDocGenerator;