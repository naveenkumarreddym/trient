// Popup UI Controller
class PopupController {
    constructor() {
        this.isRunning = false;
        this.currentStep = 0;
        this.maxSteps = 100;
        this.initializeElements();
        this.loadSettings();
        this.attachEventListeners();
        this.setupMessageListener();
    }

    initializeElements() {
        // Minimize/restore config
        this.configSection = document.getElementById('configSection');
        this.minimizeConfigBtn = document.getElementById('minimizeConfig');
        this.configRestoreBar = document.getElementById('configRestoreBar');
        this.restoreConfigBtn = document.getElementById('restoreConfig');
        // Config elements
        this.llmProvider = document.getElementById('llmProvider');
        this.apiKey = document.getElementById('apiKey');
        this.model = document.getElementById('model');
        this.saveApiKeyBtn = document.getElementById('saveApiKey');

        // Task elements
        this.taskInput = document.getElementById('taskInput');
        this.startBtn = document.getElementById('startTask');
        this.stopBtn = document.getElementById('stopTask');

        // Status elements
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');
        this.progressContainer = document.getElementById('progressContainer');
        this.progressBar = document.getElementById('progressBar');
        this.progressText = document.getElementById('progressText');

        // History elements
        this.historyList = document.getElementById('historyList');
        
        // Result elements
        this.resultSection = document.querySelector('.result-section');
        this.resultContent = document.getElementById('resultContent');
    }

    loadSettings() {
        chrome.storage.local.get(['llmProvider', 'apiKey', 'model'], (result) => {
            if (result.llmProvider) {
                this.llmProvider.value = result.llmProvider;
            }
            if (result.apiKey) {
                this.apiKey.value = result.apiKey;
            }
            if (result.model) {
                this.model.value = result.model;
            }
        });
    }

    attachEventListeners() {
        // Minimize config section
        this.minimizeConfigBtn.addEventListener('click', () => {
            this.configSection.style.display = 'none';
            this.configRestoreBar.style.display = 'block';
            this.taskInput.parentElement.classList.add('expanded-task-section');
        });
        // Restore config section
        this.restoreConfigBtn.addEventListener('click', () => {
            this.configSection.style.display = 'block';
            this.configRestoreBar.style.display = 'none';
            this.taskInput.parentElement.classList.remove('expanded-task-section');
        });
        this.saveApiKeyBtn.addEventListener('click', () => this.saveSettings());
        this.startBtn.addEventListener('click', () => this.startTask());
        this.stopBtn.addEventListener('click', () => this.stopTask());
        
        // Save settings on change
        this.llmProvider.addEventListener('change', () => this.updateModelPlaceholder());
    }

    updateModelPlaceholder() {
        const provider = this.llmProvider.value;
        const modelDefaults = {
            'openai': 'gpt-4o',
            'anthropic': 'claude-3-5-sonnet-20241022',
            'google': 'gemini-2.0-flash',
            'browser-use': 'default'
        };
        this.model.placeholder = modelDefaults[provider] || 'Enter model name';
    }

