import React, { Component } from "react";
import { EMAIL_ENDPOINT } from '../utils/config';

export default class Register extends Component {
  constructor(props) {
    super(props);
    this.state = this.props.state;
  }

  componentDidMount = async () => {
  }

  handleRegister = async(e) => {
    e.preventDefault();
    this.setState({ fetching: true });
    const { email, token } = this.props.match.params;
    const { user } = this.state.contract;
    const { accounts, voter } = this.state.user;

    const response = await fetch(EMAIL_ENDPOINT + '/verification', {
      credentials: 'same-origin',
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        token
      })
    });

    if (response.status === 200) {
      if (email) {
        try {
          await user.loginUser(email, { from: accounts[0] });
        } catch (err) {
          this.setState({ fetching: false });
          return;
        }

        this.setState({ fetching: false }, () => {
          this.props.history.push("/" + accounts[0] + "/" + email + "/" + ((voter) ? "voter" : "organizer"));
        });
      }
    }

  }

  render() {
    if (this.state.fetching) {
      return (
        <div>Loading...</div>
      );
    }

    return (
      <div>
        <div>Register</div>
        <button onClick={this.handleRegister}>Proceed To Register</button>
      </div>
    );
  }
}
