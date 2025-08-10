# Smart Field Examples

## Overview

This document provides comprehensive examples of how the Job Application Autofill Extension handles smart field selection in real-world scenarios.

## Gender Field Examples

### Example 1: LinkedIn Job Application

**Form HTML:**
```html
<div class="form-group">
  <label for="gender">Gender *</label>
  <select id="gender" name="gender" required>
    <option value="">Select Gender</option>
    <option value="Male">Male</option>
    <option value="Female">Female</option>
    <option value="Other">Other</option>
    <option value="Prefer not to say">Prefer not to say</option>
  </select>
</div>
```

**Extension Behavior:**
- ✅ Detects field using "gender" label
- ✅ Selects "Male" option (exact match)
- ✅ Triggers change events for form validation

### Example 2: Government Form with Abbreviations

**Form HTML:**
```html
<div class="field">
  <label>Sex:</label>
  <select name="applicant_sex">
    <option value="">Choose</option>
    <option value="M">M</option>
    <option value="F">F</option>
  </select>
</div>
```

**Extension Behavior:**
- ✅ Detects field using "sex" label
- ✅ Selects "M" option (pattern match for "Male")
- ✅ Handles abbreviated options intelligently

### Example 3: University Application Form

**Form HTML:**
```html
<div class="question">
  <span class="label">Gender Identity</span>
  <select name="gender_identity">
    <option value="">Please select</option>
    <option value="man">Man</option>
    <option value="woman">Woman</option>
    <option value="non-binary">Non-binary</option>
  </select>
</div>
```

**Extension Behavior:**
- ✅ Detects field using "gender identity" label
- ✅ Selects "man" option (pattern match for "Male")
- ✅ Handles alternative terminology

## Campus Field Examples

### Example 1: Job Portal University Selection

**Form HTML:**
```html
<div class="form-field">
  <label for="university">University/College *</label>
  <select id="university" name="university" required>
    <option value="">Select University</option>
    <option value="VIT-AP">VIT-AP</option>
    <option value="VIT Chennai">VIT Chennai</option>
    <option value="IIT Delhi">IIT Delhi</option>
    <option value="NIT Trichy">NIT Trichy</option>
  </select>
</div>
```

**Extension Behavior:**
- ✅ Detects field using "university" label
- ✅ Selects "VIT-AP" option (exact match)
- ✅ Prioritizes VIT-AP over other VIT campuses

### Example 2: Scholarship Application

**Form HTML:**
```html
<div class="input-group">
  <label>Current Institution Branch:</label>
  <select name="institution_branch">
    <option value="">Choose Branch</option>
    <option value="amaravathi">Amaravathi</option>
    <option value="chennai">Chennai</option>
    <option value="vellore">Vellore</option>
    <option value="bhopal">Bhopal</option>
  </select>
</div>
```

**Extension Behavior:**
- ✅ Detects field using "institution" and "branch" labels
- ✅ Selects "amaravathi" option (location-based match)
- ✅ Recognizes VIT-AP location reference

### Example 3: Internship Application

**Form HTML:**
```html
<div class="form-row">
  <label for="campus">Campus Location</label>
  <input type="text" id="campus" name="campus" placeholder="Enter your campus">
</div>
```

**Extension Behavior:**
- ✅ Detects field using "campus" label
- ✅ Fills with "VIT-AP" (default text value)
- ✅ Handles text input appropriately

## Complex Form Examples

### Example 1: Multi-Step Google Form

**Step 1 - Personal Information:**
```html
<div class="freebirdFormviewerViewItemsItemItem">
  <div class="freebirdFormviewerViewItemsItemItemTitle">
    <span>What is your gender? *</span>
  </div>
  <div class="freebirdFormviewerViewItemsItemItemChoiceContainer">
    <label>
      <input type="radio" name="gender" value="Male"> Male
    </label>
    <label>
      <input type="radio" name="gender" value="Female"> Female
    </label>
    <label>
      <input type="radio" name="gender" value="Other"> Other
    </label>
  </div>
</div>
```

**Step 2 - Educational Information:**
```html
<div class="freebirdFormviewerViewItemsItemItem">
  <div class="freebirdFormviewerViewItemsItemItemTitle">
    <span>Select your current campus</span>
  </div>
  <select name="campus_selection">
    <option value="VIT-Amaravathi">VIT-Amaravathi</option>
    <option value="VIT-Chennai">VIT-Chennai</option>
    <option value="VIT-Vellore">VIT-Vellore</option>
  </select>
</div>
```

**Extension Behavior:**
- ✅ Handles Google Forms complex structure
- ✅ Selects "Male" radio button in step 1
- ✅ Selects "VIT-Amaravathi" in step 2 (closest match to VIT-AP)
- ✅ Works across multiple form steps

