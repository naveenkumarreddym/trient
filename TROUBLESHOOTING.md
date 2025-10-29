# Troubleshooting Guide

Updated guide for fixing common issues with the Browser-Use Chrome Extension.

## 🔧 Recent Fixes Applied

### v1.0.1 Updates
- ✅ Added automatic content script injection
- ✅ Improved error handling and logging
- ✅ Better message passing between components
- ✅ Console logging for debugging
- ✅ Prevention of double initialization

## 🚀 Quick Fix Steps

If the extension isn't working:

### 1. Reload the Extension
```
1. Go to chrome://extensions/
2. Find "Browser-Use Chrome Extension"
3. Click the reload icon (circular arrow)
4. Try your task again
```

### 2. Check Console Logs
```
1. Open the webpage where you're trying to automate
2. Press F12 to open Developer Tools
3. Click the "Console" tab
4. Look for messages starting with [BrowserUse]
5. Share any error messages if asking for help
```

### 3. Refresh the Target Page
```
1. Refresh the webpage you want to automate (F5 or Ctrl+R)
2. Wait for it to fully load
3. Click the extension icon
4. Try your task again
```

### 4. Check Extension Background Console
```
1. Go to chrome://extensions/
2. Find "Browser-Use Chrome Extension"
3. Click "Inspect views: service worker"
4. Check the console for errors
5. Look for messages about LLM API calls
```

## 🐛 Common Issues & Solutions

### Issue: "Could not establish connection"

**Symptoms**: Extension shows "Could not establish connection" error

**Causes**:
- Content script not injected
- Page hasn't finished loading
- Extension was updated but not reloaded

