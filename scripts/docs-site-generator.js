#!/usr/bin/env node

/**
 * Documentation Website Generator
 * Creates a static documentation website with search and interactive examples
 */

const fs = require('fs');
const path = require('path');
const APIDocGenerator = require('./generate-api-docs');

/**
 * Main documentation website generator class
 */
class DocsWebsiteGenerator {
    constructor() {
        this.outputDir = 'docs-site';
        this.templateDir = 'docs-templates';
        this.apiGenerator = new APIDocGenerator();
        
        this.pages = [
            { name: 'index', title: 'Home', template: 'index.html' },
            { name: 'api', title: 'API Reference', template: 'api.html' },
            { name: 'smart-fields', title: 'Smart Fields', template: 'smart-fields.html' },
            { name: 'examples', title: 'Examples', template: 'examples.html' },
            { name: 'installation', title: 'Installation', template: 'installation.html' }
        ];
    }

    /**
     * Generate complete documentation website
     */
    async generateSite() {
        console.log('🚀 Starting documentation website generation...');
        
        try {
            await this.setupDirectories();
            await this.createTemplates();
            await this.generatePages();
            await this.copyAssets();
            await this.generateSearchIndex();
            
            console.log('✅ Documentation website generated successfully!');
            console.log(`🌐 Website available at: ${path.resolve(this.outputDir)}/index.html`);
        } catch (error) {
            console.error('❌ Error generating documentation website:', error.message);
            process.exit(1);
        }
    }

    /**
     * Set up output directories
     */
    async setupDirectories() {
        console.log('📁 Setting up directories...');
        
        // Create output directory
        if (fs.existsSync(this.outputDir)) {
            fs.rmSync(this.outputDir, { recursive: true });
        }
        fs.mkdirSync(this.outputDir, { recursive: true });
        
        // Create subdirectories
        ['css', 'js', 'assets', 'examples'].forEach(dir => {
            fs.mkdirSync(path.join(this.outputDir, dir), { recursive: true });
        });
    }    /**

     * Create HTML templates for the documentation site
     */
    async createTemplates() {
        console.log('📝 Creating HTML templates...');
        
        // Ensure template directory exists
        if (!fs.existsSync(this.templateDir)) {
            fs.mkdirSync(this.templateDir, { recursive: true });
        }
        
        await this.createBaseTemplate();
        await this.createIndexTemplate();
        await this.createAPITemplate();
        await this.createSmartFieldsTemplate();
        await this.createExamplesTemplate();
        await this.createInstallationTemplate();
    }

    /**
     * Create base HTML template
     */
    async createBaseTemplate() {
        const baseTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}} - Job Application Autofill Extension</title>
    <link rel="stylesheet" href="css/styles.css">
    <link rel="stylesheet" href="css/prism.css">
    <link rel="icon" type="image/png" href="assets/icon32.png">
</head>
<body>
    <nav class="navbar">
        <div class="nav-container">
            <div class="nav-brand">
                <img src="assets/icon32.png" alt="Extension Icon">
                <span>Job Application Autofill</span>
            </div>
            <ul class="nav-menu">
                <li><a href="index.html" class="nav-link">Home</a></li>
                <li><a href="api.html" class="nav-link">API</a></li>
                <li><a href="smart-fields.html" class="nav-link">Smart Fields</a></li>
                <li><a href="examples.html" class="nav-link">Examples</a></li>
                <li><a href="installation.html" class="nav-link">Installation</a></li>
            </ul>
            <div class="search-container">
                <input type="text" id="search-input" placeholder="Search documentation...">
                <div id="search-results" class="search-results"></div>
            </div>
        </div>
    </nav>
    
    <main class="main-content">
        {{content}}
    </main>
    
    <footer class="footer">
        <div class="footer-content">
            <p>&copy; 2024 Job Application Autofill Extension. Open Source MIT License.</p>
            <div class="footer-links">
                <a href="https://github.com/sayantanmandal1/job-application-autofill">GitHub</a>
                <a href="https://github.com/sayantanmandal1/job-application-autofill/issues">Issues</a>
                <a href="https://github.com/sayantanmandal1/job-application-autofill/blob/main/CONTRIBUTING.md">Contributing</a>
            </div>
        </div>
    </footer>
    
    <script src="js/prism.js"></script>
    <script src="js/search.js"></script>
    <script src="js/main.js"></script>
