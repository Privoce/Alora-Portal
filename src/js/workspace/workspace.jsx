import React from "react";
import {Avatar, List, Tabs} from "antd";
import {v4 as uuidv4} from "uuid";
import {dateFnsLocalizer,} from "react-big-calendar";
import {format, getDay, parse, startOfWeek} from "date-fns";
import {Scrollbar} from "react-scrollbars-custom";

import "antd/dist/antd.less";
import "../../css/workspace.module.less";


const {TabPane} = Tabs;

class Workspace extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            historyDomains: [],
            workspaces: [],
            currentWorkspaceId: null,
            user: {
                name: "",
                googleConnect: false,
                token: "",
                events: [],
            },
        };
        this.mainWindowId = null;
        this.stashWindowId = null;

        this.updateLock = true;

        this.setCurrentWorkspaceId = this.setCurrentWorkspaceId.bind(this);
        this.setMainWindowId = this.setMainWindowId.bind(this);
        this.setStashWindowId = this.setStashWindowId.bind(this);

        this.initWorkspacesAsync = this.initWorkspacesAsync.bind(this);
        this.saveWorkspaces = this.saveWorkspaces.bind(this);
        this.createNewWorkspace = this.createNewWorkspace.bind(this);
        this.switchToWorkspace = this.switchToWorkspace.bind(this);
        this.deleteWorkspace = this.deleteWorkspace.bind(this);
        this.updateWorkspace = this.updateWorkspace.bind(this);
    }

    setCurrentWorkspaceId(currentWorkspaceId) {
        this.setState({
            currentWorkspaceId: currentWorkspaceId,
        });
        chrome.runtime.sendMessage({
            currentWorkspaceId: currentWorkspaceId,
        });
    }

    setMainWindowId(mainWindowId) {
        this.mainWindowId = mainWindowId;
        chrome.runtime.sendMessage({
            mainWindowId: mainWindowId,
        });
    }

    setStashWindowId(stashWindowId) {
        this.stashWindowId = stashWindowId;
        chrome.runtime.sendMessage({
            stashWindowId: stashWindowId,
        });
    }

    async initWorkspacesAsync() {
        this.updateLock = true;
        // load workspaces from storage
        let workspaces = await new Promise((resolve) => {
            chrome.storage.local.get(["workspaces"], (items) => {
                resolve(
                    (items.workspaces || []).map((workspace) => ({
                        id: workspace.id,
                        title: workspace.title,
                        entries: workspace.entries.map((entry) => ({
                            url: entry.url,
                            title: entry.title,
                            tabId: null, // never load tabId from storage
                        })),
                    }))
                );
            });
        });
        // check if background script already stores currentWorkspaceId
        let savedWorkspaceId = await new Promise((resolve) => {
            chrome.runtime.sendMessage(
                {
                    getCurrentWorkspaceId: true,
                },
                resolve
            );
        });
        // search for an empty workspace
        let emptyWorkspaceId = null;
        workspaces.some((workspace) => {
            if (workspace.entries.length === 0) {
                emptyWorkspaceId = workspace.id;
                return true;
            }
        });
        // try to close the new tab page
        await new Promise((resolve) => {
            chrome.tabs.query(
                {
                    currentWindow: true,
                },
                (tabs) => {
                    for (const tab of tabs) {
                        if (tab.url === "chrome://newtab/") {
                            chrome.tabs.remove(tab.id);
                        }
                    }
                    resolve();
                }
            );
        });
        // count current tabs
        let tabsCount = await new Promise((resolve) => {
            chrome.tabs.query(
                {
                    currentWindow: true,
                },
                (tabs) => {
                    resolve(tabs.filter((tab) => !tab.pinned).length);
                }
            );
        });
        // judge for currentWorkspaceId
        let currentWorkspaceId = null;
        if (savedWorkspaceId) {
            // background script has a value
            currentWorkspaceId = savedWorkspaceId;
        } else if (!emptyWorkspaceId || tabsCount > 1) {
            // no empty workspace or some tabs already exists
            // create new workspace for current tabs
            currentWorkspaceId = uuidv4();
            let currentWorkspace = await new Promise((resolve) => {
                chrome.tabs.query(
                    {
                        currentWindow: true,
                    },
                    (tabs) => {
                        resolve({
                            id: currentWorkspaceId,
                            title: "Workspace",
                            entries: tabs
                                .filter((tab) => !tab.pinned) // ignore tab as long as it is pinned
                                .map((tab) => ({
                                    url: tab.url,
                                    title: tab.title,
                                    tabId: tab.id,
                                })),
                        });
                    }
                );
            });
            workspaces.push(currentWorkspace);
        } else {
            // use empty workspace otherwise
            currentWorkspaceId = emptyWorkspaceId;
        }
        this.setState({
            workspaces,
        });
        this.setCurrentWorkspaceId(currentWorkspaceId);
        this.updateLock = false;
    }

    async saveWorkspaces() {
        // to be precise, workspaces should be write to storage when:
        // - new workspace created
        // - current workspace modified
        // - current workspace deleted
        await new Promise((resolve) => {
            chrome.storage.local.set(
                {
                    workspaces: this.state.workspaces.map((workspace) => ({
                        id: workspace.id,
                        title: workspace.title,
                        entries: workspace.entries.map((entry) => ({
                            url: entry.url,
                            title: entry.title,
                            tabId: null, // never save tabId to storage
                        })),
                    })),
                },
                () => {
                    resolve(null);
                }
            );
        });
    }

    async createNewWorkspace() {
        this.updateLock = true;
        let workspaces = this.state.workspaces;
        let newWorkspaceId = uuidv4();
        let newWorkspace = {
            id: newWorkspaceId,
            title: "Workspace",
            entries: [],
        };
        workspaces.push(newWorkspace);
        this.setState({
            workspaces,
        });
        await this.saveWorkspaces();
        // when a workspace appears, its contained tabs should be restored
        // manually defining activeTab will not trigger tabChange event,
        // therefore, manually switching to new workspace
        await this.switchToWorkspace(newWorkspaceId);
        this.updateLock = false;
    }

    async switchToWorkspace(workspaceId) {
        this.updateLock = true;
        if (workspaceId === this.state.currentWorkspaceId) {
            return;
        }
        let previousWorkspaceId = this.state.currentWorkspaceId;
        this.setCurrentWorkspaceId(workspaceId);
        // create stash window if not exists
        if (this.stashWindowId === null) {
            await new Promise((resolve) => {
                chrome.windows.create(
                    {
                        url: `chrome-extension://${chrome.runtime.id}/stash.html`,
                        state: "minimized",
                    },
                    (window) => {
                        this.setStashWindowId(window.id);
                        resolve();
                    }
                );
            });
        }
        // move tabs to stash window
        for (const workspace of this.state.workspaces) {
            if (workspace.id === previousWorkspaceId) {
                for (const entry of workspace.entries) {
                    await new Promise((resolve) => {
                        chrome.tabs.move(
                            entry.tabId,
                            {
                                windowId: this.stashWindowId,
                                index: -1,
                            },
                            resolve
                        );
                    });
                }
            }
        }
        // move tabs to main window, or creating new tab
        for (const workspace of this.state.workspaces) {
            if (workspace.id === workspaceId) {
                for (const entry of workspace.entries) {
                    let r = await new Promise((resolve) => {
                        // check if entry has tabId and that tab exists
                        if (!entry.tabId) {
                            resolve(false);
                        } else {
                            chrome.tabs.get(entry.tabId, (tab) => {
                                if (!tab) {
                                    resolve(false);
                                } else {
                                    resolve(true);
                                }
                            });
                        }
                    });
                    if (r) {
                        await new Promise((resolve) => {
                            chrome.tabs.move(
                                entry.tabId,
                                {
                                    windowId: this.mainWindowId,
                                    index: -1,
                                },
                                resolve
                            );
                        });
                    } else {
                        await new Promise((resolve) => {
                            chrome.tabs.create(
                                {
                                    url: entry.url,
                                    active: false, // create in background
                                },
                                resolve
                            );
                        });
                        // no need to record tabId
                        // workspace will be updated after tabs are created and updated
                    }
                }
            }
        }
        this.updateLock = false;
    }

    async deleteWorkspace(workspaceId) {
        this.updateLock = true;
        // close all tabs in the workspace
        for (const workspace of this.state.workspaces) {
            if (workspace.id === workspaceId) {
                for (const entry of workspace.entries) {
                    await new Promise((resolve) => {
                        chrome.tabs.remove(entry.tabId, resolve);
                    });
                }
            }
        }
        let targetWorkspaceId = workspaceId;
        let targetWorkspaceIndex = this.state.workspaces
            .map((workspace) => workspace.id)
            .indexOf(targetWorkspaceId);
        let newWorkspaceId = this.state.workspaces[
            targetWorkspaceIndex > 0
                ? targetWorkspaceIndex - 1
                : targetWorkspaceIndex + 1
            ].id;
        this.setState({
            workspaces: this.state.workspaces.filter(
                (workspace) => workspace.id !== targetWorkspaceId
            ),
        });
        await this.saveWorkspaces();
        // when a workspace appears, its contained tabs should be restored
        // manually defining activeTab will not trigger tabChange event,
        // therefore, manually switching to new workspace
        await this.switchToWorkspace(newWorkspaceId);
        this.updateLock = false;
    }

    async updateWorkspace() {
        while (this.updateLock) {
            await new Promise((resolve) => {
                setTimeout(resolve, 50);
            });
        }
        this.state.workspaces.filter(
            (item) => item.id === this.state.currentWorkspaceId
        )[0].entries = await new Promise((resolve) => {
            chrome.tabs.query(
                {
                    currentWindow: true,
                },
                (tabs) => {
                    resolve(
                        tabs
                            .filter((tab) => !tab.pinned) // ignore tab as long as it is pinned
                            .map((tab) => ({
                                url: tab.url,
                                title: tab.title,
                                tabId: tab.id,
                            }))
                    );
                }
            );
        });
        this.setState({
            workspaces: this.state.workspaces,
        });
        await this.saveWorkspaces();
    }


    componentDidMount() {
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

        // init workspaces
        this.initWorkspacesAsync().then();
        // reload current workspace when tabs are created, updated, removed
        chrome.tabs.onCreated.addListener(this.updateWorkspace);
        chrome.tabs.onUpdated.addListener(this.updateWorkspace);
        chrome.tabs.onRemoved.addListener(this.updateWorkspace);
        // get window id of current window
        chrome.windows.getCurrent((window) => {
            this.setMainWindowId(window.id);
        });
        // try to fetch stash window id from background script
        chrome.runtime.sendMessage(
            {
                getStashWindowId: true,
            },
            (response) => {
                this.stashWindowId = response;
            }
        );
        // listening for removal of stash windows
        chrome.windows.onRemoved.addListener((windowId) => {
            if (windowId === this.stashWindowId) {
                // stash window removed, reset variable, so that it will be re-created when needed
                this.setStashWindowId(null);
            }
        });
        this.updateLock = false;
    }

    onEdit = (targetKey, action) => {
        if (action === "add") {
            this.createNewWorkspace();
            return;
        }
        this.deleteWorkspace(targetKey);
    };

    render() {
        return (
            <div id="workspacePanel">
                <Tabs
                    type="editable-card"
                    onEdit={this.onEdit}
                    activeKey={this.currentWorkspaceId}
                    onChange={this.switchToWorkspace}
                >
                    {this.workspaces.map((workspace) => (
                        <TabPane
                            closable={!this.disableDelete}
                            key={workspace.id}
                            tab={
                                <>
                                    {workspace.title}({workspace.entries.length})
                                </>
                            }
                        >
                            <Scrollbar noScrollX={true} style={{minHeight: "100%"}}>
                                <List itemLayout="horizontal">
                                    {workspace.entries.map((entry, index) => (
                                        <List.Item onClick={() => {
                                            chrome.tabs.highlight({
                                                tabs: [index + 1],
                                            });
                                        }}>
                                            <List.Item.Meta
                                                avatar={
                                                    <Avatar
                                                        shape="square"
                                                        src={"chrome://favicon/size/128@1x/" + entry.url}
                                                    />
                                                }
                                                title={entry.title}
                                                description={
                                                    entry.url.length > 50
                                                        ? entry.url.slice(0, 50) + "..."
                                                        : entry.url
                                                }
                                            />
                                        </List.Item>
                                    ))}
                                </List>
                            </Scrollbar>
                        </TabPane>
                    ))}
                </Tabs>
            </div>
        );
    }
}

export {
    Workspace,
};