import { LauncherManager } from './launcher/launcherManager';

let currentWorkspaceId = null;
let mainWindowId = null;
let stashWindowId = null;
// handle message
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
});

const createOrHighlightPortalTab = async () => {
  const tabs = await new Promise(resolve =>
    chrome.tabs.query({ currentWindow: true }, resolve),
  );
  if (
    !tabs[0].pinned ||
    tabs[0].url !== `chrome-extension://${chrome.runtime.id}/portal.html`
  ) {
    const tab = await new Promise(resolve => {
      chrome.tabs.create(
        {
          url: `chrome-extension://${chrome.runtime.id}/portal.html`,
          pinned: true,
        },
        resolve,
      );
    });
    await new Promise(resolve => {
      chrome.tabs.highlight(
        {
          tabs: [tab.index],
        },
        resolve,
      );
    });
    resolve();
  } else {
    await new Promise(resolve => {
      chrome.tabs.highlight(
        {
          tabs: [tabs[0].index],
        },
        resolve,
      );
    });
    resolve();
  }
};

chrome.runtime.onStartup.addListener(() => {
  createOrHighlightPortalTab().then();
});

chrome.runtime.onInstalled.addListener(() => {
  LauncherManager.initiate().then(() => {
    createOrHighlightPortalTab().then();
  });
});

chrome.browserAction.onClicked.addListener(() => {
  createOrHighlightPortalTab().then();
});
