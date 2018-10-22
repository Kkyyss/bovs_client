import React, { Component } from "react";
import { BrowserRouter as Router, Route, Switch, Redirect } from "react-router-dom";
import Home from "./component/home";
import Voter from "./component/voter";
import Register from "./component/register";
import Logout from "./component/logout";
import VoterPoll from "./component/voterpoll";
import Organizer from "./component/organizer";
import OrganizerPoll from "./component/organizerpoll";
import NotFound from "./component/404";
import ElectionFactory from "./contracts/ElectionFactory.json";
import User from "./contracts/User.json";
import TruffleContract from 'truffle-contract';
import getWeb3 from "./utils/getWeb3";

import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      fetching: false,
      unmounted: false,
      web3: null,
      user: {
        accounts: null,
        email: "",
        voter: false
      },
      contract: {
        user: null,
        election: null,
      }};
  }

  componentDidMount = async () => {
    this.initialMetaAndContract();
  };

  initialMetaAndContract = async () => {
    this.setState({ fetching: true });
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const ElectionContract = TruffleContract(ElectionFactory);
      const UserContract = TruffleContract(User);
      ElectionContract.setProvider(web3.currentProvider);
      UserContract.setProvider(web3.currentProvider);
      const electionInstance = await ElectionContract.deployed();
      const userInstance = await UserContract.deployed();
      console.log(electionInstance);
      console.log(userInstance);

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({
        fetching: false,
        web3,
        user: { ...this.state.user, accounts },
        contract: {
          user: userInstance,
          election: electionInstance
        } });
    } catch (err) {
      this.setState({ fetching: false });
    }
  }

  render() {
    if (this.state.fetching) {
      return <div>Loading...</div>;
    }
    if (!this.state.web3) {
      return <div>Please install the metamask and login with the valid accounts...</div>
    }

    return (
      <Router>
        <div>
          <Switch>
            <Route exact path="/" render={(props)=><Home {...props} state={this.state} />} />
            <Route exact path="/register/:token" render={(props)=><Register {...props} state={this.state} />} />
            <Route exact path="/logout" component={Logout} />
            <Route exact path="/:userId/:email/voter" render={(props)=><Voter {...props} state={this.state} />} />
            <Route exact path="/:userId/:email/voter/:electionId" render={(props)=><VoterPoll {...props} state={this.state} />} />
            <Route exact path="/:userId/:email/organizer" render={(props)=><Organizer {...props} state={this.state} />} />
            <Route exact path="/:userId/:email/organizer/:electionId" render={(props)=><OrganizerPoll {...props} state={this.state} />} />
            <Route path="/404" render={(props)=><NotFound {...props} state={this.state} />} />
            <Redirect from="*" to="/404" />
          </Switch>
        </div>
      </Router>
    );
  }
}

export default App;
