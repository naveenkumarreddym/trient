# API Documentation

Internal API documentation for the Browser-Use Chrome Extension.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Message Passing](#message-passing)
- [Class APIs](#class-apis)
- [Action Types](#action-types)
- [Browser State](#browser-state)
- [Storage API](#storage-api)
- [Extension Points](#extension-points)

## Architecture Overview

The extension follows a three-layer architecture:

```
┌─────────────────┐
│   Popup (UI)    │  User interface and configuration
└────────┬────────┘
         │
         │ Messages
         ▼
┌─────────────────┐
│   Background    │  Service Worker - Agent orchestrator
│   (Orchestrator)│  LLM communication
└────────┬────────┘
         │
         │ Messages
         ▼
┌─────────────────┐
│   Content       │  DOM interaction and state extraction
│   (DOM Layer)   │
└─────────────────┘
```

## Message Passing

All communication uses Chrome's message passing API.

### Popup → Background

#### Start Task
```javascript
chrome.runtime.sendMessage({
    type: 'start_task',
    task: string,           // User's natural language task
    tabId: number,          // Target tab ID
    settings: {
        llmProvider: string,    // 'openai' | 'anthropic' | 'google' | 'browser-use'
        apiKey: string,         // API key for the provider
        model: string           // Model name (optional)
    }
});
```

#### Stop Task
```javascript
chrome.runtime.sendMessage({
    type: 'stop_task'
});
```

### Background → Popup

#### Status Update
```javascript
chrome.runtime.sendMessage({
    type: 'status_update',
    status: string,         // 'idle' | 'running' | 'success' | 'error'
    text: string            // Human-readable status message
});
```

#### Action Executed
```javascript
chrome.runtime.sendMessage({
    type: 'action_executed',
    action: {
        type: string,       // Action type
        details: string,    // Formatted details
        error: string?      // Error message if failed
    }
});
```

#### Progress Update
```javascript
chrome.runtime.sendMessage({
    type: 'progress_update',
    step: number,           // Current step number
    maxSteps: number        // Maximum steps allowed
});
```

#### Task Completed
```javascript
chrome.runtime.sendMessage({
    type: 'task_completed',
    result: {
        text: string        // Final summary
    }
});
```

#### Task Error
```javascript
chrome.runtime.sendMessage({
    type: 'task_error',
    error: string           // Error message
});
```

### Background → Content

#### Get Browser State
```javascript
chrome.tabs.sendMessage(tabId, {
    type: 'get_state'
}, (response) => {
    // response = BrowserState object
});
```

#### Execute Action
```javascript
chrome.tabs.sendMessage(tabId, {
    type: 'execute_action',
    action: ActionObject
}, (response) => {
    // response = ActionResult object
});
```

## Class APIs

### PopupController (popup.js)

Main UI controller class.

#### Constructor
```javascript
new PopupController()
```

#### Methods

##### startTask()
```javascript
async startTask(): Promise<void>
```
Starts a new automation task.

##### stopTask()
```javascript
stopTask(): void
```
Stops the currently running task.

##### updateStatus(status, text)
```javascript
updateStatus(status: string, text: string): void
```
Updates the status indicator and text.

##### addHistoryItem(action)
```javascript
addHistoryItem(action: ActionInfo): void
```
Adds an action to the history list.

##### saveSettings()
```javascript
saveSettings(): void
```
Saves settings to Chrome storage.

### BrowserUseAgent (background.js)

Main agent orchestrator.

#### Constructor
```javascript
new BrowserUseAgent()
```

#### Methods

##### startTask(task, tabId, settings)
```javascript
async startTask(
    task: string,
    tabId: number,
    settings: Settings
): Promise<void>
```
Starts the task execution loop.

##### stopTask()
```javascript
stopTask(): void
```
Stops the current task.

##### executeTaskLoop()
```javascript
async executeTaskLoop(): Promise<void>
```
Main task execution loop. Continues until task is done or max steps reached.

##### getBrowserState()
```javascript
async getBrowserState(): Promise<BrowserState>
```
Gets current browser state from content script.

##### executeAction(action)
```javascript
async executeAction(action: Action): Promise<ActionResult>
```
Executes an action in the content script.

### LLMService (background.js)

Handles LLM API communication.

#### Constructor
```javascript
new LLMService(settings: Settings)
```

#### Methods

##### getNextAction(task, browserState, history)
```javascript
async getNextAction(
    task: string,
    browserState: BrowserState,
    history: Array<HistoryItem>
): Promise<Action>
```
Gets the next action from the LLM.

##### callLLM(messages)
```javascript
async callLLM(messages: Array<Message>): Promise<string>
```
Makes API call to the configured LLM provider.

##### parseAction(response)
```javascript
parseAction(response: string): Action
```
Parses LLM response into an Action object.

### BrowserStateExtractor (content.js)

Extracts browser state and executes actions.

#### Constructor
```javascript
new BrowserStateExtractor()
```

#### Methods

##### getBrowserState()
```javascript
async getBrowserState(): Promise<BrowserState>
```
Extracts current page state including interactive elements.

##### executeAction(action)
```javascript
async executeAction(action: Action): Promise<ActionResult>
```
Executes the given action on the page.

##### extractInteractiveElements()
```javascript
extractInteractiveElements(): Array<ElementInfo>
```
Finds and indexes all interactive elements on the page.

##### isElementVisible(element)
```javascript
isElementVisible(element: HTMLElement): boolean
```
Checks if an element is visible to the user.

## Action Types

### Click Action
```javascript
{
    type: 'click',
    index: number           // Element index from browser state
}
```

### Input Text Action
```javascript
{
    type: 'input_text',
    index: number,          // Element index
    text: string,           // Text to input
    clear: boolean          // Whether to clear existing text (default: true)
}
```

### Navigate Action
```javascript
{
    type: 'navigate',
    url: string,            // URL to navigate to
    new_tab?: boolean       // Open in new tab (not implemented)
}
```

### Scroll Action
```javascript
{
    type: 'scroll',
    down: boolean,          // true = down, false = up
    pages: number           // Number of pages to scroll (default: 1)
}
```

### Search Action
```javascript
{
    type: 'search',
    query: string,          // Search query
    engine: string          // 'duckduckgo' | 'google' | 'bing' (default: 'duckduckgo')
}
```

### Done Action
```javascript
{
    type: 'done',
    text: string,           // Summary message
    success: boolean        // Whether task completed successfully
}
```

## Browser State

Structure returned by `getBrowserState()`:

```javascript
{
    url: string,                    // Current page URL
    title: string,                  // Page title
    elements: Array<ElementInfo>,   // Interactive elements
    textContent: string,            // Page text (first 2000 chars)
    scrollY: number,                // Current scroll position
    scrollHeight: number,           // Total page height
    viewportHeight: number          // Viewport height
}
```

### ElementInfo Structure

```javascript
{
    index: number,              // Unique element index
    tag: string,                // HTML tag name (lowercase)
    type: string?,              // Input type (if applicable)
    text: string,               // Visible text content
    placeholder: string?,       // Placeholder text (if applicable)
    value: string?,             // Current value (if applicable)
    href: string?,              // Link href (if applicable)
    ariaLabel: string?,         // ARIA label
    className: string?,         // CSS classes
    id: string?                 // Element ID
}
```

## Action Result

Structure returned after action execution:

```javascript
{
    success?: boolean,          // Whether action succeeded
    error?: string,             // Error message if failed
    extracted_content?: string, // Extracted data (for extract action)
    long_term_memory?: string   // Memory to persist
}
```

## Storage API

### Save Settings
```javascript
chrome.storage.local.set({
    llmProvider: string,
    apiKey: string,
    model: string
}, callback);
```

### Load Settings
```javascript
chrome.storage.local.get(
    ['llmProvider', 'apiKey', 'model'],
    (result) => {
        // result contains saved values
    }
);
```

### Clear Settings
```javascript
chrome.storage.local.clear(callback);
```

## Extension Points

### Adding a New Action Type

1. **Define action structure** in this API doc

2. **Update LLMService.buildPrompt()** to include the action in the prompt

3. **Add parsing** in LLMService.parseAction()

4. **Implement execution** in BrowserStateExtractor.executeAction():
   ```javascript
   case 'new_action':
       return await this.newAction(action);
   ```

5. **Add method** to BrowserStateExtractor:
   ```javascript
   async newAction(action) {
       try {
           // Implementation
           return { success: true };
       } catch (error) {
           return { error: error.message };
       }
   }
   ```

6. **Update popup formatting** in PopupController.formatActionDetails()

### Adding a New LLM Provider

1. **Add to provider list** in popup.html

2. **Add default model** in LLMService.getDefaultModel()

3. **Implement API call** in LLMService:
   ```javascript
   async callNewProvider(messages) {
       const response = await fetch(API_URL, {
           method: 'POST',
           headers: {
               'Authorization': `Bearer ${this.apiKey}`,
               'Content-Type': 'application/json'
           },
           body: JSON.stringify({
               model: this.model,
               messages: messages
           })
       });
       
       if (!response.ok) {
           throw new Error('API request failed');
       }
       
       const data = await response.json();
       return this.extractCompletion(data);
   }
   ```

4. **Add to switch** in LLMService.callLLM()

5. **Update documentation**

### Custom State Extraction

Override or extend `extractInteractiveElements()`:

```javascript
extractInteractiveElements() {
    const elements = [];
    
    // Custom selectors
    const customSelectors = [
        'button',
        'a[href]',
        '[data-clickable]'  // Custom attribute
    ];
    
    document.querySelectorAll(customSelectors.join(', ')).forEach(el => {
        if (this.isElementVisible(el)) {
            elements.push({
                index: this.elementIndex++,
                tag: el.tagName.toLowerCase(),
                // ... custom properties
            });
        }
    });
    
    return elements;
}
```

## Error Handling

### Standard Error Response

```javascript
{
    error: string               // Human-readable error message
}
```

### Common Error Types

- **Element not found**: `Element with index N not found`
- **Action failed**: `Failed to <action>: <reason>`
- **LLM error**: `LLM API Error: <reason>`
- **Parse error**: `Failed to parse LLM response: <reason>`

### Error Recovery

The agent automatically:
1. Tracks consecutive errors
2. Stops after 3 consecutive errors
3. Provides error details to the user
4. Allows manual stop at any time

## Performance Considerations

### Element Indexing
- Limited to 100 elements per page to avoid overwhelming the LLM
- Elements are indexed in DOM order
- Hidden elements are excluded

### Message Size
- Page text limited to 2000 characters
- Element text limited to 100 characters per element
- History limited to last 5 actions in prompt

### Rate Limiting
- 1 second delay between actions
- Respects LLM provider rate limits
- No built-in retry logic (fails fast)

## Security

### API Key Storage
- Stored in `chrome.storage.local`
- Never transmitted except to chosen LLM provider
- Not accessible from web pages

### Content Security Policy
- All external requests use HTTPS
- No eval() or unsafe inline scripts
- Strict CSP in manifest

### Permissions
- `activeTab`: Access to current tab only
- `tabs`: Tab management
- `storage`: Settings persistence
- `scripting`: Content script injection

## Debugging

### Enable Verbose Logging

Add to background.js:
```javascript
const DEBUG = true;

function debugLog(...args) {
    if (DEBUG) {
        console.log('[BrowserUse]', ...args);
    }
}
```

### Inspect Messages

Add message logger in background.js:
```javascript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Received message:', message);
    // ... existing code
});
```

### Monitor State Extraction

Add to content.js:
```javascript
async getBrowserState() {
    const state = await this.extractState();
    console.log('Browser state:', state);
    return state;
}
```

## Version History

- **1.0.0**: Initial API design

---

For implementation examples, see the source code files.
For usage examples, see [EXAMPLES.md](EXAMPLES.md).
For contributing guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).
