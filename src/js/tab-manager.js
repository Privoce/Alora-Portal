import {v4 as uuidv4} from 'uuid';
import {autorun, makeObservable, observable, toJS} from "mobx";

class Tab {
    constructor(tab) {
        this.id = tab.id;
        this.url = tab.url;
        this.title = tab.title;
        this.favIconUrl = tab.favIconUrl;
    }
}

class Workspace {
    uuid;
    name;
    tabs;

    constructor({uuid, name}) {
        makeObservable(this, {
            uuid: observable,
            name: observable,
            tabs: observable
        });
        this.uuid = uuid;
        this.name = name;
        this.tabs = {};  // Use tab's id as key
    }
}

class Window {
    constructor({window, workspace}) {
        this.id = window.id;
        this.workspaceUuid = workspace.uuid;
    }
}

class TabManager {
    static allWorkspaces = observable({});  // Use workspace's uuid as key
    static allWindows = observable({});  // Use window's id as key

    static async initialize() {

        // Query all windows
        await new Promise(resolve => {
            chrome.windows.getAll(windows => {
                windows.forEach(window => {
                    if (window.id !== chrome.windows.WINDOW_ID_NONE) {
                        const wsUuid = uuidv4();
                        const ws = new Workspace({uuid: wsUuid, name: 'WorkSpace'});
                        const win = new Window({window, workspace: ws});
                        TabManager.allWorkspaces[wsUuid] = ws;
                        TabManager.allWindows[window.id] = win;
                    }
                });
                resolve();
            });
        });
        // Query all tabs
        await new Promise(resolve => {
            chrome.tabs.query({}, tabs => {
                // Iterate all tabs
                tabs.forEach((tab, index) => {
                    if (tab.id !== chrome.tabs.TAB_ID_NONE) {
                        const wsUuid = TabManager.allWindows[tab.windowId].workspaceUuid;
                        TabManager.allWorkspaces[wsUuid].tabs[tab.id] = new Tab(tab);
                    }
                });
                resolve();
            });
        });

        autorun(() => {
            console.log('ALL_WS', toJS(TabManager.allWorkspaces), '\nALL_WIN', toJS(TabManager.allWindows));
        });

        chrome.tabs.onCreated.addListener(tab => {
            if (tab.id !== chrome.tabs.TAB_ID_NONE) {
                const wsUuid = TabManager.allWindows[tab.windowId].workspaceUuid;
                TabManager.allWorkspaces[wsUuid].tabs[tab.id] = new Tab(tab);
            }
        });

    }
}

export {
    TabManager
}
