/**
 * Google Forms Debug Script
 * Run this in console on a Google Form to debug autofill issues
 */

console.log('🔍 Google Forms Autofill Debug Script');
console.log('=====================================');

// Check if we're on a Google Form
const isGoogleForm = window.location.hostname === 'docs.google.com' &&
                     window.location.pathname.includes('/forms/');

console.log('📍 Location:', window.location.href);
console.log('📋 Is Google Form:', isGoogleForm);

if (isGoogleForm) {
  console.log('\n🎯 Analyzing Google Form structure...');

  // Find all input fields
  const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="url"], textarea');
  console.log(`📝 Found ${inputs.length} input fields`);

  inputs.forEach((input, index) => {
    console.log(`\n🔸 Field ${index + 1}:`);
    console.log('  Element:', input);
    console.log('  Type:', input.type);
    console.log('  Name:', input.name || '(none)');
    console.log('  ID:', input.id || '(none)');
    console.log('  Placeholder:', input.placeholder || '(none)');
    console.log('  JSNAME:', input.getAttribute('jsname') || '(none)');
    console.log('  Aria-label:', input.getAttribute('aria-label') || '(none)');
    console.log('  Data-initial-value:', input.getAttribute('data-initial-value') || '(none)');

    // Find the question container
    const questionContainer = input.closest('[role="listitem"], .freebirdFormviewerViewItemsItemItem');
    if (questionContainer) {
      console.log('  📦 Question container found');

      // Look for question text
      const questionText = questionContainer.querySelector('[role="heading"], .freebirdFormviewerViewItemsItemItemTitle');
      if (questionText) {
        console.log('  📋 Question text:', questionText.textContent.trim());
      }

      // Look for description
      const description = questionContainer.querySelector('.freebirdFormviewerViewItemsItemItemHelpText');
      if (description) {
        console.log('  📄 Description:', description.textContent.trim());
      }
    } else {
      console.log('  ❌ No question container found');
    }

    // Check visibility
    const rect = input.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.height > 0;
    console.log('  👁️ Visible:', isVisible);
    console.log('  🚫 Disabled:', input.disabled);
    console.log('  🔒 ReadOnly:', input.readOnly);
  });

  console.log('\n🧪 Testing field filling...');

  // Test filling the first text field
  const firstTextField = document.querySelector('input[type="text"]');
  if (firstTextField) {
    console.log('🎯 Testing fill on first text field...');

    const testValue = 'Test Autofill Value';

    try {
      firstTextField.focus();
      firstTextField.value = testValue;

      // Trigger events
      firstTextField.dispatchEvent(new Event('input', { bubbles: true }));
      firstTextField.dispatchEvent(new Event('change', { bubbles: true }));
      firstTextField.dispatchEvent(new Event('blur', { bubbles: true }));

      setTimeout(() => {
        if (firstTextField.value === testValue) {
          console.log('✅ Test fill successful!');
        } else {
          console.log('❌ Test fill failed - value not retained');
          console.log('   Expected:', testValue);
          console.log('   Actual:', firstTextField.value);
        }
      }, 500);

    } catch (error) {
      console.log('❌ Test fill error:', error);
    }
  }

} else {
  console.log('\n📝 Analyzing standard form...');

  const inputs = document.querySelectorAll('input, textarea, select');
  console.log(`📝 Found ${inputs.length} form elements`);

  inputs.forEach((input, index) => {
    if (input.type !== 'submit' && input.type !== 'button') {
      console.log(`\n🔸 Field ${index + 1}:`);
      console.log('  Element:', input);
      console.log('  Tag:', input.tagName);
      console.log('  Type:', input.type || 'text');
      console.log('  Name:', input.name || '(none)');
      console.log('  ID:', input.id || '(none)');
      console.log('  Placeholder:', input.placeholder || '(none)');
      console.log('  Class:', input.className || '(none)');

      // Find labels
      const labels = [];
      if (input.labels) {
        Array.from(input.labels).forEach(label => {
          labels.push(label.textContent.trim());
        });
      }

      const parentLabel = input.closest('label');
      if (parentLabel) {
        labels.push(parentLabel.textContent.trim());
      }

      console.log('  🏷️ Labels:', labels.length > 0 ? labels : '(none)');
    }
  });
}

console.log('\n💡 Tips for Google Forms:');
console.log('1. Make sure your extension is loaded and data is saved');
console.log('2. Google Forms use special event handling - check if events are triggered');
console.log('3. Look for jsname attributes and role="listitem" containers');
console.log('4. Question text is usually in elements with role="heading"');
console.log('5. Try the test form (google-forms-test.html) first to verify basic functionality');

console.log('\n🔧 Quick test commands:');
console.log('- testFillFirstField() - Test filling the first text field');
console.log('- clearAllFields() - Clear all form fields');
console.log('- showAllFieldInfo() - Show detailed info for all fields');

// Helper functions
window.testFillFirstField = function() {
  const field = document.querySelector('input[type="text"], textarea');
  if (field) {
    field.focus();
    field.value = 'Test Value ' + Date.now();
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('✅ Filled first field with test value');
  } else {
    console.log('❌ No text field found');
  }
};

window.clearAllFields = function() {
  const fields = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="url"], textarea');
  fields.forEach(field => {
    field.value = '';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
  });
  console.log(`🧹 Cleared ${fields.length} fields`);
};

window.showAllFieldInfo = function() {
  const fields = document.querySelectorAll('input, textarea');
  fields.forEach((field, i) => {
    console.log(`Field ${i + 1}:`, {
      element: field,
      type: field.type,
      name: field.name,
      id: field.id,
      value: field.value,
      placeholder: field.placeholder,
      jsname: field.getAttribute('jsname'),
      ariaLabel: field.getAttribute('aria-label')
    });
  });
};
