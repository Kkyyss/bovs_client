import React, { Component } from "react";
import * as moment from 'moment';
import { Link } from "react-router-dom";

export default class Organizer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ...this.props.state,
      electionForm: {
        title: "",
        candidates: "",
        voters: "",
        manual: false,
        startNow: false,
        start: 0,
        end: 0
      },
      address: []
    };
  }

  componentDidMount = async () => {
    const { unmounted } = this.state;
    if (unmounted) {
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
      if (response.blockNumber > latestBlock) {
         this.clearElectionForm();
         this.fetchElectionAddress();
      }
    });
  }

  createElection = async (e) => {
    e.preventDefault();

    this.setState({ fetching: true });
    const { email, userId } = this.props.match.params;
    const { election } = this.state.contract;
    const { accounts } = this.state.user;
    const { title, candidates, voters, manual, startNow, start, end } = this.state.electionForm

    try {
      await election.createElection(
        email, title,
        candidates.split(";"), voters.split(";"),
        manual, startNow,
        moment(start).unix(), moment(end).unix(), { from: accounts[0] });
    } catch (err) {
      this.setState({ fetching: false });
    }
  }

  clearElectionForm = async() => {
    await this.setState({ electionForm: {
      title: "",
      candidates: "",
      voters: "",
      manual: false,
      startNow: false,
    } });
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
      const addr = await election.getOwnerElectionAddress(email, i);

      if (!addr[1]) {
        continue;
      }
      const title = await election.getTitle(addr[0]);

      myElectionAddress.push(
        <Link key={addr} to={ "/" + userId + "/" + email + "/organizer/" + addr[0] }>{ title }</Link>);
    }

    // Update state with the result.
    this.setState({ address: myElectionAddress, fetching: false });
  };

  handleTitleChange = (e) => {
    this.setState({ electionForm: {
      ...this.state.electionForm,
      title: e.target.value
    }})
  }
  handleCandidatesChange = (e) => {
    this.setState({ electionForm: {
      ...this.state.electionForm,
      candidates: e.target.value
    }})
  }
  handleVotersChange = (e) => {
    this.setState({ electionForm: {
      ...this.state.electionForm,
      voters: e.target.value
    }})
  }
  handleManualChange = (e) => {
    this.setState({ electionForm: {
      ...this.state.electionForm,
      manual: e.target.checked
    }})
  }
  handleStartNowChange = (e) => {
    this.setState({ electionForm: {
      ...this.state.electionForm,
      startNow: e.target.checked
    }})
  }
  handleStartDateChange = (e) => {
    this.setState({ electionForm: {
      ...this.state.electionForm,
      start: e.target.value
    }})
  }
  handleEndDateChange = (e) => {
    this.setState({ electionForm: {
      ...this.state.electionForm,
      end: e.target.value
    }})
  }

  render() {
    if (this.state.fetching) {
      return (
        <div>Loading...</div>
      );
    }

    const { electionForm } = this.state;

    return (
      <div>
        <div>Organizer</div>
        { this.state.address }
        <form onSubmit={this.createElection}>
          <input type="text" value={electionForm.title} onChange={this.handleTitleChange} />
          <br/>
          <input type="text" value={electionForm.candidates} onChange={this.handleCandidatesChange} />
          <br/>
          <input type="text" value={electionForm.voters} onChange={this.handleVotersChange} />
          <br/>
          Manual <input type="checkbox" value={electionForm.manual} onChange={this.handleManualChange} />
          <br/>
          Create & Start <input type="checkbox" value={electionForm.startNow} onChange={this.handleStartNowChange} />
          <br/>
          Stat Date<input type="datetime-local" value={electionForm.start} onChange={this.handleStartDateChange} />
          <br/>
          End Date<input type="datetime-local" value={electionForm.end} onChange={this.handleEndDateChange} />
          <br/>
          <input type="submit" value="Create" />
        </form>
      </div>
    );
  }
}

