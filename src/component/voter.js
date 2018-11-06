import React, { Component } from "react";
import PollsTable from './pollstable';

export default class Voter extends Component {
  render() {
    return (
      <PollsTable {...this.props} isVoter={true} />
    );
  }
}