### Example 2: Dynamic Form with AJAX Loading

**Initial Form:**
```html
<div id="personal-info">
  <select name="gender" id="gender-select">
    <option value="">Loading...</option>
  </select>
</div>
```

**After AJAX Load:**
```html
<div id="personal-info">
  <select name="gender" id="gender-select">
    <option value="">Select Gender</option>
    <option value="M">Male</option>
    <option value="F">Female</option>
  </select>
</div>
```

**Extension Behavior:**
- ✅ Waits for dynamic content to load
- ✅ Re-scans form after DOM changes
- ✅ Selects "M" option once available
- ✅ Handles AJAX-loaded forms gracefully

## Edge Cases and Fallbacks

### Example 1: Non-Standard Gender Options

**Form HTML:**
```html
<select name="gender_preference">
  <option value="">Choose</option>
  <option value="gentleman">Gentleman</option>
  <option value="lady">Lady</option>
  <option value="individual">Individual</option>
</select>
```

**Extension Behavior:**
- ✅ Detects field using "gender" in name
- ❌ No exact "Male" match found
- ✅ Falls back to partial matching
- ✅ Selects "gentleman" (closest male-related option)

### Example 2: Campus Field with No VIT Options

**Form HTML:**
```html
<select name="university">
  <option value="">Select University</option>
  <option value="IIT Delhi">IIT Delhi</option>
  <option value="NIT Trichy">NIT Trichy</option>
  <option value="Anna University">Anna University</option>
</select>
```

**Extension Behavior:**
- ✅ Detects field as campus-related
- ❌ No VIT options found
- ❌ No selection made (graceful failure)
- ✅ Logs debug information for troubleshooting

### Example 3: Multiple Gender Fields

**Form HTML:**
```html
<div class="applicant-info">
  <select name="applicant_gender">
    <option value="Male">Male</option>
    <option value="Female">Female</option>
  </select>
</div>

<div class="spouse-info">
  <select name="spouse_gender">
    <option value="Male">Male</option>
    <option value="Female">Female</option>
  </select>
</div>
```

**Extension Behavior:**
- ✅ Detects both fields as gender-related
- ✅ Fills applicant_gender with "Male"
- ⚠️ Also fills spouse_gender with "Male" (limitation)
- 💡 User can manually adjust spouse field if needed

## Testing Scenarios

### Scenario 1: Job Application Workflow

1. **Navigate to job portal** (LinkedIn, Indeed, Naukri)
2. **Click "Apply Now"** on a job posting
3. **Use extension** (Alt+Shift+F or click button)
4. **Verify results:**
   - Gender field: "Male" selected
   - University field: "VIT-AP" or closest match selected
   - Other fields filled appropriately

### Scenario 2: University Application

1. **Open university application form**
2. **Fill personal information section**
3. **Use extension autofill**
4. **Check smart field behavior:**
   - Gender/Sex field handled correctly
   - Current institution field shows VIT-AP
   - Academic information filled

### Scenario 3: Government Form

1. **Access government portal** (scholarship, exam registration)
2. **Navigate to application form**
3. **Trigger extension autofill**
4. **Validate smart selections:**
   - Sex field: "M" or "Male" selected
   - Institution: VIT-related option chosen
   - Form validation passes

## Debug Information

### Console Output Examples

**Successful Gender Field Detection:**
```
[Autofill] Field detected: gender (select)
[Autofill] Available options: ["", "Male", "Female", "Other"]
[Autofill] Gender field - exact match found: "Male"
[Autofill] Successfully filled gender field
```

**Campus Field Pattern Matching:**
```
[Autofill] Field detected: university (select)
[Autofill] Available options: ["", "VIT-Amaravathi", "VIT Chennai", "IIT Delhi"]
[Autofill] Campus field - pattern match found: "VIT-Amaravathi" (matches: amaravathi)
[Autofill] Successfully filled campus field
```

**Fallback Scenario:**
```
[Autofill] Field detected: gender_identity (select)
[Autofill] Available options: ["", "gentleman", "lady", "other"]
[Autofill] Gender field - no exact match, trying patterns
[Autofill] Pattern match found: "gentleman" (matches: male patterns)
[Autofill] Successfully filled gender field with fallback
```

## Best Practices

### For Users

1. **Review selections** after autofill, especially for critical applications
2. **Test on practice forms** before important submissions
3. **Enable debug mode** if experiencing issues
4. **Report edge cases** to help improve the extension

### For Developers

1. **Use standard field names** when possible (gender, campus, university)
2. **Provide clear labels** for form fields
3. **Include common option values** (Male/Female, standard university names)
4. **Test with the extension** during form development