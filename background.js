// Background Service Worker - Agent Orchestrator
// Side Panel Handler - Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({ windowId: tab.windowId });
});

class BrowserUseAgent {
    constructor() {
        this.isRunning = false;
        this.currentTask = null;
        this.currentTabId = null;
        this.settings = null;
        this.history = [];
        this.maxSteps = 100;
        this.currentStep = 0;
        this.llmService = null;
        
        this.setupMessageListener();
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'start_task') {
                this.startTask(message.task, message.tabId, message.settings);
                return false; // No immediate response needed
            } else if (message.type === 'stop_task') {
                this.stopTask();
                return false; // No immediate response needed
            } else if (message.type === 'cdp_click') {
                this.performCdpClick(sender.tab.id, message.x, message.y, sendResponse);
                return true; // Indicates that the response is sent asynchronously
            } else if (message.type === 'js_click') {
                // Inject code to traverse shadow DOM and click element
                chrome.scripting.executeScript({
                    target: {tabId: sender.tab.id},
                    func: (path) => {
                        function findElementByShadowPath(path) {
                            let root = document;
                            let el = null;
                            for (const hop of path) {
                                let candidates = root.querySelectorAll(hop.selector);
                                el = candidates[hop.index] || null;
                                if (!el) return null;
                                if (el.shadowRoot) {
                                    root = el.shadowRoot;
                                } else {
                                    root = el;
                                }
                            }
                            return el;
                        }
                        try {
                            const target = findElementByShadowPath(path);
                            if (!target) return {error: 'Element not found by shadow path'};
                            target.focus && target.focus();
                            target.click();
                            return {success: true};
                        } catch(e) {
                            return {error: e.message};
                        }
                    },
                    args: [message.path]
                }, (results) => {
                    if (chrome.runtime.lastError) {
                        sendResponse({error: chrome.runtime.lastError.message});
                    } else if (results && results[0] && results[0].result && results[0].result.success) {
                        sendResponse({success: true});
                    } else {
                        const err = (results && results[0] && results[0].result && results[0].result.error) || 'Unknown error';
                        sendResponse({error: err});
                    }
                });
                return true;
            }
        });
    }

    async performCdpClick(tabId, x, y, callback) {
        const debuggee = { tabId: tabId };
        const version = '1.3';

        const sendCommand = (command, params) => {
            return new Promise((resolve, reject) => {
                chrome.debugger.sendCommand(debuggee, command, params, (result) => {
                    if (chrome.runtime.lastError) {
                        return reject(new Error(chrome.runtime.lastError.message));
                    }
                    resolve(result);
                });
            });
        };

        try {
            await new Promise((resolve, reject) => {
                chrome.debugger.attach(debuggee, version, () => {
                    if (chrome.runtime.lastError) {
                        return reject(new Error(chrome.runtime.lastError.message));
                    }
                    resolve();
                });
            });

            // 1. Move mouse to the target coordinates
            await sendCommand('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
            await this.sleep(50);

            // 2. Press the mouse button
            await sendCommand('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
            await this.sleep(80);

            // 3. Release the mouse button
            await sendCommand('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });

            callback({ success: true });

        } catch (e) {
            console.error('[BrowserUse] CDP Click Error:', e.message);
            callback({ error: e.message });
        } finally {
            // 4. Always detach the debugger
            chrome.debugger.detach(debuggee, () => {
                if (chrome.runtime.lastError) {
                    console.error('[BrowserUse] Debugger detach error:', chrome.runtime.lastError.message);
                }
            });
        }
    }

    async startTask(task, tabId, settings) {
        this.isRunning = true;
        this.currentTask = task;
        this.currentTabId = tabId;
        this.settings = settings;
        this.history = [];
        this.currentStep = 0;
        
        this.llmService = new LLMService(settings);
        
        this.sendStatusUpdate('running', 'Initializing...');
        
        try {
            // Ensure content script is injected
            await this.ensureContentScript();
            
            this.sendStatusUpdate('running', 'Analyzing task...');
            await this.executeTaskLoop();
        } catch (error) {
            console.error('Task error:', error);
            this.sendMessage({ type: 'task_error', error: error.message });
            this.isRunning = false;
        }
    }

    async ensureContentScript() {
        try {
            // First, check if we're on a valid page
            const tab = await chrome.tabs.get(this.currentTabId);
            const url = tab.url || '';
            
            console.log('Attempting to automate URL:', url);
            
            // Check for unsupported pages
            const isInvalidPage = 
                url.startsWith('chrome://') || 
                url.startsWith('chrome-extension://') || 
                url.startsWith('edge://') || 
                url.startsWith('about:') ||
                url === '' ||
                url === 'about:blank' ||
                url.startsWith('chrome-search://');
            
            if (isInvalidPage) {
                let pageType = 'Unknown';
                if (url.startsWith('chrome://')) pageType = 'Chrome internal page';
                else if (url.startsWith('chrome-extension://')) pageType = 'Extension page';
                else if (url.startsWith('about:')) pageType = 'About page';
                else if (url === '' || url === 'about:blank') pageType = 'Empty/blank page';
                else if (url.startsWith('chrome-search://')) pageType = 'Chrome search page';
                
                throw new Error(`Cannot automate ${pageType}.\n\nCurrent URL: ${url}\n\nPlease navigate to:\n• A regular website (http:// or https://)\n• Or open test-simple.html from your file system\n\nExamples: google.com, example.com, wikipedia.org`);
            }
            
            console.log('Checking content script on:', url);
            
            // Try to ping the content script (with timeout)
            const response = await Promise.race([
                this.getBrowserState(),
                new Promise(resolve => setTimeout(() => resolve({ timeout: true }), 2000))
            ]);
            
            // If we got a valid response, content script is ready
            if (response.url && !response.error && !response.timeout) {
                console.log('Content script already loaded');
                return;
            }
            
            // Content script not responding, try to inject it
            console.log('Content script not found, injecting...');
            
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: this.currentTabId },
                    files: ['content.js']
                });
                console.log('Content script injected');
            } catch (injectError) {
                console.error('Failed to inject content script:', injectError);
                throw new Error(`Cannot inject script on this page. Try refreshing the page (F5) or use a different website.`);
            }
            
            // Wait for script to initialize
            await this.sleep(1000);
            
            // Verify it's working now
            const verifyResponse = await Promise.race([
                this.getBrowserState(),
                new Promise(resolve => setTimeout(() => resolve({ timeout: true }), 2000))
            ]);
            
            if (verifyResponse.timeout || verifyResponse.error) {
                throw new Error('Content script loaded but not responding. Please refresh the page and try again.');
            }
            
            console.log('Content script verified and ready');
            
        } catch (error) {
            console.error('Error in ensureContentScript:', error);
            
            // Re-throw with the original message if it's already user-friendly
            if (error.message.includes('Cannot automate') || 
                error.message.includes('Cannot inject') ||
                error.message.includes('not responding')) {
                throw error;
            }
            
            // Otherwise, provide a generic helpful message
            throw new Error(`Failed to initialize: ${error.message}. Try refreshing the page (F5) first.`);
        }
    }

    stopTask() {
        this.isRunning = false;
        this.currentTask = null;
    }

    async executeTaskLoop() {
        while (this.isRunning && this.currentStep < this.maxSteps) {
            this.currentStep++;
            this.sendMessage({ 
                type: 'progress_update', 
                step: this.currentStep, 
                maxSteps: this.maxSteps 
            });

            // Get browser state
            const browserState = await this.getBrowserState();
            
            // Get next action from LLM
            this.sendStatusUpdate('running', 'Thinking...');
            const action = await this.llmService.getNextAction(
                this.currentTask, 
                browserState, 
                this.history
            );

            if (!action) {
                throw new Error('Failed to get next action from LLM');
            }

            // Execute action
            this.sendStatusUpdate('running', `Executing: ${action.type}`);
            const result = await this.executeAction(action);
            
            // Record in history
            this.history.push({
                step: this.currentStep,
                action: action,
                result: result
            });

            // Send action to popup
            this.sendMessage({
                type: 'action_executed',
                action: {
                    type: action.type,
                    details: this.formatActionDetails(action),
                    error: result.error
                }
            });

            // Check if task is done
            if (action.type === 'done') {
                this.sendMessage({ 
                    type: 'task_completed', 
                    result: { text: action.text } 
                });
                this.isRunning = false;
                break;
            }

            // Check for errors
            if (result.error) {
                const errorCount = this.history.filter(h => h.result.error).length;
                if (errorCount >= 3) {
                    throw new Error('Too many consecutive errors. Stopping task.');
                }
            }

            // Small delay between actions
            await this.sleep(1000);
        }

        if (this.currentStep >= this.maxSteps) {
            throw new Error('Maximum steps reached');
        }
    }

    async getBrowserState() {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                console.warn('getBrowserState timeout');
                resolve({ error: 'Timeout waiting for page state' });
            }, 5000);
            
            chrome.tabs.sendMessage(
                this.currentTabId,
                { type: 'get_state' },
                (response) => {
                    clearTimeout(timeout);
                    
                    if (chrome.runtime.lastError) {
                        console.error('Get state error:', chrome.runtime.lastError);
                        resolve({ error: chrome.runtime.lastError.message });
                    } else if (!response) {
                        console.error('No response from content script');
                        resolve({ error: 'No response from content script' });
                    } else {
                        resolve(response);
                    }
                }
            );
        });
    }

    async executeAction(action) {
        return new Promise((resolve) => {
            chrome.tabs.sendMessage(
                this.currentTabId,
                { type: 'execute_action', action: action },
                (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('Execute action error:', chrome.runtime.lastError);
                        resolve({ error: chrome.runtime.lastError.message });
                    } else if (!response) {
                        console.error('No response from action execution');
                        resolve({ error: 'No response from content script' });
                    } else {
                        resolve(response);
                    }
                }
            );
        });
    }

    formatActionDetails(action) {
        switch (action.type) {
            case 'click':
                return `Click element ${action.index}`;
            case 'input_text':
                return `Input text: "${action.text}" into element ${action.index}`;
            case 'navigate':
                return `Navigate to: ${action.url}`;
            case 'scroll':
                return `Scroll ${action.down ? 'down' : 'up'} ${action.pages} pages`;
            case 'search':
                return `Search for: "${action.query}"`;
            case 'done':
                return action.text;
            default:
                return JSON.stringify(action);
        }
    }

    sendStatusUpdate(status, text) {
        this.sendMessage({ type: 'status_update', status, text });
    }

    sendMessage(message) {
        chrome.runtime.sendMessage(message).catch(() => {
            // Popup might be closed
        });
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// LLM Service - Handles communication with various LLM providers
class LLMService {
    constructor(settings) {
        this.provider = settings.llmProvider;
        this.apiKey = settings.apiKey;
        this.model = settings.model || this.getDefaultModel();
        this.conversationHistory = [];
    }

    getDefaultModel() {
        const defaults = {
            'openai': 'gpt-4o',
            'anthropic': 'claude-3-5-sonnet-20241022',
            'google': 'gemini-2.0-flash-exp',
            'browser-use': 'default'
        };
        return defaults[this.provider] || 'gpt-4o';
    }

    async getNextAction(task, browserState, history) {
        const prompt = this.buildPrompt(task, browserState, history);
        
        this.conversationHistory.push({
            role: 'user',
            content: prompt
        });

        try {
            const response = await this.callLLM(this.conversationHistory);
            
            this.conversationHistory.push({
                role: 'assistant',
                content: response
            });

            return this.parseAction(response);
        } catch (error) {
            console.error('LLM API Error:', error);
            throw new Error(`LLM API Error: ${error.message}`);
        }
    }

    buildPrompt(task, browserState, history) {
        let prompt = `You are a browser automation assistant. Your task is: "${task}"\n\n`;
        
        prompt += `Current browser state:\n`;
        prompt += `URL: ${browserState.url || 'unknown'}\n`;
        prompt += `Title: ${browserState.title || 'unknown'}\n`;
        
        if (browserState.elements && browserState.elements.length > 0) {
            prompt += `\nInteractive elements (IMPORTANT: indices start from 1, NOT 0):\n`;
            browserState.elements.forEach(el => {
                prompt += `${el.index}: ${el.tag} - ${el.text || el.placeholder || el.type}\n`;
            });
        } else {
            prompt += `\nNo interactive elements found. Use scroll(), wait(), or navigate() to find elements.\n`;
        }

        if (history.length > 0) {
            prompt += `\nRecent action history:\n`;
            history.slice(-5).forEach(h => {
                const error = h.result.error ? ` (Error: ${h.result.error})` : '';
                prompt += `Step ${h.step}: ${h.action.type}${error}\n`;
            });
        }

        prompt += `\nIMPORTANT RULES:\n`;
        prompt += `1. Element indices start from 1. Index 0 is INVALID.\n`;
        prompt += `2. Only use indices from the list above.\n`;
        prompt += `3. If no elements available, use scroll(), wait(), or navigate().\n`;
        prompt += `4. After clicking buttons (like Search, Submit), use wait() to let page load.\n`;
        prompt += `5. DO NOT use done() until the ACTUAL TASK is complete (not just one step).\n`;
        prompt += `6. For searches/forms: Fill → Click Submit → Wait → Analyze Results → Then done().\n`;
        prompt += `7. If page is loading or changed, wait before extracting information.\n`;
        prompt += `\nAvailable actions (respond with ONE):\n`;
        prompt += `{"type": "click", "index": <number>} - Click element by index (must be >= 1)\n`;
        prompt += `{"type": "input_text", "index": <number>, "text": "<text>", "clear": true} - Type in input field\n`;
        prompt += `{"type": "navigate", "url": "<url>"} - Go to URL\n`;
        prompt += `{"type": "scroll", "down": true, "pages": 1} - Scroll page (down:true for down, false for up)\n`;
        prompt += `{"type": "search", "query": "<query>", "engine": "google"} - Web search (engines: google, duckduckgo, bing)\n`;
        prompt += `{"type": "wait", "seconds": 3} - Wait for page load/changes (use after clicks that navigate)\n`;
        prompt += `{"type": "done", "text": "<summary>", "success": true} - ONLY when full task is complete\n`;
        prompt += `\nRespond with ONLY the JSON object, no other text or explanation.`;

        return prompt;
    }

    async callLLM(messages) {
        switch (this.provider) {
            case 'openai':
                return await this.callOpenAI(messages);
            case 'anthropic':
                return await this.callAnthropic(messages);
            case 'google':
                return await this.callGoogle(messages);
            case 'browser-use':
                return await this.callBrowserUse(messages);
            default:
                throw new Error(`Unsupported provider: ${this.provider}`);
        }
    }

    async callOpenAI(messages) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'OpenAI API request failed');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async callAnthropic(messages) {
        // Convert messages format for Anthropic
        const systemMessage = messages.find(m => m.role === 'system');
        const conversationMessages = messages.filter(m => m.role !== 'system');

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: 1000,
                system: systemMessage?.content || '',
                messages: conversationMessages
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Anthropic API request failed');
        }

        const data = await response.json();
        return data.content[0].text;
    }

    async callGoogle(messages) {
        // Format for Google Gemini API
        const contents = messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: contents,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1000
                    }
                })
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Google API request failed');
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    async callBrowserUse(messages) {
        const response = await fetch('https://api.browser-use.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                messages: messages,
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Browser-Use API request failed');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    parseAction(response) {
        try {
            // Extract JSON from response (in case there's extra text)
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }
            
            const action = JSON.parse(jsonMatch[0]);
            
            // Validate action has type
            if (!action.type) {
                throw new Error('Action missing type field');
            }
            
            return action;
        } catch (error) {
            console.error('Failed to parse action:', response);
            throw new Error(`Failed to parse LLM response: ${error.message}`);
        }
    }
}

// Initialize the agent
const agent = new BrowserUseAgent();
