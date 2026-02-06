let CURRENT_BLOCKED = [];

function toRules(blockedSites) {
    const sites = Array.isArray(blockedSites) ? blockedSites : [];
    return sites.map((site, index) => ({
        id: index + 1,
        priority: 1,
        action: { type: "block" },
        condition: {
            urlFilter: site,
            resourceTypes: ["main_frame"],
        },
    }));
}

function syncDynamicRules(blockedSites) {
    CURRENT_BLOCKED = Array.isArray(blockedSites) ? blockedSites : [];
    const addRules = toRules(blockedSites);
    chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
        const removeRuleIds = existingRules.map((rule) => rule.id);
        chrome.declarativeNetRequest.updateDynamicRules(
            { removeRuleIds, addRules },
            () => {
                if (chrome.runtime.lastError) {
                    console.error("[Website Blocker] Failed to update dynamic rules:", chrome.runtime.lastError.message);
                } else {
                    console.log("[Website Blocker] Dynamic rules updated:", addRules.map((r) => r.condition.urlFilter));
                    clearBlockedTabs(blockedSites);
                }
            }
        );
    });
}

function isBlockedUrl(url, blockedSites) {
    if (!url) return false;
    try {
        const hostname = new URL(url).hostname.replace(/^www\./, "");
        const sites = Array.isArray(blockedSites) ? blockedSites : [];
        return sites.some((site) => hostname === site || hostname.endsWith(`.${site}`));
    } catch (err) {
        return false;
    }
}

function clearBlockedTabs(blockedSites) {
    chrome.tabs.query({}, (tabs) => {
        const toClear = tabs.filter((tab) => isBlockedUrl(tab.url, blockedSites));
        toClear.forEach((tab) => {
            chrome.tabs.update(tab.id, { url: "about:blank" }).catch((err) => {
                console.error("[Website Blocker] Failed to clear blocked tab:", err.message);
            });
        });
    });
}

function loadAndSyncRules() {
    chrome.storage.local.get({ blockedSites: [] }, (data) => {
        syncDynamicRules(data.blockedSites);
    });
}

chrome.runtime.onInstalled.addListener(loadAndSyncRules);
chrome.runtime.onStartup.addListener(loadAndSyncRules);

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.blockedSites) {
        syncDynamicRules(changes.blockedSites.newValue);
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.url && isBlockedUrl(changeInfo.url, CURRENT_BLOCKED)) {
        chrome.tabs.update(tabId, { url: "about:blank" }).catch((err) => {
            console.error("[Website Blocker] Failed to clear blocked navigation:", err.message);
        });
    }
});


