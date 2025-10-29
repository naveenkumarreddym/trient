# Contributing to Browser-Use Chrome Extension

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the Browser-Use Chrome Extension.

## 🤝 How to Contribute

### Reporting Bugs

1. **Check existing issues** - Search to see if the bug has already been reported
2. **Create a new issue** with:
   - Clear, descriptive title
   - Steps to reproduce the bug
   - Expected vs actual behavior
   - Your Chrome version and OS
   - Screenshots if applicable
   - Console logs if relevant

### Suggesting Enhancements

1. **Check existing feature requests** - Avoid duplicates
2. **Create an issue** with:
   - Clear description of the feature
   - Use cases and benefits
   - Potential implementation approach
   - Examples from other tools (if applicable)

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Commit with clear messages**
   ```bash
   git commit -m "Add feature: description of feature"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request**

## 🏗️ Development Setup

### Prerequisites

- Chrome browser (latest version)
- Text editor or IDE
- Python 3 (for icon generation)
- Basic knowledge of JavaScript and Chrome Extensions

### Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd chrome-plugin
   ```

2. Generate icons (if needed):
   ```bash
   python3 create_icons.py
   ```

3. Load extension in Chrome:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `chrome-plugin` folder

4. Make changes and reload:
   - Click the reload icon on the extension card
   - Or use Ctrl+R / Cmd+R on the extensions page

## 📁 Project Structure

```
chrome-plugin/
├── manifest.json          # Extension manifest (version, permissions)
├── popup.html            # Main UI interface
├── popup.js              # UI controller logic
├── styles.css            # Styling for popup
├── background.js         # Service worker (agent orchestrator)
├── content.js            # DOM interaction layer
├── icons/                # Extension icons
├── test-page.html        # Test page for development
└── docs/                 # Documentation files
```

## 🧪 Testing

### Manual Testing

1. **Test page**: Open `test-page.html` in Chrome
2. **Basic tasks**:
   - Click buttons
   - Fill forms
   - Navigate links
   - Scroll content
3. **Real websites**: Test on various websites
4. **Error scenarios**: Test with invalid inputs

### Test Checklist

- [ ] Extension loads without errors
- [ ] API key can be saved and loaded
- [ ] Tasks execute correctly
- [ ] Status updates appear in real-time
- [ ] Action history is recorded
- [ ] Stop button works
- [ ] Error handling works properly
- [ ] Works on different websites
- [ ] No console errors
- [ ] Graceful degradation on failures

### Testing Different LLM Providers

Test with all supported providers:
- [ ] OpenAI
- [ ] Anthropic
- [ ] Google Gemini
- [ ] Browser-Use Cloud

## 📝 Code Style

### JavaScript

- Use camelCase for variables and functions
- Use PascalCase for classes
- Add JSDoc comments for functions
- Use async/await over promises
- Keep functions small and focused

Example:
```javascript
/**
 * Execute a browser action
 * @param {Object} action - The action to execute
 * @returns {Promise<Object>} Result of the action
 */
async function executeAction(action) {
    // Implementation
}
```

### HTML/CSS

- Use semantic HTML5 elements
- Keep CSS organized by component
- Use meaningful class names
- Maintain responsive design
- Follow accessibility best practices

### File Organization

- Keep related code together
- Use clear, descriptive file names
- Add comments for complex logic
- Remove unused code

## 🎯 Areas for Contribution

### High Priority

1. **Multi-tab support** - Allow agents to work across multiple tabs
2. **Screenshot capability** - Add vision model support
3. **Error recovery** - Better handling of failures
4. **Action templates** - Pre-built task templates
5. **Testing framework** - Automated tests

### Medium Priority

1. **File upload handling** - Support for file inputs
2. **Custom actions** - Allow users to define actions
3. **History export** - Export task history as JSON
4. **Keyboard shortcuts** - Quick access shortcuts
5. **Dark mode** - UI theming support

### Low Priority