</body>
</html>`;
        
        fs.writeFileSync(path.join(this.templateDir, 'base.html'), baseTemplate);
    }    /*
*
     * Create index page template
     */
    async createIndexTemplate() {
        const indexContent = `<div class="hero">
    <div class="hero-content">
        <h1>Job Application Autofill Extension</h1>
        <p class="hero-subtitle">A powerful Chrome/Brave browser extension that acts as an instant autofill assistant for job applications, Google Forms, and similar online forms.</p>
        <div class="hero-buttons">
            <a href="installation.html" class="btn btn-primary">Get Started</a>
            <a href="api.html" class="btn btn-secondary">API Reference</a>
        </div>
    </div>
</div>

<div class="features">
    <div class="container">
        <h2>Key Features</h2>
        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">⚡</div>
                <h3>Instant Autofill</h3>
                <p>Fill forms with a single click or keyboard shortcut (Alt+Shift+F)</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🧠</div>
                <h3>Smart Field Detection</h3>
                <p>Advanced algorithm matches form fields using multiple strategies</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🔄</div>
                <h3>Cross-Device Sync</h3>
                <p>Data syncs across all your devices using Chrome storage</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">👤</div>
                <h3>Multiple Profiles</h3>
                <p>Create different profiles for various application types</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🎯</div>
                <h3>Smart Selection</h3>
                <p>Intelligent dropdown option selection for gender and campus fields</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🔒</div>
                <h3>Secure & Private</h3>
                <p>All data remains local with optional password protection</p>
            </div>
        </div>
    </div>
</div>

<div class="quick-start">
    <div class="container">
        <h2>Quick Start</h2>
        <div class="steps">
            <div class="step">
                <div class="step-number">1</div>
                <div class="step-content">
                    <h3>Install Extension</h3>
                    <p>Add the extension to your Chrome or Brave browser</p>
                </div>
            </div>
            <div class="step">
                <div class="step-number">2</div>
                <div class="step-content">
                    <h3>Set Up Profile</h3>
                    <p>Fill in your personal information in the popup form</p>
                </div>
            </div>
            <div class="step">
                <div class="step-number">3</div>
                <div class="step-content">
                    <h3>Start Autofilling</h3>
                    <p>Use Alt+Shift+F or click the extension icon on any form</p>
                </div>
            </div>
        </div>
    </div>
</div>`;
        
        fs.writeFileSync(path.join(this.templateDir, 'index-content.html'), indexContent);
    }    /**
 
    * Create API reference template
     */
    async createAPITemplate() {
        const apiContent = `<div class="container">
    <div class="page-header">
        <h1>API Reference</h1>
        <p>Comprehensive API documentation for the Job Application Autofill Chrome Extension.</p>
    </div>
    
    <div class="api-content">
        <div class="api-sidebar">
            <div class="sidebar-section">
                <h3>Quick Navigation</h3>
                <ul id="api-nav">
                    <!-- Generated dynamically -->
                </ul>
            </div>
            <div class="sidebar-section">
                <h3>Search API</h3>
                <input type="text" id="api-search" placeholder="Search methods...">
            </div>
        </div>
        
        <div class="api-main">
            <div id="api-documentation">
                {{api_content}}
            </div>
        </div>
    </div>
