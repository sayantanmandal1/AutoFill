/**
 * Extended CSS styles for documentation website
 * This file contains additional styles that are appended to the main CSS
 */

const extendedStyles = `
/* API Documentation Styles */
.api-content {
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: 2rem;
    margin-top: 2rem;
}

.api-sidebar {
    background: var(--surface-color);
    padding: 1.5rem;
    border-radius: 0.75rem;
    height: fit-content;
    position: sticky;
    top: 80px;
}

.sidebar-section {
    margin-bottom: 2rem;
}

.sidebar-section h3 {
    margin-bottom: 1rem;
    color: var(--primary-color);
    font-size: 1rem;
}

.sidebar-section ul {
    list-style: none;
}

.sidebar-section li {
    margin-bottom: 0.5rem;
}

.sidebar-section a {
    color: var(--text-muted);
    text-decoration: none;
    font-size: 0.875rem;
    transition: color 0.2s;
}

.sidebar-section a:hover {
    color: var(--primary-color);
}

#api-search {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 0.375rem;
    font-size: 0.875rem;
}

.api-main {
    min-width: 0;
}

.api-section {
    margin-bottom: 3rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--border-color);
}

.api-section:last-child {
    border-bottom: none;
}

.api-section h2 {
    color: var(--primary-color);
    margin-bottom: 1rem;
}

.api-source {
    color: var(--text-muted);
    font-size: 0.875rem;
    margin-bottom: 2rem;
}

.no-methods {
    color: var(--text-muted);
    font-style: italic;
}

.api-class {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: var(--surface-color);
    border-radius: 0.75rem;
}

.class-name {
    color: var(--primary-color);
    margin-bottom: 0.5rem;
}

.class-description {
    color: var(--text-muted);
    margin-bottom: 1.5rem;
}

.api-method {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: var(--background-color);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
}

.method-signature {
    background: var(--code-background);
    padding: 0.75rem;
    border-radius: 0.375rem;
    margin-bottom: 1rem;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.875rem;
    color: var(--primary-color);
}

.method-description {
    margin-bottom: 1rem;
    line-height: 1.6;
}

.method-params,
.method-returns,
.method-throws,
.method-example {
    margin-bottom: 1rem;
}

.method-params h5,
.method-returns h5,
.method-throws h5,
.method-example h5 {
    color: var(--text-color);
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
}

.method-params ul {
    margin-left: 1rem;
}

.method-params li {
    margin-bottom: 0.25rem;
}

.deprecated-notice {
    background: #fef3c7;
    color: #92400e;
    padding: 0.75rem;
    border-radius: 0.375rem;
    margin-bottom: 1rem;
    border-left: 4px solid var(--warning-color);
}

/* Smart Fields Demo Styles */
.demo-section {
    margin-bottom: 3rem;
    padding: 2rem;
    background: var(--surface-color);
    border-radius: 0.75rem;
}

.demo-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-top: 1.5rem;
}

.demo-form {
    background: var(--background-color);
    padding: 1.5rem;
    border-radius: 0.5rem;
    border: 1px solid var(--border-color);
}

.demo-form h3 {
    margin-bottom: 1rem;
    color: var(--primary-color);
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--text-color);
}

.form-group select,
.form-group input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 0.375rem;
    font-size: 1rem;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group select:focus,
.form-group input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.demo-explanation {
    background: var(--background-color);
    padding: 1.5rem;
    border-radius: 0.5rem;
    border: 1px solid var(--border-color);
}

.demo-explanation h4 {
    margin-bottom: 1rem;
    color: var(--primary-color);
}

.demo-explanation ul {
    margin-left: 1rem;
}

.demo-explanation li {
    margin-bottom: 0.5rem;
    line-height: 1.5;
}

/* Examples Page Styles */
.examples-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
}

.example-card {
    background: var(--surface-color);
    padding: 1.5rem;
    border-radius: 0.75rem;
    border: 1px solid var(--border-color);
}

.example-card h3 {
    margin-bottom: 1rem;
    color: var(--primary-color);
}

.integration-examples {
    margin-top: 3rem;
}

.integration-card {
    background: var(--surface-color);
    padding: 2rem;
    border-radius: 0.75rem;
    margin-bottom: 2rem;
    border-left: 4px solid var(--primary-color);
}

.integration-card h3 {
    margin-bottom: 1rem;
    color: var(--primary-color);
}

/* Installation Page Styles */
.installation-methods {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
}

.method-card {
    background: var(--surface-color);
    padding: 2rem;
    border-radius: 0.75rem;
    border: 1px solid var(--border-color);
    position: relative;
}

.method-card h2 {
    margin-bottom: 1rem;
    color: var(--primary-color);
}

.status-badge {
    position: absolute;
    top: 1rem;
    right: 1rem;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
}

.status-badge.coming-soon {
    background: #fef3c7;
    color: #92400e;
}

.status-badge.available {
    background: #dcfce7;
    color: #166534;
}

.browser-support {
    margin-bottom: 3rem;
}

.browser-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
}

.browser-card {
    background: var(--surface-color);
    padding: 1.5rem;
    border-radius: 0.75rem;
    text-align: center;
    border: 1px solid var(--border-color);
}

.browser-card.supported {
    border-color: var(--success-color);
}

.browser-icon {
    font-size: 2rem;
    margin-bottom: 1rem;
}

.browser-card h3 {
    margin-bottom: 0.5rem;
    color: var(--primary-color);
}

.support-status {
    margin-top: 1rem;
    padding: 0.5rem;
    background: #dcfce7;
    color: #166534;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
}

.setup-guide {
    background: var(--surface-color);
    padding: 2rem;
    border-radius: 0.75rem;
}

.setup-steps {
    display: grid;
    gap: 1.5rem;
    margin-top: 2rem;
}

.setup-step {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
}

.step-icon {
    width: 2.5rem;
    height: 2.5rem;
    background: var(--primary-color);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    flex-shrink: 0;
}

.step-content h3 {
    margin-bottom: 0.5rem;
    color: var(--primary-color);
}

/* Toast Notifications */
.toast {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    border-radius: 0.5rem;
    color: white;
    font-weight: 500;
    z-index: 1000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
}

.toast-show {
    transform: translateX(0);
}

.toast-success {
    background: var(--success-color);
}

.toast-error {
    background: var(--error-color);
}

.toast-warning {
    background: var(--warning-color);
}

/* Search Results */
.search-result-item {
    padding: 0.75rem;
    border-bottom: 1px solid var(--border-color);
}

.search-result-item:last-child {
    border-bottom: none;
}

.search-result-link {
    text-decoration: none;
    color: inherit;
    display: block;
}

.search-result-link:hover {
    background: var(--surface-color);
}

.search-result-title {
    font-weight: 500;
    margin-bottom: 0.25rem;
}

.search-result-type {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
}

.search-no-results {
    padding: 1rem;
    text-align: center;
    color: var(--text-muted);
    font-style: italic;
}

/* Quick Start Steps */
.quick-start {
    padding: 4rem 0;
}

.steps {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
}

.step {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
}

.step-number {
    width: 2.5rem;
    height: 2.5rem;
    background: var(--primary-color);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    flex-shrink: 0;
}

.step-content h3 {
    margin-bottom: 0.5rem;
    color: var(--primary-color);
}

/* Page Header */
.page-header {
    text-align: center;
    margin-bottom: 3rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--border-color);
}

.page-header h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: var(--primary-color);
}

.page-header p {
    font-size: 1.125rem;
    color: var(--text-muted);
}

/* Responsive Design for Extended Styles */
@media (max-width: 1024px) {
    .api-content {
        grid-template-columns: 1fr;
    }
    
    .api-sidebar {
        position: static;
        order: 2;
    }
    
    .demo-container {
        grid-template-columns: 1fr;
    }
    
    .installation-methods {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .examples-grid {
        grid-template-columns: 1fr;
    }
    
    .browser-grid {
        grid-template-columns: 1fr;
    }
    
    .steps {
        grid-template-columns: 1fr;
    }
    
    .page-header h1 {
        font-size: 2rem;
    }
}
`;

module.exports = extendedStyles;