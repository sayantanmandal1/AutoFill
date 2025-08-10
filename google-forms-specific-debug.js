/**
 * Google Forms Specific Debug Script
 * Run this on the actual Google Form to see what's happening
 */

console.log('🔍 Google Forms Specific Debug for Autofill');
console.log('===========================================');

// Enable debug mode
localStorage.setItem('autofill_debug', 'true');

// Check current form
console.log('📍 Current URL:', window.location.href);

// Find all input fields
const allInputs = document.querySelectorAll('input, textarea, div[role="textbox"]');
console.log(`📝 Found ${allInputs.length} total input elements`);

// Filter fillable fields
const fillableInputs = Array.from(allInputs).filter(input => {
    if (input.disabled || input.readOnly) return false;
    if (input.type === 'hidden' || input.type === 'submit' || input.type === 'button') return false;
    
    const rect = input.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    
    const style = window.getComputedStyle(input);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    
    return true;
});

console.log(`✅ Found ${fillableInputs.length} fillable fields`);

// Analyze each field
fillableInputs.forEach((field, index) => {
    console.log(`\n🔸 Field ${index + 1}:`);
    console.log('  Element:', field);
    console.log('  Type:', field.type || 'text');
    console.log('  Tag:', field.tagName);
    console.log('  Name:', field.name || '(none)');
    console.log('  ID:', field.id || '(none)');
    console.log('  Placeholder:', field.placeholder || '(none)');
    console.log('  Class:', field.className || '(none)');
    console.log('  JSNAME:', field.getAttribute('jsname') || '(none)');
    console.log('  Aria-label:', field.getAttribute('aria-label') || '(none)');
    console.log('  Data-params:', field.getAttribute('data-params') || '(none)');
    
    // Find question container and text
    const questionContainer = field.closest('[role="listitem"], .freebirdFormviewerViewItemsItemItem, [data-params]');
    if (questionContainer) {
        console.log('  📦 Question container found');
        
        // Look for question text in various ways
        const questionSelectors = [
            '[role="heading"]',
            '.freebirdFormviewerViewItemsItemItemTitle',
            '.Xb9hP', // Common Google Forms class
            '.M7eMe', // Another common class
            'span[jsslot]',
            'div[jsname] span'
        ];
        
        let questionText = '';
        for (const selector of questionSelectors) {
            const element = questionContainer.querySelector(selector);
            if (element && element.textContent.trim()) {
                questionText = element.textContent.trim();
                console.log(`  📋 Question text (${selector}):`, questionText);
                break;
            }
        }
        
        if (!questionText) {
            // Try to find any text in the container
            const allText = questionContainer.textContent.trim();
            if (allText && allText.length < 200) {
                questionText = allText;
                console.log('  📋 Container text:', questionText);
            }
        }
        
        // Create search text like the extension does
        const searchText = [
            field.name || '',
            field.id || '',
            field.placeholder || '',
            field.getAttribute('aria-label') || '',
            questionText || ''
        ].join(' ').toLowerCase().trim();
        
        console.log('  🔍 Search text:', `"${searchText}"`);
        
        // Test matching against common patterns
        const patterns = {
            fullName: ['name', 'full name', 'your name', 'applicant name', 'candidate name', 'first name', 'last name'],
            email: ['email', 'e-mail', 'email address', 'contact email', 'university email', 'college email'],
            phone: ['phone', 'mobile', 'telephone', 'contact number', 'phone number', 'mobile number'],
            studentNumber: ['student', 'registration', 'id number', 'student id', 'enrollment', 'roll number'],
            linkedinUrl: ['linkedin', 'linked in', 'linkedin profile', 'linkedin url', 'professional profile'],
            githubUrl: ['github', 'git hub', 'github profile', 'github url', 'repository', 'code profile'],
            leetcodeUrl: ['leetcode', 'leet code', 'coding profile', 'algorithm profile', 'competitive programming'],
            resumeUrl: ['resume', 'cv', 'curriculum vitae', 'resume link', 'cv link', 'document'],
            portfolioUrl: ['portfolio', 'website', 'personal website', 'portfolio website', 'work samples']
        };
        
        let bestMatch = null;
        let bestScore = 0;
        
        Object.entries(patterns).forEach(([dataKey, keywords]) => {
            let score = 0;
            const matchedKeywords = [];
            
            keywords.forEach(keyword => {
                if (searchText.includes(keyword.toLowerCase())) {
                    score += keyword.length;
                    matchedKeywords.push(keyword);
                }
            });
            
            if (score > bestScore) {
                bestScore = score;
                bestMatch = {
                    dataKey: dataKey,
                    score: score,
                    confidence: Math.min(score / 10, 1.0),
                    matchedKeywords: matchedKeywords
                };
            }
        });
        
        if (bestMatch && bestMatch.confidence > 0.1) {
            console.log(`  ✅ MATCH: ${bestMatch.dataKey} (confidence: ${bestMatch.confidence.toFixed(2)}, keywords: ${bestMatch.matchedKeywords.join(', ')})`);
        } else {
            console.log('  ❌ NO MATCH FOUND');
            console.log('  💡 Suggestion: Add custom field with key matching the search text');
        }
        
    } else {
        console.log('  ❌ No question container found');
    }
});

