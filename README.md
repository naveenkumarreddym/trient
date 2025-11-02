# Trient AI Chrome Extension

A Chrome extension that brings AI-powered browser automation to your fingertips. This extension is based on the [browser-use](https://github.com/browser-use/browser-use) Python library, reimagined as a lightweight Chrome plugin. Check [video](https://www.youtube.com/watch?v=0rOVIbGx2mk)

## 🌟 Features

- **Natural Language Commands**: Tell the browser what to do in plain English
- **Multi-LLM Support**: Works with OpenAI, Anthropic and Google Gemini
- **Smart Element Detection**: Automatically identifies and indexes interactive elements
- **Action History**: Track all actions performed by the AI agent
- **Real-time Feedback**: Visual indicators and status updates
- **Flexible Configuration**: Easy API key management and model selection

## 🚀 Installation

### From Source

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked"
5. Select the `chrome-plugin` folder

## ⚙️ Configuration

### Setting up API Keys

1. Click the extension icon in your Chrome toolbar
2. Select your preferred LLM provider (eg. Google Gemini)
3. Use https://aistudio.google.com/ for free api key
4. Enter your API key
5. (Optional) Specify a custom model name (eg. gemini-2.0-flash)
6. Click "Save"

### Supported Providers

#### OpenAI
- **Default Model**: `gpt-4o`
- **API Key**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
- **Recommended Models**: `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo`

#### Anthropic (Claude)
- **Default Model**: `claude-3-5-sonnet-20241022`
- **API Key**: Get from [Anthropic Console](https://console.anthropic.com/)
- **Recommended Models**: `claude-3-5-sonnet-20241022`, `claude-3-opus-20240229`

#### Google Gemini
- **Default Model**: `gemini-2.0-flash-exp`
- **API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Recommended Models**: `gemini-2.0-flash`, `gemini-1.5-pro`

#### Browser-Use Cloud
- **API Key**: Get from [Browser-Use Cloud](https://cloud.browser-use.com/dashboard/api)
- **Benefits**: Optimized for browser automation, faster execution

## 📖 Usage

### Basic Example

1. Open any webpage
2. Click the Trient AI extension icon
3. Enter a task like:
   - "Search for the latest AI news"
   - "Fill out this form with test data"
   - "Find all product prices on this page"
   - "Navigate to the checkout page"
4. Click "Start Task"
5. Watch the AI agent work!

### Task Examples

**Web Search**
```
Search for "Python tutorials" on Google and open the first result
```

**Form Filling**
```
Fill the email field with test@example.com and submit the form
```

**Data Extraction**
```
Find all the product names and prices on this page
```

**Navigation**
```
Go to the pricing page and click on the enterprise plan
```

**Multi-Step Tasks**
```
Search for "best laptops 2024", open the first article, and summarize the top 3 recommendations
```

## 🛠️ Architecture

The extension consists of three main components:

### 1. Popup (UI Layer)
- **File**: `popup.html`, `popup.js`, `styles.css`
- **Purpose**: User interface for configuration and task input
- **Features**: Real-time status updates, action history, result display

### 2. Background Service Worker (Orchestration Layer)
- **File**: `background.js`
- **Purpose**: Coordinates between popup and content script
- **Components**:
  - `BrowserUseAgent`: Main agent orchestrator
  - `LLMService`: Handles API calls to various LLM providers
- **Responsibilities**:
  - Task execution loop
  - LLM communication
  - Error handling and retries

### 3. Content Script (DOM Interaction Layer)
- **File**: `content.js`
- **Purpose**: Interacts with webpage DOM
- **Components**:
  - `BrowserStateExtractor`: Extracts page state and interactive elements
  - `VisualFeedback`: Provides visual indicators for actions
- **Actions Supported**:
  - Click elements
  - Input text
  - Navigate URLs
  - Scroll pages
  - Search queries
  - Mark task as done

## 🔄 How It Works

1. **State Extraction**: The content script analyzes the current page and extracts:
   - URL and title
   - Interactive elements (buttons, inputs, links)
   - Page text content
   - Scroll position

2. **LLM Decision**: The background service sends the state to the LLM with the user's task and gets the next action to perform

3. **Action Execution**: The content script executes the action (click, type, navigate, etc.)

4. **Loop**: Steps 1-3 repeat until the task is complete or max steps reached

## 🎯 Action Types

### Click
```json
{"type": "click", "index": 5}
```
Clicks on the element with the specified index.

### Input Text
```json
{"type": "input_text", "index": 3, "text": "hello world", "clear": true}
```
Inputs text into a form field.

### Navigate
```json
{"type": "navigate", "url": "https://example.com"}
```
Navigates to a new URL.

### Scroll
```json
{"type": "scroll", "down": true, "pages": 1}
```
Scrolls the page up or down.

### Search
```json
{"type": "search", "query": "AI news", "engine": "duckduckgo"}
```
Performs a web search.

### Done
```json
{"type": "done", "text": "Task completed successfully", "success": true}
```
Marks the task as complete.

## ⚠️ Limitations

1. **Single Tab**: Currently works on one tab at a time
2. **Max Steps**: Limited to 100 steps per task to prevent infinite loops
3. **Element Detection**: May miss dynamically loaded elements (use scroll/wait)
4. **File Downloads**: No Download handling
5. **Authentication**: Cannot handle complex authentication flows
6. **CAPTCHAs**: Cannot solve CAPTCHAs

## 🔒 Security & Privacy

- API keys are stored locally using Chrome's storage API
- No data is sent to any server except your chosen LLM provider
- All processing happens locally in your browser
- Open source - review the code yourself
- **Secure API Key Storage**: Your API keys are stored securely in local browser storage, never exposed.
- **Independent Per-Tab Operation**: Run multiple automation tasks in parallel across different tabs. Each side panel operates independently with its own isolated context, history, and status.

## 🐛 Troubleshooting

### Extension doesn't appear
- Make sure Developer mode is enabled in `chrome://extensions/`
- Verify all files are in the correct directory
- Check the browser console for errors

### API errors
- Verify your API key is correct
- Check that you have credits/quota available
- Ensure your API key has the necessary permissions

### Actions not executing
- Refresh the page and try again
- Check if the page has finished loading
- Some websites may block automated interactions

### Task gets stuck
- Click "Stop" and try rephrasing your task
- Break complex tasks into smaller steps
- Check the action history for errors

## 🤝 Comparison with Python Library

| Feature | Python Library | Chrome Extension |
|---------|---------------|------------------|
| Installation | pip/uv install | Load unpacked |
| Platform | Desktop only | Any Chrome browser |
| Capabilities | Full browser control | Tab-level control |
| Stealth Mode | ✅ Available | ❌ Not available |
| Multi-tab | ✅ Full support | ⚠️ Limited |
| File System | ✅ Full access | ⚠️ No Downloads |
| Screenshots | ✅ Yes | ❌ Not implemented |
| Vision Models | ✅ Supported | ❌ Not implemented |
| Custom Tools | ✅ Yes | ⚠️ Limited |

## 📝 Development

### Project Structure
```
chrome-plugin/
├── manifest.json          # Extension configuration
├── popup.html            # Main UI
├── popup.js              # UI controller
├── styles.css            # Styling
├── background.js         # Service worker (agent orchestrator)
├── content.js            # DOM interaction layer
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md            # This file
```

### Adding New Actions

1. **Define action in background.js**:
   Update the `formatActionDetails` method and prompt

2. **Implement in content.js**:
   Add a new method to `BrowserStateExtractor` class

3. **Update LLM prompt**:
   Add the action to the `buildPrompt` method in `LLMService`

### Testing

1. Load the extension in Chrome
2. Open Developer Tools (F12)
3. Check the Console tab for logs
4. Test with simple tasks first
5. Gradually increase complexity

## 🌐 Resources

- [Browser-Use Python Library](https://github.com/browser-use/browser-use)
- [Browser-Use Documentation](https://docs.browser-use.com)
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [LLM Provider APIs](https://docs.browser-use.com/category/llm-integration)

## 📄 License

MIT License - Same as the original browser-use library

## 🙏 Acknowledgments

This Chrome extension is based on the excellent [browser-use](https://github.com/browser-use/browser-use) Python library created by the Browser-Use team. All core concepts and automation strategies are derived from their work.

## 💬 Support

For issues related to:
- **This Chrome Extension**: Open an issue in this repository
- **Browser-Use Library**: Visit the [original repository](https://github.com/browser-use/browser-use)
- **LLM APIs**: Contact your LLM provider's support

## 🚀 Future Enhancements

- [ ] Screenshot capability with vision models
- [ ] Multi-tab support
- [ ] File upload handling
- [ ] Custom action definitions
- [ ] Task templates/shortcuts
- [ ] History replay
- [ ] Export/import tasks
- [ ] Scheduling recurring tasks
- [ ] Team collaboration features

---

Made with ❤️ based on Browser-Use
