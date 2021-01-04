import React from "react";
import ReactDOM from "react-dom";
import {FaExternalLinkAlt, FaGoogle} from "react-icons/fa";
import {Avatar, Button, Col, List, Popover, Row, Tabs, Tooltip} from "antd";
import {v4 as uuidv4} from "uuid";
import {Calendar as BigCalendar, dateFnsLocalizer, Views,} from "react-big-calendar";
import {format, getDay, parse, startOfWeek} from "date-fns";
import {Scrollbar} from "react-scrollbars-custom";

import {Notes} from "./notes/note";
import {Calendar} from "./calendar/calendar";
import {Workspace} from "./workspace/workspace";

import "antd/dist/antd.less";
import "../css/portal.less";
import calendarImg from "../assets/calendar.png";
import workspaceImg from "../assets/workspace.png";
import plusIcon from "../assets/plus-icon.png";
import gpsIcon from "../assets/gps-icon.png";
import sunIcon from "../assets/sun-icon.png";
import noteIcon from "../assets/notes.png";

// test
ReactDOM.render(<div style={{height: "100vh", marginTop: "-1px", paddingTop: "1px"}}>
    <Workspace/>
</div>, document.getElementById("root"));
