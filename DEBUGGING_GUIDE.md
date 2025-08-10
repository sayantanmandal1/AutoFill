# Debugging Field Matching Issues

If your extension is not matching fields properly, follow this step-by-step debugging guide.

## 🔍 **Step 1: Enable Debug Mode**

1. **Open browser console** (F12)
2. **Enable debug logging**:
   ```javascript
   localStorage.setItem('autofill_debug', 'true');
   ```
3. **Reload the page** you're testing on

## 🧪 **Step 2: Use the Debug Script**

1. **Copy and paste** the contents of `debug-autofill.js` into the browser console
2. **Run the analysis**:
   ```javascript
   debugAutofill();
   ```
3. **Check the output** - it will show you all detected fields and their attributes

## 🎯 **Step 3: Test Manual Filling**

1. **Test with sample data**:
   ```javascript
   testAutofill();
   ```
2. **This will try to fill fields** with sample data using simple matching
3. **See which fields get filled** and which don't

## 🔧 **Step 4: Common Issues & Solutions**

### **Issue 1: No Fields Detected**
**Symptoms**: Extension says "No fillable form fields found"

**Solutions**:
- Check if fields are visible: `field.offsetParent !== null`
- Check if fields are enabled: `!field.disabled && !field.readOnly`
- Look for non-standard form elements (divs with contenteditable, etc.)

### **Issue 2: Fields Detected But Not Matched**
**Symptoms**: Extension finds fields but says "No matching fields found"

**Solutions**:
1. **Check field attributes**:
   ```javascript
   // In console, inspect a field
   const field = document.querySelector('input[type="text"]');
   console.log('Name:', field.name);
   console.log('ID:', field.id);
   console.log('Placeholder:', field.placeholder);
   console.log('Class:', field.className);
   ```

2. **Add custom fields** in extension popup:
   - If field has `name="applicant_name"`, add custom field: `applicant_name` → `Your Name`
   - If field has `id="contact_email"`, add custom field: `contact_email` → `Your Email`

### **Issue 3: Fields Matched But Not Filled**
**Symptoms**: Extension says "Autofilled X fields" but fields remain empty

**Solutions**:
1. **Check if it's a React/Vue form**:
   ```javascript
   // Test React-style filling
   const field = document.querySelector('input[name="email"]');
   const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
   nativeInputValueSetter.call(field, 'test@example.com');
   field.dispatchEvent(new Event('input', { bubbles: true }));
   ```

2. **Try different event types**:
   ```javascript
   field.focus();
   field.value = 'test value';
   field.dispatchEvent(new Event('input', { bubbles: true }));
   field.dispatchEvent(new Event('change', { bubbles: true }));
   field.dispatchEvent(new Event('blur', { bubbles: true }));
   ```

## 🛠️ **Step 5: Website-Specific Fixes**

### **Google Forms**
- Fields usually have `data-params` attributes
- Use `aria-label` for field identification
- May need to trigger `focusout` events

### **LinkedIn**
- Uses React components heavily
- Field names often have random suffixes
- Look for `data-test-id` attributes

### **Indeed/Job Portals**
- Often use `name` attributes like `applicant.name`
- May have hidden fields that need to be filled
- Check for multi-step forms

## 🔍 **Step 6: Advanced Debugging**

### **Inspect Extension Storage**
```javascript
// Check what data is saved
chrome.storage.sync.get(null, (data) => {
  console.log('Saved data:', data);
});
```

### **Monitor Extension Messages**
```javascript
// Listen for extension messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Extension message:', message);
});
```

### **Check Content Script Loading**
```javascript
// Verify content script is loaded
console.log('Content script loaded:', typeof AutofillManager !== 'undefined');
```

## 🎯 **Step 7: Quick Fixes**

### **Fix 1: Lower Confidence Threshold**
If fields aren't matching, the confidence threshold might be too high. The enhanced version I provided lowers it to 0.1.

### **Fix 2: Add More Keywords**
Add these to your field mappings:
```javascript
// Common variations
'full-name', 'fullname', 'your-name', 'applicant-name', 'candidate-name'
'e-mail', 'email-address', 'contact-email', 'work-email'
'phone-number', 'mobile-number', 'contact-number', 'telephone'
```

### **Fix 3: Use Custom Fields**
In the extension popup, add custom fields for specific websites:
- Key: `applicant_name` → Value: Your actual name
- Key: `contact_email` → Value: Your actual email
- Key: `phone_number` → Value: Your actual phone

## 🚀 **Step 8: Test Different Strategies**

### **Strategy 1: Positional Matching**
```javascript
// Fill first few fields with common data
const inputs = document.querySelectorAll('input[type="text"], input[type="email"]');
if (inputs[0]) inputs[0].value = 'Your Name';
if (inputs[1]) inputs[1].value = 'your@email.com';
```

### **Strategy 2: Type-Based Matching**
```javascript
// Fill by input type
document.querySelectorAll('input[type="email"]').forEach(field => {
  field.value = 'your@email.com';
});
document.querySelectorAll('input[type="tel"]').forEach(field => {
  field.value = '+1234567890';
});
```

## 📋 **Step 9: Report Issues**

If you're still having issues, collect this information:

1. **Website URL**: Where the issue occurs
2. **Browser**: Chrome/Brave/Edge version
3. **Console Output**: Copy the debug output
4. **Field HTML**: Right-click field → Inspect → Copy HTML
5. **Extension Data**: What data you have saved

## 💡 **Pro Tips**

1. **Test on simple forms first** (like the test-form.html I created)
2. **Use browser dev tools** to inspect form structure
3. **Check network tab** for any AJAX requests that might affect forms
4. **Try different websites** to see if it's site-specific
5. **Clear browser cache** if forms behave unexpectedly

---

**Remember**: The enhanced field matching I implemented should be much more aggressive and catch more fields. If you're still having issues, the debug script will help identify exactly what's happening!