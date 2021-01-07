import React from "react";
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  Views,
} from "react-big-calendar";
import { Row, Button } from "antd";
import { format, getDay, parse, startOfWeek } from "date-fns";
import {
  FaExternalLinkAlt,
  FaGoogle,
  FaArrowRight,
  FaArrowLeft,
} from "react-icons/fa";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "../../css/calendar.less";

const CustomToolbar = () => {
  return <></>;
};

const CustomTimeGutterHeader = (onClick) => {
  return (
    <div>
      <button className="calendar--card-today" onClick={onClick}>
        Today
      </button>
    </div>
  );
};

const CustomDateCellWrapper = (date) => {
  return (
    <div className="calendar--card-date">
      <p>{format(date, "dd MMMM, yyyy")}</p>
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
      currentDate: new Date(),
      events: [],
    };
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
      <div className="calendar--container">
        <div className="calendar-footer--container">
          <Row className="header-left">
            <Button
              className="arrow--btn"
              onClick={() => {
                this.setState({
                  currentDate: subDays(this.state.currentDate, 1),
                });
              }}
            >
              <FaArrowLeft />
            </Button>
            <Button
              className="arrow--btn"
              onClick={() => {
                this.setState({
                  currentDate: addDays(this.state.currentDate, 1),
                });
              }}
            >
              <FaArrowRight />
            </Button>
            <div className="header-date">
              <p>{format(this.state.currentDate, "dd MMMM, yyyy")}</p>
            </div>
          </Row>
          <div>
            <button
              className="calendar--card-today"
              style={this.state.buttonStyle}
              onClick={() => {
                this.setState({
                  currentDate: new Date(),
                });
              }}
            >
              Today
            </button>
          </div>
        </div>

        {this.props.user.googleConnect ? (
          <div className="events--container">
            {this.props.user.events.map(
              (item) =>
                isTheSameDay(item.start, this.state.currentDate) && (
                  <div className="event--card">
                    <p>{item.title}</p>
                  </div>
                )
            )}
          </div>
        ) : (
          <>
            <div className="social-auth--container">
              <button onClick={this.loginHandle}>
                <FaGoogle />
                Login with Google
              </button>
            </div>
          </>
        )}
        <a
          className="google-calendar-link"
          href="https://calendar.google.com/calendar/u/0/r"
          target="_blank"
        >
          <FaExternalLinkAlt />
        </a>
      </div>
    );
  }
}

export { Calendar };
