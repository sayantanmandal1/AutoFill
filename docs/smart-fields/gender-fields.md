# Gender Field Smart Selection

## Overview

The Job Application Autofill Extension includes intelligent gender field detection and selection logic designed to handle various form implementations commonly found in job applications, university forms, and online registrations.

## How It Works

### Detection Patterns

The extension recognizes gender fields using these label patterns:
- `gender`
- `sex`
- `male`
- `female`
- `gender identity`
- `sex identity`

### Smart Selection Logic

#### For Text Input Fields
```javascript
// Default value filled
value = "Male"
```

#### For Dropdown/Select Fields

The extension uses a priority-based selection system:

1. **Exact Match Priority**
   - Looks for exact "Male" option first
   - Case-insensitive matching

2. **Pattern Matching Fallback**
   - `Male` → Matches: "male", "m", "man", "boy"
   - `Female` → Matches: "female", "f", "woman", "girl"  
   - `Other` → Matches: "other", "prefer not to say", "non-binary"

## Implementation Examples

### Example 1: Standard Gender Dropdown
```html
<select name="gender">
  <option value="">Select Gender</option>
  <option value="Male">Male</option>        <!-- ✅ This will be selected -->
  <option value="Female">Female</option>
  <option value="Other">Other</option>
</select>
```

### Example 2: Abbreviated Options
```html
<select name="sex">
  <option value="">Choose</option>
  <option value="M">M</option>             <!-- ✅ This will be selected -->
  <option value="F">F</option>
  <option value="O">O</option>
</select>
```

### Example 3: Alternative Wording
```html
<select name="genderIdentity">
  <option value="">Please select</option>
  <option value="man">Man</option>         <!-- ✅ This will be selected -->
  <option value="woman">Woman</option>
  <option value="non-binary">Non-binary</option>
</select>
```

### Example 4: Text Input
```html
<input type="text" name="gender" placeholder="Enter gender">
<!-- Will be filled with: "Male" -->
```

## Algorithm Details

### Selection Strategy

```javascript
// Pseudo-code for gender field selection
function selectGenderOption(element, value) {
  const options = element.options;
  
  // Strategy 1: Exact match
  let selected = findExactMatch(options, "Male");
  
  // Strategy 2: Pattern matching
  if (!selected) {
    const patterns = ["male", "m", "man", "boy"];
    selected = findPatternMatch(options, patterns);
  }
  
  // Strategy 3: Fallback to other genders if needed
  if (!selected) {
    selected = findAnyGenderOption(options);
  }
  
  return selected;
}
```

### Field Detection

```javascript
// Field detection algorithm
function isGenderField(element) {
  const searchText = extractFieldInfo(element);
  const genderKeywords = [
    'gender', 'sex', 'male', 'female', 
    'gender identity', 'sex identity'
  ];
  
  return genderKeywords.some(keyword => 
    searchText.toLowerCase().includes(keyword)
  );
}
```

## Common Form Variations

### Indian University Forms
- Often use "Sex" instead of "Gender"
- May have options like "M/F" or "Male/Female"
- Sometimes include "Transgender" or "Other" options

### Job Application Forms
- Usually use "Gender" label
- Standard "Male/Female/Other" options
- May include "Prefer not to say" option

### Government Forms
- Often use "Sex" terminology
- May have abbreviated options (M/F)
- Sometimes include additional categories

## Testing

### Test Cases Covered

1. **Standard dropdowns** with "Male/Female/Other"
2. **Abbreviated dropdowns** with "M/F/O"
3. **Alternative wording** like "Man/Woman"
4. **Text inputs** expecting gender text
5. **Multi-language forms** (English variations)

### Browser Compatibility

- ✅ Chrome 88+
- ✅ Brave 1.20+
- ✅ Edge 88+

## Troubleshooting

### Common Issues

**Gender field not being selected:**
1. Check if the dropdown contains recognizable options
2. Verify field detection using browser console logs
3. Some forms may use non-standard option values

**Wrong option being selected:**
1. The extension prioritizes "Male" options
2. Check if multiple gender-related fields exist
3. Some forms may have conflicting field labels

### Debug Information

Enable debug mode to see:
- Field detection results
- Available dropdown options
- Selection logic decisions
- Pattern matching results

```javascript
// Console output example
Field detected: gender (select)
Available options: ["", "Male", "Female", "Other"]
Selected option: "Male" (exact match)
```

## Customization

### Modifying Selection Logic

To customize gender selection behavior, modify the `fillSelectField` function in `content.js`:

```javascript
// Custom gender mapping
const customGenderMappings = [
  { value: 'Male', patterns: ['male', 'm', 'man', 'boy', 'gentleman'] },
  { value: 'Female', patterns: ['female', 'f', 'woman', 'girl', 'lady'] },
  { value: 'Other', patterns: ['other', 'non-binary', 'prefer not to say'] }
];
```

### Adding New Detection Patterns

Add new keywords to the field detection array:

```javascript
gender: [
  'gender', 'sex', 'male', 'female', 
  'gender identity', 'sex identity',
  'your-custom-keyword'  // Add custom patterns here
]
```