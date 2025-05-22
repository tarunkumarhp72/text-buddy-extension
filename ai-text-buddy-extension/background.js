// Background script for Text Buddy Chrome Extension

// Install/update handler
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Text Buddy installed/updated:', details.reason);
    
    // Set up keyboard shortcuts
    if (details.reason === 'install') {
      // Show welcome notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'Text Buddy Installed!',
        message: 'Press Ctrl+Shift+T to get started with your AI writing assistant.'
      });
    }
  });
  
  // Handle keyboard shortcuts
  chrome.commands.onCommand.addListener(async (command) => {
    console.log('Command received:', command);
    
    if (command === 'toggle-text-buddy') {
      try {
        // Get the current active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tab) {
          // Inject content script if not already injected
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: () => {
                // Check if Text Buddy is already loaded
                return document.getElementById('text-buddy-container') !== null;
              }
            });
          } catch (error) {
            // Content script not loaded, inject it
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['content.js']
            });
            
            await chrome.scripting.insertCSS({
              target: { tabId: tab.id },
              files: ['styles.css']
            });
          }
          
          // Send message to toggle Text Buddy
          await chrome.tabs.sendMessage(tab.id, { action: 'toggleTextBuddy' });
        }
      } catch (error) {
        console.error('Error toggling Text Buddy:', error);
      }
    }
  });
  
  // Handle messages from content script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received:', request);
    
    if (request.action === 'getAPIStatus') {
      // Check API status
      fetch('http://localhost:2000/')
        .then(response => response.ok)
        .then(isOnline => sendResponse({ online: isOnline }))
        .catch(() => sendResponse({ online: false }));
      
      return true; // Keep message channel open for async response
    }
    
    if (request.action === 'showNotification') {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: request.title || 'Text Buddy',
        message: request.message
      });
    }
    
    if (request.action === 'setBadge') {
      chrome.action.setBadgeText({
        text: request.text || '',
        tabId: sender.tab?.id
      });
      
      chrome.action.setBadgeBackgroundColor({
        color: request.color || '#3b82f6',
        tabId: sender.tab?.id
      });
    }
  });
  
  // Handle extension icon click
  chrome.action.onClicked.addListener(async (tab) => {
    try {
      // Check if content script is already injected
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          return document.getElementById('text-buddy-container') !== null;
        }
      });
      
      if (!results[0].result) {
        // Content script not loaded, inject it
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['styles.css']
        });
      }
      
      // Send message to toggle Text Buddy
      await chrome.tabs.sendMessage(tab.id, { action: 'toggleTextBuddy' });
      
    } catch (error) {
      console.error('Error handling icon click:', error);
      
      // Show error notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'Text Buddy Error',
        message: 'Could not activate on this page. Try refreshing and try again.'
      });
    }
  });
  
  // Context menu setup
  chrome.runtime.onInstalled.addListener(() => {
    // Create context menu for selected text
    chrome.contextMenus.create({
      id: 'text-buddy-translate',
      title: 'Translate with Text Buddy',
      contexts: ['selection']
    });
    
    chrome.contextMenus.create({
      id: 'text-buddy-grammar',
      title: 'Check Grammar with Text Buddy',
      contexts: ['selection']
    });
    
    chrome.contextMenus.create({
      id: 'text-buddy-enhance',
      title: 'Enhance with Text Buddy',
      contexts: ['selection']
    });
    
    chrome.contextMenus.create({
      id: 'separator',
      type: 'separator',
      contexts: ['selection']
    });
    
    chrome.contextMenus.create({
      id: 'text-buddy-open',
      title: 'Open Text Buddy',
      contexts: ['page', 'selection']
    });
  });
  
  // Handle context menu clicks
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    try {
      // Check if content script is already injected
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          return document.getElementById('text-buddy-container') !== null;
        }
      });
      
      if (!results[0].result) {
        // Content script not loaded, inject it
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['styles.css']
        });
        
        // Wait a bit for initialization
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const selectedText = info.selectionText || '';
      
      if (info.menuItemId === 'text-buddy-open') {
        // Just open Text Buddy
        await chrome.tabs.sendMessage(tab.id, { 
          action: 'openTextBuddy',
          text: selectedText 
        });
      } else {
        // Open and perform specific action
        let action = '';
        if (info.menuItemId === 'text-buddy-translate') action = 'translate';
        else if (info.menuItemId === 'text-buddy-grammar') action = 'correct';
        else if (info.menuItemId === 'text-buddy-enhance') action = 'prompt';
        
        await chrome.tabs.sendMessage(tab.id, { 
          action: 'openTextBuddyWithAction',
          text: selectedText,
          actionType: action
        });
      }
      
    } catch (error) {
      console.error('Error handling context menu:', error);
    }
  });
  
  // Handle tab updates to maintain state
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
      // Clear any badges when page loads
      chrome.action.setBadgeText({ text: '', tabId: tabId });
    }
  });
  
  // Handle extension startup
  chrome.runtime.onStartup.addListener(() => {
    console.log('Text Buddy extension started');
  });
  
  // Cleanup on extension suspension
  chrome.runtime.onSuspend.addListener(() => {
    console.log('Text Buddy extension suspended');
  });
  
  // Error handling for unhandled promise rejections
  self.addEventListener('unhandledrejection', event => {
    console.error('Unhandled promise rejection in background script:', event.reason);
  });
  
  // Periodic health check
  setInterval(async () => {
    try {
      const response = await fetch('http://localhost:2000/');
      const isHealthy = response.ok;
      
      // Update extension badge based on API health
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
          try {
            const hasTextBuddy = await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: () => document.getElementById('text-buddy-container') !== null
            });
            
            if (hasTextBuddy[0].result) {
              chrome.action.setBadgeText({
                text: isHealthy ? '' : '!',
                tabId: tab.id
              });
              
              chrome.action.setBadgeBackgroundColor({
                color: isHealthy ? '#10b981' : '#ef4444',
                tabId: tab.id
              });
            }
          } catch (error) {
            // Tab not accessible or content script not injected
          }
        }
      }
    } catch (error) {
      console.warn('Health check failed:', error);
    }
  }, 60000); // Check every minute