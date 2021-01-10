import React from "react";
import {Avatar, Button, Input, List, Modal, Popover, Select} from "antd";
import {CloseOutlined} from "@ant-design/icons";
import {IObservableArray, observable, runInAction} from "mobx";
import {observer} from "mobx-react";
import {v4 as uuidv4} from "uuid";
import Scrollbar from "react-scrollbars-custom";
import {createTab, HistoryEntry} from "./utils";
import {App, LauncherManager} from "./launcherManager";
import "antd/dist/antd.less";
import Style from "../../css/launcher.module.less";

const {Option} = Select;

const preventImgDrag = (event: React.DragEvent<HTMLImageElement>) => event.preventDefault();

@observer
class Detail extends React.Component<{ app: App }, {}> {
    render() {
        return (
            <div className={Style.detailList}>
                <Scrollbar noScrollX={true} style={{height: "100%", width: "100%"}} className={Style.fixScrollbar}>
                    <List
                        itemLayout="horizontal"
                        dataSource={this.props.app.historyEntries}
                        renderItem={(historyEntry: HistoryEntry & { faviconHref: string }) => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={<Avatar src={historyEntry.faviconHref} shape="square"/>}
                                    title={
                                        <a onClick={() => {
                                            createTab(historyEntry.url).then();
                                        }}>{historyEntry.title}</a>
                                    }
                                    description={historyEntry.url}
                                />
                            </List.Item>
                        )}
                    />
                </Scrollbar>
            </div>
        );
    }
}

@observer
class Icon extends React.Component<{ app: App, onDelete: () => void }, {}> {
    iconState: {
        isPopoverVisible: boolean;
    } = observable({
        isPopoverVisible: false,
    });

    handleClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
        createTab(this.props.app.origin).then();
        event.preventDefault();
    };

    handleRightClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
        runInAction(() => {
            this.iconState.isPopoverVisible = !this.iconState.isPopoverVisible;
        });
        event.preventDefault();
    };

    handleVisibleChange = (): void => {
        runInAction(() => {
            this.iconState.isPopoverVisible = false;
        });
    };

    handleClose = (): void => {
        this.props.onDelete();
    };

    render() {
        return (
            <div className={Style.icon}>
                <Popover
                    placement="right"
                    arrowPointAtCenter
                    title={`History on ${this.props.app.origin}`}
                    content={<Detail app={this.props.app}/>}
                    visible={this.iconState.isPopoverVisible}
                    trigger="click"
                    onVisibleChange={this.handleVisibleChange}
                >
                    <img
                        src={this.props.app.faviconHref}
                        alt=""
                        onDragStart={preventImgDrag}
                        onClick={this.handleClick}
                        onContextMenu={this.handleRightClick}
                    />
                </Popover>
                <div className={Style.closeBtn} onClick={this.handleClose}>
                    <CloseOutlined/>
                </div>
            </div>
        );
    }
}

@observer
class DeleteConfirmModal extends React.Component<{}, {}> {
    modalState: {
        visible: boolean;
        loading: boolean;
        origin: string;
    } = observable({
        visible: false,
        loading: false,
        origin: "",
    });

    resetState = (): void => {
        runInAction(() => {
            this.modalState.loading = false;
            this.modalState.origin = "";
            this.modalState.visible = false;
        });
    }

    handleOk = (): void => {
        runInAction(() => {
            this.modalState.loading = true;
        });
        this.handleDelete().then(() => {
            setTimeout((): void => {
                this.resetState();
            }, 1000);
        });
    };

    handleCancel = (): void => {
        this.resetState();
    };

    handleDelete = async (): Promise<void> => {
        await LauncherManager.removeApp(this.modalState.origin);
        reloadAppList().then();
    };

    showModal = (origin: string): void => {
        runInAction(() => {
            this.modalState.origin = origin;
            this.modalState.visible = true;
        });
    }