    saveSettings() {
        const settings = {
            llmProvider: this.llmProvider.value,
            apiKey: this.apiKey.value,
            model: this.model.value
        };

        chrome.storage.local.set(settings, () => {
            this.showNotification('Settings saved successfully!');
        });
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.type) {
                case 'status_update':
                    this.updateStatus(message.status, message.text);
                    break;
                case 'action_executed':
                    this.addHistoryItem(message.action);
                    break;
                case 'progress_update':
                    this.updateProgress(message.step, message.maxSteps);
                    break;
                case 'task_completed':
                    this.taskCompleted(message.result);
                    break;
                case 'task_error':
                    this.taskError(message.error);
                    break;
            }
        });
    }

    async startTask() {
        const task = this.taskInput.value.trim();
        if (!task) {
            this.showNotification('Please enter a task');
            return;
        }

        const apiKey = this.apiKey.value.trim();
        if (!apiKey) {
            this.showNotification('Please enter an API key');
            return;
        }

        this.isRunning = true;
        this.startBtn.disabled = true;
        this.stopBtn.disabled = false;
        this.currentStep = 0;
        this.clearHistory();
        this.resultSection.style.display = 'none';
        this.progressContainer.style.display = 'block';

        this.updateStatus('running', 'Starting task...');

        // Get current tab
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        let tab = tabs[0];
        // If no tab, or tab is a Chrome/Edge/internal page, open google.com and use that
        const invalidPrefixes = [
            'chrome://', 'chrome-extension://', 'edge://', 'about:', 'chrome-search://', 'devtools://', 'vivaldi://', 'brave://', 'opera://'
        ];
        let isInvalid = false;
        if (!tab || !tab.url) {
            isInvalid = true;
        } else {
            for (const prefix of invalidPrefixes) {
                if (tab.url.startsWith(prefix)) {
                    isInvalid = true;
                    break;
                }
            }
        }
        if (isInvalid) {
            tab = await chrome.tabs.create({ url: 'https://www.google.com' });
            await new Promise(resolve => setTimeout(resolve, 1200));
        }

        // Send message to background script to start task
        chrome.runtime.sendMessage({
            type: 'start_task',
            task: task,
            tabId: tab.id,
            settings: {
                llmProvider: this.llmProvider.value,
                apiKey: this.apiKey.value,
                model: this.model.value
            }
        });
    }

    stopTask() {
        this.isRunning = false;
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;

        chrome.runtime.sendMessage({ type: 'stop_task' });
        this.updateStatus('idle', 'Task stopped by user');
    }

    updateStatus(status, text) {
        this.statusIndicator.className = `status-indicator ${status}`;
        this.statusText.textContent = text;
    }

    updateProgress(step, maxSteps) {
        this.currentStep = step;
        this.maxSteps = maxSteps;
        const percentage = (step / maxSteps) * 100;
        this.progressBar.style.width = `${percentage}%`;
        this.progressText.textContent = `Step ${step}/${maxSteps}`;
    }

    clearHistory() {
        this.historyList.innerHTML = '<div class="history-empty">No actions yet</div>';
    }

    addHistoryItem(action) {
        // Remove empty message if present
        const emptyMsg = this.historyList.querySelector('.history-empty');
        if (emptyMsg) {
            emptyMsg.remove();
        }

        const item = document.createElement('div');
        item.className = `history-item ${action.error ? 'error' : ''}`;
        
        const actionType = document.createElement('div');
        actionType.className = 'action-type';
        actionType.textContent = action.error ? '❌ Error' : `✓ ${this.formatActionType(action.type)}`;
        
        const actionDetails = document.createElement('div');
        actionDetails.className = 'action-details';
        actionDetails.textContent = action.details || action.error;
        
        item.appendChild(actionType);
        item.appendChild(actionDetails);
        
        this.historyList.insertBefore(item, this.historyList.firstChild);
        
        // Limit history to 20 items
        while (this.historyList.children.length > 20) {
            this.historyList.removeChild(this.historyList.lastChild);
        }
    }

    formatActionType(type) {
        return type
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
    }

    taskCompleted(result) {
        this.isRunning = false;
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        
        this.updateStatus('success', 'Task completed successfully!');
        
        if (result && result.text) {
            this.resultSection.style.display = 'block';
            this.resultContent.textContent = result.text;
        }
        
        this.showNotification('Task completed!');
    }

    taskError(error) {
        this.isRunning = false;
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        
        // Provide helpful suggestions based on error type
        let helpfulMessage = error;
        let suggestion = '';
        
        if (error.includes('Cannot automate this page')) {
            suggestion = '\n\n💡 Tip: Try navigating to a regular website (like google.com, example.com, etc.)';
        } else if (error.includes('refresh the page')) {
            suggestion = '\n\n💡 Tip: Press F5 to refresh, wait for page to load, then try again';
        } else if (error.includes('Cannot inject')) {
            suggestion = '\n\n💡 Tip: Some pages block scripts. Try a different website or reload the extension';
        } else if (error.includes('LLM API')) {
            suggestion = '\n\n💡 Tip: Check your API key and credits at your provider\'s dashboard';
        } else if (error.includes('not responding')) {
            suggestion = '\n\n💡 Tip: Reload the extension at chrome://extensions/ and refresh the page';
        }
        
        this.updateStatus('error', `❌ ${helpfulMessage}${suggestion}`);
        
        // Also add to history
        this.addHistoryItem({
            type: 'error',
            details: error,
            error: true
        });
    }

    showNotification(message) {
        // Create a temporary notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize popup controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
});
