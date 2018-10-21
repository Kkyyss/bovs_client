import React, { Component } from "react";

export default class Home extends Component {

  constructor(props) {
    super(props);
    this.state = this.props.state;
  }

  componentDidMount = async () => {
  }

  login = async(e) => {
    e.preventDefault();

    const { user, election } = this.state.contract;
    const { accounts } = this.state.user;

    const valid = await user.verifyCredentials(this.state.user.email);
    if (!valid[0]) {
      console.log("Email/account is invalid.");
      return;
    }
    this.setState({ fetching: true });
    if (!valid[1]) {
      try {
        const response = await user.loginUser(this.state.user.email, { from: accounts[0] });
      } catch (err) {
        this.setState({ fetching: false });
        return;
      }
    }
    // login
    // Request related election
    // this.fetchElection();
    this.setState({ fetching: false }, () => {
      this.props.history.push("/" + accounts[0] + "/" + this.state.user.email + "/" + ((this.state.user.voter) ? "voter" : "organizer"));
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

    return (
      <div className="App">
        <h1>Welcome dudez to this onine voting shit</h1>
        <p>Giff ur email pls</p>
        <form onSubmit={this.login}>
          <input type="text" value={this.state.user.email} onChange={this.handleEmailChange} />
          <br/>
          <span>im voter</span><input type="checkbox" value={this.state.user.voter} onChange={this.handleRoleChange} />
          <br/>
          <input type="submit" value="Login" />
        </form>
      </div>
    );
  }
}
