// Send message to background script when page loads
console.log("[Website Blocker] Content script loaded. URL:", window.location.href);
chrome.runtime.sendMessage({ action: "checkUrl", url: window.location.href }, (response) => {
    console.log("[Website Blocker] Response from background:", response);
});
