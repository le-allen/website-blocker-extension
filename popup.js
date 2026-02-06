// for debug
// function logTabs(tabs) {
//     console.log(tabs);
//     tabs.forEach((tab, index) => {
//         console.log(`Tab ${index +1}:`, tab.title)
//   })
// }

// old feature: track time spent on sites
// chrome.storage.local.get("time", (data) => {
//     document.getElementById("time-field").textContent = data.time;
// });

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

function renderBlockedList(items) {
    blockedList.innerHTML = "";
    if (!items.length) {
        const empty = document.createElement("li");
        empty.textContent = "No blocked websites yet.";
        empty.className = "muted";
        blockedList.appendChild(empty);
        return;
    }

    items.forEach((item) => {
        const li = document.createElement("li");
        const label = document.createElement("span");
        label.textContent = item;

        const removeButton = document.createElement("button");
        removeButton.textContent = "Remove";
        removeButton.className = "secondary";
        removeButton.addEventListener("click", () => removeBlocked(item));

        li.appendChild(label);
        li.appendChild(removeButton);
        blockedList.appendChild(li);
    });
}

function loadBlockedList() {
    chrome.storage.local.get({ blockedSites: [] }, (data) => {
        const items = Array.isArray(data.blockedSites) ? data.blockedSites : [];
        renderBlockedList(items);
    });
}

function updateBlockedList(nextList) {
    chrome.storage.local.set({ blockedSites: nextList }, () => {
        renderBlockedList(nextList);
    });
}

function addBlocked() {
    const normalized = normalizeEntry(blockedInput.value);
    if (!normalized) {
        blockedInput.value = "";
        return;
    }

    chrome.storage.local.get({ blockedSites: [] }, (data) => {
        const items = Array.isArray(data.blockedSites) ? data.blockedSites : [];
        if (!items.includes(normalized)) {
            items.push(normalized);
            items.sort();
            updateBlockedList(items);
        }
        blockedInput.value = "";
    });
}

function removeBlocked(site) {
    chrome.storage.local.get({ blockedSites: [] }, (data) => {
        const items = Array.isArray(data.blockedSites) ? data.blockedSites : [];
        const nextItems = items.filter((entry) => entry !== site);
        updateBlockedList(nextItems);
    });
}

addBlockedButton.addEventListener("click", addBlocked);
blockedInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        addBlocked();
    }
});

loadBlockedList();

