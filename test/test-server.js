/**
 * Simple test server for Playwright browser compatibility tests
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, '..', req.url === '/' ? 'test-form.html' : req.url);
  
  // Security check - prevent directory traversal
  if (!filePath.startsWith(path.join(__dirname, '..'))) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Serve test-form.html for root requests
  if (req.url === '/test-form.html' || req.url === '/') {
    const testFormContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Form for Browser Compatibility</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, select, textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        button { background: #4285f4; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #3367d6; }
    </style>
</head>
<body>
    <h1>Job Application Test Form</h1>
    <form id="jobApplicationForm">
        <div class="form-group">
            <label for="fullName">Full Name:</label>
            <input type="text" id="fullName" name="fullName" placeholder="Enter your full name">
        </div>
        
        <div class="form-group">
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" placeholder="Enter your email">
        </div>
        
        <div class="form-group">
            <label for="phone">Phone:</label>
            <input type="tel" id="phone" name="phone" placeholder="Enter your phone number">
        </div>
        
        <div class="form-group">
            <label for="address">Address:</label>
            <input type="text" id="address" name="address" placeholder="Enter your address">
        </div>
        
        <div class="form-group">
            <label for="city">City:</label>
            <input type="text" id="city" name="city" placeholder="Enter your city">
        </div>
        
        <div class="form-group">
            <label for="state">State:</label>
            <input type="text" id="state" name="state" placeholder="Enter your state">
        </div>
        
        <div class="form-group">
            <label for="zipCode">ZIP Code:</label>
            <input type="text" id="zipCode" name="zipCode" placeholder="Enter your ZIP code">
        </div>
        
        <div class="form-group">
            <label for="gender">Gender:</label>
            <select id="gender" name="gender">
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
        </div>
        
        <div class="form-group">
            <label for="campus">Campus (VIT):</label>
            <select id="campus" name="campus">
                <option value="">Select Campus</option>
                <option value="vit-ap">VIT-AP</option>
                <option value="vit-amaravathi">VIT-Amaravathi</option>
                <option value="vit-chennai">VIT-Chennai</option>
                <option value="vit-bhopal">VIT-Bhopal</option>
            </select>
        </div>
        
        <div class="form-group">
            <label for="experience">Years of Experience:</label>
            <input type="number" id="experience" name="experience" min="0" max="50" placeholder="Years of experience">
        </div>
        
        <div class="form-group">
            <label for="skills">Skills:</label>
            <textarea id="skills" name="skills" rows="4" placeholder="List your skills"></textarea>
        </div>
        
        <div class="form-group">
            <button type="submit">Submit Application</button>
            <button type="reset" style="margin-left: 10px; background: #6c757d;">Reset Form</button>
        </div>
    </form>
    
    <script>
        // Add form submission handler for testing
        document.getElementById('jobApplicationForm').addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Form submitted successfully! (Test mode)');
        });
        
        // Add keyboard shortcut listener for testing
        document.addEventListener('keydown', function(e) {
            if (e.altKey && e.shiftKey && e.key === 'F') {
                console.log('Autofill shortcut detected: Alt+Shift+F');
                // Simulate autofill
                document.getElementById('fullName').value = 'John Doe';
                document.getElementById('email').value = 'john.doe@example.com';
                document.getElementById('phone').value = '+1234567890';
            }
        });
    </script>
</body>
</html>`;
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(testFormContent);
    return;
  }

  // Try to serve the requested file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }

    // Set content type based on file extension
    const ext = path.extname(filePath);
    const contentTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml'
    };

    const contentType = contentTypes[ext] || 'text/plain';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down test server...');
  server.close(() => {
    console.log('Test server stopped');
    process.exit(0);
  });
});

export default server;