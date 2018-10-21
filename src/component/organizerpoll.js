import React, { Component } from "react";
import * as moment from 'moment';
export default class OrganizerPoll extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ...this.props.state,
      electionInfo: {
        title: "",
        candidates: [],
        manual: false,
        status: null,
        start: null,
        end: null
      },
      candidates: []
    };
  }

  componentDidMount = async () => {
    const { unmounted } = this.state;

    if (unmounted) {
      return;
    }

    await this.fetchElectionContent();
    await this.listenVoteEvent();
    await this.listenStartedElectionEvent();
    await this.listenClosedElectionEvent();
  }
  componentWillUnmount = async() => {
    await this.setState({ unmounted: true });
  }

  listenStartedElectionEvent = async() => {
    const { election } = this.state.contract;
    const { web3 } = this.state;

    const latestBlock = await web3.eth.getBlockNumber();
    election.startedElection().watch((err, response) => {
      if (response.blockNumber > latestBlock) {
        this.fetchElectionContent();
      }
    });
  }
  listenClosedElectionEvent = async() => {
    const { election } = this.state.contract;
    const { web3 } = this.state;

    const latestBlock = await web3.eth.getBlockNumber();
    election.closedElection().watch((err, response) => {
      if (response.blockNumber > latestBlock) {
        this.fetchElectionContent();
      }
    });
  }

  listenVoteEvent = async() => {
    const { election } = this.state.contract;
    const { web3 } = this.state;

    const latestBlock = await web3.eth.getBlockNumber();
    election.votedEvent().watch((err, response) => {
      if (response.blockNumber > latestBlock) {
        this.fetchElectionContent();
      }
    });
  }

  startElection = async(e) => {
    e.preventDefault();
    const { email, electionId } = this.props.match.params;
    const { election } = this.state.contract;
    const { accounts } = this.state.user;

    this.setState({ fetching: true });

    try {
      await election.start(electionId, email, { from: accounts[0] });
    } catch (err) {
      console.log(err);
      this.setState({ fetching: false });
    }
  }
  closeElection = async(e) => {
    e.preventDefault();
    const { email, electionId } = this.props.match.params;
    const { election } = this.state.contract;
    const { accounts } = this.state.user;

    this.setState({ fetching: true });

    try {
      await election.close(electionId, email, { from: accounts[0] });
    } catch (err) {
      this.setState({ fetching: false });
    }
  }

  compareDate = async() => {
    const { end } = this.state.electionInfo;
    const status = (moment().unix() >= end) ? 1 : 0;
    if (status) {
      await this.setState({ electionInfo: { ...this.state.electionInfo, status } });
      return;
    }
    setTimeout(this.compareDate, 1000);
  }

  fetchElectionContent = async() => {
    this.setState({ fetching: true });
    const { email, userId, electionId } = this.props.match.params;
    const { election } = this.state.contract;

    const title = await election.getTitle(electionId);
    const manual = await election.isManual(electionId);
    const start = await election.getStartDate(electionId);
    if (manual) {
      const res = await election.getStatus(electionId);
      this.setState({ electionInfo: { ...this.state.electionInfo, start, status: res.toNumber() }  })
    } else {
      // Compare date
      const end = await election.getEndDate(electionId);
      const status = (moment().unix() >= end) ? 1 : 0;
      this.setState({ electionInfo: { ...this.state.electionInfo, start, end, status } })
      if (!status) this.compareDate();
    }
    const candSize = await election.getCandidateSize(electionId);

    const candidates = [];
    for (let i = 0; i < candSize; i++) {
      const cand = await election.getCandidate(electionId, i);
      candidates.push(
        <div key={i}>{ cand[1] + " count: " + cand[2] }</div>
      );
    }

    this.setState({ electionInfo: {
      ...this.state.electionInfo, title, candidates, manual
    }, fetching: false });
  }

  render() {
    if (this.state.fetching) {
      return (
        <div>Loading...</div>
      );
    }

    const StartButton = () => {
      return (
        <button onClick={this.startElection}>Start</button>
      )
    };
    const CloseButton = () => {
      return (
        <button onClick={this.closeElection}>Close</button>
      )
    };
    const ResultContent = () => {
      return (
        <div>Closed</div>
      )
    };

    const { electionInfo } = this.state;

    return (
      <div>
        <div>{ "organizer poll:" + electionInfo.title }</div>
        <div>{ "Start date: " + moment.unix(electionInfo.start).format('MMMM Do YYYY, h:mm:ss a') }</div>
        <div>{ "End date: " + moment.unix(electionInfo.end).format('MMMM Do YYYY, h:mm:ss a') }</div>
        { electionInfo.candidates }
        { (electionInfo.manual && electionInfo.status === 2) && <StartButton /> }
        { (electionInfo.manual && electionInfo.status === 0) && <CloseButton /> }
        { electionInfo.status === 1 && <ResultContent /> }
      </div>
    );
  }
}
