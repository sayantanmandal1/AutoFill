#!/usr/bin/env node

/**
 * Simple HTTP server for serving documentation website locally
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

class DocsServer {
    constructor(port = 3000, docsDir = 'docs-site') {
        this.port = port;
        this.docsDir = docsDir;
        this.mimeTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon'
        };
    }

    start() {
        const server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        server.listen(this.port, () => {
            console.log(`📚 Documentation server running at http://localhost:${this.port}`);
            console.log(`📁 Serving files from: ${path.resolve(this.docsDir)}`);
            console.log('🌐 Open http://localhost:' + this.port + ' in your browser');
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`❌ Port ${this.port} is already in use. Try a different port.`);
            } else {
                console.error('❌ Server error:', err.message);
            }
            process.exit(1);
        });
    }

    handleRequest(req, res) {
        const parsedUrl = url.parse(req.url);
        let pathname = parsedUrl.pathname;

        // Default to index.html for root path
        if (pathname === '/') {
            pathname = '/index.html';
        }

        const filePath = path.join(this.docsDir, pathname);
        const ext = path.extname(filePath);

        // Security check - prevent directory traversal
        if (!filePath.startsWith(path.resolve(this.docsDir))) {
            this.sendError(res, 403, 'Forbidden');
            return;
        }

        // Check if file exists
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                this.sendError(res, 404, 'File not found');
                return;
            }

            // Read and serve file
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    this.sendError(res, 500, 'Internal server error');
                    return;
                }

                const mimeType = this.mimeTypes[ext] || 'application/octet-stream';
                
                res.writeHead(200, {
                    'Content-Type': mimeType,
                    'Cache-Control': 'no-cache'
                });
                
                res.end(data);
                
                console.log(`📄 Served: ${pathname} (${mimeType})`);
            });
        });
    }

    sendError(res, statusCode, message) {
        res.writeHead(statusCode, { 'Content-Type': 'text/html' });
        res.end(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Error ${statusCode}</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    h1 { color: #e74c3c; }
                </style>
            </head>
            <body>
                <h1>Error ${statusCode}</h1>
                <p>${message}</p>
                <a href="/">← Back to Home</a>
            </body>
            </html>
        `);
    }
}

// Run server if called directly
if (require.main === module) {
    const port = process.argv[2] || 3000;
    const docsDir = process.argv[3] || 'docs-site';
    
    // Check if docs directory exists
    if (!fs.existsSync(docsDir)) {
        console.error(`❌ Documentation directory '${docsDir}' not found.`);
        console.log('💡 Run "npm run docs:site" to generate the documentation website first.');
        process.exit(1);
    }
    
    const server = new DocsServer(port, docsDir);
    server.start();
}

module.exports = DocsServer;