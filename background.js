let brainrot = ["youtube.com", "x.com", "tiktok.com", "instagram.com"];
let time = 0;
let stopwatchOn = false;

chrome.storage.local.set({ time });
// apply function after implemented
chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const tab = tabs[0];
        console.log(`init; currently on: ${tab.title} || ${tab.url}`)
    });
});


// it seems like alt tabbing to new window and switch back to brainrot window will double the amount of ticks in stopwatch
function stopwatch() {
    if(!stopwatchOn) return;
    time++;
    console.log(time)
    chrome.storage.local.set({ time }); // updates time shown on window, prob better way to do it
    setTimeout(stopwatch, 1000);
}

chrome.windows.onFocusChanged.addListener((windowId) => {
    if(windowId === chrome.windows.WINDOW_ID_NONE) return;

    chrome.tabs.query({ active: true, windowId }, (tabs) => {
        const tab = tabs[0];
        console.log(`switched to: ${tab.title} || ${tab.url}`)
        
        // prob turn into function
        if(brainrot.some(site => tab.url.includes(site))) {
            console.log("fucking retard")
            stopwatchOn = true;
        } else {
            console.log("chill")
            stopwatchOn = false;
        }
        stopwatch();
        //

    });
});

// console.log(time)