1. **i18n** - Multi-language support
2. **Analytics** - Usage statistics (opt-in)
3. **Sync** - Sync settings across devices
4. **Task scheduler** - Schedule recurring tasks

## 🐛 Debugging

### Console Logging

- **Background script**: Right-click extension → "Inspect popup" → Console tab
- **Content script**: F12 on the webpage → Console tab
- **Popup**: Right-click extension → "Inspect popup"

### Common Issues

1. **Message passing failures**
   - Check if content script is loaded
   - Verify message types match
   - Use `chrome.runtime.lastError`

2. **Element not found**
   - Page might not be fully loaded
   - Element might be in iframe
   - Element might be dynamically loaded

3. **API errors**
   - Check API key validity
   - Verify rate limits
   - Check network connectivity

## 🔒 Security Guidelines

1. **Never commit API keys** - Use local storage only
2. **Validate all inputs** - Sanitize user inputs
3. **Use HTTPS** - All external API calls must use HTTPS
4. **Minimize permissions** - Request only needed permissions
5. **Audit dependencies** - Check for vulnerabilities

## 📚 Documentation

When adding features, update:

1. **README.md** - Main documentation
2. **QUICKSTART.md** - If affects getting started
3. **EXAMPLES.md** - Add example tasks
4. **CHANGELOG.md** - Document changes
5. **Code comments** - Inline documentation

## 🎨 UI/UX Guidelines

1. **Consistency** - Match existing design patterns
2. **Feedback** - Provide visual feedback for actions
3. **Accessibility** - Follow WCAG guidelines
4. **Responsiveness** - Support different popup sizes
5. **Error messages** - Clear, actionable error messages

## 🚀 Release Process

1. **Update version** in manifest.json
2. **Update CHANGELOG.md** with changes
3. **Test thoroughly** on different sites
4. **Create git tag**
   ```bash
   git tag -a v1.1.0 -m "Release version 1.1.0"
   git push origin v1.1.0
   ```
5. **Create release notes** on GitHub

## 📋 Commit Message Guidelines

Use conventional commits format:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

Examples:
```bash
feat: add multi-tab support
fix: resolve element indexing issue
docs: update API documentation
refactor: simplify action parsing logic
```

## 🤔 Questions?

- Open an issue with the "question" label
- Check existing discussions
- Review the documentation

## 📜 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what's best for the project
- Show empathy towards other contributors

## 🙏 Thank You!

Every contribution, no matter how small, is valuable. Thank you for helping make Browser-Use better!

---

## Quick Reference

### Adding a New Action

1. **Define action in background.js**:
   ```javascript
   // In buildPrompt method
   prompt += `{"type": "new_action", "param": "<value>"}\n`;
   ```

2. **Handle in content.js**:
   ```javascript
   async executeAction(action) {
       switch (action.type) {
           case 'new_action':
               return await this.newAction(action);
       }
   }
   
   async newAction(action) {
       // Implementation
       return { success: true };
   }
   ```

3. **Update UI in popup.js**:
   ```javascript
   formatActionDetails(action) {
       switch (action.type) {
           case 'new_action':
               return `New action: ${action.param}`;
       }
   }
   ```

4. **Document in EXAMPLES.md**

### Adding a New LLM Provider

1. **Add provider option** in popup.html:
   ```html
   <option value="new_provider">New Provider</option>
   ```

2. **Add API call method** in background.js:
   ```javascript
   async callNewProvider(messages) {
       const response = await fetch('API_ENDPOINT', {
           method: 'POST',
           headers: {
               'Authorization': `Bearer ${this.apiKey}`,
               'Content-Type': 'application/json'
           },
           body: JSON.stringify({ messages })
       });
       
       const data = await response.json();
       return data.completion; // Adjust based on API
   }
   ```

3. **Update callLLM switch** statement

4. **Test thoroughly**

5. **Document in README.md**

---

Happy coding! 🚀
