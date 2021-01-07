import React from "react";
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  Views,
} from "react-big-calendar";
import { Button, Row } from "antd";
import {
  FaGoogle,
  FaExternalLinkAlt,
  FaArrowLeft,
  FaArrowRight,
} from "react-icons/fa";
import {
  getMonth,
  getDay,
  startOfWeek,
  parse,
  format,
  addDays,
  subDays,
} from "date-fns";

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
      <>
        {/* We should replace them with antd's Card Component */}
        <div className="calendar--container">
          {this.props.user.googleConnect ? (
            <>
              <BigCalendar
                className="big-calendar"
                style={{ height: "320px" }}
                events={this.props.user.events}
                date={this.state.currentDate}
                localizer={localizer}
                startAccessor="start"
                endAccessor="end"
                defaultView={Views.DAY}
                views={Views.DAY}
                step={30}
                showMultiDayTimes
                components={{
                  toolbar: CustomToolbar,
                  timeGutterHeader: () =>
                    CustomTimeGutterHeader(() =>
                      this.setState({ currentDate: new Date() })
                    ),
                  dateCellWrapper: () =>
                    CustomDateCellWrapper(this.state.currentDate),
                }}
              />
              <div className="calendar-footer--container">
                <Row>
                  <Button
                    onClick={() => {
                      this.setState({
                        currentDate: subDays(this.state.currentDate, 1),
                      });
                    }}
                  >
                    <FaArrowLeft />
                  </Button>
                  <Button
                    onClick={() => {
                      this.setState({
                        currentDate: addDays(this.state.currentDate, 1),
                      });
                    }}
                  >
                    <FaArrowRight />
                  </Button>
                </Row>
                <a
                  className="google-calendar-link"
                  href="https://calendar.google.com/calendar/u/0/r"
                  target="_blank"
                >
                  <FaExternalLinkAlt />
                </a>
              </div>
            </>
          ) : (
            <>
              <div className="social-auth--container">
                <button onClick={() => this.props.onLogin()}>
                  <FaGoogle />
                  Login with Google
                </button>
              </div>
            </>
          )}
        </div>
      </>
    );
  }
}

export { Calendar };
