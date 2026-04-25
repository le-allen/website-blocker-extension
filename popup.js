const blockedInput = document.getElementById("blocked-input");
const blockedList = document.getElementById("blocked-list");
const addBlockedButton = document.getElementById("add-blocked");

function normalizeEntry(value) {
    const raw = value.trim();
    if (!raw) return "";

    try {
        const withProtocol = raw.includes("//") ? raw : `https://${raw}`;
        const url = new URL(withProtocol);
        return url.hostname.replace(/^www\./, "");
    } catch (err) {
        return "";
    }
}

function renderSites(sites) {
    blockedList.innerHTML = "";
    if (!sites.length) {
        const empty = document.createElement("li");
        empty.textContent = "No websites yet. Add one above.";
        empty.className = "muted";
        blockedList.appendChild(empty);
        return;
    }

    sites.forEach((site) => {
        const li = document.createElement("li");

        const label = document.createElement("span");
        label.textContent = site.host;
        label.className = "host" + (site.enabled ? "" : " disabled");

        const controls = document.createElement("div");
        controls.className = "controls";

        const toggleLabel = document.createElement("label");
        toggleLabel.className = "switch";
        toggleLabel.title = site.enabled ? "Blocked" : "Unblocked";

        const toggle = document.createElement("input");
        toggle.type = "checkbox";
        toggle.checked = !!site.enabled;
        toggle.addEventListener("change", () => toggleSite(site.host, toggle.checked));

        const slider = document.createElement("span");
        slider.className = "slider";

        toggleLabel.appendChild(toggle);
        toggleLabel.appendChild(slider);

        const removeButton = document.createElement("button");
        removeButton.textContent = "Remove";
        removeButton.className = "secondary";
        removeButton.addEventListener("click", () => removeSite(site.host));

        controls.appendChild(toggleLabel);
        controls.appendChild(removeButton);

        li.appendChild(label);
        li.appendChild(controls);
        blockedList.appendChild(li);
    });
}

function loadSites() {
    chrome.storage.local.get({ sites: [] }, (data) => {
        const items = Array.isArray(data.sites) ? data.sites : [];
        renderSites(items);
    });
}

function saveSites(nextSites) {
    chrome.storage.local.set({ sites: nextSites }, () => renderSites(nextSites));
}

function addBlocked() {
    const normalized = normalizeEntry(blockedInput.value);
    if (!normalized) {
        blockedInput.value = "";
        return;
    }

    chrome.storage.local.get({ sites: [] }, (data) => {
        const items = Array.isArray(data.sites) ? data.sites : [];
        if (!items.some((s) => s.host === normalized)) {
            items.push({ host: normalized, enabled: true });
            items.sort((a, b) => a.host.localeCompare(b.host));
            saveSites(items);
        }
        blockedInput.value = "";
    });
}

function removeSite(host) {
    chrome.storage.local.get({ sites: [] }, (data) => {
        const items = Array.isArray(data.sites) ? data.sites : [];
        saveSites(items.filter((s) => s.host !== host));
    });
}

function toggleSite(host, enabled) {
    chrome.storage.local.get({ sites: [] }, (data) => {
        const items = Array.isArray(data.sites) ? data.sites : [];
        const next = items.map((s) => (s.host === host ? { ...s, enabled } : s));
        saveSites(next);
    });
}

addBlockedButton.addEventListener("click", addBlocked);
blockedInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        addBlocked();
    }
});

loadSites();

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.sites) {
        const next = Array.isArray(changes.sites.newValue) ? changes.sites.newValue : [];
        renderSites(next);
    }
});
