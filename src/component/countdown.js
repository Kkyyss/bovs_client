import React, { Component } from "react";
import * as moment from 'moment';

export default class CountdownClock extends Component {

  constructor(props) {
    super(props);
    this.state = {
      duration: null,
      countDown: {
        days: 0,
        hours: 0,
        minutes: 0,
        months: 0,
        seconds: 0,
        years: 0
      }
    };
  }

  componentDidMount = () => {
    const interval = 1000;
    this.intervalDT = setInterval(() => this.tick(interval), 1000)
  }
  componentWillUnmount = () => {
    clearInterval(this.intervalDT);
  }

  tick = (interval) => {
    const { start, end, status } = this.props;

    if (status === 0) {
      const dr = moment.duration((end - moment().unix()) * 1000, 'milliseconds');
      const drdt = moment.duration(dr - interval, 'milliseconds');

      this.setState({
        duration: drdt
      })
      if (drdt <= 0) {
        clearInterval(this.intervalDT);
      }
    }
    if (status === 2) {
      const dr = moment.duration((start - moment().unix()) * 1000, 'milliseconds');
      const drdt = moment.duration(dr - interval, 'milliseconds');
      this.setState({
        duration: drdt
      })
      if (drdt <= 0) {
        clearInterval(this.intervalDT);
      }
    }

    const { duration } = this.state;

    if (duration !== null && duration >= 0) {
      this.setState({
        countDown: {
          days: duration.days(),
          hours: duration.hours(),
          minutes: duration.minutes(),
          months: duration.months(),
          seconds: duration.seconds(),
          years: duration.years()
        }
      })
    }
  }

  render() {
    const { status } = this.props;
    const { years, months, days, hours, minutes, seconds } = this.state.countDown;
    const TimesLeft = () => {
      return (
        <div>
          <div>{ (status !== 1) && ("Voting " + ((status === 0 && "Closing In") || "Starting In")) }</div>
          <div>
            {
              (status !== 1) && (
                ((years !== 0 && years + "y ") || "") +
                (((months !== 0 || years !== 0) && months + "m ") || "") +
                (((days !== 0 || months !== 0 || years !== 0) && days + "d ") || "") +
                (((hours !== 0 || days !== 0 || months !== 0 || years !== 0) && hours + "h ") || "") +
                (((minutes !== 0 || hours !== 0 || days !== 0 || months !== 0 || years !== 0) && minutes + "m ") || "") +
                ((seconds !== 0 || minutes !== 0 || hours !== 0 || days !== 0 || months !== 0 || years !== 0) && seconds + "s" || "")
              )
            }
          </div>
        </div>
      )
    }

    return (
      <TimesLeft />
    )
  }

}
