/**
 * Test script for the specific Google Form
 * Run this in the console on: https://docs.google.com/forms/d/e/1FAIpQLSe8d4KG-SfppJaZNX3ERZstVPma6Y1NDvuOTIadGUObMxk9CA/viewform
 */

console.log('🎯 Testing Specific Google Form');
console.log('==============================');

// Enable debug mode
localStorage.setItem('autofill_debug', 'true');

// Sample data to test with
const testData = {
    fullName: 'Sayantan Mandal',
    email: 'sayantan.22bce8533@vitapstudent.ac.in',
    phone: '6290464748',
    studentNumber: '22BCE8533',
    tenthMarks: '95',
    twelfthMarks: '75',
    ugCgpa: '8.87',
    linkedinUrl: 'https://www.linkedin.com/in/sayantan-mandal-8a14b7202/',
    githubUrl: 'https://github.com/sayantanmandal1',
    leetcodeUrl: 'https://leetcode.com/u/sayonara1337/',
    resumeUrl: 'https://drive.google.com/file/d/1e_zGr0Ld9mUR9C1HLHjMGN8aV77l1jcO/view?usp=drive_link',
    portfolioUrl: 'https://d1grz986bewgw4.cloudfront.net/',
    customFields: {}
};

// Find all fillable fields
const fillableFields = [];
const allInputs = document.querySelectorAll('input, textarea, div[role="textbox"]');

Array.from(allInputs).forEach(input => {
    if (input.disabled || input.readOnly) return;
    if (input.type === 'hidden' || input.type === 'submit' || input.type === 'button') return;
    
    const rect = input.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;
    
    const style = window.getComputedStyle(input);
    if (style.display === 'none' || style.visibility === 'hidden') return;
    
    fillableFields.push(input);
});

console.log(`📝 Found ${fillableFields.length} fillable fields`);

