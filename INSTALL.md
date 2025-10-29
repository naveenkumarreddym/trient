# Installation & Setup Guide

Complete step-by-step guide to install and configure the Browser-Use Chrome Extension.

## 📋 Prerequisites

Before you begin, ensure you have:

- ✅ **Chrome Browser** (version 88 or higher)
- ✅ **Python 3** (for icon generation, optional if icons already exist)
- ✅ **API Key** from one of the supported LLM providers
- ✅ **Internet connection** (for LLM API calls)

## 🚀 Installation Methods

### Method 1: Quick Install (Recommended)

1. **Download the extension**
   ```bash
   git clone <repository-url>
   cd chrome-plugin
   ```

2. **Generate icons** (if not already present)
   ```bash
   python3 create_icons.py
   ```

3. **Load in Chrome**
   - Open Chrome
   - Navigate to `chrome://extensions/`
   - Toggle **"Developer mode"** ON (top-right corner)
   - Click **"Load unpacked"**
   - Select the `chrome-plugin` folder
   - Done! 🎉

### Method 2: Manual Setup

If you don't have git:

1. **Download files**
   - Download all files from the repository
   - Save to a folder named `chrome-plugin`

2. **Create icons manually**
   - Create an `icons` folder inside `chrome-plugin`
   - Add three PNG files:
     - `icon16.png` (16x16 pixels)
     - `icon48.png` (48x48 pixels)
     - `icon128.png` (128x128 pixels)
   - Use any robot/AI-themed icon with purple/blue colors

3. **Load in Chrome**
   - Follow step 3 from Method 1

## 🔑 Getting API Keys

### Option 1: OpenAI (Easiest for beginners)

1. Go to https://platform.openai.com/signup
2. Create an account or sign in
3. Navigate to https://platform.openai.com/api-keys
4. Click **"Create new secret key"**
5. Copy the key (starts with `sk-`)
6. **Important**: Add credits to your account
   - Go to https://platform.openai.com/account/billing
   - Add payment method
   - Add at least $5 credit

**Cost**: ~$0.01-0.05 per task with GPT-4o

### Option 2: Anthropic Claude (Best for complex tasks)

1. Go to https://console.anthropic.com/
2. Sign up for an account
3. Navigate to **API Keys** section
4. Click **"Create Key"**
5. Copy your API key
6. Add credits if needed

**Cost**: ~$0.015 per task with Claude 3.5 Sonnet

### Option 3: Google Gemini (Free tier available!)

1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click **"Create API key"**
4. Copy your API key

**Cost**: Free tier includes 60 requests per minute!

### Option 4: Browser-Use Cloud (Optimized)

1. Go to https://cloud.browser-use.com/
2. Sign up (get $10 free credits)
3. Navigate to **Dashboard** → **API**
4. Copy your API key

**Cost**: Uses credits, new signups get $10 free

## ⚙️ Configuration

### Initial Setup

1. **Click the extension icon** in Chrome toolbar (puzzle piece if not pinned)

2. **Select your LLM provider**
   - Choose from: OpenAI, Anthropic, Google, or Browser-Use Cloud

3. **Enter your API key**
   - Paste the key you obtained earlier
   - Don't worry - it's stored locally and securely

4. **Choose a model** (optional)
   - Default models are already optimized
   - Advanced users can specify custom models

5. **Click "Save"**
   - You should see a success message

### Verifying Installation

Test with a simple task:

