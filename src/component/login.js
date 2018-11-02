import React, { Component } from "react";
import { EMAIL_ENDPOINT } from '../utils/config';
import { Spin } from 'antd';

export default class Register extends Component {
  constructor(props) {
    super(props);
    this.state = this.props.state;

    this.handleLogin();
  }

  componentDidMount = async () => {
  }

  handleLogin = async() => {
    this.setState({ fetching: true });
    const { email, token, role, addr } = this.props.match.params;
    const { accounts } = this.state.user;

    const response = await fetch(EMAIL_ENDPOINT + '/verification', {
      credentials: 'same-origin',
      method: 'GET',
      headers: {
        'Content-Type':'application/json',
        'Authorization': 'Bearer ' + token
      }
    });

    if (response.status === 200) {
      localStorage.setItem('token', token);
      this.setState({ fetching: false }, () => {
        if (!addr) {
          this.props.history.push("/" + accounts[0] + "/" + email + "/" + role);
        } else {
          this.props.history.push("/" + accounts[0] + "/" + email + "/voter/" + addr);
        }
      });
    }
    this.setState({ fetching: false });
  }

  render() {
    if (this.state.fetching) {
      return (
        <div className="loading-cover">
          <Spin />
        </div>
      );
    }

    return (
      <div>Failed to login...</div>
    );
  }
}