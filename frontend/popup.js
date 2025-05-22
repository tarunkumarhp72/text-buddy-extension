 // Create animated background particles
 function createParticles() {
  const container = document.getElementById('particles');
  const particleCount = 15;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 6 + 's';
    particle.style.animationDuration = (4 + Math.random() * 4) + 's';
    container.appendChild(particle);
  }
}

class TextBuddyPro {
  constructor() {
    this.initializeElements();
    this.bindEvents();
    this.loadSelectedText();
    this.initializeAnimations();
    createParticles();
  }

  initializeElements() {
    this.inputText = document.getElementById('input-text');
    this.outputContainer = document.getElementById('output-container');
    this.processButton = document.getElementById('process-button');
    this.copyButton = document.getElementById('copy-button');
    this.actionRadios = document.getElementsByName('action');
    this.radioOptions = document.querySelectorAll('.radio-option');
    this.translationOptions = document.getElementById('translation-options');
    this.promptOptions = document.getElementById('prompt-options');
    this.targetLanguage = document.getElementById('target-language');
    this.customPrompt = document.getElementById('custom-prompt');
    this.charCount = document.getElementById('char-count');
    this.buttonText = document.getElementById('button-text');
    this.copyText = document.getElementById('copy-text');
    this.errorContainer = document.getElementById('error-container');
  }

