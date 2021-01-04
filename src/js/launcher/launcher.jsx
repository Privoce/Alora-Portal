import React from "react";
import PropTypes from "prop-types";
import {CloseOutlined} from "@ant-design/icons";
import {v4 as uuid} from "uuid";

import Style from "../../css/launcher.module.less";
import {getFaviconUrl} from "../misc/utils";

class Icon extends React.Component {
    render() {
        return (
            <div className={Style.icon}>
                <img src={getFaviconUrl(this.props.url)} alt="" onDragStart={event => event.preventDefault()}/>
                <div className={Style.closeBtn}>
                    <CloseOutlined/>
                </div>
            </div>
        );
    }
}

Icon.propTypes = {
    id: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
};

class Launcher extends React.Component {
    render() {
        return (
            <div className={Style.container}>
                <Icon id={uuid()} url="https://www.google.com"/>
                <Icon id={uuid()} url="https://reactjs.org/"/>
                <Icon id={uuid()} url="https://www.youtube.com"/>
                <Icon id={uuid()} url="https://facebook.com/"/>
                <Icon id={uuid()} url="https://twitter.com"/>
                <Icon id={uuid()} url="https://www.baidu.com/"/>
                <div className={Style.icon}>
                    <div className={Style.addBtn}>+</div>
                </div>
            </div>
        );
    }
}

export {
    Launcher
};