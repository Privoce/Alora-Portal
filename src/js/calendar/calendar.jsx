import React from "react";
import { Row, Button } from "antd";
import { format, addDays, subDays } from "date-fns";
import { FaExternalLinkAlt, FaGoogle } from "react-icons/fa";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";

import "../../css/calendar.less";

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
    const isTheSameDay = (date1, date2) => {
      return (
        date1.getDate() == date2.getDate() &&
        date1.getMonth() == date2.getMonth() &&
        date1.getFullYear() == date2.getFullYear()
      );
    };

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
              <BsChevronLeft />
            </Button>
            <Button
              className="arrow--btn"
              onClick={() => {
                this.setState({
                  currentDate: addDays(this.state.currentDate, 1),
                });
              }}
            >
              <BsChevronRight />
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
                    <p>{`${item.title[0].toUpperCase()}${item.title.slice(
                      1
                    )}`}</p>
                    {item.allDay ? (
                      <p>All day</p>
                    ) : (
                      <p>
                        {format(item.start, "HH:mm")} -{" "}
                        {format(item.end, "HH:mm")}
                      </p>
                    )}
                  </div>
                )
            )}
            {this.props.user.events.length === 0 && (
              <p className="event--no-event">No upcoming events</p>
            )}
          </div>
        ) : (
          <>
            <div className="sign-in-label">Sign in to preview your agenda</div>
            <div className="social-auth--container">
              <button onClick={this.props.onLogin}>
                <FaGoogle />
                Sign in with Google
              </button>
            </div>
          </>
        )}
        <div className="link--container">
          <a
            className="google-calendar-link"
            href="https://calendar.google.com/calendar/u/0/r"
            target="_blank"
          >
            <FaExternalLinkAlt />
          </a>
        </div>
      </div>
    );
  }
}

export { Calendar };
