// Content script for Text Buddy Chrome Extension
class TextBuddy {
    constructor() {
      this.apiBaseUrl = 'http://localhost:2000';
      this.chatHistory = [];
      this.isVisible = false;
      this.isProcessing = false;
      this.currentChatId = this.generateChatId();
      
      this.languages = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'ru': 'Russian',
        'zh': 'Chinese',
        'ja': 'Japanese',
        'ko': 'Korean',
        'ar': 'Arabic',
        'hi': 'Hindi'
      };
  
      this.init();
    }
  
    generateChatId() {
      return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
  
    init() {
      this.createUI();
      this.bindEvents();
      this.loadChatHistory();
      this.setupMessageListener();
    }
  
    setupMessageListener() {
      // Listen for messages from background script
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'toggleTextBuddy') {
          this.toggleVisibility();
          sendResponse({ success: true });
        } else if (request.action === 'openTextBuddy') {
          if (!this.isVisible) {
            this.toggleVisibility();
          }
          if (request.text) {
            this.textInput.value = request.text;
            this.handleTextInput();
          }
          sendResponse({ success: true });
        } else if (request.action === 'openTextBuddyWithAction') {
          if (!this.isVisible) {
            this.toggleVisibility();
          }
          if (request.text) {
            this.textInput.value = request.text;
            this.handleTextInput();
            
            // Auto-perform the action after a short delay
            setTimeout(() => {
              if (request.actionType === 'prompt') {
                this.handleAction('prompt');
              } else {
                this.handleAction(request.actionType);
              }
            }, 500);
          }
          sendResponse({ success: true });
        }
        
        return true; // Keep message channel open
      });
    }
  
    createUI() {
      // Create main container
      this.container = document.createElement('div');
      this.container.id = 'text-buddy-container';
      this.container.innerHTML = this.getUIHTML();
      
      // Add to page
      document.body.appendChild(this.container);
      
      // Get references to key elements
      this.textInput = this.container.querySelector('#tb-text-input');
      this.chatContainer = this.container.querySelector('#tb-chat-container');
      this.languageSelect = this.container.querySelector('#tb-language-select');
      this.toggleBtn = this.container.querySelector('#tb-toggle-btn');
      this.minimizeBtn = this.container.querySelector('#tb-minimize-btn');
      this.newChatBtn = this.container.querySelector('#tb-new-chat-btn');
      this.wordCount = this.container.querySelector('#tb-word-count');
      
      // Setup resize handle
      this.setupResizeHandle();
    }
  
    getUIHTML() {
      return `
        <div id="tb-toggle-btn" class="tb-toggle-button">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        
        <div id="tb-main-panel" class="tb-main-panel">
          <div class="tb-header">
            <div class="tb-header-left">
              <div class="tb-logo">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span>Text Buddy</span>
              </div>
            </div>
            <div class="tb-header-right">
              <button id="tb-new-chat-btn" class="tb-icon-btn" title="New Chat">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </button>
              <button id="tb-minimize-btn" class="tb-icon-btn" title="Minimize">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
            </div>
          </div>
  
          <div id="tb-chat-container" class="tb-chat-container">
            <div class="tb-welcome-message">
              <div class="tb-welcome-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <h3>Welcome to Text Buddy</h3>
              <p>Your AI-powered writing assistant. Translate, correct grammar, or use custom prompts to enhance your text.</p>
            </div>
          </div>
  
          <div class="tb-input-section">
            <div class="tb-language-row">
              <select id="tb-language-select" class="tb-language-select">
                <option value="en">🇺🇸 English</option>
                <option value="es">🇪🇸 Spanish</option>
                <option value="fr">🇫🇷 French</option>
                <option value="de">🇩🇪 German</option>
                <option value="it">🇮🇹 Italian</option>
                <option value="pt">🇵🇹 Portuguese</option>
                <option value="ru">🇷🇺 Russian</option>
                <option value="zh">🇨🇳 Chinese</option>
                <option value="ja">🇯🇵 Japanese</option>
                <option value="ko">🇰🇷 Korean</option>
                <option value="ar">🇸🇦 Arabic</option>
                <option value="hi">🇮🇳 Hindi</option>
              </select>
            </div>
            
            <div class="tb-input-container">
              <div class="tb-textarea-wrapper">
                <textarea 
                  id="tb-text-input" 
                  placeholder="Type or paste your text here... (up to 5000 words)"
                  maxlength="35000"
                  rows="4"
                ></textarea>
                <div class="tb-resize-handle"></div>
              </div>
              
              <div class="tb-input-footer">
                <div class="tb-word-count-container">
                  <span id="tb-word-count" class="tb-word-count">0 / 5000 words</span>
                </div>
                
                <div class="tb-button-group">
                  <button id="tb-translate-btn" class="tb-action-btn tb-translate" data-action="translate">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
                      <path d="M2 12h20"/>
                    </svg>
                    Translate
                  </button>
                  
                  <button id="tb-grammar-btn" class="tb-action-btn tb-grammar" data-action="correct">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 12l2 2 4-4"/>
                      <path d="M21 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
                      <path d="M3 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
                    </svg>
                    Grammar
                  </button>
                  
                  <button id="tb-prompt-btn" class="tb-action-btn tb-prompt" data-action="prompt">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Enhance
                  </button>
                  
                  <button id="tb-submit-btn" class="tb-submit-btn" disabled>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 2L11 13"/>
                      <path d="M22 2l-7 20-4-9-9-4 20-7z"/>
                    </svg>
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  
    setupResizeHandle() {
      const resizeHandle = this.container.querySelector('.tb-resize-handle');
      let isResizing = false;
      let startY = 0;
      let startHeight = 0;
  
      resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startY = e.clientY;
        startHeight = parseInt(window.getComputedStyle(this.textInput).height, 10);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        e.preventDefault();
      });
  
      const handleMouseMove = (e) => {
        if (!isResizing) return;
        const height = startHeight - (e.clientY - startY);
        if (height >= 80 && height <= 300) {
          this.textInput.style.height = height + 'px';
        }
      };
  
      const handleMouseUp = () => {
        isResizing = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  
    bindEvents() {
      // Toggle visibility
      this.toggleBtn.addEventListener('click', () => this.toggleVisibility());
      this.minimizeBtn.addEventListener('click', () => this.toggleVisibility());
  
      // New chat
      this.newChatBtn.addEventListener('click', () => this.startNewChat());
  
      // Text input events
      this.textInput.addEventListener('input', () => this.handleTextInput());
      this.textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          this.handleSubmit();
        }
      });
  
      // Action buttons
      const actionButtons = this.container.querySelectorAll('.tb-action-btn');
      actionButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const action = e.currentTarget.dataset.action;
          this.handleAction(action);
        });
      });
  
      // Submit button
      this.container.querySelector('#tb-submit-btn').addEventListener('click', () => this.handleSubmit());
  
      // Keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isVisible) {
          this.toggleVisibility();
        }
        if (e.ctrlKey && e.shiftKey && e.key === 'T') {
          this.toggleVisibility();
          e.preventDefault();
        }
      });
    }
  
    handleTextInput() {
      const text = this.textInput.value;
      const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
      const isOverLimit = wordCount > 5000;
      
      this.wordCount.textContent = `${wordCount} / 5000 words`;
      this.wordCount.classList.toggle('tb-over-limit', isOverLimit);
      
      const submitBtn = this.container.querySelector('#tb-submit-btn');
      submitBtn.disabled = !text.trim() || isOverLimit || this.isProcessing;
      
      // Update button states
      const actionButtons = this.container.querySelectorAll('.tb-action-btn');
      actionButtons.forEach(btn => {
        btn.disabled = !text.trim() || isOverLimit || this.isProcessing;
      });
    }
  
    async handleAction(action) {
      const text = this.textInput.value.trim();
      if (!text) return;
  
      let query = '';
      
      if (action === 'prompt') {
        query = await this.getCustomPrompt();
        if (!query) return;
      }
  
      await this.processText(text, action, query);
    }
  
    async getCustomPrompt() {
      const prompts = [
        'Summarize this text in 3 bullet points',
        'Rewrite this to be more formal and professional',
        'Simplify this text for easy understanding',
        'Extract the main argument from this text',
        'Convert this into a persuasive message',
        'Identify key points in this text'
      ];
  
      const promptText = prompt(
        `Enter your custom instruction for the text:\n\nExamples:\n${prompts.map(p => `• ${p}`).join('\n')}`
      );
  
      return promptText?.trim() || '';
    }
  
    async handleSubmit() {
      const text = this.textInput.value.trim();
      if (!text || this.isProcessing) return;
      
      await this.processText(text, 'correct');
    }
  
    async processText(text, action, query = '') {
      if (this.isProcessing) return;
      
      this.setProcessingState(true);
      
      try {
        // Add user message to chat
        this.addMessageToChat('user', text);
        
        // Show loading message
        const loadingId = this.addLoadingMessage();
        
        const requestBody = {
          text: text,
          action: action
        };
        
        if (action === 'translate') {
          requestBody.language = this.languageSelect.value;
        }
        
        if (action === 'prompt' && query) {
          requestBody.query = query;
        }
        
        const response = await fetch(`${this.apiBaseUrl}/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Request failed');
        }
        
        const data = await response.json();
        
        // Remove loading message and add response
        this.removeLoadingMessage(loadingId);
        this.addMessageToChat('assistant', data.processed_text, action, query);
        
        // Clear input after successful processing
        this.textInput.value = '';
        this.handleTextInput();
        
      } catch (error) {
        console.error('Processing error:', error);
        this.removeLoadingMessage(loadingId);
        this.addMessageToChat('error', `Error: ${error.message}`);
      } finally {
        this.setProcessingState(false);
      }
    }
  
    setProcessingState(processing) {
      this.isProcessing = processing;
      
      const buttons = this.container.querySelectorAll('button:not(#tb-toggle-btn):not(#tb-minimize-btn):not(#tb-new-chat-btn)');
      buttons.forEach(btn => {
        btn.disabled = processing || !this.textInput.value.trim();
        if (processing) {
          btn.classList.add('tb-processing');
        } else {
          btn.classList.remove('tb-processing');
        }
      });
      
      this.textInput.disabled = processing;
    }
  
    addMessageToChat(type, content, action = '', query = '') {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const message = {
        id: messageId,
        type: type,
        content: content,
        action: action,
        query: query,
        timestamp: new Date().toISOString(),
        chatId: this.currentChatId
      };
      
      this.chatHistory.push(message);
      this.renderMessage(message);
      this.saveChatHistory();
      this.scrollToBottom();
      
      return messageId;
    }
  
    addLoadingMessage() {
      const loadingId = `loading_${Date.now()}`;
      const loadingElement = document.createElement('div');
      loadingElement.className = 'tb-message tb-assistant tb-loading';
      loadingElement.id = loadingId;
      loadingElement.innerHTML = `
        <div class="tb-message-content">
          <div class="tb-skeleton-loader">
            <div class="tb-skeleton-line"></div>
            <div class="tb-skeleton-line"></div>
            <div class="tb-skeleton-line short"></div>
          </div>
        </div>
      `;
      
      this.chatContainer.appendChild(loadingElement);
      loadingElement.style.animation = 'tb-fadeInUp 0.3s ease-out';
      this.scrollToBottom();
      
      return loadingId;
    }
  
    removeLoadingMessage(loadingId) {
      const loadingElement = document.getElementById(loadingId);
      if (loadingElement) {
        loadingElement.remove();
      }
    }
  
    renderMessage(message) {
      // Remove welcome message if it exists
      const welcomeMessage = this.chatContainer.querySelector('.tb-welcome-message');
      if (welcomeMessage) {
        welcomeMessage.remove();
      }
      
      const messageElement = document.createElement('div');
      messageElement.className = `tb-message tb-${message.type}`;
      messageElement.id = message.id;
      
      let actionLabel = '';
      if (message.action) {
        const actionLabels = {
          'translate': 'Translation',
          'correct': 'Grammar Check',
          'prompt': message.query || 'Custom Prompt'
        };
        actionLabel = actionLabels[message.action] || message.action;
      }
      
      const timestamp = new Date(message.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      messageElement.innerHTML = `
        <div class="tb-message-content">
          ${actionLabel ? `<div class="tb-message-action">${actionLabel}</div>` : ''}
          <div class="tb-message-text">${this.formatMessageContent(message.content)}</div>
          <div class="tb-message-time">${timestamp}</div>
        </div>
      `;
      
      this.chatContainer.appendChild(messageElement);
      
      // Animate message appearance
      messageElement.style.animation = 'tb-fadeInUp 0.3s ease-out';
    }
  
    formatMessageContent(content) {
      // Convert newlines to <br> and preserve formatting
      return content
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }
  
    startNewChat() {
      this.currentChatId = this.generateChatId();
      this.chatHistory = [];
      this.chatContainer.innerHTML = `
        <div class="tb-welcome-message">
          <div class="tb-welcome-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h3>New Chat Started</h3>
          <p>Ready to help you with text translation, grammar checking, and custom prompts.</p>
        </div>
      `;
      this.textInput.value = '';
      this.handleTextInput();
      this.saveChatHistory();
    }
  
    toggleVisibility() {
      this.isVisible = !this.isVisible;
      const panel = this.container.querySelector('#tb-main-panel');
      
      if (this.isVisible) {
        panel.classList.add('tb-visible');
        this.toggleBtn.classList.add('tb-active');
        setTimeout(() => this.textInput.focus(), 300);
      } else {
        panel.classList.remove('tb-visible');
        this.toggleBtn.classList.remove('tb-active');
      }
    }
  
    scrollToBottom() {
      setTimeout(() => {
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
      }, 100);
    }
  
    saveChatHistory() {
      try {
        chrome.storage.local.set({
          [`textBuddy_chat_${this.currentChatId}`]: this.chatHistory,
          'textBuddy_currentChatId': this.currentChatId
        });
      } catch (error) {
        console.warn('Could not save chat history:', error);
      }
    }
  
    loadChatHistory() {
      try {
        chrome.storage.local.get(['textBuddy_currentChatId'], (result) => {
          if (result.textBuddy_currentChatId) {
            this.currentChatId = result.textBuddy_currentChatId;
            
            chrome.storage.local.get([`textBuddy_chat_${this.currentChatId}`], (chatResult) => {
              const history = chatResult[`textBuddy_chat_${this.currentChatId}`];
              if (history && history.length > 0) {
                this.chatHistory = history;
                this.renderChatHistory();
              }
            });
          }
        });
      } catch (error) {
        console.warn('Could not load chat history:', error);
      }
    }
  
    renderChatHistory() {
      this.chatContainer.innerHTML = '';
      this.chatHistory.forEach(message => {
        this.renderMessage(message);
      });
      this.scrollToBottom();
    }
  }
  
  // Initialize Text Buddy when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new TextBuddy();
    });
  } else {
    new TextBuddy();
  }