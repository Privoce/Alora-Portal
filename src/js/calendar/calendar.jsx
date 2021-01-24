import React from 'react';
import { Button, Row } from 'antd';
import {
  addDays,
  addMinutes,
  format,
  isSameDay,
  isTomorrow,
  subDays,
} from 'date-fns';
import { FaExternalLinkAlt, FaGoogle } from 'react-icons/fa';
import { BsChevronLeft, BsChevronRight } from 'react-icons/bs';
import loadingGif from '../../assets/loading.gif';
import '../../css/calendar.less';

import { useTranslation } from 'react-i18next';
import "../../locales/i18n";

class Calendar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      historyDomains: [],
      workspaces: [],
      currentWorkspaceId: null,
      currentDate: new Date(),
      events: [],
      todayEvents: true,
    };
    this.nextDay = this.nextDay.bind(this);
    this.prevDay = this.prevDay.bind(this);
    this.currentDay = this.currentDay.bind(this);
  }

  checkEvents(date) {
    const check = this.props.user.events.find(evento =>
      isSameDay(evento.start, date),
    );

    this.props.getEvents(date);

    this.setState({
      todayEvents: check,
    });
  }

  nextDay() {
    this.checkEvents(addDays(this.state.currentDate, 1));

    this.setState({
      currentDate: addDays(this.state.currentDate, 1),
    });
  }

  prevDay() {
    this.checkEvents(subDays(this.state.currentDate, 1));

    this.setState({
      currentDate: subDays(this.state.currentDate, 1),
    });
  }

  currentDay() {
    this.checkEvents(new Date());

    this.setState({
      currentDate: new Date(),
    });
  }

  componentDidMount() {
    // change the currente date when change day
    this.timer = setInterval(() => {
      if (isTomorrow(addMinutes(new Date(), 1))) {
        this.setState({
          currentDate: addMinutes(new Date(), 1),
        });
      }
    }, 20000);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  render() {
    const isTheSameDay = (date, date2) => {
      if (date.allDay) return isSameDay(date.end, date2);
      return isSameDay(date.start, date2);
    };

    const isOngoingEvent = date => {
      let currentTime = new Date();
      if (date.allDay && isSameDay(date.end, currentTime)) return true;
      return date.start < currentTime && date.end > currentTime;
    };

    const { t } = this.props;

    return (
      <div className="calendar--container">
        <div className="calendar-footer--container">
          <Row className="header-left">
            <Button
              className="arrow--btn"
              onClick={this.prevDay}
              icon={<BsChevronLeft />}
            ></Button>
            <Button
              className="arrow--btn"
              onClick={this.nextDay}
              icon={<BsChevronRight />}
            ></Button>
            <div className="header-date">
              <p>{format(this.state.currentDate, 'dd MMMM, yyyy')}</p>
            </div>
          </Row>
          <div>
            <button
              className={`calendar--card-today ${
                !isSameDay(this.state.currentDate, new Date()) && 'not-today'
              }`}
              style={this.state.buttonStyle}
              onClick={this.currentDay}
            >
              <Today />
            </button>
          </div>
        </div>

        {this.props.user.googleConnect ? (
          <div className="events--container">
            {this.props.user.events.map(
              item =>
                isTheSameDay(item, this.state.currentDate) && (
                  <div
                    className={
                      isOngoingEvent(item)
                        ? 'event--card ongoing-event'
                        : 'event--card'
                    }
                  >
                    <p>{`${item.title[0].toUpperCase()}${item.title.slice(
                      1,
                    )}`}</p>
                    {item.allDay ? (
                      <p>
                        <AllDay />
                      </p>
                    ) : (
                      <p>
                        {format(item.start, 'HH:mm')} -{' '}
                        {format(item.end, 'HH:mm')}
                      </p>
                    )}
                  </div>
                ),
            )}
            {this.props.eventLoading ? (
              <center>
                <img src={loadingGif} className="calendar--image-load" />
              </center>
            ) : this.props.user.events.length === 0 ||
              !this.state.todayEvents ? (
              <p className="event--no-event">
                <NoUpcomingEvents />
              </p>
            ) : null}
          </div>
        ) : (
          <>
            <div className="sign-in-label">
              <SigninToPreview />
            </div>
            <div className="social-auth--container">
              <button onClick={this.props.onLogin}>
                <FaGoogle />
                <SigninWithGoogle />
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

function AllDay() {
  const { t } = useTranslation();
  return <>{t('ALL_DAY')}</>;
}

function SigninToPreview() {
  const { t } = useTranslation();
  return <>{t('SIGNIN_TO_PREVIEW')}</>;
}

function SigninWithGoogle() {
  const { t } = useTranslation();
  return <>{t('SIGNIN_WITH_GOOGLE')}</>;
}

function NoUpcomingEvents() {
  const { t } = useTranslation();
  return <>{t('NO_UPCOMING_EVENTS')}</>;
}

function Today() {
  const { t } = useTranslation();
  return <>{t('TODAY')}</>;
}

export { Calendar };
