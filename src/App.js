import React, { Component } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import ElectionFactory from "./contracts/ElectionFactory.json";
import TruffleContract from 'truffle-contract';
import getWeb3 from "./utils/getWeb3";
import Routes from "./routes";
import ErrorPage from './component/errorPage';
import * as moment from 'moment';
import { BackTop, Button, Spin } from 'antd';

import { ENDPOINTS } from './utils/config';

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
      },
      auth: false
    };
  }

  componentDidMount = async () => {
    this.initialMetaAndContract();
    this.initialServerDateTime();
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
      ElectionContract.setProvider(web3.currentProvider);
      const electionInstance = await ElectionContract.deployed();

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({
        fetching: false,
        web3,
        user: { ...this.state.user, accounts },
        contract: {
          election: electionInstance
        } });
      web3.currentProvider.publicConfigStore.on('update', async() => {
        const { web3 } = this.state;
        const { accounts } = this.state.user;
        const currentAccount = await web3.eth.getAccounts();
        if (currentAccount[0] !== accounts[0]) {
          window.location.href = "/";
        }
      });
    } catch (err) {
      this.setState({ fetching: false });
    }
  }

  initialServerDateTime = async() => {
    const response = await fetch(ENDPOINTS + "/current-dt", {
      credentials: 'same-origin',
      method: 'GET',
      headers: {
        'Content-Type':'application/json',
      }
    });
    const currentDateTime = await response.json();
    const offsetDateTime = moment.unix(currentDateTime.now).valueOf() - Date.now();
    const now = moment(Date.now() + offsetDateTime);

    setInterval(() => { now.add(1, 's'); }, 1000);

    moment.now = function() { return now; }
  }

  render() {
    if (this.state.fetching) {
      return (
        <div className="loading-cover">
          <Spin />
        </div>
      );
    }
    if (!this.state.web3) {
      return <ErrorPage />
    }

    return (
      <Router>
        <div>
          <BackTop className="back-top-custom" visibilityHeight={200}>
            <Button type="primary" ghost shape="circle" icon="to-top" size="large" />
          </BackTop>
          <Routes {...this.props} state={this.state} />
        </div>
      </Router>
    );
  }
}

export default App;
