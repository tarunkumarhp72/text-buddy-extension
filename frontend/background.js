// Add context menu option for selected text
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "text-buddy",
      title: "Process with Text Buddy",
      contexts: ["selection"]
    });
  });
  
  // Handle context menu click
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "text-buddy" && info.selectionText) {
      // Open the popup with the selected text
      chrome.storage.local.set({ 'selectedText': info.selectionText }, () => {
        chrome.action.openPopup();
      });
    }
  });