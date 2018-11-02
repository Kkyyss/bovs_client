import React, { Component } from "react";
import { Link } from "react-router-dom";

export default class Voter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ...this.props.state,
      address: []
    };
  }

  componentDidMount = async () => {
    const { unmounted } = this.state;

    if (unmounted) {
      await this.setState({ unmounted: false });
      return;
    }

    await this.fetchElectionAddress();
    await this.listenCreateElectionEvent();
  }
  componentWillUnmount = async() => {
    await this.setState({ unmounted: true });
  }

  listenCreateElectionEvent = async() => {
    const { election } = this.state.contract;
    const { web3 } = this.state;

    const latestBlock = await web3.eth.getBlockNumber();
    election.electionCreated().watch((err, response) => {
     this.fetchElectionAddress();
   });
  }

  fetchElectionAddress = async () => {
    this.setState({ fetching: true });
    const { email, userId } = this.props.match.params;
    const { user, election } = this.state.contract;

    // Get election size
    const electionSize = await election.getSize();
    const myElectionAddress = [];

    // Get election address
    for (let i = 0; i < electionSize; i++) {
      const addr = await election.getVoterElectionAddress(email, i);

      if (!addr[1]) {
        continue;
      }
      const title = await election.getTitle(addr[0]);

      myElectionAddress.push(
        <Link key={addr} to={ "/" + userId + "/" + email + "/voter/" + addr[0] }>{ title }</Link>);
    }

    // Update state with the result.
    this.setState({ address: myElectionAddress, fetching: false });
  };

  render() {
    if (this.state.fetching) {
      return (
        <div>Loading...</div>
      );
    }

    return (
      <div>
        <Link to="/">Logout</Link>
        <div>
          { this.state.address }
        </div>
      </div>
    );
  }
}
