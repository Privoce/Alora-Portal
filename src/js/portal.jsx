import React from "react";
import ReactDOM from "react-dom";
import { observer } from "mobx-react";
import { Col, Row } from "antd";
import socketIOClient from "socket.io-client";

import { Launcher } from "./launcher/launcher";
import { Workspace } from "./workspace/workspace";
import { Notes } from "./notes/note";

import "antd/dist/antd.less";
import "../css/portal.less";

import calendarImg from "../assets/calendar.png";
import workspaceImg from "../assets/workspace.png";
import gpsIcon from "../assets/gps-icon.png";
import sunIcon from "../assets/sun-icon.png";
import noteIcon from "../assets/notes.png";
import { Calendar } from "./calendar/calendar";

import { OPEN_WEATHER_API_KEY, BACKEND_URL } from "./misc/variables";
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
      location: {
        city: "",
        region: "",
        temp: "",
      },
    };

    this.socket = null;
    this.loginHandle = this.loginHandle.bind(this);
    this.getEventsFromServer = this.getEventsFromServer.bind(this);
  }

  getHour = () => {
    const date = new Date();
    const hour = date.getHours();
    const minutes = date.getMinutes();

    return `${hour < 10 ? "0" : ""}${hour}:${
      minutes < 10 ? "0" : ""
    }${minutes}`;
  };

  async getEventsFromServer() {
    const { user } = this.state;

    // if dont have google account connected
    if (!user.googleConnect || user.token == "") {
      return;
    }

    const response = await fetch(`${BACKEND_URL}user/calendar`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": user.token,
      },
    });

    if (response.status > 204) {
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

      // If is the same, dont update the state
      if (JSON.stringify(this.state.events) === JSON.stringify(events)) {
        return;
      }

      this.setState({
        user: {
          ...this.state.user,
          events,
        },
      });
    }
  }

  async getLocationAndWeather() {
    const locationResponse = await fetch("http://ip-api.com/json/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const locationData = await locationResponse.json();

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${locationData.city},${locationData.region},br&appid=${OPEN_WEATHER_API_KEY}`;

    const weatherResponse = await fetch(weatherUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const weatherData = await weatherResponse.json();

    this.setState({
      location: {
        city: locationData.city,
        region: locationData.region,
        temp: Math.floor(Number(weatherData.main.temp) - 273.15),
      },
    });
  }

  loginHandle = () => {
    const globalThis = this;

    chrome.tabs.create({
      url: `${BACKEND_URL}auth/google?redirect=https://privoce.com/thankyou.html?token=`,
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
          alert("Error");
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
        localStorage.setItem("userId", userData.user._id);

        globalThis.socket.emit("storeClientInfo", userData.user);
        globalThis.getEventsFromServer();

        setTimeout(() => {
          chrome.tabs.remove(tabId);
          chrome.tabs.onUpdated.removeListener(authorizationHook);
        }, 1000);
      }
    });
  };

  componentDidMount() {
    this.socket = socketIOClient(BACKEND_URL);

    const googleConected = localStorage.getItem("googleConnect");
    const nickname = localStorage.getItem("nickname");
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    if (googleConected === "true") {
      this.socket.emit("storeClientInfo", { nickname, _id: userId });
    }

    this.socket.on("new-event", (data) => {
      this.getEventsFromServer();
    });

    this.setState(
      {
        user: {
          ...this.state.user,
          name: nickname,
          token,
          googleConnect: googleConected === "true",
        },
      },
      () => this.getEventsFromServer()
    );

    this.getLocationAndWeather();
  }

  render() {
    const { location, user } = this.state;
    return (
      <Row className="container--portal">
        <Col span={6}>
          <h1 className="home--clock">{this.getHour()}</h1>
          <h1 className="home--username">
            Welcome{" "}
            {user.name
              ? `${user.name.charAt(0).toUpperCase()}${user.name.slice(1)}`
              : "User"}
          </h1>
          <p className="home--weather">
            <img src={sunIcon} width={20} height={20} /> {location.temp}° C
          </p>
          <p className="home--location">
            <img src={gpsIcon} width={17} height={17} /> {location.city},{" "}
            {location.region}
          </p>
          <div className="home--history">
            <Launcher />
          </div>
        </Col>

        <Col span={9}>
          {
            // We should replace them with antd's Card Componment
          }
          <div className="home--calendar-toolbar calendar-header">
            <img src={calendarImg} alt="" />
            <h2 className="home--calendar">Calendar</h2>
          </div>
          <div className="site-calendar-demo-card">
            <div className="calendar">
              <Calendar onLogin={this.loginHandle} user={user} />
            </div>
          </div>

          <div className="note-container">
            <div className="home--calendar-toolbar calendar-header">
              <img src={noteIcon} alt="" />
              <h2 className="home--calendar">Notes</h2>
            </div>
            <div className="site-calendar-demo-card">
              <div className="notes">
                <Notes />
              </div>
            </div>
          </div>
        </Col>

        <Col span={9}>
          <div className="home--workspace-toolbar workspace-header">
            <img src={workspaceImg} alt="" />
            <h2 className="home--workspace">Workspace</h2>
          </div>
          <div className="workspace">
            <Workspace />
          </div>
        </Col>
      </Row>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("root"));
