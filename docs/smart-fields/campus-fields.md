# Campus Field Smart Selection

## Overview

The Job Application Autofill Extension includes specialized campus field detection and selection logic, specifically optimized for VIT (Vellore Institute of Technology) students applying to various institutions and job portals.

## How It Works

### Detection Patterns

The extension recognizes campus fields using these label patterns:
- `campus`
- `college`
- `university`
- `institution`
- `branch`
- `location`
- `vit`
- `amaravathi`
- `ap`

### Smart Selection Logic

#### For Text Input Fields
```javascript
// Default value filled
value = "VIT-AP"
```

#### For Dropdown/Select Fields

The extension uses a comprehensive matching system for VIT campuses:

1. **Exact Match Priority**
   - Looks for exact "VIT-AP" option first
   - Case-insensitive matching

2. **VIT Campus Pattern Matching**
   - `VIT-AP` variations: "VIT-Amaravathi", "VIT AP", "VITAP"
   - Location-based: "amaravathi", "amravati", "ap"
   - State-based: "andhra pradesh"

## Implementation Examples

### Example 1: Standard Campus Dropdown
```html
<select name="campus">
  <option value="">Select Campus</option>
  <option value="VIT-AP">VIT-AP</option>           <!-- ✅ This will be selected -->
  <option value="VIT Chennai">VIT Chennai</option>
  <option value="VIT Vellore">VIT Vellore</option>
</select>
```

### Example 2: University Branch Selection
```html
<select name="universityBranch">
  <option value="">Choose Branch</option>
  <option value="amaravathi">Amaravathi</option>    <!-- ✅ This will be selected -->
  <option value="chennai">Chennai</option>
  <option value="vellore">Vellore</option>
</select>
```

### Example 3: Institution Dropdown
```html
<select name="institution">
  <option value="">Select Institution</option>
  <option value="vit_ap">VIT AP</option>           <!-- ✅ This will be selected -->
  <option value="vit_chennai">VIT Chennai</option>
  <option value="iit_madras">IIT Madras</option>
</select>
```

### Example 4: Text Input
```html
<input type="text" name="campus" placeholder="Enter campus name">
<!-- Will be filled with: "VIT-AP" -->
```

## Algorithm Details

### Selection Strategy

```javascript
// Pseudo-code for campus field selection
function selectCampusOption(element, value) {
  const options = element.options;
  
  // Strategy 1: Exact match for VIT-AP
  let selected = findExactMatch(options, "VIT-AP");
  
  // Strategy 2: VIT campus pattern matching
  if (!selected) {
    const vitPatterns = [
      'vit-ap', 'vit ap', 'vitap', 'vit amaravathi', 
      'vit amravati', 'amaravathi', 'amravati', 
      'ap', 'andhra pradesh'
    ];
    selected = findPatternMatch(options, vitPatterns);
  }
  
  // Strategy 3: Partial matching
  if (!selected) {
    selected = findPartialMatch(options, value);
  }
  
  return selected;
}
```

### Field Detection

```javascript
// Field detection algorithm
function isCampusField(element) {
  const searchText = extractFieldInfo(element);
  const campusKeywords = [
    'campus', 'college', 'university', 'institution', 
    'branch', 'location', 'vit', 'amaravathi', 'ap'
  ];
  
  return campusKeywords.some(keyword => 
    searchText.toLowerCase().includes(keyword)
  );
}
```

## VIT Campus Variations

### Official Names
- **VIT-AP** (Primary)
- **VIT-Amaravathi** (Full name)
- **VIT Amaravathi** (Space variant)
- **VITAP** (Concatenated)

### Location-Based
- **Amaravathi** (City name)
- **Amravati** (Alternative spelling)
- **AP** (State abbreviation)
- **Andhra Pradesh** (Full state name)

### Technical Variations
- **vit_ap** (Underscore format)
- **vit-amaravathi** (Hyphenated)
- **VIT AP** (Space separated)

## Common Form Scenarios

### Job Application Forms
```html
<!-- LinkedIn, Indeed, Naukri.com style -->
<select name="university">
  <option value="VIT-AP">VIT-AP</option>
  <option value="VIT Chennai">VIT Chennai</option>
  <option value="IIT Delhi">IIT Delhi</option>
</select>
```

### University Application Forms
```html
<!-- Higher education applications -->
<select name="currentInstitution">
  <option value="vit_amaravathi">VIT Amaravathi</option>
  <option value="vit_vellore">VIT Vellore</option>
  <option value="anna_university">Anna University</option>
</select>
```

### Government Forms
```html
<!-- Scholarship, exam applications -->
<select name="collegeName">
  <option value="amaravathi">Amaravathi</option>
  <option value="chennai">Chennai</option>
  <option value="hyderabad">Hyderabad</option>
</select>
```

## Testing

### Test Cases Covered

1. **Exact VIT-AP matches**
2. **Alternative VIT campus names**
3. **Location-based selections** (Amaravathi, AP)
4. **Text inputs** expecting campus names
5. **Mixed case variations**
6. **Special character handling** (hyphens, underscores)

### Browser Compatibility

- ✅ Chrome 88+
- ✅ Brave 1.20+
- ✅ Edge 88+

## Troubleshooting

### Common Issues

**Campus field not being selected:**
1. Check if dropdown contains VIT-related options
2. Verify field detection using browser console logs
3. Some forms may use completely different naming schemes

**Wrong campus being selected:**
1. Extension prioritizes VIT-AP/Amaravathi options
2. Check if multiple campus fields exist on the form
3. Some forms may have regional preferences

**Text input not being filled:**
1. Ensure field is detected as campus-related
2. Check field label and name attributes
3. Some forms may have validation that rejects "VIT-AP"

### Debug Information

Enable debug mode to see:
- Field detection results
- Available dropdown options
- Pattern matching attempts
- Final selection decision

```javascript
// Console output example
Field detected: campus (select)
Available options: ["", "VIT-AP", "VIT Chennai", "VIT Vellore"]
Pattern matching: "VIT-AP" found (exact match)
Selected option: "VIT-AP"
```

## Customization

### Adding Other Campuses

To support other VIT campuses or institutions, modify the campus patterns:

```javascript
// Custom campus patterns
const customCampusPatterns = [
  // VIT Campuses
  'vit-ap', 'vit ap', 'vit amaravathi',
  'vit-chennai', 'vit chennai',
  'vit-vellore', 'vit vellore',
  'vit-bhopal', 'vit bhopal',
  
  // Other institutions
  'your-institution-name'
];
```

### Modifying Default Value

To change the default text input value:

```javascript
// In storage.js DEFAULT_PROFILE_DATA
campus: "Your-Preferred-Campus"  // Change from "VIT-AP"
```

### Adding New Detection Keywords

Add custom keywords for campus field detection:

```javascript
campus: [
  'campus', 'college', 'university', 'institution', 
  'branch', 'location', 'vit', 'amaravathi', 'ap',
  'your-custom-keyword'  // Add custom patterns here
]
```

## Regional Considerations

### Indian Context
- Many forms use "College" instead of "University"
- State abbreviations are common (AP, TN, KA)
- Regional language variations may exist

### International Forms
- May use "Institution" or "School"
- Country-specific naming conventions
- Different campus identification systems

## Future Enhancements

### Planned Features
- Support for more VIT campuses
- Integration with other university systems
- Dynamic campus detection based on location
- Multi-language campus name support