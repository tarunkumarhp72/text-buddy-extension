async function checkAPIStatus() {
    const statusEl = document.getElementById('status');
    
    try {
        const response = await fetch('http://localhost:2000/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            statusEl.className = 'status';
            statusEl.innerHTML = '<div class="status-dot"></div><span>Connected to API</span>';
        } else {
            throw new Error('API not responding');
        }
    } catch (error) {
        statusEl.className = 'status offline';
        statusEl.innerHTML = '<div class="status-dot"></div><span>API Offline</span>';
    }
}

// Open Text Buddy
document.getElementById('openBtn').addEventListener('click', async () => {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.tabs.sendMessage(tab.id, { action: 'toggleTextBuddy' });
        window.close();
    } catch (error) {
        console.error('Error opening Text Buddy:', error);
    }
});

// Settings (placeholder)
document.getElementById('settingsBtn').addEventListener('click', () => {
    alert('Settings panel coming soon! For now, you can use the extension directly on any webpage.');
});

// Help link
document.getElementById('helpLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({
        url: 'data:text/html,<html><head><title>Text Buddy Help</title></head><body><h1>Text Buddy Help</h1><h2>Getting Started</h2><p>1. Press <strong>Ctrl+Shift+T</strong> or click the floating button to open Text Buddy</p><p>2. Type or paste your text (up to 5000 words)</p><p>3. Choose an action: Translate, Grammar Check, or Custom Prompt</p><p>4. Select target language for translation</p><p>5. Click Submit or press Ctrl+Enter</p><h2>Features</h2><ul><li><strong>Translation:</strong> Translate text to 12+ languages</li><li><strong>Grammar Check:</strong> Fix spelling, grammar, and punctuation</li><li><strong>Custom Prompts:</strong> Use AI for summarizing, rewriting, simplifying, etc.</li><li><strong>Chat Interface:</strong> View conversation history</li><li><strong>Responsive Design:</strong> Works on desktop, tablet, and mobile</li></ul><h2>Keyboard Shortcuts</h2><ul><li><strong>Ctrl+Shift+T:</strong> Toggle Text Buddy</li><li><strong>Escape:</strong> Close Text Buddy</li><li><strong>Ctrl+Enter:</strong> Submit text</li></ul></body></html>'
    });
});

// Feedback link
document.getElementById('feedbackLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({
        url: 'mailto:feedback@textbuddy.ai?subject=Text Buddy Feedback'
    });
});

// Initialize
checkAPIStatus();

// Refresh status every 30 seconds
setInterval(checkAPIStatus, 30000);