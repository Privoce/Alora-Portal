// listen for incoming messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(message);
    if (message.command === 'sendThis') {
        // popup msg, save and close active tab
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, tabs => {
            chrome.storage.local.get(['urls'], items => {
                let urls = items.urls || [];
                urls.push(tabs[0].url);
                chrome.tabs.remove(tabs[0].id);
                chrome.storage.local.set({urls: urls});
            });
        });
    } else if (message.command === 'sendAll') {
        // popup msg, save and close all tabs
        chrome.tabs.query({
            currentWindow: true
        }, tabs => {
            chrome.storage.local.get(['urls'], items => {
                let urls = items.urls || [];
                let newUrls = [];
                tabs.forEach(element => {
                    newUrls.push(element.url);
                    chrome.tabs.remove(element.id);
                });
                urls = urls.concat(newUrls);
                chrome.storage.local.set({urls: urls});
            });
        });
        chrome.tabs.create({
            url: 'chrome://newtab/'
        });
    } else if (message.command === 'showPage') {
        // popup msg, create a new tab to display newTab page
        chrome.tabs.create({
            url: 'chrome://newtab/'
        });
    } else if (message.command === 'restore') {
        // newTab page msg, restore tab and purge url from storage
        chrome.storage.local.get(['urls'], items => {
            let urls = items.urls;
            chrome.tabs.create({
                url: urls[message.index]
            });
            urls = urls.splice(message.index, 1);
            chrome.storage.local.set({urls: urls});
        });
    }
});