</div>`;
        
        fs.writeFileSync(path.join(this.templateDir, 'api-content.html'), apiContent);
    }

    /**
     * Create smart fields demonstration template
     */
    async createSmartFieldsTemplate() {
        const smartFieldsContent = `<div class="container">
    <div class="page-header">
        <h1>Smart Fields</h1>
        <p>Interactive demonstrations of intelligent field detection and selection.</p>
    </div>
    
    <div class="demo-section">
        <h2>Gender Field Intelligence</h2>
        <p>The extension automatically handles gender fields with smart selection logic.</p>
        
        <div class="demo-container">
            <div class="demo-form">
                <h3>Try it yourself:</h3>
                <form id="gender-demo-form">
                    <div class="form-group">
                        <label for="gender-select">Gender:</label>
                        <select id="gender-select" name="gender">
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="sex-select">Sex:</label>
                        <select id="sex-select" name="sex">
                            <option value="">Select</option>
                            <option value="M">M</option>
                            <option value="F">F</option>
                        </select>
                    </div>
                    <button type="button" id="demo-gender-fill" class="btn btn-primary">Demo Smart Fill</button>
                </form>
            </div>
            <div class="demo-explanation">
                <h4>How it works:</h4>
                <ul>
                    <li><strong>Primary Match:</strong> Looks for "Male" option first</li>
                    <li><strong>Fallback Patterns:</strong> Tries "M", "man", "boy"</li>
                    <li><strong>Detection Keywords:</strong> "gender", "sex", "gender identity"</li>
                </ul>
            </div>
        </div>
    </div>
    
    <div class="demo-section">
        <h2>Campus Field Intelligence</h2>
        <p>Specifically designed for VIT students with smart campus selection.</p>
        
        <div class="demo-container">
            <div class="demo-form">
                <h3>Try it yourself:</h3>
                <form id="campus-demo-form">
                    <div class="form-group">
                        <label for="campus-select">Campus:</label>
                        <select id="campus-select" name="campus">
                            <option value="">Select Campus</option>
                            <option value="VIT-AP">VIT-AP</option>
                            <option value="VIT Chennai">VIT Chennai</option>
                            <option value="VIT-Amaravathi">VIT-Amaravathi</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="university-select">University:</label>
                        <select id="university-select" name="university">
                            <option value="">Select University</option>
                            <option value="amaravathi">Amaravathi</option>
                            <option value="chennai">Chennai</option>
                            <option value="ap">AP</option>
                        </select>
                    </div>
                    <button type="button" id="demo-campus-fill" class="btn btn-primary">Demo Smart Fill</button>
                </form>
            </div>
            <div class="demo-explanation">
                <h4>How it works:</h4>
                <ul>
                    <li><strong>Primary Match:</strong> Looks for "VIT-AP" option first</li>
                    <li><strong>Smart Patterns:</strong> Tries "VIT-Amaravathi", "VIT AP", "amaravathi", "ap"</li>
                    <li><strong>Detection Keywords:</strong> "campus", "college", "university", "institution"</li>
                </ul>
            </div>
        </div>
    </div>
</div>`;
        
        fs.writeFileSync(path.join(this.templateDir, 'smart-fields-content.html'), smartFieldsContent);
    }    
/**
     * Create examples template
     */
    async createExamplesTemplate() {
        const examplesContent = `<div class="container">
    <div class="page-header">
        <h1>Usage Examples</h1>
        <p>Practical examples and code snippets for using the extension.</p>
    </div>
    
    <div class="examples-grid">
        <div class="example-card">
            <h3>Basic Profile Setup</h3>
            <pre><code class="language-javascript">// Set up your profile data
const profileData = {
    fullName: 'John Doe',
    email: 'john.doe@university.edu',
    phone: '+1234567890',
    gender: 'Male',
    campus: 'VIT-AP'
};

// Save profile
await StorageManager.saveProfile('default', {
    name: 'My Profile',
    data: profileData
});</code></pre>
        </div>
        
        <div class="example-card">
            <h3>Programmatic Autofill</h3>
            <pre><code class="language-javascript">// Send autofill message to content script
