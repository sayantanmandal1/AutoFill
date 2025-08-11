# Documentation Website

This directory contains the generated static documentation website for the Job Application Autofill Chrome Extension.

## Generated Files

- `index.html` - Homepage with feature overview
- `api.html` - Complete API reference documentation
- `smart-fields.html` - Interactive smart fields demonstrations
- `examples.html` - Usage examples and code snippets
- `installation.html` - Installation and setup guide
- `css/` - Stylesheets for the website
- `js/` - JavaScript for search and interactive features
- `assets/` - Images and icons

## Features

- **Responsive Design**: Works on desktop and mobile devices
- **Search Functionality**: Search across all documentation content
- **Interactive Demos**: Try smart field selection in the browser
- **Syntax Highlighting**: Code examples with proper highlighting
- **Cross-References**: Easy navigation between related topics

## Development

This website is automatically generated from:
- JSDoc comments in source code
- Markdown documentation files
- Template files in `docs-templates/`

To regenerate the website:
```bash
npm run docs:site
```

To serve locally for development:
```bash
npm run docs:serve
```

## Deployment

The website is automatically deployed to GitHub Pages when changes are pushed to the main branch.

Live URL: https://sayantanmandal1.github.io/job-application-autofill/

## Technology Stack

- Static HTML/CSS/JavaScript
- Prism.js for syntax highlighting
- Custom search implementation
- Responsive CSS Grid and Flexbox
- GitHub Pages for hosting