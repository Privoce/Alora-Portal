import React from "react";
import ReactDOM from "react-dom";
import {observer} from "mobx-react";
import {Col, Row} from "antd";

import {Launcher} from "./launcher/launcher";
import {Workspace} from "./workspace/workspace";
import {Notes} from "./notes/note";

import "antd/dist/antd.less";
import "../css/portal.less";

import calendarImg from "../assets/calendar.png";
import workspaceImg from "../assets/workspace.png";
import gpsIcon from "../assets/gps-icon.png";
import sunIcon from "../assets/sun-icon.png";
import noteIcon from "../assets/notes.png";
import {Calendar} from "./calendar/calendar";

@observer
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
    }

    getHour = () => {
        const date = new Date();
        const hour = date.getHours();
        const minutes = date.getMinutes();

        return `${hour < 10 ? "0" : ""}${hour}:${
            minutes < 10 ? "0" : ""
        }${minutes}`;
    };

    getEventsFromServer = async () => {
        const googleConnected = localStorage.getItem("googleConnect");
        const token = localStorage.getItem("token");
        const nickname = localStorage.getItem("nickname");

        this.setState({
            user: {
                name: nickname,
                googleConnect: googleConnected,
                token,
                events: [],
            },
        });

        // if dont have google account connected
        if (!googleConnected || token === "") {
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
                allDay: !!event.start.date,
            }));

            console.log("calendar", {
                user: {
                    name: nickname,
                    token,
                    googleConnect: googleConnected,
                    events,
                },
            });

            this.setState({
                user: {
                    name: nickname,
                    token,
                    googleConnect: googleConnected,
                    events,
                },
            });
        }
    };

    componentDidMount() {
        //fetch data from api
        this.getEventsFromServer();

        const googleConnected = localStorage.getItem("googleConnect");
        const nickname = localStorage.getItem("nickname");

        this.setState({
            user: {
                ...this.state.user,
                name: nickname,
                googleConnect: googleConnected === "true",
            },
        });
    }

    render() {
        return (
            <Row className="container--portal">
                <Col span={6}>
                    <h1 className="home--clock">{this.getHour()}</h1>
                    <h1 className="home--username">
                        Welcome {this.state.user.name ? this.state.user.name : "User"}
                    </h1>
                    <p className="home--weather">
                        <img src={sunIcon} width={20} height={20}/> 80 F
                    </p>
                    <p className="home--location">
                        <img src={gpsIcon} width={17} height={17}/> Boston, US
                    </p>
                    <div className="home--history">
                        <Launcher/>
                    </div>
                </Col>

                <Col span={9}>
                    {
                        // We should replace them with antd's Card Componment
                    }
                    <div className="home--calendar-toolbar calendar-header">
                        <img src={calendarImg} alt=""/>
                        <h2 className="home--calendar">Calendar</h2>
                    </div>
                    <div className="site-calendar-demo-card">
                        <div className="calendar">
                            <Calendar/>
                        </div>
                    </div>

                    <div className="note-container">
                        <div className="home--calendar-toolbar calendar-header">
                            <img src={noteIcon} alt=""/>
                            <h2 className="home--calendar">Notes</h2>
                        </div>
                        <div className="site-calendar-demo-card">
                            <div className="notes">
                                <Notes/>
                            </div>
                        </div>
                    </div>

                </Col>

                <Col span={9}>
                    <div className="home--workspace-toolbar workspace-header">
                        <img src={workspaceImg} alt=""/>
                        <h2 className="home--workspace">Workspace</h2>
                    </div>
                    <div className="workspace">
                        <Workspace/>
                    </div>
                </Col>
            </Row>
        );
    }
}

ReactDOM.render(<App/>, document.getElementById('root'));
