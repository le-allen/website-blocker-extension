const DEFAULT_SITES = ["x.com", "tiktok.com", "instagram.com"];

let CURRENT_BLOCKED = [];

function getEnabledHosts(sites) {
    if (!Array.isArray(sites)) return [];
    return sites.filter((s) => s && s.enabled && s.host).map((s) => s.host);
}

function toRules(hosts) {
    // Use `requestDomains` so we only block requests whose host is exactly the
    // site (or a subdomain). A plain `urlFilter` string is a substring match,
    // which caused accidental blocks on pages that merely *mention* the domain
    // (e.g. en.wikipedia.org/wiki/X.com_(bank)).
    return hosts.map((host, index) => ({
        id: index + 1,
        priority: 1,
        action: { type: "block" },
        condition: {
            requestDomains: [host],
            resourceTypes: ["main_frame"],
        },
    }));
}

function syncDynamicRules(sites) {
    const hosts = getEnabledHosts(sites);
    CURRENT_BLOCKED = hosts;
    const addRules = toRules(hosts);
    chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
        const removeRuleIds = existingRules.map((rule) => rule.id);
        chrome.declarativeNetRequest.updateDynamicRules(
            { removeRuleIds, addRules },
            () => {
                if (chrome.runtime.lastError) {
                    console.error("[Website Blocker] Failed to update dynamic rules:", chrome.runtime.lastError.message);
                } else {
                    console.log("[Website Blocker] Dynamic rules updated:", hosts);
                    clearBlockedTabs(hosts);
                }
            }
        );
    });
}

function isBlockedUrl(url, hosts) {
    if (!url) return false;
    try {
        const hostname = new URL(url).hostname.replace(/^www\./, "");
        const list = Array.isArray(hosts) ? hosts : [];
        return list.some((site) => hostname === site || hostname.endsWith(`.${site}`));
    } catch (err) {
        return false;
    }
}

function clearBlockedTabs(hosts) {
    chrome.tabs.query({}, (tabs) => {
        const toClear = tabs.filter((tab) => isBlockedUrl(tab.url, hosts));
        toClear.forEach((tab) => {
            chrome.tabs.update(tab.id, { url: "about:blank" }).catch((err) => {
                console.error("[Website Blocker] Failed to clear blocked tab:", err.message);
            });
        });
    });
}

// Seed defaults the first time the extension runs. Previously we stored a plain
// `blockedSites` array; migrate those entries so existing users keep their list.
function ensureDefaults(callback) {
    chrome.storage.local.get({ sites: null, blockedSites: null }, (data) => {
        if (Array.isArray(data.sites)) {
            callback(data.sites);
            return;
        }

        const legacyHosts = Array.isArray(data.blockedSites) ? data.blockedSites : [];
        const merged = Array.from(new Set([...DEFAULT_SITES, ...legacyHosts]));
        const initial = merged
            .map((host) => ({ host, enabled: true }))
            .sort((a, b) => a.host.localeCompare(b.host));

        chrome.storage.local.set({ sites: initial }, () => callback(initial));
    });
}

function loadAndSyncRules() {
    ensureDefaults((sites) => syncDynamicRules(sites));
}

chrome.runtime.onInstalled.addListener(loadAndSyncRules);
chrome.runtime.onStartup.addListener(loadAndSyncRules);

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.sites) {
        syncDynamicRules(changes.sites.newValue);
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.url && isBlockedUrl(changeInfo.url, CURRENT_BLOCKED)) {
        chrome.tabs.update(tabId, { url: "about:blank" }).catch((err) => {
            console.error("[Website Blocker] Failed to clear blocked navigation:", err.message);
        });
    }
});