1. Open any webpage (try https://example.com)
2. Click the Browser-Use extension icon
3. Enter: `Find and click the "More information" link`
4. Click **"Start Task"**
5. Watch it work! ✨

If it works, you're all set! 🎉

## 🔧 Troubleshooting

### Extension Doesn't Load

**Problem**: Extension won't load or shows errors

**Solutions**:
1. Check that all files are present in the folder
2. Verify `manifest.json` is valid (no syntax errors)
3. Ensure icons folder exists with all three PNG files
4. Check Chrome console (F12) for specific errors
5. Try reloading: Right-click extension → "Reload"

### Extension Icon Not Showing

**Problem**: Can't find the extension icon

**Solutions**:
1. Look for the puzzle piece icon in Chrome toolbar
2. Click it to see all extensions
3. Pin Browser-Use to toolbar for easy access
4. Check if extension is enabled in `chrome://extensions/`

### API Key Errors

**Problem**: "Invalid API key" or similar errors

**Solutions**:
1. **Verify key format**:
   - OpenAI: starts with `sk-`
   - Anthropic: starts with `sk-ant-`
   - Google: Long alphanumeric string
2. **Check key is active**:
   - Make sure you copied the entire key
   - No extra spaces before/after
3. **Verify credits**:
   - Check your account has available credits/quota
4. **Test key directly**:
   - Try using the key in provider's playground
5. **Create new key**:
   - Sometimes regenerating helps

### "Could not establish connection" Error

**Problem**: Messages fail to send between components

**Solutions**:
1. **Refresh the webpage**:
   - Press F5 or Ctrl+R
2. **Reload extension**:
   - Go to `chrome://extensions/`
   - Click reload icon on the extension card
3. **Check content script**:
   - Open DevTools (F12) on the page
   - Look for errors in Console
4. **Restart Chrome**:
   - Close all Chrome windows
   - Open Chrome again

### Task Gets Stuck

**Problem**: Task runs but doesn't progress

**Solutions**:
1. **Click "Stop" button**
2. **Check action history** for errors
3. **Simplify the task**:
   - Break complex tasks into smaller steps
4. **Try a different website**:
   - Some sites block automation
5. **Refresh and retry**:
   - Reload page, try again with clearer instructions

### Elements Not Found

**Problem**: "Element with index N not found"

**Solutions**:
1. **Wait for page load**:
   - Some elements load dynamically
   - Try: "Wait 3 seconds, then click button X"
2. **Scroll first**:
   - Try: "Scroll down, then click X"
3. **Be more specific**:
   - Instead of "click button", try "click the blue Submit button"
4. **Check if element exists**:
   - Manually verify the element is visible on page

### High API Costs

**Problem**: Spending too much on API calls

**Solutions**:
1. **Use efficient models**:
   - Google Gemini has generous free tier
   - GPT-3.5-turbo is cheaper than GPT-4
2. **Limit steps**:
   - Extension already limits to 100 steps
3. **Stop failed tasks**:
   - Don't let failed tasks run forever
4. **Be specific**:
   - Clear instructions = fewer steps = lower cost

### Actions Don't Execute

**Problem**: Actions fail silently or with errors

**Solutions**:
1. **Check website compatibility**:
   - Some sites actively block automation
   - Banking/payment sites often don't work
2. **Disable extensions that might conflict**:
   - Ad blockers
   - Privacy extensions
   - Other automation tools
3. **Try incognito mode**:
   - Test if other extensions are interfering
4. **Check console for errors**:
   - F12 → Console tab
   - Look for JavaScript errors

## 🔒 Security & Privacy

### Is My API Key Safe?

✅ **YES** - Your API key is:
- Stored locally using Chrome's secure storage
- Never sent anywhere except your chosen LLM provider
- Not accessible to websites you visit
- Encrypted by Chrome's storage system

### What Data Is Collected?

❌ **NONE** - This extension:
- Does not track your usage
- Does not send telemetry
- Does not collect personal information
- Open source - verify yourself!

### Can Others See My Tasks?

❌ **NO** - Your tasks are:
- Processed only by your chosen LLM provider
- Not logged by this extension
- Not shared with third parties
- Subject to your LLM provider's privacy policy

## 🔄 Updating the Extension

### Manual Update

1. Download latest version
2. Replace files in your `chrome-plugin` folder
3. Go to `chrome://extensions/`
4. Click reload icon on Browser-Use card
5. Done!

### Check for Updates

No automatic update system yet. Check the repository periodically for new releases.

## 🗑️ Uninstalling

### Complete Removal

1. Go to `chrome://extensions/`
2. Find "Browser-Use Chrome Extension"
3. Click **"Remove"**
4. Confirm removal
5. (Optional) Delete the `chrome-plugin` folder from your computer

### Keep Settings

If you want to reinstall later:
- Don't clear Chrome storage
- Your API keys will be preserved

## 📱 Using on Multiple Computers

### Sync Settings (Manual)

Chrome doesn't sync extension settings by default. To use on multiple computers:

1. **Export settings**:
   - Note your API key and provider
   - Or use Chrome's export bookmarks feature (doesn't include extensions)

2. **Install on new computer**:
   - Follow installation steps above
   - Re-enter your API key

### Future: Automatic Sync

Coming in a future version!

## 🆘 Still Having Issues?

### Before Asking for Help

Please check:
- [ ] All prerequisites are met
- [ ] Icons exist in `icons/` folder
- [ ] API key is valid and has credits
- [ ] Extension is enabled in Chrome
- [ ] Console shows no critical errors
- [ ] You've tried the troubleshooting steps above

### Getting Help

1. **Check documentation**:
   - [README.md](README.md) - Full documentation
   - [QUICKSTART.md](QUICKSTART.md) - Quick start guide
   - [EXAMPLES.md](EXAMPLES.md) - Example tasks
   - [API.md](API.md) - Technical details

2. **Review examples**:
   - Try the test page: `test-page.html`
   - Test with simple tasks first
   - Check if problem is site-specific

3. **Open an issue**:
   - Describe the problem clearly
   - Include Chrome version and OS
   - Share relevant console errors
   - Describe steps to reproduce

4. **Community support**:
   - Check existing issues
   - Join Browser-Use Discord
   - Ask in discussions

## ✅ Post-Installation Checklist

After installation, verify:

- [ ] Extension icon appears in Chrome
- [ ] Can open extension popup
- [ ] Settings are saved successfully
- [ ] Test task completes without errors
- [ ] Action history is displayed
- [ ] Can stop tasks manually
- [ ] No console errors

If all checked, you're ready to automate! 🚀

## 🎓 Next Steps

Now that you're installed:

1. **Read [QUICKSTART.md](QUICKSTART.md)** - Learn the basics
2. **Try [EXAMPLES.md](EXAMPLES.md)** - Test different tasks
3. **Experiment!** - Try automating your workflows
4. **Share your experience** - Help improve the extension

---

**Congratulations!** You're now ready to use Browser-Use Chrome Extension! 🎉

For usage examples and tips, see [QUICKSTART.md](QUICKSTART.md).

For common task patterns, see [EXAMPLES.md](EXAMPLES.md).

Happy automating! 🤖✨
