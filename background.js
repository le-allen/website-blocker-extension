// let brainrot = ["youtube.com", "x.com", "tiktok.com", "instagram.com"]; // put in storage, let user add and remove
// let time = 0;
// chrome.storage.local.set({ time });
// let stopwatchOn = false;

// chrome.runtime.onInstalled.addListener(() => {
//     chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//         const tab = tabs[0];
//         console.log(`init; currently on: ${tab.title} || ${tab.url}`)

//         stopwatch(tab);
//     });
// });

// // it seems like alt tabbing to new window and switch back to brainrot window will double the amount of ticks in stopwatch
// function tick() {
//     if(!stopwatchOn) return;
//     time++;
//     console.log(time)
//     chrome.storage.local.set({ time }); // updates time shown on window, prob better way to do it
//     setTimeout(tick, 1000);
// }


// // logic for starting the stopwatch
// function stopwatch(tab) {
//     if(brainrot.some(site => tab.url.includes(site))) {
//         console.log("brainrotting")
//         stopwatchOn = true;
//     } else {
//         console.log("chill")
//         stopwatchOn = false;
//     }
//     tick();
// }

// chrome.windows.onFocusChanged.addListener((windowId) => {
//     if(windowId === chrome.windows.WINDOW_ID_NONE) return;

//     chrome.tabs.query({ active: true, windowId }, (tabs) => {
//         const tab = tabs[0];
//         console.log(`switched to: ${tab.title} || ${tab.url}`)
        
//         stopwatch(tab);
//     });
// });

// REMOVER

let TARGET = ["x.com", "instagram.com", "tiktok.com", "www.instagram.com", "www.tiktok.com"];
// TARGET.push("https://discord.com/channels/@me/617207654808289290".replace("https://", ""));
// TARGET.push("tiktok.com");
// TARGET.push("instagram.com");

function isTargetUrl(url) {
    try {
        const u = new URL(url);
        return TARGET.includes(u.hostname) | TARGET.includes(u.href);
    } catch (e) {
        console.log("mango mustard error");
        return false;
    }
}

browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.url && isTargetUrl(changeInfo.url)) {
        console.log("suc 67: " + changeInfo.url);
        browser.tabs.remove(tabId).catch((err) => {console.error("err 41: " + err.message);});
    }
});