  initializeAnimations() {
    // Add stagger animation to radio buttons
    this.radioOptions.forEach((option, index) => {
      option.style.animationDelay = `${0.8 + (index * 0.1)}s`;
      option.classList.add('fade-in');
    });

    // Add intersection observer for elements
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    });

    // Observe elements for scroll animations
    document.querySelectorAll('.content > *').forEach(el => {
      observer.observe(el);
    });
  }

  bindEvents() {
    // Enhanced radio button handling
    this.radioOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleActionChange(option);
      });
    });

    // Process button with enhanced feedback
    this.processButton.addEventListener('click', () => this.processText());

    // Copy button with animation
    this.copyButton.addEventListener('click', () => this.copyToClipboard());

    // Character counter with smooth updates
    this.inputText.addEventListener('input', () => {
      this.updateCharCount();
      this.autoResize();
    });

    // Enhanced keyboard shortcuts
    this.inputText.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.processText();
      }
    });

    // Input focus animations
    this.inputText.addEventListener('focus', () => {
      this.inputText.parentElement.style.transform = 'scale(1.02)';
    });

    this.inputText.addEventListener('blur', () => {
      this.inputText.parentElement.style.transform = 'scale(1)';
    });

    // Enhanced dropdown animations
    this.targetLanguage.addEventListener('focus', () => {
      this.targetLanguage.style.transform = 'scale(1.05)';
    });

    this.targetLanguage.addEventListener('blur', () => {
      this.targetLanguage.style.transform = 'scale(1)';
    });

    this.customPrompt.addEventListener('focus', () => {
      this.customPrompt.style.transform = 'scale(1.05)';
    });

    this.customPrompt.addEventListener('blur', () => {
      this.customPrompt.style.transform = 'scale(1)';
    });
  }

  handleActionChange(selectedOption) {
    // Update radio button states with animation
    this.radioOptions.forEach(option => {
      option.classList.remove('selected');
      const radio = option.querySelector('input[type="radio"]');
      radio.checked = false;
    });

    selectedOption.classList.add('selected');
    const radio = selectedOption.querySelector('input[type="radio"]');
    radio.checked = true;

    // Add selection animation
    selectedOption.style.transform = 'scale(1.05)';
    setTimeout(() => {
      selectedOption.style.transform = 'scale(1)';
    }, 200);

    const selectedAction = radio.value;
    
    // Smooth dropdown transitions
    if (selectedAction === 'translate') {
      this.showOptions(this.translationOptions);
      this.hideOptions(this.promptOptions);
    } else if (selectedAction === 'prompt') {
      this.showOptions(this.promptOptions);
      this.hideOptions(this.translationOptions);
    } else {
      this.hideOptions(this.translationOptions);
      this.hideOptions(this.promptOptions);
    }
    
    this.updateButtonText();
    this.clearError();
  }

  showOptions(element) {
    element.classList.remove('hidden');
    element.style.animation = 'fadeInUp 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
  }

  hideOptions(element) {
    element.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => {
      element.classList.add('hidden');
    }, 300);
  }

  updateButtonText() {
    const action = this.getSelectedAction();
    const texts = {
      translate: '🌐 Translate Text',
      correct: '✏️ Fix Grammar',
      prompt: '⚡ Process Text'
    };
    this.buttonText.textContent = texts[action] || '⚡ Process Text';
  }

  getSelectedAction() {
    return Array.from(this.actionRadios).find(radio => radio.checked)?.value || 'translate';
  }

  updateCharCount() {
    const count = this.inputText.value.length;
    this.charCount.textContent = count;
    
    // Animated color transitions
    if (count > 4500) {
      this.charCount.style.color = 'var(--warning-color)';
      this.charCount.style.transform = 'scale(1.1)';
    } else if (count > 4800) {
      this.charCount.style.color = 'var(--error-color)';
      this.charCount.style.transform = 'scale(1.2)';
    } else {
      this.charCount.style.color = 'var(--text-muted)';
      this.charCount.style.transform = 'scale(1)';
    }
  }

  autoResize() {
    this.inputText.style.height = 'auto';
    const newHeight = Math.min(this.inputText.scrollHeight, 240);
    this.inputText.style.height = newHeight + 'px';
    
    // Smooth height transition
    this.inputText.style.transition = 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
  }

  showEnhancedSkeleton() {
    this.outputContainer.innerHTML = `
      <div class="skeleton skeleton-line"></div>
      <div class="skeleton skeleton-line"></div>
      <div class="skeleton skeleton-line"></div>
      <div class="skeleton skeleton-line"></div>
    `;
    this.outputContainer.classList.add('bounce-in');
  }

  showError(message, type = 'error') {
    this.clearError();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    const icon = type === 'error' 
      ? `<span class="message-icon">❌</span>`
      : `<span class="message-icon">✅</span>`;
    
    messageDiv.innerHTML = `${icon}<span>${message}</span>`;
    this.errorContainer.appendChild(messageDiv);
    
    if (type === 'success') {
      setTimeout(() => this.clearError(), 4000);
    }
  }

  clearError() {
    this.errorContainer.innerHTML = '';
  }

  async processText() {
    const text = this.inputText.value.trim();
    if (!text) {
      this.showError('Please enter some text to process.');
      this.inputText.focus();
      this.inputText.style.borderColor = 'var(--error-color)';
      setTimeout(() => {
        this.inputText.style.borderColor = 'var(--border-color)';
      }, 1000);
      return;
    }

    const action = this.getSelectedAction();
    
    if (action === 'prompt') {
      const prompt = this.customPrompt.value.trim();
      if (!prompt) {
        this.showError('Please enter instructions for what you want me to do with the text.');
        this.customPrompt.focus();
        return;
      }
    }

    this.setLoading(true);
    this.showEnhancedSkeleton();
    this.clearError();

    try {
      const requestData = {
        text: text,
        action: action
      };

      if (action === 'translate') {
        requestData.language = this.targetLanguage.value;
      } else if (action === 'prompt') {
        requestData.query = this.customPrompt.value.trim();
      }

      const response = await fetch('http://localhost:2000/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || `Server error: ${response.status}`);
      }

      this.displayResult(result.processed_text);
      this.showError('Text processed successfully! 🎉', 'success');

    } catch (error) {
      console.error('Error processing text:', error);
      this.displayError(this.getErrorMessage(error));
      this.showError(this.getErrorMessage(error));
    } finally {
      this.setLoading(false);
    }
  }

  getErrorMessage(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('fetch')) {
      return 'Unable to connect to the server. Please make sure the backend is running.';
    } else if (message.includes('api key')) {
      return 'API key issue. Please check your Gemini API configuration.';
    } else if (message.includes('quota')) {
      return 'API quota exceeded. Please try again later.';
    } else if (message.includes('invalid action')) {
      return 'Invalid action selected. Please try again.';
    } else if (message.includes('language parameter')) {
      return 'Please select a target language for translation.';
    } else if (message.includes('query parameter')) {
      return 'Please provide instructions for the custom task.';
    } else {
      return error.message || 'An unexpected error occurred. Please try again.';
    }
  }

  setLoading(isLoading) {
    this.processButton.disabled = isLoading;
    
    if (isLoading) {
      this.buttonText.innerHTML = `
        <div class="button-spinner"></div>
        <span>Processing...</span>
      `;
      this.processButton.style.transform = 'scale(0.98)';
    } else {
      this.updateButtonText();
      this.processButton.style.transform = 'scale(1)';
    }
  }

  displayResult(text) {
    this.outputContainer.innerHTML = '';
    this.outputContainer.textContent = text;
    this.outputContainer.classList.add('fade-in');
    
    // Animate copy button appearance
    setTimeout(() => {
      this.copyButton.classList.add('visible');
      this.copyButton.style.animation = 'slideInRight 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    }, 300);
  }

  displayError(message) {
    this.outputContainer.innerHTML = `
      <div class="output-placeholder" style="color: var(--error-color);">
        <span style="font-size: 24px;">😔</span>
        ${message}
      </div>
    `;
    this.copyButton.classList.remove('visible');
  }

  async copyToClipboard() {
    const textToCopy = this.outputContainer.textContent;
    
    if (!textToCopy || textToCopy.includes('Your brilliantly processed text will appear here')) {
      return;
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      
      // Enhanced copy feedback
      this.copyText.textContent = 'Copied!';
      this.copyButton.classList.add('copied');
      this.copyButton.style.transform = 'scale(1.1)';
      
      setTimeout(() => {
        this.copyText.textContent = 'Copy';
        this.copyButton.classList.remove('copied');
        this.copyButton.style.transform = 'scale(1)';
      }, 2000);

      this.showError('Text copied to clipboard! 📋', 'success');

    } catch (err) {
      console.error('Failed to copy text:', err);
      this.showError('Failed to copy to clipboard');
    }
  }

  loadSelectedText() {
    // For Chrome extension context
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['selectedText'], (result) => {
        if (result.selectedText) {
          this.inputText.value = result.selectedText;
          this.updateCharCount();
          this.autoResize();
          chrome.storage.local.remove(['selectedText']);
        }
      });
    }
  }
}

// Enhanced initialization with loading animation
document.addEventListener('DOMContentLoaded', () => {
  // Add initial loading animation
  document.body.style.opacity = '0';
  document.body.style.transform = 'scale(0.95)';
  
  setTimeout(() => {
    document.body.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    document.body.style.opacity = '1';
    document.body.style.transform = 'scale(1)';
    
    // Initialize the application
    new TextBuddyPro();
  }, 100);
});

// Add some interactive easter eggs
let clickCount = 0;
document.querySelector('.header h1').addEventListener('click', () => {
  clickCount++;
  if (clickCount === 5) {
    document.querySelector('.header').style.background = 'var(--success-gradient)';
    setTimeout(() => {
      document.querySelector('.header').style.background = 'var(--primary-gradient)';
    }, 1000);
    clickCount = 0;
  }
});