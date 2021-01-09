import React from "react";
import PropTypes from "prop-types";
import { CloseOutlined } from "@ant-design/icons";
import { v4 as uuid } from "uuid";
import {
  Avatar,
  Button,
  Col,
  List,
  Popover,
  Row,
  Tabs,
  Tooltip,
  Modal,
  Input,
  Card,
} from "antd";

import Style from "../../css/launcher.module.less";
import { getFaviconUrl } from "../misc/utils";

class Icon extends React.Component {
  constructor(props) {
    super(props);

    this.handleDelete = this.handleDelete.bind(this);
    this.handleOpenApp = this.handleOpenApp.bind(this);
  }

  handleDelete() {
    this.props.deleteCallback(this.props.name);
  }

  handleOpenApp() {
    this.props.openAppCallback(this.props.url);
  }

  render() {
    return (
      <button
        className={`${Style.icon} ${this.props.selected && Style.selected}`}
        onClick={this.handleOpenApp}
      >
        <img
          src={getFaviconUrl(this.props.url)}
          alt=""
          onDragStart={(event) => event.preventDefault()}
        />
        <button className={Style.closeBtn} onClick={this.handleDelete}>
          <CloseOutlined />
        </button>
      </button>
    );
  }
}

Icon.propTypes = {
  id: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  deleteCallback: PropTypes.func.isRequired,
  openAppCallback: PropTypes.func.isRequired,
  selected: PropTypes.bool.isRequired,
};

