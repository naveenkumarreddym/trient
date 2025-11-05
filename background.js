// Background Service Worker - Agent Orchestrator
// Side Panel Handler - Enable side panel only for the current tab
chrome.action.onClicked.addListener((tab) => {
    const panelUrl = `popup.html?tabId=${tab.id}`;
    chrome.sidePanel.setOptions({ tabId: tab.id, path: panelUrl, enabled: true });
    chrome.sidePanel.open({ tabId: tab.id });
});

class BrowserUseAgent {
    constructor() {
        // Map to store context for each tab
        this.contextMap = new Map();
        this.maxSteps = 100;

        this.setupMessageListener();

        // Clean up context when a tab is closed
        chrome.tabs.onRemoved.addListener((tabId) => {
            this.contextMap.delete(tabId);
        });
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            const tabId = sender.tab?.id || message.tabId;
            if (!tabId) return; // Ignore messages without a tab context

            // Get or create context for the tab
            if (!this.contextMap.has(tabId)) {
                this.contextMap.set(tabId, {
                    isRunning: false,
                    currentTask: null,
                    settings: null,
                    history: [],
                    currentStep: 0,
                    llmService: null,
                });
            }
            const context = this.contextMap.get(tabId);

            if (message.type === 'start_task') {
                this.startTask(message.task, tabId, message.settings, context);
                return false;
            } else if (message.type === 'stop_task') {
                this.stopTask(context);
                return false;
            } else if (message.type === 'cdp_click') {
                this.performCdpClick(tabId, message.x, message.y, sendResponse);
                return true;
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

    async startTask(task, tabId, settings, context) {
        context.isRunning = true;
        context.currentTask = task;
        context.settings = settings;
        context.history = [];
        context.currentStep = 0;
        context.llmService = new LLMService(settings);

        this.sendStatusUpdate(tabId, 'running', 'Initializing...');

        try {
            await this.ensureContentScript(tabId);
            this.sendStatusUpdate(tabId, 'running', 'Analyzing task...');
            await this.executeTaskLoop(tabId, context);
        } catch (error) {
            console.error(`Task error in tab ${tabId}:`, error);
            this.sendMessageToTab(tabId, { type: 'task_error', error: error.message });
            context.isRunning = false;
        }
    }

    async ensureContentScript(tabId) {
        try {
            const tab = await chrome.tabs.get(tabId);
            const url = tab.url || '';
            
            // Check if the page is restricted (chrome://, edge://, about:, or new tab)
            const isRestrictedPage = url.startsWith('chrome://') || 
                                     url.startsWith('edge://') || 
                                     url.startsWith('about:') ||
                                     url === '' ||
                                     url === 'chrome://newtab/' ||
                                     url === 'edge://newtab/';
            
            if (isRestrictedPage) {
                // Automatically navigate to google.com
                this.sendStatusUpdate(tabId, 'running', '🌐 Navigating to google.com...');
                await chrome.tabs.update(tabId, { url: 'https://www.google.com' });
                
                // Wait for navigation to complete
                await new Promise((resolve) => {
                    const listener = (updatedTabId, changeInfo) => {
                        if (updatedTabId === tabId && changeInfo.status === 'complete') {
                            chrome.tabs.onUpdated.removeListener(listener);
                            resolve();
                        }
                    };
                    chrome.tabs.onUpdated.addListener(listener);
                    
                    // Timeout after 10 seconds
                    setTimeout(() => {
                        chrome.tabs.onUpdated.removeListener(listener);
                        resolve();
                    }, 10000);
                });
                
                // Wait a bit more for the page to be fully ready
                await this.sleep(1000);
            }

            const results = await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: () => window.hasOwnProperty('browserStateExtractorInjected'),
            });

            if (results[0] && results[0].result) return; // Already injected
        } catch (e) {
            // If still failing after navigation attempt, provide helpful error
            if (e.message.includes('Cannot access')) {
                throw new Error(`Cannot access tab: ${e.message}. 💡 Tip: Try manually navigating to a website first.`);
            }
            throw new Error(`Cannot access tab: ${e.message}`);
        }

        this.sendStatusUpdate(tabId, 'running', 'Injecting script...');
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js'],
        });

        // Wait for the script to be ready
        let retries = 10;
        while (retries > 0) {
            try {
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    func: () => window.hasOwnProperty('browserStateExtractorInjected'),
                });
                if (results[0] && results[0].result) return; // Success
            } catch (e) {
                // Ignore errors during retries
            }
            await this.sleep(500);
            retries--;
        }

        throw new Error('Failed to inject content script. Please refresh the page.');
    }

    stopTask(context) {
        context.isRunning = false;
        context.currentTask = null;
    }

    async executeTaskLoop(tabId, context) {
        while (context.isRunning && context.currentStep < this.maxSteps) {
            context.currentStep++;
            this.sendMessageToTab(tabId, { 
                type: 'progress_update', 
                step: context.currentStep, 
                maxSteps: this.maxSteps 
            });

            const browserState = await this.getBrowserState(tabId);
            
            this.sendStatusUpdate(tabId, 'running', 'Thinking...');
            const action = await context.llmService.getNextAction(
                context.currentTask, 
                browserState, 
                context.history
            );

            if (!action) {
                throw new Error('Failed to get next action from LLM');
            }

            this.sendStatusUpdate(tabId, 'running', `Executing: ${action.type}`);
            const result = await this.executeAction(action, tabId);
            
            context.history.push({
                step: context.currentStep,
                action: action,
                result: result
            });

            this.sendMessageToTab(tabId, {
                type: 'history_update',
                action: { ...action, details: this.formatActionDetails(action), result: result }
            });

            if (action.type === 'done') {
                this.sendMessageToTab(tabId, { 
                    type: 'task_completed', 
                    result: { text: action.text } 
                });
                context.isRunning = false;
                break;
            }

            if (result.error) {
                const errorCount = context.history.slice(-3).filter(h => h.result.error).length;
                if (errorCount >= 3) {
                    throw new Error('Too many consecutive errors. Stopping task.');
                }
            }

            await this.sleep(1000);
        }

        if (context.currentStep >= this.maxSteps) {
            throw new Error('Maximum steps reached');
        }
    }

    async getBrowserState(tabId) {
        this.sendStatusUpdate(tabId, 'running', 'Extracting page content...');
        return new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(
                tabId,
                { type: 'get_browser_state' },
                (response) => {
                    if (chrome.runtime.lastError) {
                        return reject(new Error(chrome.runtime.lastError.message));
                    }
                    if (response && response.success) {
                        resolve(response.data);
                    } else {
                        reject(new Error(response?.error || 'Content script not responding.'));
                    }
                }
            );
        });
    }

    async executeAction(action, tabId) {
        return new Promise((resolve) => {
            chrome.tabs.sendMessage(
                tabId,
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

    sendStatusUpdate(tabId, status, text) {
        this.sendMessageToTab(tabId, { type: 'status_update', status, text });
    }

    sendMessageToTab(tabId, message) {
        // Send to the specific tab's popup/side panel
        chrome.runtime.sendMessage({ ...message, tabId }).catch(err => {
            // Ignore errors if the side panel for this tab isn't open
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