    render() {
        return (
            <Modal
                title="Delete App"
                visible={this.modalState.visible}
                onOk={this.handleOk}
                onCancel={this.handleCancel}
                footer={[
                    <Button
                        key="cancel"
                        onClick={this.handleCancel}
                    >
                        No
                    </Button>,
                    <Button
                        className={Style.fixLoadingBtn}
                        key="ok"
                        type="primary"
                        loading={this.modalState.loading}
                        onClick={this.handleOk}
                    >
                        Yes
                    </Button>,
                ]}
            >
                <p>Do you confirm to delete {this.modalState.origin}?</p>
            </Modal>
        );
    }
}

@observer
class AddInputModal extends React.Component<{}, {}> {
    modalState: {
        visible: boolean;
        loading: boolean;
        selectVal: string;
        inputVal: string;
    } = observable({
        visible: false,
        loading: false,
        selectVal: "http://",
        inputVal: "",
    });

    resetState = (): void => {
        runInAction(() => {
            this.modalState.visible = false;
            this.modalState.loading = false;
            this.modalState.selectVal = "http://";
            this.modalState.inputVal = "";
        });
    }

    handleOk = (): void => {
        runInAction(() => {
            this.modalState.loading = true;
        });
        this.handleAdd().then(() => {
            setTimeout(() => {
                this.resetState();
            }, 1000);
        });
    };

    handleCancel = (): void => {
        this.resetState();
    };

    handleAdd = async (): Promise<void> => {
        await LauncherManager.addApp(`${this.modalState.selectVal}${this.modalState.inputVal}`);
        reloadAppList().then();
    }

    showModal = (): void => {
        runInAction(() => {
            this.modalState.visible = true;
        });
    }

    render() {
        return (
            <Modal
                title="Add App"
                visible={this.modalState.visible}
                onOk={this.handleOk}
                onCancel={this.handleCancel}
                footer={[
                    <Button
                        key="cancel"
                        onClick={this.handleCancel}
                    >
                        Cancel
                    </Button>,
                    <Button
                        className={Style.fixLoadingBtn}
                        key="ok"
                        type="primary"
                        loading={this.modalState.loading}
                        onClick={this.handleOk}
                    >
                        Add
                    </Button>,
                ]}
            >
                <p>Manually add an app:</p>
                <Input
                    addonBefore={
                        <Select
                            value={this.modalState.selectVal}
                            onChange={((value) => {
                                runInAction(() => {
                                    this.modalState.selectVal = value;
                                });
                            })}
                        >
                            <Option value="http://">http://</Option>
                            <Option value="https://">https://</Option>
                            <Option value="ftp://">ftp://</Option>
                            <Option value="chrome://">chrome://</Option>
                        </Select>
                    }
                    placeholder="www.custom-site.com"
                    value={this.modalState.inputVal}
                    onChange={(event) => {
                        runInAction(() => {
                            this.modalState.inputVal = event.target.value;
                        });
                    }}
                />
            </Modal>
        );
    }
}


@observer
export class Launcher extends React.Component<{}, {}> {
    deleteConfirmModal: React.RefObject<DeleteConfirmModal> = React.createRef();
    addInputModal: React.RefObject<AddInputModal> = React.createRef();

    componentDidMount() {
        reloadAppList().then();
    }

    render() {
        return (
            <Scrollbar noScrollX={true} style={{height: "100%", width: "100%"}} className={Style.fixScrollbar}>
                <div className={Style.container}>
                    {appList.map((app: App) => (
                        <Icon
                            key={uuidv4()}
                            app={app}
                            onDelete={() => {
                                this.deleteConfirmModal.current.showModal(app.origin);
                            }}
                        />
                    ))}
                    <div
                        className={Style.icon}
                        onClick={() => {
                            this.addInputModal.current.showModal();
                        }}
                    >
                        <div className={Style.addBtn}>+</div>
                    </div>
                    <DeleteConfirmModal ref={this.deleteConfirmModal}/>
                    <AddInputModal ref={this.addInputModal}/>
                </div>
            </Scrollbar>
        );
    }
}

const appList: IObservableArray<App> = observable([]);

const reloadAppList = async (): Promise<void> => {
    const apps: App[] = await LauncherManager.getApps();
    runInAction(() => {
        appList.replace(apps);
    });
}

