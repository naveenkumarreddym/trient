// Content Script - DOM Interaction Layer
class BrowserStateExtractor {
    constructor() {
        this.setupMessageListener();
        this.interactiveElements = [];
        this.elementIndex = 1;

    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            (async () => {
                if (message.type === 'get_browser_state') {
                    try {
                        const state = await this.getBrowserState();
                        sendResponse({ success: true, data: state });
                    } catch (error) {
                        sendResponse({ success: false, error: error.message });
                    }
                } else if (message.type === 'execute_action') {
                    try {
                        const result = await this.executeAction(message.action);
                        sendResponse(result);
                    } catch (error) {
                        sendResponse({ error: error.message });
                    }
                }
            })();

            return true; // Keep the message port open for the async response
        });
    }

    async getBrowserState() {
        try {

            
            // Get page info
            const url = window.location.href;
            const title = document.title;
            
            // Extract interactive elements
            const elements = this.extractInteractiveElements();

            
            // Get page text content (limited)
            const textContent = this.getPageTextContent();
            
            return {
                url,
                title,
                elements,
                textContent,
                scrollY: window.scrollY,
                scrollHeight: document.documentElement.scrollHeight,
                viewportHeight: window.innerHeight
            };
        } catch (error) {

            return { error: error.message };
        }
    }

    extractInteractiveElements() {
        this.interactiveElements = [];
        this.elementIndex = 1;
        const elementList = [];
        const maxElements = 150; // Increased limit



        // Traverse both regular DOM and Shadow DOM
        this.traverseDOM(document.body, elementList, maxElements);



        return elementList;
    }

    traverseDOM(root, elementList, maxElements) {
        if (!root || elementList.length >= maxElements) {
            return;
        }

        // Process current element if it's interactive
        if (root.nodeType === Node.ELEMENT_NODE && this.isInteractiveElement(root)) {
            if (this.isElementVisible(root)) {
                // Store element reference
                this.interactiveElements[this.elementIndex] = root;

                // Extract element info
                const info = {
                    index: this.elementIndex,
                    tag: root.tagName.toLowerCase(),
                    type: root.type || null,
                    text: this.getElementText(root),
                    placeholder: root.placeholder || null,
                    value: root.value || null,
                    href: root.href || null,
                    ariaLabel: root.getAttribute('aria-label') || null,
                    role: root.getAttribute('role') || null,
                    className: root.className || null,
                    id: root.id || null,
                    inShadowDOM: root.getRootNode() !== document
                };

                elementList.push(info);
                this.elementIndex++;

                if (elementList.length >= maxElements) {
                    return;
                }
            }
        }

        // Traverse Shadow DOM if present (open shadow roots)
        if (root.shadowRoot) {

            this.traverseDOM(root.shadowRoot, elementList, maxElements);
        }

        // Traverse regular child nodes
        const children = root.children || root.childNodes || [];
        for (let i = 0; i < children.length && elementList.length < maxElements; i++) {
            this.traverseDOM(children[i], elementList, maxElements);
        }
    }

    isInteractiveElement(element) {
        if (!element || element.nodeType !== Node.ELEMENT_NODE) {
            return false;
        }

        const tagName = element.tagName.toLowerCase();

        // Skip html and body
        if (tagName === 'html' || tagName === 'body') {
            return false;
        }

        // Primary interactive tags
        const interactiveTags = new Set([
            'a', 'button', 'input', 'select', 'textarea',
            'details', 'summary', 'option', 'optgroup'
        ]);

        if (interactiveTags.has(tagName)) {
            return true;
        }

        // Check for ARIA roles
        const role = element.getAttribute('role');
        const interactiveRoles = new Set([
            'button', 'link', 'menuitem', 'option', 'radio',
            'checkbox', 'tab', 'textbox', 'combobox', 'slider',
            'spinbutton', 'search', 'searchbox'
        ]);

        if (role && interactiveRoles.has(role)) {
            return true;
        }

        // Check for event handlers
        const interactiveAttributes = [
            'onclick', 'onmousedown', 'onmouseup', 'onkeydown', 
            'onkeyup', 'tabindex'
        ];

        for (const attr of interactiveAttributes) {
            if (element.hasAttribute(attr)) {
                return true;
            }
        }

        // Check for cursor: pointer (indicates clickability)
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.cursor === 'pointer') {
            return true;
        }

        // Check for search indicators (common in modern web apps)
        const className = element.className || '';
        const id = element.id || '';
        const searchIndicators = [
            'search', 'magnify', 'glass', 'lookup', 'find',
            'query', 'search-icon', 'search-btn'
        ];

        const combinedText = (className + ' ' + id).toLowerCase();
        if (searchIndicators.some(indicator => combinedText.includes(indicator))) {
            return true;
        }

        return false;
    }

    isElementVisible(el) {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        
        return (
            rect.width > 0 &&
            rect.height > 0 &&
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0'
        );
    }

    getElementText(el) {
        // Get visible text from element
        let text = '';
        
        // Try different text sources
        if (el.ariaLabel) {
            text = el.ariaLabel;
        } else if (el.innerText) {
            text = el.innerText;
        } else if (el.textContent) {
            text = el.textContent;
        } else if (el.value) {
            text = el.value;
        } else if (el.alt) {
            text = el.alt;
        } else if (el.title) {
            text = el.title;
        }

        // Clean and truncate
        text = text.trim().replace(/\s+/g, ' ');
        return text.substring(0, 100);
    }

    getPageTextContent() {
        const maxTextLength = 4000; // Limit text content to avoid performance issues
        let text = document.body.innerText || '';
        if (text.length > maxTextLength) {
            text = text.substring(0, maxTextLength) + '...';
        }
        return text;
    }

    async executeAction(action) {
        try {

            
            let result;
            switch (action.type) {
                case 'click':
                    result = await this.clickElement(action);
                    break;
                case 'input_text':
                    result = await this.inputText(action);
                    break;
                case 'navigate':
                    result = await this.navigate(action);
                    break;
                case 'scroll':
                    result = await this.scroll(action);
                    break;
                case 'search':
                    result = await this.search(action);
                    break;
                case 'wait':
                    result = await this.wait(action);
                    break;
                case 'done':
                    result = { success: true };
                    break;
                default:
                    result = { error: `Unknown action type: ${action.type}` };
            }
            

            return result;
        } catch (error) {

            return { error: error.message };
        }
    }

    /**
     * Find an element by its info, traversing shadow DOMs as needed.
     * @param {Object} info - The element info object from elementList.
     * @returns {Element|null}
     */
    findElementByInfo(info) {
        // Try to use id if available
        if (info.id) {
            // If not in shadow DOM, use document.getElementById
            if (!info.inShadowDOM) {
                return document.getElementById(info.id);
            }
            // If in shadow DOM, search recursively
            const found = this.findElementByIdInShadowRoots(document.body, info.id);
            if (found) return found;
        }
        // Fallback: try to match by tag/class/text/aria/role in shadow DOMs
        const candidates = [];
        this.collectCandidates(document.body, info, candidates, 0);
        // Try to find the best match
        if (candidates.length === 1) return candidates[0];
        if (candidates.length > 1) {
            // Prefer exact text match if possible
            for (const el of candidates) {
                if (this.getElementText(el) === info.text) return el;
            }
            return candidates[0];
        }
        return null;
    }

    /**
     * Recursively search for element by id in shadow roots.
     */
    findElementByIdInShadowRoots(root, id) {
        if (!root) return null;
        if (root.id === id) return root;
        // Traverse shadow root if present
        if (root.shadowRoot) {
            const found = this.findElementByIdInShadowRoots(root.shadowRoot, id);
            if (found) return found;
        }
        // Traverse children
        const children = root.children || root.childNodes || [];
        for (let i = 0; i < children.length; i++) {
            const found = this.findElementByIdInShadowRoots(children[i], id);
            if (found) return found;
        }
        return null;
    }

    /**
     * Collect candidate elements matching the info, traversing shadow DOMs.
     */
    collectCandidates(root, info, candidates, depth) {
        if (!root || depth > 10) return;
        if (root.nodeType === Node.ELEMENT_NODE) {
            let match = root.tagName.toLowerCase() === info.tag;
            if (info.className && root.className && root.className === info.className) match = true;
            if (info.role && root.getAttribute('role') === info.role) match = true;
            if (info.ariaLabel && root.getAttribute('aria-label') === info.ariaLabel) match = true;
            if (info.text && this.getElementText(root) === info.text) match = true;
            if (match) candidates.push(root);
        }
        // Traverse shadow DOM
        if (root.shadowRoot) {
            this.collectCandidates(root.shadowRoot, info, candidates, depth + 1);
        }
        // Traverse children
        const children = root.children || root.childNodes || [];
        for (let i = 0; i < children.length; i++) {
            this.collectCandidates(children[i], info, candidates, depth + 1);
        }
    }

    /**
     * Build a shadow DOM path for the given element.
     * Returns an array of {selector, index} for each shadow root hop.
     */
    buildShadowDomPath(element) {
        const path = [];
        let el = element;
        while (el) {
            let parent = el.getRootNode().host;
            let selector = el.id ? `#${el.id}` : el.className ? `${el.tagName.toLowerCase()}.${el.className.split(' ').join('.')}` : el.tagName.toLowerCase();
            let index = 0;
            if (parent) {
                // Find index among siblings of same selector
                const siblings = Array.from(parent.shadowRoot ? parent.shadowRoot.querySelectorAll(selector) : []);
                index = siblings.indexOf(el);
            } else {
                // Top-level: find index among all matches in document
                const siblings = Array.from(document.querySelectorAll(selector));
                index = siblings.indexOf(el);
            }
            path.unshift({ selector, index });
            el = parent;
        }
        return path;
    }

    async clickElement(action) {
        try {
            // Use robust lookup for the element at click time
            const elementInfo = this.interactiveElements[action.index]
                ? {
                    ...this.interactiveElements[action.index],
                    // Add extra fields if needed
                }
                : null;
            let element = null;
            if (elementInfo) {
                element = this.findElementByInfo(elementInfo);
            }
            // Fallback to direct reference if lookup fails
            if (!element) {
                element = this.interactiveElements[action.index];
            }
            if (!element) {
                return { error: `Element with index ${action.index} not found (including shadow DOM lookup)` };
            }

            const tagName = element.tagName?.toLowerCase() || '';

            // 1. Scroll into view and wait
            element.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
            await this.sleep(100);

            // 2. Get element's bounding box
            const rect = element.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) {

                try {
                    element.click();
                    return { success: true, method: 'direct_click_zero_size' };
                } catch (e) {
                    return { error: `Direct click on zero-size element failed: ${e.message}` };
                }
            }

            // 3. Calculate click coordinates
            let clickX = rect.left + rect.width / 2;
            let clickY = rect.top + rect.height / 2;

            // 4. Check for occlusion
            const elementAtPoint = this.deepElementFromPoint(clickX, clickY);
            const isOccluded = elementAtPoint && elementAtPoint !== element && !element.contains(elementAtPoint);

            const preferDirectClick = ['a', 'button', 'input', 'textarea'].includes(tagName);

            // 5. Robust click fallback chain
            const reason = isOccluded ? 'occluded' : `direct click preferred for <${tagName}>`;
            let lastError = null;

            // (1) Try direct JS click
            try {
                if (typeof element.focus === 'function') element.focus();
                await this.sleep(50);
                element.click();
                await this.sleep(100);
                return { success: true, method: 'direct_click' };
            } catch (e) {
                lastError = `[Direct click failed] ${e.message}`;

            }

            // (2) Try JS-injected shadow DOM click via background
            try {
                const path = this.buildShadowDomPath(element);
                const jsClickResult = await new Promise((resolve) => {
                    chrome.runtime.sendMessage(
                        {
                            type: 'js_click',
                            path: path
                        },
                        (response) => {
                            if (chrome.runtime.lastError) {
                                resolve({ error: `JS click failed: ${chrome.runtime.lastError.message}` });
                            } else if (response && response.success) {
                                resolve({ success: true, method: 'js_shadow_click' });
                            } else {
                                const err = (response && response.error) || 'Unknown error';
                                resolve({ error: err });
                            }
                        }
                    );
                });
                if (jsClickResult.success) return jsClickResult;
                lastError = `[JS shadow click failed] ${jsClickResult.error}`;

            } catch (e) {
                lastError = `[JS shadow click threw] ${e.message}`;

            }

            // (3) Try coordinate-based click via background script (CDP)
            try {
                const cdpClickResult = await new Promise((resolve) => {
                    chrome.runtime.sendMessage(
                        { 
                            type: 'cdp_click', 
                            x: Math.round(clickX), 
                            y: Math.round(clickY) 
                        },
                        (response) => {
                            if (chrome.runtime.lastError) {
                                resolve({ error: `CDP click failed: ${chrome.runtime.lastError.message}` });
                            } else if (response && response.success) {
                                resolve({ success: true, method: 'cdp_click' });
                            } else {
                                const err = (response && response.error) || 'Unknown error';
                                resolve({ error: err });
                            }
                        }
                    );
                });
                if (cdpClickResult.success) return cdpClickResult;
                lastError = `[CDP click failed] ${cdpClickResult.error}`;

            } catch (e) {
                lastError = `[CDP click threw] ${e.message}`;

            }

            // (4) As a last resort, try dispatching synthetic mouse events directly on the element
            try {
                const eventOpts = { bubbles: true, cancelable: true, view: window };
                element.dispatchEvent(new MouseEvent('mouseover', eventOpts));
                element.dispatchEvent(new MouseEvent('mousemove', eventOpts));
                element.dispatchEvent(new MouseEvent('mousedown', eventOpts));
                element.dispatchEvent(new MouseEvent('mouseup', eventOpts));
                element.dispatchEvent(new MouseEvent('click', eventOpts));
                await this.sleep(100);
                return { success: true, method: 'synthetic_mouse_events' };
            } catch (e) {
                lastError = `[Synthetic mouse events failed] ${e.message}`;

            }

            // All methods failed
            return { error: `All click methods failed. Last error: ${lastError}` };


        } catch (error) {

            return { error: `Failed to click element: ${error.message}` };
        }
    }

    highlightElement(element) {
        const originalOutline = element.style.outline;
        const originalBackground = element.style.backgroundColor;
        
        element.style.outline = '3px solid #667eea'; // A nice purple-blue
        element.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
        
        setTimeout(() => {
            element.style.outline = originalOutline;
            element.style.backgroundColor = originalBackground;
        }, 1000); // Highlight for 1 second
    }

    deepElementFromPoint(x, y) {
        /**
         * Find element at coordinates, traversing through shadow DOM boundaries
         * Similar to document.elementFromPoint but shadow DOM-aware
         */
        let element = document.elementFromPoint(x, y);
        
        // Traverse shadow DOM if present
        while (element && element.shadowRoot) {
            const shadowElement = element.shadowRoot.elementFromPoint(x, y);
            if (shadowElement) {
                element = shadowElement;
            } else {
                break;
            }
        }
        
        return element;
    }

    async inputText(action) {
        const element = this.interactiveElements[action.index];
        if (!element) {
            return { error: `Element with index ${action.index} not found` };
        }

        try {
            // Scroll element into view
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.sleep(300);
            
            // Focus the element
            element.focus();
            
            // Clear if needed
            if (action.clear !== false) {
                element.value = '';
            }
            
            // Set the value
            element.value = action.text;
            
            // Trigger input events
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            
            return { success: true };
        } catch (error) {
            return { error: `Failed to input text: ${error.message}` };
        }
    }

    async navigate(action) {
        try {
            window.location.href = action.url;
            return { success: true };
        } catch (error) {
            return { error: `Failed to navigate: ${error.message}` };
        }
    }

    async scroll(action) {
        try {
            const viewportHeight = window.innerHeight;
            const scrollAmount = viewportHeight * (action.pages || 1);
            const currentScroll = window.scrollY;
            
            const newScroll = action.down 
                ? currentScroll + scrollAmount 
                : Math.max(0, currentScroll - scrollAmount);
            
            window.scrollTo({
                top: newScroll,
                behavior: 'smooth'
            });
            
            await this.sleep(500);
            
            return { success: true };
        } catch (error) {
            return { error: `Failed to scroll: ${error.message}` };
        }
    }

    async search(action) {
        try {
            const searchEngines = {
                'duckduckgo': 'https://duckduckgo.com/?q=',
                'google': 'https://www.google.com/search?q=',
                'bing': 'https://www.bing.com/search?q='
            };
            
            const engine = action.engine || 'duckduckgo';
            const baseUrl = searchEngines[engine] || searchEngines.duckduckgo;
            const query = encodeURIComponent(action.query);
            
            window.location.href = baseUrl + query;
            return { success: true };
        } catch (error) {
            return { error: `Failed to search: ${error.message}` };
        }
    }

    async wait(action) {
        try {
            const seconds = action.seconds || 3;
            const ms = Math.min(seconds * 1000, 10000); // Max 10 seconds
            
            await this.sleep(ms);
            
            return { 
                success: true, 
                extracted_content: `Waited ${seconds} seconds for page to load/update` 
            };
        } catch (error) {
            return { error: `Failed to wait: ${error.message}` };
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the state extractor (only once)
if (!window.browserStateExtractorInjected) {
    window.browserStateExtractorInjected = true;
    window.stateExtractor = new BrowserStateExtractor();
} else {
}

// Visual feedback for actions
class VisualFeedback {
    static highlightElement(element) {
        const originalOutline = element.style.outline;
        const originalBackground = element.style.backgroundColor;
        
        element.style.outline = '3px solid #667eea';
        element.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
        
        setTimeout(() => {
            element.style.outline = originalOutline;
            element.style.backgroundColor = originalBackground;
        }, 1000);
    }

    static showActionIndicator(action) {
        const indicator = document.createElement('div');
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 999999;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            animation: slideIn 0.3s ease-out;
        `;
        
        indicator.innerHTML = `🤖 ${action}`;
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            indicator.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => indicator.remove(), 300);
        }, 2000);
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