class Launcher extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      myApps: [
        {
          name: "Instagram",
          url: "https://www.instagram.com",
          selected: false,
        },
        {
          name: "Privoce",
          url: "https://privoce.com/",
          selected: false,
        },
      ],
      newEntryModal: false,
      newEntryModalLoading: false,
      newEntryModalAppUrl: "",
      newentryModalImagePreview: "",
      deleteAppModal: false,
      deleteAppName: "",
    };

    this.handleNewEntryModal = this.handleNewEntryModal.bind(this);
    this.saveMyApps = this.saveMyApps.bind(this);
    this.loadMyApps = this.loadMyApps.bind(this);
    this.handlePinedAppsChange = this.handlePinedAppsChange.bind(this);
    this.handleModalUrlChange = this.handleModalUrlChange.bind(this);
    this.handleDone = this.handleDone.bind(this);
    this.toggleDeleteModal = this.toggleDeleteModal.bind(this);
    this.handleDeleteApp = this.handleDeleteApp.bind(this);
    this.handleOpenApp = this.handleOpenApp.bind(this);
    this.deleteApp = this.deleteApp.bind(this);
  }

  handleNewEntryModal() {
    this.setState({ newEntryModal: !this.state.newEntryModal });
  }

  saveMyApps() {
    const saveApps = JSON.stringify(this.state.myApps);

    localStorage.setItem("my-apps", saveApps);
  }

  loadMyApps() {
    const savedApps = JSON.parse(localStorage.getItem("my-apps"));

    if (!savedApps) {
      return;
    }

    this.setState({
      myApps: savedApps,
    });
  }

  handlePinedAppsChange(item) {
    const findApp = this.state.myApps.find((app) => app.name === item.name);

    let updatePineds = [];

    if (findApp) {
      updatePineds = this.state.myApps.map((app) => {
        if (app.name === item.name) {
          return {
            ...app,
            pined: item.pined,
          };
        }

        return app;
      });
    } else {
      updatePineds = [...this.state.myApps, item];
    }

    this.setState(
      {
        myApps: updatePineds,
      },
      () => {
        this.saveMyApps();
      }
    );
  }

  handleModalUrlChange(e) {
    this.setState({ newEntryModalAppUrl: e.target.value });
  }

  async handleDone() {
    const { newEntryModalAppUrl, myApps } = this.state;
    this.setState({
      newEntryModalLoading: true,
    });

    let prefix = "";

    if (
      newEntryModalAppUrl.slice(0, 5) !== "https" ||
      newEntryModalAppUrl.slice(0, 4) !== "http"
    ) {
      prefix = "https://";
    }

    try {
      new URL(`${prefix}${newEntryModalAppUrl}`);

      let tempTab;
      chrome.tabs.create(
        {
          url: `${prefix}${newEntryModalAppUrl}`,
          active: false,
        },
        (tab) => {
          tempTab = tab.id;
        }
      );

      setTimeout(() => {
        this.setState(
          {
            newentryModalImagePreview: `chrome://favicon/size/128@1x/${prefix}${newEntryModalAppUrl}`,
            newEntryModalLoading: false,
            myApps: [
              ...myApps,
              {
                name: `${prefix}${newEntryModalAppUrl}`,
                url: `${prefix}${newEntryModalAppUrl}`,
                icon: `chrome://favicon/size/128@1x/${prefix}${newEntryModalAppUrl}`,
                pined: true,
              },
            ],
          },
          () => {
            this.saveMyApps();
          }
        );

        chrome.tabs.remove(tempTab);

        //only to create a effect, see icon and close modal
        setTimeout(() => {
          this.handleNewEntryModal();
        }, 500);
      }, 2000);
    } catch (err) {
      this.setState({
        newEntryModalLoading: false,
      });
      return;
    }
  }

  toggleDeleteModal() {
    if (this.state.deleteAppModal) {
      const updateSelected = this.state.myApps.map((app) => {
        if (app.selected) {
          return {
            ...app,
            selected: false,
          };
        }
        return app;
      });

      this.setState({
        myApps: updateSelected,
      });
    }

    this.setState({
      deleteAppModal: !this.state.deleteAppModal,
    });
  }

  handleDeleteApp(name) {
    const updateSelected = this.state.myApps.map((app) => {
      if (name === app.name) {
        return {
          ...app,
          selected: true,
        };
      }
      return app;
    });

    this.setState({
      deleteAppName: name,
      myApps: updateSelected,
    });

    this.toggleDeleteModal();
  }

  handleOpenApp(url) {
    chrome.tabs.create({
      url: url,
    });
  }

  deleteApp() {
    const newApps = this.state.myApps.filter(
      (app) => app.name !== this.state.deleteAppName
    );

    this.setState(
      {
        myApps: newApps,
      },
      () => {
        this.toggleDeleteModal();
        this.saveMyApps();
      }
    );
  }

  componentDidMount() {
    this.loadMyApps();
  }

  render() {
    const {
      newEntryModalLoading,
      newEntryModal,
      newentryModalImagePreview,
      deleteAppModal,
      deleteAppName,
      newEntryModalAppUrl,
    } = this.state;
    return (
      <div className={Style.container}>
        {this.state.myApps.map((app) => (
          <Icon
            id={uuid()}
            url={app.url}
            name={app.name}
            deleteCallback={this.handleDeleteApp}
            openAppCallback={this.handleOpenApp}
            selected={app.selected}
          />
        ))}

        <div className={Style.icon}>
          <button className={Style.addBtn} onClick={this.handleNewEntryModal}>
            +
          </button>
        </div>

        <Modal
          title="Add a new app"
          visible={newEntryModal}
          onOk={this.handleNewEntryModal}
          onCancel={this.handleNewEntryModal}
          footer={
            <div className="modal-footer--container">
              <Button
                key="remove"
                disabled={newEntryModalLoading}
                onClick={this.handleNewEntryModal}
              >
                Cancel
              </Button>

              <Button
                type="primary"
                loading={newEntryModalLoading}
                key="done"
                onClick={this.handleDone}
              >
                Done
              </Button>
            </div>
          }
        >
          <div className="modal-content--container">
            <div className="modal-contenct--image-container">
              <img
                src={!!newentryModalImagePreview && newentryModalImagePreview}
              />
              <small>Preview</small>
            </div>
            <div className="modal-contenct--input-container">
              <label>URL:</label>
              <Input
                autoFocus
                value={newEntryModalAppUrl}
                onChange={this.handleModalUrlChange}
                disabled={newEntryModalLoading}
              />
            </div>
          </div>
        </Modal>

        {/* Delete app modal */}
        <Modal
          title="Delete app"
          visible={deleteAppModal}
          onOk={this.deleteApp}
          onCancel={this.toggleDeleteModal}
          okText="Yes"
          cancelText="Cancel"
          okType="danger"
        >
          <p>{`Delete the ${deleteAppName} ?`}</p>
        </Modal>
      </div>
    );
  }
}

export { Launcher };