// Extract field info for each field
const fieldInfos = fillableFields.map((element, index) => {
    const info = {
        element: element,
        type: element.type || 'text',
        value: element.value || '',
        labels: [],
        searchText: ''
    };

    // Find question container
    const questionContainer = element.closest('[role="listitem"], .freebirdFormviewerViewItemsItemItem, [data-params]');
    if (questionContainer) {
        // Look for question text
        const questionSelectors = [
            '[role="heading"]',
            '.freebirdFormviewerViewItemsItemItemTitle',
            '.Xb9hP',
            '.M7eMe',
            'span[jsslot]',
            'div[jsname] span'
        ];

        for (const selector of questionSelectors) {
            const questionElement = questionContainer.querySelector(selector);
            if (questionElement && questionElement.textContent.trim()) {
                info.labels.push(questionElement.textContent.trim());
                break;
            }
        }

        // If no specific elements found, use container text
        if (info.labels.length === 0) {
            const containerText = questionContainer.textContent.trim();
            if (containerText && containerText.length < 300) {
                const cleanText = containerText
                    .replace(/\n+/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                if (cleanText) {
                    info.labels.push(cleanText);
                }
            }
        }
    }

    // Create search text
    const searchComponents = [
        element.name || '',
        element.id || '',
        element.placeholder || '',
        element.getAttribute('aria-label') || '',
        ...info.labels
    ];

    info.searchText = searchComponents
        .filter(text => text && typeof text === 'string')
        .map(text => text.trim())
        .filter(text => text.length > 0)
        .join(' ')
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    console.log(`\n🔸 Field ${index + 1}:`);
    console.log('  Element:', element);
    console.log('  Labels:', info.labels);
    console.log('  Search text:', `"${info.searchText}"`);

    return info;
});

// Test matching
console.log('\n🎯 Testing field matching...');

const patterns = {
    fullName: ['name', 'full name', 'your name', 'applicant name', 'candidate name', 'first name', 'last name', 'fname', 'lname', 'fullname'],
    email: ['email', 'e-mail', 'email address', 'contact email', 'university email', 'college email', 'mail'],
    phone: ['phone', 'mobile', 'telephone', 'contact number', 'phone number', 'mobile number', 'cell', 'tel'],
    studentNumber: ['student', 'registration', 'id number', 'student id', 'enrollment', 'roll number', 'id'],
    tenthMarks: ['10th', 'tenth', '10 grade', 'tenth grade', 'class 10', 'ssc', 'matriculation', '10th marks', 'tenth marks', '10th percentage', 'class x'],
    twelfthMarks: ['12th', 'twelfth', '12 grade', 'twelfth grade', 'class 12', 'hsc', 'intermediate', '12th marks', 'twelfth marks', '12th percentage', 'class xii'],
    ugCgpa: ['cgpa', 'gpa', 'undergraduate', 'ug cgpa', 'college gpa', 'university gpa', 'graduation', 'degree', 'bachelor'],
    linkedinUrl: ['linkedin', 'linked in', 'linkedin profile', 'linkedin url', 'professional profile'],
    githubUrl: ['github', 'git hub', 'github profile', 'github url', 'repository', 'code profile'],
    leetcodeUrl: ['leetcode', 'leet code', 'coding profile', 'algorithm profile', 'competitive programming'],
    resumeUrl: ['resume', 'cv', 'curriculum vitae', 'resume link', 'cv link', 'document'],
    portfolioUrl: ['portfolio', 'website', 'personal website', 'portfolio website', 'work samples']
};

const matches = [];

fieldInfos.forEach((field, fieldIndex) => {
    const searchText = field.searchText;
    let bestMatch = null;
    let bestScore = 0;

    Object.entries(patterns).forEach(([dataKey, keywords]) => {
        if (!testData[dataKey] || !testData[dataKey].trim()) {
            return;
        }

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
                field: field,
                dataKey: dataKey,
                value: testData[dataKey],
                confidence: Math.min(score / 5, 1.0),
                matchedKeywords: matchedKeywords
            };
        }
    });

    if (bestMatch && bestMatch.confidence > 0.05) {
        console.log(`✅ Field ${fieldIndex + 1} MATCHED: ${bestMatch.dataKey} (confidence: ${bestMatch.confidence.toFixed(2)})`);
        console.log(`   Keywords: ${bestMatch.matchedKeywords.join(', ')}`);
        console.log(`   Value: "${bestMatch.value}"`);
        matches.push(bestMatch);
    } else {
        console.log(`❌ Field ${fieldIndex + 1} NO MATCH`);
        console.log(`   Search text: "${searchText}"`);
        console.log(`   💡 Suggestion: Add custom field with key "${searchText}" or part of it`);
    }
});

console.log(`\n📊 Summary: ${matches.length} matches found out of ${fieldInfos.length} fields`);

// Test filling the matched fields
if (matches.length > 0) {
    console.log('\n🧪 Testing field filling...');
    
    matches.forEach((match, index) => {
        const element = match.field.element;
        const value = match.value;
        
        console.log(`Filling field ${index + 1} with: "${value}"`);
        
        try {
            element.focus();
            element.value = value;
            
            // Trigger events
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
            element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
            element.dispatchEvent(new Event('blur', { bubbles: true }));
            
            setTimeout(() => {
                if (element.value === value) {
                    console.log(`✅ Field ${index + 1} filled successfully`);
                } else {
                    console.log(`❌ Field ${index + 1} fill failed - value not retained`);
                }
            }, 100);
            
        } catch (error) {
            console.log(`❌ Field ${index + 1} fill error:`, error);
        }
    });
} else {
    console.log('\n❌ No matches found - cannot test filling');
    console.log('\n💡 Solutions:');
    console.log('1. Add custom fields in the extension popup using the search text as keys');
    console.log('2. Make sure you have saved data in the extension popup');
    console.log('3. Try simpler field names that match common patterns');
}

// Function to add suggested custom fields
window.addCustomFieldSuggestions = function() {
    console.log('\n🔧 Custom Field Suggestions:');
    console.log('Add these to your extension popup as custom fields:');
    
    fieldInfos.forEach((field, index) => {
        if (field.searchText && field.searchText.length > 0 && field.searchText.length < 50) {
            console.log(`"${field.searchText}" → [Your data for field ${index + 1}]`);
        }
    });
};

console.log('\n🔧 Run addCustomFieldSuggestions() to get exact custom field keys to add');