import React, { Component } from "react";
import { ENDPOINTS } from '../utils/config';
import { Spin, message, Button } from 'antd';

export default class Register extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ...this.props.state,
      isError: false,
    };

    this.handleLogin();
  }

  componentDidMount = async () => {
  }

  handleLogin = async() => {
    this.setState({ fetching: true });
    const { email, token, role, addr } = this.props.match.params;
    const { accounts } = this.state.user;

    const response = await fetch(ENDPOINTS + '/verification', {
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
        const rolePrefix = (role === 'voter' ? '1' : '0');
        if (!addr) {
          this.props.history.push("/" + accounts[0] + "/" + email + "/" + rolePrefix + '/' + role);
        } else {
          this.props.history.push("/" + accounts[0] + "/" + email + "/" + rolePrefix + "/" + role + '/' + addr + '/vote-info');
        }
      });
      this.setState({ fetching: false });
    } else {
      this.setState({ isError: true, fetching: false });
    }
  }

  error = () => {
    message.config({
      maxCount: 1,
    });
    message.error('Failed to authentiacted!', 0);
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
      <div>
        { this.state.isError && this.error() }
      </div>
    );
  }
}
