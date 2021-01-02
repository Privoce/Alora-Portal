import React from "react";
import {Calendar as BigCalendar, dateFnsLocalizer, Views} from "react-big-calendar";
import {format, getDay, parse, startOfWeek} from "date-fns";
import {FaExternalLinkAlt, FaGoogle} from "react-icons/fa";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "../../css/calendar.less";

const BACKEND_URL = "https://auth.privoce.com/";

const CustomToolbar = () => {
    return <div className="home--calendar-toolbar"/>;
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

class Calendar extends React.Component {
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

    loginHandle = () => {
        const globalThis = this;

        chrome.tabs.create({
            url: `${BACKEND_URL}auth/google?redirect=http://localhost/auth?token=`,
        });

        // we can improve this, listening only the auth tab
        chrome.tabs.onUpdated.addListener(async function authorizationHook(
            tabId,
            changeInfo,
            tab
        ) {
            //If you don't have the authentication tab id remove that part
            if (tab.title.indexOf("token=") >= 0) {
                //tab url consists of access_token
                const url = new URL(tab.url);
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
        // fetch data from api
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
            <>
                {/* We should replace them with antd's Card Component */}
                <BigCalendar
                    className="big-calendar"
                    style={{height: "calc(100% - 30px)"}}
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
                    <FaExternalLinkAlt/>
                </a>
                <div className="social-auth--container">
                    {!this.state.user.googleConnect && (
                        <button onClick={this.loginHandle}>
                            <FaGoogle/>
                            Login with Google
                        </button>
                    )}
                </div>
            </>
        );
    }
}

export {
    Calendar,
};
