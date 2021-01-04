let currentWorkspaceId = null;
let mainWindowId = null;
let stashWindowId = null;
// handle message
chrome.runtime.onMessage.addListener(((message, sender, sendResponse) => {
    if (message.currentWorkspaceId) {
        currentWorkspaceId = message.currentWorkspaceId;
    } else if (message.mainWindowId) {
        mainWindowId = message.mainWindowId;
    } else if (message.stashWindowId) {
        stashWindowId = message.stashWindowId;
    } else if (message.getCurrentWorkspaceId) {
        sendResponse(currentWorkspaceId);
    } else if (message.getMainWindowId) {
        sendResponse(mainWindowId);
    } else if (message.getStashWindowId) {
        sendResponse(stashWindowId);
    }
}))

const createPortalTab = () => {
    // create portal page if not exists
    chrome.tabs.query({currentWindow: true}, tabs => {
        if (!tabs[0].pinned || tabs[0].url !== `chrome-extension://${chrome.runtime.id}/portal.html`) {
            chrome.tabs.create({
                url: `chrome-extension://${chrome.runtime.id}/portal.html`,
                pinned: true
            });
        }
    });
};

// open portal page on startup
chrome.runtime.onStartup.addListener(createPortalTab);
chrome.runtime.onInstalled.addListener(() => {
    createPortalTab();
    // load recent history
    chrome.history.search(
        {
            text: "",
            startTime: Date.now() - 7 * (24 * 60 * 60 * 1000), // start from 1 week ago
            endTime: Date.now(),
        },
        (historyItems) => {
            let historyDomains = {};
            for (const historyItem of historyItems) {
                // remove port number and ?
                let domain = historyItem.url
                    .split("/")[2]
                    .split(":")[0]
                    .split("?")[0];
                if (!historyDomains[domain]) {
                    historyDomains[domain] = {
                        domain: domain,
                        faviconUrl: "chrome://favicon/size/256@1x/" + historyItem.url,
                        historyItems: [],
                    };
                }
                historyDomains[domain].historyItems.push({
                    title: historyItem.title,
                    url: historyItem.url,
                });
            }
            historyDomains = Object.values(historyDomains);
            this.setState({historyDomains});
        }
    );
});


// show portal page when browserAction gets clicked
chrome.browserAction.onClicked.addListener(() => {
    chrome.tabs.query({currentWindow: true}, tabs => {
        if (!tabs[0].pinned || tabs[0].url !== `chrome-extension://${chrome.runtime.id}/portal.html`) {
            chrome.tabs.create({
                url: `chrome-extension://${chrome.runtime.id}/portal.html`,
                pinned: true
            }, tab => {
                chrome.tabs.highlight({
                    tabs: [tab.index]
                });
            });
        } else {
            chrome.tabs.highlight({
                tabs: [tabs[0].index]
            });
        }
    });
});
