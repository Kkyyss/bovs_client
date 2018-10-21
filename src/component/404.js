import React, { Component } from "react";

export default class NotFound extends Component {
  constructor(props) {
    super(props);
    this.state = this.props.state;
  }

  componentDidMount = async () => {
  }

  render() {
    return (
      <div>not found</div>
    );
  }
}
