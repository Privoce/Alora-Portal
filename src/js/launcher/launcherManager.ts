import {
    getFaviconUrl,
    getHistoryEntries,
    getOriginEntries,
    getStorage,
    getTopOrigins,
    HistoryEntry,
    setStorage
} from "./utils";
import HistoryItem = chrome.history.HistoryItem;

const originListStorageKey = "launcherOrigins";
const searchScope = 31 * 24 * 60 * 60 * 1000; // one month

export interface App {
    origin: string;
    faviconHref: string;
    historyEntries: (HistoryEntry & { faviconHref: string })[];
}

export class LauncherManager {
    static initiate = async (): Promise<void> => {
        const historyEntries: HistoryItem[] = await getHistoryEntries(searchScope);// search scope is one month
        const topOrigins: string[] = getTopOrigins(historyEntries, 6);
        await setStorage(originListStorageKey, topOrigins);
        console.log("🚀 Initiated launcher apps.", topOrigins)
    }

    static getApps = async (): Promise<App[]> => {
        const storageData: string[] = (await getStorage(originListStorageKey)) || [];
        const historyEntries: HistoryItem[] = await getHistoryEntries(searchScope);
        return await Promise.all(storageData.map((origin: string) => (
            (async (origin: string): Promise<App> => ({
                origin,
                faviconHref: getFaviconUrl(origin),
                historyEntries: (await getOriginEntries(historyEntries, origin)).map(
                    (historyEntry: HistoryEntry) => ({
                        ...historyEntry,
                        faviconHref: getFaviconUrl(historyEntry.url),
                    })
                ),
            }))(origin)
        )));
    }

    static addApp = async (origin: string): Promise<void> => {
        const storageData: string[] = (await getStorage(originListStorageKey)) || [];
        storageData.push(origin);
        await setStorage(originListStorageKey, storageData);
        return Promise.resolve();
    }

    static removeApp = async (origin: string): Promise<void> => {
        const storageData: string[] = (await getStorage(originListStorageKey)) || [];
        const filteredStorageData = storageData.filter(item => item !== origin);
        await setStorage(originListStorageKey, filteredStorageData);
        return Promise.resolve();
    }
}