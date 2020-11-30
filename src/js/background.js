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

// open portal page on startup
chrome.runtime.onStartup.addListener(() => {
    // create portal page if not exists
    chrome.tabs.query({currentWindow: true}, tabs => {
        if (!tabs[0].pinned || tabs[0].url !== `chrome-extension://${chrome.runtime.id}/portal.html`) {
            chrome.tabs.create({
                url: `chrome-extension://${chrome.runtime.id}/portal.html`,
                pinned: true
            });
        }
    });
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
        } else{
            chrome.tabs.highlight({
                tabs: [tabs[0].index]
            });
        }
    });
});