// Test filling the first field
console.log('\n🧪 Testing field filling...');
const firstField = fillableInputs[0];
if (firstField) {
    console.log('Testing fill on first field...');
    
    const originalValue = firstField.value;
    const testValue = 'TEST_AUTOFILL_' + Date.now();
    
    try {
        firstField.focus();
        firstField.value = testValue;
        
        // Trigger events
        firstField.dispatchEvent(new Event('input', { bubbles: true }));
        firstField.dispatchEvent(new Event('change', { bubbles: true }));
        firstField.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
        firstField.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
        firstField.dispatchEvent(new Event('blur', { bubbles: true }));
        
        setTimeout(() => {
            if (firstField.value === testValue) {
                console.log('✅ Field filling test SUCCESSFUL');
                // Restore original value
                firstField.value = originalValue;
                firstField.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                console.log('❌ Field filling test FAILED');
                console.log('  Expected:', testValue);
                console.log('  Actual:', firstField.value);
            }
        }, 500);
        
    } catch (error) {
        console.log('❌ Field filling test ERROR:', error);
    }
}

// Check what data is saved in the extension
console.log('\n💾 Checking saved extension data...');
if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.get(null, (data) => {
        console.log('📦 Extension data:', data);
        
        if (data.profiles && data.profiles.default) {
            console.log('👤 Default profile data:', data.profiles.default.data);
            
            // Check which fields have data
            const profileData = data.profiles.default.data;
            Object.entries(profileData).forEach(([key, value]) => {
                if (value && value.trim && value.trim()) {
                    console.log(`  ✅ ${key}: "${value}"`);
                } else {
                    console.log(`  ❌ ${key}: (empty)`);
                }
            });
            
            if (profileData.customFields) {
                console.log('🔧 Custom fields:', profileData.customFields);
            }
        } else {
            console.log('❌ No profile data found - make sure to save your data in the extension popup first!');
        }
    });
} else {
    console.log('❌ Chrome storage not available');
}

console.log('\n💡 Debugging Tips:');
console.log('1. Make sure you have saved data in the extension popup');
console.log('2. Look at the "Search text" for each field - this is what the extension uses for matching');
console.log('3. If no matches found, add custom fields in the extension popup');
console.log('4. For custom fields, use the exact search text as the key');
console.log('5. Try simpler keywords if complex ones don\'t work');

// Helper function to add custom field suggestions
window.suggestCustomFields = function() {
    console.log('\n🔧 Custom Field Suggestions:');
    fillableInputs.forEach((field, index) => {
        const questionContainer = field.closest('[role="listitem"], .freebirdFormviewerViewItemsItemItem, [data-params]');
        if (questionContainer) {
            const questionText = questionContainer.textContent.trim();
            if (questionText && questionText.length < 100) {
                const cleanText = questionText.replace(/[*\n\r]/g, ' ').trim();
                console.log(`Field ${index + 1}: Add custom field with key "${cleanText}" and your data as value`);
            }
        }
    });
};

console.log('\n🔧 Run suggestCustomFields() to get custom field suggestions');