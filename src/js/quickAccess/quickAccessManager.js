import {observable} from "mobx";
import {observer} from "mobx-react";

import {getDomain, getFaviconUrl} from "../misc/utils";
import {save, restore} from "../misc/storage";

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
            await save(historyDomains, "quickAccess");
            resolve();
        });
    });
}

class QuickAccessManager {

    historyDomains = observable({});

    async constructor() {
        await restore("historyDomains")
    }

}

export {
    Initialize, QuickAccessManager,
};