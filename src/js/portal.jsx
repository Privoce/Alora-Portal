import React from "react";
import ReactDOM from "react-dom";
import { FaGoogle, FaExternalLinkAlt } from "react-icons/fa";
import { Avatar, Button, Col, List, Popover, Row, Tabs, Tooltip } from "antd";
import "antd/dist/antd.less";
import "../css/portal.less";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { v4 as uuidv4 } from "uuid";
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  Views,
} from "react-big-calendar";
import { getMonth, getDay, startOfWeek, parse, format } from "date-fns";
import calendarImg from "../assets/calendar.png";
import workspaceImg from "../assets/workspace.png";
import plusIcon from "../assets/plus-icon.png";
import gpsIcon from "../assets/gps-icon.png";
import sunIcon from "../assets/sun-icon.png";
import { Scrollbar } from "react-scrollbars-custom";

const { TabPane } = Tabs;

const BACKEND_URL = "https://auth.privoce.com/";

class HistoryEntryButton extends React.Component {
  render() {
    return (
      <Popover
        placement="rightTop"
        trigger="click"
        arrowPointAtCenter
        title={() => (
          <>
            <span>Latest history on </span>
            {this.props.domain}
          </>
        )}
        content={() => (
          <Scrollbar style={{ minHeight: "200px" }}>
            <List itemLayout="horizontal">
              {this.props.historyItems.map(item => (
                  <List.Item>
                    <List.Item.Meta
                        avatar={
                          <Avatar shape="square" src={this.props.faviconUrl} />
                        }
                        title={
                          <a href={item.url} target="_blank" rel="noreferrer">
                            {item.title}
                          </a>
                        }
                        description={
                          item.url.length > 50
                              ? item.url.slice(0, 50) + "..."
                              : item.url
                        }

                    />
                  </List.Item>
              ))}
            </List>
          </Scrollbar>
        )}
      >
        <Button ghost>
          <img src={this.props.faviconUrl} alt="" />
        </Button>
      </Popover>
    );
  }
}

class HistoryPanel extends React.Component {
  render() {
    let counter = 0;
    return (
      <Scrollbar style={{ minHeight: "300px" }}>
        <div id={this.props.id}>
          {this.props.historyDomains.map((domain, index) => {
            if (index > 9) {
              return;
            }

            return (
              <HistoryEntryButton
                domain={domain.domain}
                faviconUrl={domain.faviconUrl}
                historyItems={domain.historyItems}
                key={counter++}
              />
            );
          })}

          <Tooltip title="Add a new entry">
            <Button ghost>
              <img src={plusIcon} alt="" />
            </Button>
          </Tooltip>
        </div>
      </Scrollbar>
    );
  }
}

