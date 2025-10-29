# 🚀 Quick Start Guide

Get up and running with Browser-Use Chrome Extension in 5 minutes!

## Step 1: Install the Extension

### Option A: Load from Source (Recommended for now)

1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Toggle "Developer mode" ON (top-right corner)
4. Click "Load unpacked" button
5. Select the `chrome-plugin` folder
6. You should see the Browser-Use icon appear in your toolbar!

### Option B: Pin the Extension

After loading, click the puzzle icon 🧩 in Chrome toolbar and pin the Browser-Use extension for easy access.

## Step 2: Get Your API Key

Choose one of these LLM providers and get an API key:

### OpenAI (Recommended for beginners)
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-`)
4. Cost: ~$0.01-0.05 per task with GPT-4o

### Anthropic Claude (Best for complex tasks)
1. Go to https://console.anthropic.com/
2. Navigate to API Keys
3. Create a new key
4. Cost: ~$0.015 per task with Claude 3.5 Sonnet

### Google Gemini (Fast and free tier available)
1. Go to https://makersuite.google.com/app/apikey
2. Create API key
3. Free tier: 60 requests per minute

### Browser-Use Cloud (Optimized for browser automation)
1. Go to https://cloud.browser-use.com/dashboard/api
2. Sign up (get $10 free credits)
3. Copy your API key

## Step 3: Configure the Extension

1. Click the Browser-Use icon in your Chrome toolbar
2. Select your LLM provider from the dropdown
3. Paste your API key
4. (Optional) Change the model if desired
5. Click "Save"

**Your API key is stored locally and never shared with anyone except your chosen LLM provider.**

## Step 4: Try Your First Task

### Example 1: Simple Search

1. Open a new tab (any page is fine)
2. Click the Browser-Use icon
3. Enter this task:
   ```
   Search for "Python programming tutorials" on DuckDuckGo
   ```
4. Click "Start Task"
5. Watch the magic happen! ✨

### Example 2: Web Navigation

1. Go to any website (e.g., https://example.com)
2. Click the Browser-Use icon
3. Enter this task:
   ```
   Find and click on the "More information" link
   ```
4. Click "Start Task"

### Example 3: Form Interaction

1. Go to https://httpbin.org/forms/post
2. Click the Browser-Use icon
3. Enter this task:
   ```
   Fill the form with: name "John Doe", comment "Test message", and submit
   ```
4. Click "Start Task"

## 📊 Understanding the Interface

### Status Indicator (Colored Dot)
- 🔵 **Blue**: Task is running
- 🟢 **Green**: Task completed successfully
- 🔴 **Red**: Error occurred
- ⚪ **Gray**: Idle/ready

### Progress Bar
Shows how many steps have been completed out of the maximum (100 steps)

### Action History
Real-time log of all actions being performed:
- ✓ Success actions (white background)
- ❌ Failed actions (red border)

### Result Section
Shows the final summary when task completes

## 💡 Tips for Better Results

### 1. Be Specific
❌ Bad: "Find stuff about AI"
✅ Good: "Search Google for 'latest AI research papers 2024' and open the first academic result"

### 2. Break Complex Tasks
❌ Bad: "Research laptops, compare prices, add to cart, and checkout"
✅ Good: Start with "Search for gaming laptops under $1000"

### 3. Current Page Context
The AI can see what's on your current page. You can say:
- "Click the login button"
- "Fill out this form"
- "Scroll down and find the pricing section"

### 4. Use Quotes for Exact Text
```
Search for "best practices" (will search for exact phrase)
```

### 5. Multiple Steps
```
Go to wikipedia.org, search for "Artificial Intelligence", and click on the first result
```

## 🎯 Sample Tasks by Difficulty

### Beginner Tasks

**Simple Search**
```
Search DuckDuckGo for "weather today"
```

**Click Element**
```
Click the "About" link on this page
```

**Scroll Page**
```
Scroll down to the bottom of the page
```

### Intermediate Tasks

**Form Filling**
```
Fill the email field with test@example.com and the password field with Password123
```

**Multi-Step Navigation**
```
Go to github.com, search for "browser-use", and open the first repository
```

**Data Finding**
```
Find the price of the first product on this page
```

### Advanced Tasks

**Research Task**
```
Search for "best laptops 2024", open the first article, find the top 3 recommendations, and tell me their names and prices
```

**Form Automation**
```
Fill out this contact form with: Name: Jane Smith, Email: jane@example.com, Message: "Interested in your services", then submit
```

**Conditional Navigation**
```
If there's a cookie consent banner, accept it, then scroll to the footer and find the privacy policy link
```

## ⚠️ Common Issues

### "Element not found" Error
**Cause**: Page hasn't loaded completely
**Fix**: Add "wait" or try "refresh the page first, then click..."

### Task Gets Stuck
**Cause**: Ambiguous instructions or page issues
**Fix**: 
1. Click "Stop"
2. Refresh the page
3. Rephrase your task more specifically

### API Key Error
**Cause**: Invalid key or no credits
**Fix**: 
1. Check your API key is correct
2. Verify you have credits/quota remaining
3. Try a different provider

### Actions Not Working
**Cause**: Website blocking automation
**Fix**: Some websites actively block automated interactions. Try:
1. Different website
2. Simpler task
3. Manual completion for those specific sites

## 🔄 Next Steps

1. **Experiment**: Try different types of tasks on various websites
2. **Learn Patterns**: Notice which phrasings work best
3. **Share**: Tell others about successful tasks
4. **Contribute**: Found a bug? Have ideas? Open an issue!

## 📚 More Resources

- [Full README](README.md) - Complete documentation
- [Example Tasks](EXAMPLES.md) - More task examples
- [Browser-Use Docs](https://docs.browser-use.com) - Original library docs
- [Chrome Extensions Guide](https://developer.chrome.com/docs/extensions/) - Learn more about extensions

## 🆘 Need Help?

- Check the [Troubleshooting section](README.md#-troubleshooting) in the main README
- Review [example tasks](EXAMPLES.md)
- Open an issue with your problem

---

Happy automating! 🤖✨