chrome.tabs.sendMessage(tabId, {
    action: 'autofill',
    data: profileData
}, (response) => {
    if (response.success) {
        console.log(\`Filled \${response.result.filledCount} fields\`);
    }
});</code></pre>
        </div>
        
        <div class="example-card">
            <h3>Password Protection</h3>
            <pre><code class="language-javascript">// Enable password protection
await StorageManager.setupPassword('mySecurePassword');

// Verify before accessing data
const isValid = await StorageManager.verifyPassword('mySecurePassword');
if (isValid) {
    const profile = await StorageManager.getActiveProfile();
}</code></pre>
        </div>
        
        <div class="example-card">
            <h3>Custom Field Mapping</h3>
            <pre><code class="language-javascript">// Add custom fields to your profile
const customData = {
    ...profileData,
    customFields: {
        'Student ID': 'STU123456',
        'Emergency Contact': '+0987654321',
        'Dietary Preferences': 'Vegetarian'
    }
};</code></pre>
        </div>
    </div>
    
    <div class="integration-examples">
        <h2>Integration Examples</h2>
        
        <div class="integration-card">
            <h3>Google Forms Integration</h3>
            <p>The extension automatically detects Google Forms and uses specialized selectors:</p>
            <pre><code class="language-javascript">// Google Forms detection
if (document.querySelector('[data-params*="google.com/forms"]')) {
    // Use Google Forms specific field detection
    const fields = detectGoogleFormFields();
}</code></pre>
        </div>
        
        <div class="integration-card">
            <h3>Standard HTML Forms</h3>
            <p>Works with any standard HTML form elements:</p>
            <pre><code class="language-html">&lt;form&gt;
    &lt;input type="text" name="fullName" placeholder="Full Name"&gt;
    &lt;input type="email" name="email" placeholder="Email"&gt;
    &lt;select name="gender"&gt;
        &lt;option value="Male"&gt;Male&lt;/option&gt;
        &lt;option value="Female"&gt;Female&lt;/option&gt;
    &lt;/select&gt;
&lt;/form&gt;</code></pre>
        </div>
    </div>
</div>`;
        
        fs.writeFileSync(path.join(this.templateDir, 'examples-content.html'), examplesContent);
    } 
   /**
     * Create installation template
     */
    async createInstallationTemplate() {
        const installationContent = `<div class="container">
    <div class="page-header">
        <h1>Installation Guide</h1>
        <p>Step-by-step instructions for installing and setting up the extension.</p>
    </div>
    
    <div class="installation-methods">
        <div class="method-card">
            <h2>Chrome Web Store (Recommended)</h2>
            <div class="status-badge coming-soon">Coming Soon</div>
            <p>The extension will be available on the Chrome Web Store for easy installation.</p>
            <ol>
                <li>Visit the Chrome Web Store</li>
                <li>Search for "Job Application Autofill"</li>
                <li>Click "Add to Chrome"</li>
                <li>Confirm the installation</li>
            </ol>
        </div>
        
        <div class="method-card">
            <h2>Manual Installation (Developer Mode)</h2>
            <div class="status-badge available">Available Now</div>
            <p>Install the extension directly from the source code.</p>
            <ol>
                <li>Download or clone the repository from <a href="https://github.com/sayantanmandal1/job-application-autofill">GitHub</a></li>
                <li>Open Chrome and navigate to <code>chrome://extensions/</code></li>
                <li>Enable "Developer mode" in the top right</li>
                <li>Click "Load unpacked" and select the extension folder</li>
                <li>The extension icon will appear in your browser toolbar</li>
            </ol>
        </div>
    </div>
    
    <div class="browser-support">
        <h2>Browser Compatibility</h2>
        <div class="browser-grid">
            <div class="browser-card supported">
                <div class="browser-icon">🌐</div>
                <h3>Chrome</h3>
                <p>Version 88+</p>
                <div class="support-status">✅ Fully Supported</div>
            </div>
            <div class="browser-card supported">
                <div class="browser-icon">🦁</div>
                <h3>Brave</h3>
                <p>Version 1.20+</p>
                <div class="support-status">✅ Fully Supported</div>
            </div>
            <div class="browser-card supported">
                <div class="browser-icon">🔷</div>
                <h3>Edge</h3>
                <p>Version 88+</p>
                <div class="support-status">✅ Fully Supported</div>
            </div>
        </div>
    </div>
    
    <div class="setup-guide">
        <h2>Initial Setup</h2>
        <div class="setup-steps">
            <div class="setup-step">
                <div class="step-icon">1</div>
                <div class="step-content">
                    <h3>Open Extension Popup</h3>
                    <p>Click the extension icon in your browser toolbar to open the popup interface.</p>
                </div>
            </div>
            <div class="setup-step">
                <div class="step-icon">2</div>
                <div class="step-content">
                    <h3>Fill Profile Information</h3>
                    <p>Enter your personal details like name, email, phone, and other commonly used information.</p>
                </div>
            </div>
            <div class="setup-step">
                <div class="step-icon">3</div>
                <div class="step-content">
                    <h3>Configure Settings</h3>
                    <p>Adjust settings like auto-fill behavior, password protection, and domain blacklisting.</p>
                </div>
            </div>
            <div class="setup-step">
                <div class="step-icon">4</div>
                <div class="step-content">
                    <h3>Start Using</h3>
                    <p>Navigate to any form and use Alt+Shift+F or click the extension icon to autofill.</p>
                </div>
            </div>
        </div>
    </div>
</div>`;
        
        fs.writeFileSync(path.join(this.templateDir, 'installation-content.html'), installationContent);
    }  
  /**
     * Generate all HTML pages
     */
    async generatePages() {
        console.log('📄 Generating HTML pages...');
        
        const baseTemplate = fs.readFileSync(path.join(this.templateDir, 'base.html'), 'utf8');
        
        for (const page of this.pages) {
            console.log(`  📝 Generating ${page.name}.html...`);
            
            let content = '';
            if (page.name === 'api') {
                // Generate API documentation content
                const apiData = await this.apiGenerator.extractAllJSDocComments();
                content = await this.generateAPIContent(apiData);
            } else {
                // Load content from template
                const contentFile = path.join(this.templateDir, `${page.name}-content.html`);
                if (fs.existsSync(contentFile)) {
                    content = fs.readFileSync(contentFile, 'utf8');
                }
            }
            
            const html = baseTemplate
                .replace('{{title}}', page.title)
                .replace('{{content}}', content)
                .replace('{{api_content}}', page.name === 'api' ? content : '');
            
            fs.writeFileSync(path.join(this.outputDir, `${page.name}.html`), html);
        }
    }

    /**
     * Generate API documentation content for the website
     */
    async generateAPIContent(apiData) {
        let content = '<div class="api-sections">';
        
        Object.entries(apiData).forEach(([file, blocks]) => {
            const fileName = path.basename(file, '.js');
            const fileTitle = fileName.charAt(0).toUpperCase() + fileName.slice(1);
            
            content += `<section class="api-section" id="${fileName}-api">`;
            content += `<h2>${fileTitle} API</h2>`;
            content += `<p class="api-source">Source: <code>${file}</code></p>`;
            
            if (blocks.length === 0) {
                content += '<p class="no-methods">No documented public methods found.</p>';
            } else {
                // Group by classes and functions
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
                    content += `<div class="api-class">`;
                    content += `<h3 class="class-name">${className}</h3>`;
                    
                    const classDoc = classMethods.find(m => m.signature.includes('class '));
                    if (classDoc && classDoc.description) {
                        content += `<p class="class-description">${classDoc.description}</p>`;
                    }
                    
                    content += '<div class="class-methods">';
                    classMethods.forEach(method => {
                        if (!method.signature.includes('class ')) {
                            content += this.generateMethodHTML(method);
                        }
                    });
                    content += '</div></div>';
                });
                
                // Document standalone functions
                if (functions.length > 0) {
                    content += '<div class="api-functions"><h3>Functions</h3>';
                    functions.forEach(func => {
                        content += this.generateMethodHTML(func);
                    });
                    content += '</div>';
                }
            }
            
            content += '</section>';
        });
        
        content += '</div>';
        return content;
    }    /**

     * Generate HTML for a single method
     */
    generateMethodHTML(method) {
        let html = `<div class="api-method" id="${method.signature.replace(/[^a-zA-Z0-9]/g, '-')}">`;
        html += `<h4 class="method-signature"><code>${method.signature}</code></h4>`;
        
        if (method.deprecated) {
            html += `<div class="deprecated-notice">⚠️ Deprecated: ${method.deprecated}</div>`;
        }
        
        if (method.description) {
            html += `<p class="method-description">${method.description}</p>`;
        }
        
        if (method.params.length > 0) {
            html += '<div class="method-params"><h5>Parameters:</h5><ul>';
            method.params.forEach(param => {
                html += `<li><code>${param.name}</code> (<code>${param.type}</code>) - ${param.description}</li>`;
            });
            html += '</ul></div>';
        }
        
        if (method.returns) {
            html += `<div class="method-returns"><h5>Returns:</h5><p><code>${method.returns.type}</code> - ${method.returns.description}</p></div>`;
        }
        
        if (method.throws) {
            html += `<div class="method-throws"><h5>Throws:</h5><p><code>${method.throws.type}</code> - ${method.throws.description}</p></div>`;
        }
        
        if (method.example) {
            html += `<div class="method-example"><h5>Example:</h5><pre><code class="language-javascript">${method.example}</code></pre></div>`;
        }
        
        html += '</div>';
        return html;
    }

    /**
     * Copy static assets (CSS, JS, images)
     */
    async copyAssets() {
        console.log('📦 Copying static assets...');
        
        // Create CSS
        await this.createCSS();
        
        // Create JavaScript
        await this.createJavaScript();
        
        // Copy extension icons
        const iconSizes = [16, 32, 48, 128];
        iconSizes.forEach(size => {
            const iconPath = `icons/icon${size}.png`;
            if (fs.existsSync(iconPath)) {
                fs.copyFileSync(iconPath, path.join(this.outputDir, 'assets', `icon${size}.png`));
            }
        });
        
        // Copy Prism.js for syntax highlighting
        await this.copyPrismAssets();
    }    /**

     * Create CSS styles for the documentation site
     */
    async createCSS() {
        const extendedStyles = require('./docs-styles-extended');
        const css = `/* Documentation Website Styles */
:root {
    --primary-color: #2563eb;
    --secondary-color: #64748b;
    --success-color: #10b981;
    --warning-color: #f59e0b;
    --error-color: #ef4444;
    --background-color: #ffffff;
    --surface-color: #f8fafc;
    --text-color: #1e293b;
    --text-muted: #64748b;
    --border-color: #e2e8f0;
    --code-background: #f1f5f9;
    --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: var(--text-color);
    background-color: var(--background-color);
}

/* Navigation */
.navbar {
    background: var(--background-color);
    border-bottom: 1px solid var(--border-color);
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: var(--shadow);
}

.nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
}

.nav-brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    font-size: 1.125rem;
}

.nav-brand img {
    width: 32px;
    height: 32px;
}

.nav-menu {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-link {
    text-decoration: none;
    color: var(--text-color);
    font-weight: 500;
    transition: color 0.2s;
}

.nav-link:hover {
    color: var(--primary-color);
}

/* Search */
.search-container {
    position: relative;
}

#search-input {
    padding: 0.5rem 1rem;
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    width: 250px;
    font-size: 0.875rem;
}

.search-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--background-color);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    box-shadow: var(--shadow);
    max-height: 300px;
    overflow-y: auto;
    display: none;
    z-index: 200;
}

/* Main Content */
.main-content {
    min-height: calc(100vh - 64px - 80px);
    padding: 2rem 0;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
}

/* Hero Section */
.hero {
    background: linear-gradient(135deg, var(--primary-color), #3b82f6);
    color: white;
    padding: 4rem 0;
    text-align: center;
}

.hero-content h1 {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 1rem;
}

.hero-subtitle {
    font-size: 1.25rem;
    margin-bottom: 2rem;
    opacity: 0.9;
}

.hero-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
}

/* Buttons */
.btn {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s;
    border: none;
    cursor: pointer;
}

.btn-primary {
    background: var(--background-color);
    color: var(--primary-color);
}

.btn-secondary {
    background: transparent;
    color: white;
    border: 1px solid white;
}

.btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Features Grid */
.features {
    padding: 4rem 0;
    background: var(--surface-color);
}

.features h2 {
    text-align: center;
    margin-bottom: 3rem;
    font-size: 2.5rem;
}

.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

.feature-card {
    background: var(--background-color);
    padding: 2rem;
    border-radius: 0.75rem;
    box-shadow: var(--shadow);
    text-align: center;
}

.feature-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.feature-card h3 {
    margin-bottom: 1rem;
    color: var(--primary-color);
}

/* Code Blocks */
pre {
    background: var(--code-background);
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    margin: 1rem 0;
}

code {
    background: var(--code-background);
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.875rem;
}

pre code {
    background: none;
    padding: 0;
}

/* Footer */
.footer {
    background: var(--text-color);
    color: white;
    padding: 2rem 0;
    text-align: center;
}

.footer-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
}

.footer-links {
    margin-top: 1rem;
    display: flex;
    gap: 2rem;
    justify-content: center;
}

.footer-links a {
    color: white;
    text-decoration: none;
}

.footer-links a:hover {
    text-decoration: underline;
}

/* Responsive Design */
@media (max-width: 768px) {
    .nav-container {
        flex-direction: column;
        height: auto;
        padding: 1rem;
    }
    
    .nav-menu {
        margin: 1rem 0;
    }
    
    .search-container {
        width: 100%;
    }
    
    #search-input {
        width: 100%;
    }
    
    .hero-content h1 {
        font-size: 2rem;
    }
    
    .hero-buttons {
        flex-direction: column;
        align-items: center;
    }
}

${extendedStyles}`;
        
        fs.writeFileSync(path.join(this.outputDir, 'css', 'styles.css'), css);
    }   
 /**
     * Create JavaScript for the documentation site
     */
    async createJavaScript() {
        // Main JavaScript
        const mainJS = `// Documentation Website JavaScript

// Search functionality
class DocumentationSearch {
    constructor() {
        this.searchInput = document.getElementById('search-input');
        this.searchResults = document.querySelector('.search-results');
        this.searchIndex = [];
        
        this.init();
    }
    
    async init() {
        if (this.searchInput) {
            await this.buildSearchIndex();
            this.setupEventListeners();
        }
    }
    
    async buildSearchIndex() {
        // Build search index from page content
        const content = document.body.textContent;
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        
        headings.forEach(heading => {
            this.searchIndex.push({
                title: heading.textContent,
                url: '#' + (heading.id || ''),
                type: 'heading',
                content: heading.textContent
            });
        });
        
        // Add API methods to search index
        const methods = Array.from(document.querySelectorAll('.api-method'));
        methods.forEach(method => {
            const signature = method.querySelector('.method-signature');
            if (signature) {
                this.searchIndex.push({
                    title: signature.textContent,
                    url: '#' + method.id,
                    type: 'method',
                    content: method.textContent
                });
            }
        });
    }
    
    setupEventListeners() {
        this.searchInput.addEventListener('input', (e) => {
            this.performSearch(e.target.value);
        });
        
        this.searchInput.addEventListener('focus', () => {
            if (this.searchInput.value) {
                this.showResults();
            }
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.hideResults();
            }
        });
    }
    
    performSearch(query) {
        if (!query.trim()) {
            this.hideResults();
            return;
        }
        
        const results = this.searchIndex.filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.content.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 10);
        
        this.displayResults(results);
    }
    
    displayResults(results) {
        if (results.length === 0) {
            this.searchResults.innerHTML = '<div class="search-no-results">No results found</div>';
        } else {
            this.searchResults.innerHTML = results.map(result => 
                \`<div class="search-result-item">
                    <a href="\${result.url}" class="search-result-link">
                        <div class="search-result-title">\${result.title}</div>
                        <div class="search-result-type">\${result.type}</div>
                    </a>
                </div>\`
            ).join('');
        }
        
        this.showResults();
    }
    
    showResults() {
        this.searchResults.style.display = 'block';
    }
    
    hideResults() {
        this.searchResults.style.display = 'none';
    }
}

// Smart Fields Demo
class SmartFieldsDemo {
    constructor() {
        this.init();
    }
    
    init() {
        const genderButton = document.getElementById('demo-gender-fill');
        const campusButton = document.getElementById('demo-campus-fill');
        
        if (genderButton) {
            genderButton.addEventListener('click', () => this.demoGenderFill());
        }
        
        if (campusButton) {
            campusButton.addEventListener('click', () => this.demoCampusFill());
        }
    }
    
    demoGenderFill() {
        const genderSelect = document.getElementById('gender-select');
        const sexSelect = document.getElementById('sex-select');
        
        // Simulate smart gender selection
        if (genderSelect) {
            genderSelect.value = 'Male';
            this.highlightField(genderSelect);
        }
        
        if (sexSelect) {
            sexSelect.value = 'M';
            this.highlightField(sexSelect);
        }
        
        this.showToast('Gender fields filled using smart selection!', 'success');
    }
    
    demoCampusFill() {
        const campusSelect = document.getElementById('campus-select');
        const universitySelect = document.getElementById('university-select');
        
        // Simulate smart campus selection
        if (campusSelect) {
            campusSelect.value = 'VIT-AP';
            this.highlightField(campusSelect);
        }
        
        if (universitySelect) {
            universitySelect.value = 'amaravathi';
            this.highlightField(universitySelect);
        }
        
        this.showToast('Campus fields filled using smart selection!', 'success');
    }
    
    highlightField(field) {
        field.style.background = '#dcfce7';
        field.style.borderColor = '#10b981';
        
        setTimeout(() => {
            field.style.background = '';
            field.style.borderColor = '';
        }, 2000);
    }
    
    showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = \`toast toast-\${type}\`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('toast-show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('toast-show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DocumentationSearch();
    new SmartFieldsDemo();
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});`;
        
        fs.writeFileSync(path.join(this.outputDir, 'js', 'main.js'), mainJS);
        
        // Search-specific JavaScript
        const searchJS = `// Advanced search functionality
// This file is loaded by main.js and provides additional search features`;
        
        fs.writeFileSync(path.join(this.outputDir, 'js', 'search.js'), searchJS);
    } 
   /**
     * Copy Prism.js assets for syntax highlighting
     */
    async copyPrismAssets() {
        // Create minimal Prism CSS
        const prismCSS = `/* Prism.js Syntax Highlighting */
code[class*="language-"],
pre[class*="language-"] {
    color: #393A34;
    font-family: "Consolas", "Bitstream Vera Sans Mono", "Courier New", Courier, monospace;
    direction: ltr;
    text-align: left;
    white-space: pre;
    word-spacing: normal;
    word-break: normal;
    font-size: .9em;
    line-height: 1.2em;
    -moz-tab-size: 4;
    -o-tab-size: 4;
    tab-size: 4;
    -webkit-hyphens: none;
    -moz-hyphens: none;
    -ms-hyphens: none;
    hyphens: none;
}

pre > code[class*="language-"] {
    font-size: 1em;
}

pre[class*="language-"]::-moz-selection,
pre[class*="language-"] ::-moz-selection,
code[class*="language-"]::-moz-selection,
code[class*="language-"] ::-moz-selection {
    background: #b3d4fc;
}

pre[class*="language-"]::selection,
pre[class*="language-"] ::selection,
code[class*="language-"]::selection,
code[class*="language-"] ::selection {
    background: #b3d4fc;
}

/* Code blocks */
pre[class*="language-"] {
    padding: 1em;
    margin: .5em 0;
    overflow: auto;
    border: 1px solid #dddddd;
    background-color: #f8f8f8;
}

/* Inline code */
:not(pre) > code[class*="language-"] {
    padding: .2em;
    padding-top: 1px;
    padding-bottom: 1px;
    background: #f8f8f8;
    border: 1px solid #dddddd;
}

.token.comment,
.token.prolog,
.token.doctype,
.token.cdata {
    color: #999988;
    font-style: italic;
}

.token.namespace {
    opacity: .7;
}

.token.string,
.token.attr-value {
    color: #e3116c;
}

.token.punctuation,
.token.operator {
    color: #393A34;
}

.token.entity,
.token.url,
.token.symbol,
.token.number,
.token.boolean,
.token.variable,
.token.constant,
.token.property,
.token.regex,
.token.inserted {
    color: #36acaa;
}

.token.atrule,
.token.keyword,
.token.attr-name,
.language-autohotkey .token.selector {
    color: #00a4db;
}

.token.function,
.token.deleted,
.language-autohotkey .token.tag {
    color: #9a050f;
}

.token.tag,
.token.selector,
.language-autohotkey .token.keyword {
    color: #00009f;
}`;
        
        fs.writeFileSync(path.join(this.outputDir, 'css', 'prism.css'), prismCSS);
        
        // Create minimal Prism JS
        const prismJS = `/* Prism.js - Minimal syntax highlighting */
(function() {
    if (typeof self === 'undefined' || !self.Prism || !self.document) {
        return;
    }
    
    Prism.highlightAll = function() {
        var elements = document.querySelectorAll('code[class*="language-"], pre[class*="language-"]');
        for (var i = 0; i < elements.length; i++) {
            Prism.highlightElement(elements[i]);
        }
    };
    
    Prism.highlightElement = function(element) {
        // Basic syntax highlighting for JavaScript
        var code = element.textContent;
        
        // Simple token replacement for demo purposes
        code = code.replace(/(function|const|let|var|if|else|for|while|return|class|async|await)/g, '<span class="token keyword">$1</span>');
        code = code.replace(/('.*?'|".*?")/g, '<span class="token string">$1</span>');
        code = code.replace(/(\/\/.*$)/gm, '<span class="token comment">$1</span>');
        code = code.replace(/(\d+)/g, '<span class="token number">$1</span>');
        
        element.innerHTML = code;
    };
    
    // Auto-highlight on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', Prism.highlightAll);
    } else {
        Prism.highlightAll();
    }
})();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Prism;
}`;
        
        fs.writeFileSync(path.join(this.outputDir, 'js', 'prism.js'), prismJS);
    }

    /**
     * Generate search index for the documentation
     */
    async generateSearchIndex() {
        console.log('🔍 Generating search index...');
        
        const searchIndex = {
            pages: [],
            methods: [],
            content: []
        };
        
        // Index pages
        this.pages.forEach(page => {
            searchIndex.pages.push({
                title: page.title,
                url: `${page.name}.html`,
                description: `${page.title} documentation page`
            });
        });
        
        // Index API methods
        const apiData = await this.apiGenerator.extractAllJSDocComments();
        Object.entries(apiData).forEach(([file, blocks]) => {
            blocks.forEach(block => {
                if (block.signature && block.description) {
                    searchIndex.methods.push({
                        title: block.signature,
                        description: block.description,
                        file: file,
                        url: `api.html#${block.signature.replace(/[^a-zA-Z0-9]/g, '-')}`
                    });
                }
            });
        });
        
        // Save search index
        fs.writeFileSync(
            path.join(this.outputDir, 'js', 'search-index.json'),
            JSON.stringify(searchIndex, null, 2)
        );
    }
}

// Run the generator if called directly
if (require.main === module) {
    const generator = new DocsWebsiteGenerator();
    generator.generateSite().catch(error => {
        console.error('Failed to generate documentation website:', error);
        process.exit(1);
    });
}

module.exports = DocsWebsiteGenerator;