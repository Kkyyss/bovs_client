import React, { Component } from "react";
import { EMAIL_ENDPOINT } from '../utils/config';

export default class Home extends Component {

  constructor(props) {
    super(props);
    this.state = {
      ...this.props.state,
      sentEmail: false,
    };
  }

  componentDidMount = async () => {
  }

  login = async(e) => {
    e.preventDefault();

    const { user, election } = this.state.contract;
    const { accounts, email, voter } = this.state.user;

    const valid = await user.verifyCredentials(this.state.user.email);
    if (!valid[0]) {
      console.log("Email/account is invalid.");
      return;
    }
    this.setState({ fetching: true });
    if (!valid[1]) {
      const response = await fetch(EMAIL_ENDPOINT + '/token', {
        method: 'POST',
        headers: {
          'Content-Type':'application/json'
        },
        body: JSON.stringify({
          email
        })
      });

      this.setState({ fetching: false });
      return;
    }
    // login
    this.setState({ fetching: false }, () => {
      this.props.history.push("/" + accounts[0] + "/" + email + "/" + ((voter) ? "voter" : "organizer"));
    });
  }

  handleEmailChange = (e) => {
    // e.preventDefault();
    this.setState({
      user: {
        ...this.state.user,
        email: e.target.value
      }
    });
  }

  handleRoleChange = (e) => {
    this.setState({
      user: {
        ...this.state.user,
        voter: e.target.checked
      }
    });
  }

  render() {
    if (this.state.fetching) {
      return (
        <div>Loading...</div>
      );
    }

    const { email, voter } = this.state.user;
    const { sentEmail } = this.state;

    return (
      <div className="App">
        <h1>Welcome dudez to this onine voting shit</h1>
        <p>Giff ur email pls</p>
        <form onSubmit={this.login}>
          <input type="text" value={email} onChange={this.handleEmailChange} />
          <br/>
          <span>im voter</span><input type="checkbox" value={voter} onChange={this.handleRoleChange} />
          <br/>
          <input type="submit" value="Login" />
        </form>
      </div>
    );
  }
}
