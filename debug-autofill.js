/**
 * Debug Script for Autofill Extension
 * Run this in the browser console to debug field matching issues
 */

// Enable debug mode
localStorage.setItem('autofill_debug', 'true');

// Debug function to analyze form fields
function debugAutofill() {
  console.log('🔍 Starting Autofill Debug Analysis...');

  // Find all form fields
  const allFields = document.querySelectorAll('input, textarea, select');
  console.log(`📋 Found ${allFields.length} total form fields`);

  // Analyze each field
  allFields.forEach((field, index) => {
    console.log(`\n🔸 Field ${index + 1}:`);
    console.log('  Element:', field);
    console.log('  Tag:', field.tagName);
    console.log('  Type:', field.type || 'text');
    console.log('  Name:', field.name || '(none)');
    console.log('  ID:', field.id || '(none)');
    console.log('  Placeholder:', field.placeholder || '(none)');
    console.log('  Class:', field.className || '(none)');
    console.log('  Value:', field.value || '(empty)');

    // Check labels
    const labels = [];
    if (field.labels) {
      Array.from(field.labels).forEach(label => {
        labels.push(label.textContent.trim());
      });
    }

    // Check for nearby labels
    const parentLabel = field.closest('label');
    if (parentLabel) {
      labels.push(parentLabel.textContent.trim());
    }

    // Check previous siblings
    let sibling = field.previousElementSibling;
    let siblingCount = 0;
    while (sibling && siblingCount < 3) {
      if (sibling.textContent && sibling.textContent.trim()) {
        labels.push(sibling.textContent.trim());
      }
      sibling = sibling.previousElementSibling;
      siblingCount++;
    }

    console.log('  Labels:', labels.length > 0 ? labels : '(none found)');

    // Check visibility
    const isVisible = field.offsetParent !== null;
    const style = window.getComputedStyle(field);
    const isDisplayed = style.display !== 'none' && style.visibility !== 'hidden';
    console.log('  Visible:', isVisible && isDisplayed);
    console.log('  Disabled:', field.disabled);
    console.log('  ReadOnly:', field.readOnly);
  });

  console.log('\n🎯 Suggested Matches:');

  // Try to match common patterns
  const commonPatterns = {
    'Full Name': ['name', 'full-name', 'fullname', 'your-name', 'applicant-name'],
    'Email': ['email', 'e-mail', 'contact-email', 'university-email'],
    'Phone': ['phone', 'mobile', 'contact', 'telephone'],
    'LinkedIn': ['linkedin', 'linked-in', 'linkedin-profile'],
    'GitHub': ['github', 'git-hub', 'github-profile'],
    'Resume': ['resume', 'cv', 'resume-link'],
    'Portfolio': ['portfolio', 'website', 'personal-website']
  };

  Object.entries(commonPatterns).forEach(([fieldType, keywords]) => {
    console.log(`\n📌 Looking for ${fieldType} fields:`);

    allFields.forEach((field, index) => {
      const searchText = [
        field.name || '',
        field.id || '',
        field.placeholder || '',
        field.className || ''
      ].join(' ').toLowerCase();

      const matches = keywords.filter(keyword =>
        searchText.includes(keyword.toLowerCase())
      );

      if (matches.length > 0) {
        console.log(`  ✅ Field ${index + 1} matches: ${matches.join(', ')}`);
        console.log('     Element:', field);
      }
    });
  });

  console.log('\n🔧 To fix matching issues:');
  console.log('1. Check if fields have proper name/id attributes');
  console.log('2. Verify fields are visible and not disabled');
  console.log('3. Look for labels or nearby text that describes the field');
  console.log('4. Try adding custom fields in the extension popup');
  console.log('5. Enable debug mode and check console for detailed logs');
}

// Function to test autofill with sample data
function testAutofill() {
  console.log('🧪 Testing autofill with sample data...');

  const sampleData = {
    fullName: 'John Doe',
    email: 'john.doe@university.edu',
    phone: '+1 (555) 123-4567',
    linkedinUrl: 'https://linkedin.com/in/johndoe',
    githubUrl: 'https://github.com/johndoe',
    resumeUrl: 'https://drive.google.com/file/d/sample',
    portfolioUrl: 'https://johndoe.dev'
  };

  // Try to fill fields manually
  const allFields = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="url"], textarea');

  allFields.forEach((field, index) => {
    const searchText = [
      field.name || '',
      field.id || '',
      field.placeholder || ''
    ].join(' ').toLowerCase();

    let filled = false;

    // Try to match and fill
    if (searchText.includes('name') && !filled) {
      field.value = sampleData.fullName;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      console.log(`✅ Filled field ${index + 1} with name: ${sampleData.fullName}`);
      filled = true;
    }

    if (searchText.includes('email') && !filled) {
      field.value = sampleData.email;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      console.log(`✅ Filled field ${index + 1} with email: ${sampleData.email}`);
      filled = true;
    }

    if (searchText.includes('phone') && !filled) {
      field.value = sampleData.phone;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      console.log(`✅ Filled field ${index + 1} with phone: ${sampleData.phone}`);
      filled = true;
    }

    if (searchText.includes('linkedin') && !filled) {
      field.value = sampleData.linkedinUrl;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      console.log(`✅ Filled field ${index + 1} with LinkedIn: ${sampleData.linkedinUrl}`);
      filled = true;
    }

    if (searchText.includes('github') && !filled) {
      field.value = sampleData.githubUrl;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      console.log(`✅ Filled field ${index + 1} with GitHub: ${sampleData.githubUrl}`);
      filled = true;
    }
  });
}

// Function to clear all fields
function clearAllFields() {
  const allFields = document.querySelectorAll('input, textarea, select');
  allFields.forEach(field => {
    if (field.type !== 'submit' && field.type !== 'button') {
      field.value = '';
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  console.log(`🧹 Cleared ${allFields.length} fields`);
}

// Auto-run debug analysis
console.log('🚀 Autofill Debug Script Loaded!');
console.log('📝 Available functions:');
console.log('  - debugAutofill() - Analyze all form fields');
console.log('  - testAutofill() - Test filling with sample data');
console.log('  - clearAllFields() - Clear all form fields');
console.log('\n💡 Run debugAutofill() to start analysis');

// Run initial analysis
debugAutofill();
