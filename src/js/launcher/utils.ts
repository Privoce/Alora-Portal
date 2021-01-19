import HistoryItem = chrome.history.HistoryItem;
import Tab = chrome.tabs.Tab;

export const getFaviconUrl = (url: string, size: number = 256): string =>
  `chrome://favicon/size/${size.toString()}@1x/${url}`;

export const setStorage = async (key: string, data: any): Promise<void> => await new Promise((
  resolve: (value: void) => void,
) => {
  const obj: { [p: string]: any } = {};
  obj[key] = data;
  chrome.storage.local.set(obj, resolve);
});

export const getStorage = async (key: string): Promise<any> => await new Promise((
  resolve: (value: any) => void,
) => {
  chrome.storage.local.get([key], (
    value: { [p: string]: any }
  ) => {
    resolve(value[key]);
  });
});

export const removeStorage = async (key: string): Promise<void> => await new Promise((
  resolve: (value: void) => void,
) => {
  chrome.storage.local.remove([key], resolve);
});

export const clearStorage = async (): Promise<void> => await new Promise((
  resolve: (value: void) => void,
) => {
  chrome.storage.local.clear(resolve);
});

export const getHistoryEntries = async (millisecond: number): Promise<HistoryItem[]> => await new Promise((
  resolve: (value: HistoryItem[]) => void
) => {
  chrome.history.search({
    text: "",
    startTime: Date.now() - millisecond,
    endTime: Date.now(),
  }, resolve);
});

function countOccurrence(data: string[]): [string, number][] {
  let result: Map<string, number> = new Map();
  data.map((item: string) =>
    result.set(item, (result.get(item) || 0) + 1));
  return [...result];
}

const defaultOrigins: string[] = [
  "https://www.google.com",
  "https://www.youtube.com",
  "https://facebook.com",
  "https://twitter.com",
];

export const getTopOrigins = (entries: HistoryItem[], limit: number): string[] => {
  const result = countOccurrence(entries.map((item: HistoryItem) => new URL(item.url).origin))
    .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
    .slice(0, limit)
    .map((item: [string, number]) => item[0]);
  return result.length >= limit ? result : defaultOrigins;
}

export interface HistoryEntry {
  title: string;
  url: string;
}

export const getOriginEntries = (entries: HistoryItem[], origin: string): HistoryEntry[] => {
  let result: HistoryEntry[] = [];
  entries.map((item: HistoryItem) => {
    if (new URL(item.url).origin === origin) {
      result.push({
        title: item.title,
        url: item.url,
      });
    }
  });
  return result;
}

export const createTab = async (url: string): Promise<Tab> => await new Promise((
  resolve: (value: Tab) => void,
) => {
  chrome.tabs.create({
    url: url,
  }, resolve)
})
