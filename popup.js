function logTabs(tabs) {
    console.log(tabs);
    tabs.forEach((tab, index) => {
        console.log(`Tab ${index +1}:`, tab.title)
  })
}

// document.getElementById("click-me").addEventListener("click", () => {
//     alert("Button clicked!");
//     browser.tabs.query({ currentWindow: true }).then(logTabs);
// });

chrome.storage.local.get("time", (data) => {
    document.getElementById("time-field").textContent = data.time;
});