**Solutions**:
1. **Refresh the target page** (F5)
2. **Reload the extension** (chrome://extensions/)
3. **Wait for page to fully load** before starting task
4. **Check console** for specific errors

**New in v1.0.1**: The extension now automatically injects the content script if it's not present!

---

### Issue: Actions not executing

**Symptoms**: Status shows "running" but nothing happens on the page

**Causes**:
- Elements not found
- Page structure different than expected
- Website blocking automation

**Solutions**:
1. **Check console logs** - Look for "[BrowserUse]" messages
2. **Be more specific** - Instead of "click button", say "click the blue Submit button"
3. **Wait first** - Try: "wait 2 seconds, then click X"
4. **Scroll first** - Try: "scroll down, then click X"

**Debugging**:
```javascript
// In the page console, check if elements are found:
document.querySelectorAll('button')  // See all buttons
document.querySelectorAll('input')   // See all inputs
```

---

### Issue: "Element with index N not found"

**Symptoms**: Error message says element not found

**Causes**:
- Element is dynamically loaded
- Page changed after state extraction
- Element is in an iframe
- Element is hidden

**Solutions**:
1. **Scroll first**: "Scroll to element, then click it"
2. **Wait for loading**: "Wait 3 seconds, then click X"
3. **Be specific**: Use element text/color/position
4. **Check visibility**: Make sure element is visible on screen

---

### Issue: LLM API errors

**Symptoms**: "LLM API Error" or "Invalid API key"

**Causes**:
- Invalid or expired API key
- No credits/quota remaining
- Network issues
- Rate limiting

**Solutions**:
1. **Verify API key**:
   - Check it's copied correctly
   - No extra spaces
   - Still valid/active
2. **Check credits**:
   - OpenAI: https://platform.openai.com/account/billing
   - Anthropic: https://console.anthropic.com/
   - Google: Check quota limits
3. **Try again**: Sometimes temporary network issues
4. **Check background console**: Look for specific API error messages

---

### Issue: Extension popup doesn't open

**Symptoms**: Clicking extension icon does nothing

**Causes**:
- Extension not properly loaded
- Chrome issue
- Icon files missing

**Solutions**:
1. **Check extension is enabled**: chrome://extensions/
2. **Reload extension**: Click reload icon
3. **Verify icons exist**: Check `icons/` folder has 3 PNG files
4. **Restart Chrome**: Close all windows, reopen

---

### Issue: Task gets stuck in a loop

**Symptoms**: Same action repeats over and over

**Causes**:
- LLM not recognizing success
- Page doesn't change after action
- Ambiguous task description

**Solutions**:
1. **Click Stop button** immediately
2. **Rephrase task** to be more specific
3. **Add explicit end condition**: "...then mark as done"
4. **Break into steps**: Do one action at a time

The extension will auto-stop after 100 steps or 3 consecutive errors.

---

### Issue: "Failed to initialize browser automation"

**Symptoms**: Error on task start

**Causes**:
- Content script couldn't inject
- Page doesn't allow scripts
- Special Chrome page (like chrome://)

**Solutions**:
1. **Can't automate Chrome pages**: chrome://, chrome-extension://, etc.
2. **Refresh the page**: F5 or Ctrl+R
3. **Try a different website**: Test with example.com first
4. **Check page loaded**: Wait for page to fully load

---

## 📊 Checking Logs

### Page Console (F12)
Look for these messages:
```
[BrowserUse] Content script initialized
[BrowserUse] Content script ready
[BrowserUse] Received message: get_state
[BrowserUse] Extracting browser state...
[BrowserUse] Found X interactive elements
[BrowserUse] Executing action: click
[BrowserUse] Action completed: { success: true }
```

### Background Console (Inspect service worker)
Look for these messages:
```
Task starting...
Injecting content script...
Thinking...
Executing: click
Action result: success
```

### Errors to Watch For
- ❌ "Could not establish connection" - Content script issue
- ❌ "No response from content script" - Communication issue
- ❌ "Element with index X not found" - Element not available
- ❌ "LLM API Error" - API/key issue

## 🧪 Testing the Extension

### Step 1: Test with Simple Page

1. Open: [test-page.html](test-page.html) (in this folder)
2. Click extension icon
3. Try task: "Click the Primary Button"
4. Should see: Button click message

### Step 2: Test with Real Website

1. Open: https://example.com
2. Click extension icon
3. Try task: "Find and click the 'More information' link"
4. Should navigate to another page

### Step 3: Test Form Filling

1. Open: test-page.html
2. Try task: "Fill the name field with 'John Doe'"
3. Should see: Name field populated

### Step 4: Test Search

1. Open any tab
2. Try task: "Search Google for 'test query'"
3. Should navigate to Google search results

## 🔍 Advanced Debugging

### Enable Verbose Logging

1. Open `background.js`
2. Add at the top:
```javascript
const DEBUG = true;
console.log = console.log.bind(console);
```
3. Reload extension

### Monitor All Messages

In page console, add:
```javascript
// Monitor all Chrome messages
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    console.log('Message received:', msg);
    return false; // Don't block other listeners
});
```

### Check Content Script Loaded

In page console:
```javascript
// Check if content script is loaded
console.log('Initialized?', window.browserUseInitialized);
console.log('Extractor?', window.stateExtractor);
```

### Manual State Extraction

In page console:
```javascript
// Manually get browser state
chrome.runtime.sendMessage(
    {type: 'get_state'}, 
    response => console.log('State:', response)
);
```

## 📝 Reporting Issues

When reporting an issue, please include:

1. **Chrome version**: chrome://version/
2. **Extension version**: Check manifest.json or chrome://extensions/
3. **What you tried**: Exact task text
4. **What happened**: Error message or behavior
5. **Console logs**: From both page and background console
6. **Steps to reproduce**: How to recreate the issue
7. **Website URL**: Where you were trying to automate (if public)

### Where to Report
- GitHub Issues (if available)
- Include all information above
- Add screenshots if helpful

## ✅ Best Practices

### 1. Start Simple
```
❌ Don't: "Research laptops, compare prices, and buy the best one"
✅ Do: "Search for 'laptops under $1000'"
```

### 2. Be Specific
```
❌ Don't: "Click the button"
✅ Do: "Click the blue Submit button at the bottom"
```

### 3. Wait When Needed
```
❌ Don't: "Click result"
✅ Do: "Wait for results to load, then click the first one"
```

### 4. Check Visibility
```
❌ Don't: "Click the hidden menu item"
✅ Do: "Click the menu button, then click Settings"
```

### 5. Handle Errors Gracefully
```
❌ Don't: Let it run forever
✅ Do: Click Stop if it's not working
```

## 🔄 After Updates

When extension is updated:

1. **Go to chrome://extensions/**
2. **Click reload** on Browser-Use
3. **Refresh all open tabs** you want to automate
4. **Clear cache** if issues persist (Ctrl+Shift+Delete)
5. **Restart Chrome** if still having issues

## 🆘 Still Not Working?

### Last Resort Fixes

1. **Remove and reinstall extension**:
   ```
   1. chrome://extensions/
   2. Remove Browser-Use extension
   3. Close Chrome completely
   4. Reopen Chrome
   5. Load unpacked extension again
   ```

2. **Try incognito mode**:
   ```
   1. Enable extension in incognito (chrome://extensions/)
   2. Open incognito window
   3. Test there (no interference from other extensions)
   ```

3. **Check Chrome updates**:
   ```
   1. chrome://settings/help
   2. Update if available
   3. Restart Chrome
   ```

4. **Create new Chrome profile**:
   ```
   1. chrome://settings/
   2. Add new person
   3. Load extension in new profile
   4. Test there
   ```

## 📞 Getting Help

If you've tried everything:

1. **Check documentation**:
   - README.md
   - QUICKSTART.md
   - EXAMPLES.md
   - This file

2. **Review examples**: Try tasks from EXAMPLES.md

3. **Test with test-page.html**: Isolate issue

4. **Check console logs**: Both page and background

5. **Report issue**: Include all information above

---

**Remember**: The extension now has better error handling and logging. Check the console logs first - they'll usually tell you exactly what's wrong!

Good luck! 🚀
