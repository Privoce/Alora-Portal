import {observable} from "mobx";

import {getDomain, getFaviconUrl} from "../misc/utils";
import {restore, save} from "../notes/storage";

/*
* Load recent history entries and store to chrome storage
*/
const Initialize = async () => {
    return await new Promise(resolve => {
        chrome.history.search({
            text: "",
            startTime: Date.now() - 31 * 24 * 60 * 60 * 1000, // search scope is 1 month
            endTime: Date.now(),
        }, async (historyItems) => {
            let historyDomains = {};
            for (const historyItem of historyItems) {
                let domain = getDomain(historyItem.url);
                if (!historyDomains[domain]) {
                    historyDomains[domain] = {
                        domain: domain,
                        faviconUrl: getFaviconUrl(historyItem.url),
                        historyItems: [],
                    };
                }
                historyDomains[domain].historyItems.push({
                    title: historyItem.title,
                    url: historyItem.url,
                });
            }
            historyDomains = Object.values(historyDomains);
            await save(historyDomains, "launcher");
            resolve();
        });
    });
}

class LauncherManager {

    historyDomains = observable({});

    async constructor() {
        await restore("historyDomains")
    }

}

export {
    Initialize, LauncherManager,
};