class WorkspacePanel extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const onEdit = (targetKey, action) => {
      if (action === "add") {
        this.props.createNewWorkspace();
        return;
      }
      this.props.deleteWorkspace(targetKey);
    };

    return (
      <div id={this.props.id}>
        <Tabs
          type="editable-card"
          onEdit={onEdit}
          activeKey={this.props.currentWorkspaceId}
          onChange={this.props.switchToWorkspace}
        >
          {this.props.workspaces.map((workspace) => (
            <TabPane
              closable={!this.props.disableDelete}
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

class App extends React.Component {
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

    this.getEventsFromServer = this.getEventsFromServer.bind(this);
    this.loginHandle = this.loginHandle.bind(this);
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
        resolve
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
    let r = await new Promise((resolve) => {
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
    this.state.workspaces.filter(
      (item) => item.id === this.state.currentWorkspaceId
    )[0].entries = r;
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
        startTime: Date.now() - 3 * (24 * 60 * 60 * 1000), // start from 1 week ago
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
              faviconUrl: "chrome://favicon/size/128@1x/" + historyItem.url,
              historyItems: [],
            };
          }
          historyDomains[domain].historyItems.push({
            title: historyItem.title,
            url: historyItem.url,
          });
        }
        historyDomains = Object.values(historyDomains);
        this.setState({ historyDomains });
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

  async getEventsFromServer() {
    const googleConected = localStorage.getItem("googleConnect");
    const token = localStorage.getItem("token");
    const nickname = localStorage.getItem("nickname");

    this.setState({
      user: {
        name: nickname,
        googleConnect: googleConected,
        token,
        events: [],
      },
    });

    // if dont have google account connected
    if (!googleConected || token == "") {
      return;
    }

    const response = await fetch(`${BACKEND_URL}user/calendar`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
    });

    if (response.status > 204) {
      this.setState({
        user: {
          name: "",
          googleConnect: false,
          token: "",
          events: [],
        },
      });

      localStorage.setItem("nickname", "");
      localStorage.setItem("googleConnect", "false");
      localStorage.setItem("token", "");

      return alert("Session expired!");
    }

    const data = await response.json();

    if (data.events && data.events.length > 0) {
      const events = data.events.map((event) => ({
        id: event.id,
        start: event.start.date
          ? new Date(event.start.date)
          : new Date(event.start.dateTime),
        end: event.end.date
          ? new Date(event.end.date)
          : new Date(event.end.dateTime),
        title: event.summary,
        allDay: event.start.date ? true : false,
      }));

      console.log("calendar", {
        user: {
          name: nickname,
          token,
          googleConnect: googleConected,
          events,
        },
      });

      this.setState({
        user: {
          name: nickname,
          token,
          googleConnect: googleConected,
          events,
        },
      });
    }
  }

  loginHandle() {
    const globalThis = this;

    chrome.tabs.create({
      url: `${BACKEND_URL}auth/google?redirect=http://localhost/auth?token=`,
    });

    // we can improve this, listering only the auth tab
    chrome.tabs.onUpdated.addListener(async function authorizationHook(
      tabId,
      changeInfo,
      tab
    ) {
      //If you don't have the authentication tab id remove that part
      if (tab.title.indexOf("token=") >= 0) {
        //tab url consists of access_token
        var url = new URL(tab.url);
        const urlParams = new URLSearchParams(url.search);
        const token = urlParams.get("token");

        if (!token) {
          return;
        }

        const userResponse = await fetch(`${BACKEND_URL}auth/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-access-token": token,
          },
        });

        if (userResponse.status !== 200) {
          return alert("User not found");
        }

        const userData = await userResponse.json();

        globalThis.setState({
          user: {
            name: userData.user.nickname,
            googleConnect: true,
            token,
            events: [],
          },
        });

        //save on localstorage
        localStorage.setItem("nickname", userData.user.nickname);
        localStorage.setItem("googleConnect", "true");
        localStorage.setItem("token", token);

        globalThis.getEventsFromServer();

        chrome.tabs.onUpdated.removeListener(authorizationHook);
        chrome.tabs.remove(tabId);
      }
    });
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
              faviconUrl: "chrome://favicon/size/128@1x/" + historyItem.url,
              historyItems: [],
            };
          }
          historyDomains[domain].historyItems.push({
            title: historyItem.title,
            url: historyItem.url,
          });
        }
        historyDomains = Object.values(historyDomains);
        this.setState({ historyDomains });
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

    //fetch data from api
    this.getEventsFromServer();

    const googleConected = localStorage.getItem("googleConnect");
    const nickname = localStorage.getItem("nickname");

    this.setState({
      user: {
        ...this.state.user,
        name: nickname,
        googleConnect: googleConected === "true" ? true : false,
      },
    });
  }

  getHour() {
    const date = new Date();
    const hour = date.getHours();
    const minutes = date.getMinutes();

    return `${hour < 10 ? "0" : ""}${hour}:${
      minutes < 10 ? "0" : ""
    }${minutes}`;
  }

  render() {
    const locales = {
      "en-US": require("date-fns/locale/en-US"),
    };
    const localizer = dateFnsLocalizer({
      format,
      parse,
      startOfWeek,
      getDay,
      locales,
    });

    return (
      <Row className="container--portal">
        <Col span={6}>
          <h1 className="home--clock">{this.getHour()}</h1>
          <h1 className="home--username">
            Welcome {this.state.user.name ? this.state.user.name : "User"}
          </h1>
          <p className="home--weather">
            <img src={sunIcon} width={20} height={20} /> 80 F
          </p>
          <p className="home--location">
            <img src={gpsIcon} width={17} height={17} /> Boston, US
          </p>
          <div>
            <HistoryPanel
              id="historyPanel"
              historyDomains={this.state.historyDomains}
            />
          </div>
        </Col>

        <Col span={9}>
          <div className="home--calendar-toolbar calendar-header">
            <img src={calendarImg} alt="" />
            <h2 className="home--calendar">Calendar</h2>
          </div>
          <div className="site-calendar-demo-card">
            <div className="calendar--container">
              <BigCalendar
                className="big-calendar"
                style={{ height: "320px" }}
                events={this.state.user.events}
                localizer={localizer}
                startAccessor="start"
                endAccessor="end"
                defaultView={Views.DAY}
                views={Views.DAY}
                step={30}
                showMultiDayTimes
                components={{
                  toolbar: CustomToolbar,
                  timeGutterHeader: CustomTimeGutterHeader,
                  dateCellWrapper: CustomDateCellWrapper,
                }}
              />
              <a
                className="google-calendar-link"
                href="https://calendar.google.com/calendar/u/0/r"
                target="_blank"
              >
                <FaExternalLinkAlt />
              </a>
            </div>
          </div>
          <div className="social-auth--container">
            {!this.state.user.googleConnect && (
              <button onClick={this.loginHandle}>
                <FaGoogle />
                Login with Google
              </button>
            )}
          </div>
        </Col>

        <Col span={9}>
          <div className="home--workspace-toolbar workspace-header">
            <img src={workspaceImg} alt="" />
            <h2 className="home--workspace">Workspace</h2>
          </div>
          <WorkspacePanel
            id="workspacePanel"
            workspaces={this.state.workspaces}
            currentWorkspaceId={this.state.currentWorkspaceId}
            createNewWorkspace={this.createNewWorkspace}
            switchToWorkspace={this.switchToWorkspace}
            deleteWorkspace={this.deleteWorkspace}
            disableDelete={this.state.workspaces.length <= 1}
          />
        </Col>
      </Row>
    );
  }
}

const CustomToolbar = () => {
  return <div className="home--calendar-toolbar"></div>;
};

const CustomTimeGutterHeader = () => {
  return (
    <div>
      <h2 className="calendar--card-today">Today</h2>
    </div>
  );
};

const CustomDateCellWrapper = () => {
  return (
    <div className="calendar--card-date">
      <p>{format(new Date(), "dd MMMM, yyyy")}</p>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
