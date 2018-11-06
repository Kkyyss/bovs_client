import React, { Component } from "react";
import PollsTable from './pollstable';

export default class Organizer extends Component {
  render() {
    return (
      <PollsTable {...this.props} isVoter={false} />
    );
  }
}

