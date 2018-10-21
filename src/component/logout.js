import React, { Component } from "react";

export default class Logout extends Component {
  componentDidMount = async () => {
    this.props.history.push("/");
  }

  render() {
    return (
      <div>Logout...</div>
    );
  }
}
