import React, { Component } from "react";
import * as moment from 'moment';
import { EMAIL_ENDPOINT } from '../utils/config';
import CountdownClock from './countdown';

export default class VoterPoll extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ...this.props.state,
      electionInfo: {
        title: "",
        candidates: [],
        isPublic: 0,
        isManual: false,
        status: 0,
        winner: null,
        start: 0,
        end: 0
      },
      voter: {
        voted: false,
        votedTo: ""
      },
      voteForm: {
        selected: 0,
      }
    };
  }

  componentDidMount = async () => {
    const { unmounted } = this.state;

    if (unmounted) {
      await this.setState({ unmounted: false });
      return;
    }

    await this.fetchElectionContent();
    await this.listenClosedElectionEvent();
  }

  componentWillUnmount = async() => {
    await this.setState({ unmounted: true });
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

  compareDate = async() => {
    const { start, end, status } = this.state.electionInfo;
    if (status === 1) return;
    const curStatus = (moment().unix() < start) ? 2 : (end !== 0 && moment().unix() >= end) ? 1 : 0;

    if (status !== 0 && curStatus === 0) {
      this.setState({ electionInfo: {
        ...this.state.electionInfo,
        status: curStatus
      }})

      if (end === 0) {
        return;
      }
    }

    if (curStatus === 1) {
      await this.setState({ electionInfo: {
        ...this.state.electionInfo,
        status: curStatus
      }})
      this.fetchWinner();
      return;
    }
    setTimeout(this.compareDate, 1000);
  }

  fetchElectionContent = async() => {
    this.setState({ fetching: true });
    const { email, userId, electionId } = this.props.match.params;
    const { election } = this.state.contract;

    const isVoted = await election.isVoted(electionId, email);
    const isPublic = await election.getMode(electionId);
    const start = await election.getStartDate(electionId);
    const end = await election.getEndDate(electionId);

    await this.setState({ electionInfo: { ...this.state.electionInfo, start: start.toNumber() }, voter: { ...this.state.voter, voted: isVoted } });
    if (end.toNumber() === 0) {
      const status = (moment().unix() < start) ? 2 : 0;
      await this.setState({ electionInfo: { ...this.state.electionInfo, isManual: true, status } });
      if (status === 2) this.compareDate();
    } else {
      const status = (moment().unix() < start) ? 2 : (moment().unix() >= end) ? 1 : 0;
      await this.setState({ electionInfo: { ...this.state.electionInfo, end: end.toNumber(), status } })
      if (status !== 1) this.compareDate();
    }
    if (this.state.electionInfo.status === 1) {
      await this.fetchWinner();
    }

    if (isVoted) {
      const votedTo = await election.getVotedTo(electionId, email);

      this.setState({ fetching: false, voter: { ...this.state.voter, votedTo } });
    } else {
      const cands = await this.fetchCandidates();
      const candidates = []
      for (let i = 0; i < cands.length; i++) {
        candidates.push(
          <option key={i} value={ cands[i][0] }>{ cands[i][1] + " vote: " + cands[i][2] }</option>
        );
      }
      this.setState({ fetching: false, electionInfo: { ...this.state.electionInfo, candidates } });
    }
  }

  fetchWinner = async() => {
    const { email, electionId } = this.props.match.params;
    const { election } = this.state.contract;
    const candidates = await this.fetchCandidates();

    const votes = []
    for (let i = 0; i < candidates.length; i++) {
      votes.push(candidates[i][2].toNumber());
    }
    await this.setState({ fetching: false, electionInfo: { ...this.state.electionInfo, winner: candidates[votes.indexOf(Math.max(...votes))] } });
  }

  fetchCandidates = async() => {
    const { email, electionId } = this.props.match.params;
    const { election } = this.state.contract;

    const candSize = await election.getCandidateSize(electionId);

    const candidates = [];
    for (let i = 0; i < candSize; i++) {
      const cand = await election.getCandidate(electionId, i);
      candidates.push(cand);
    }
    return candidates;
  }

  handleSelectedChange = (e) => {
    this.setState({ voteForm: { selected: e.target.value } });
  }

  handleVote = async(e) => {
    e.preventDefault();

    this.setState({ fetching: true });
    const { email, electionId } = this.props.match.params;
    const { election } = this.state.contract;
    const { accounts } = this.state.user;

    try {
      await election.vote(electionId, email, this.state.voteForm.selected, { from: accounts[0] });
      this.fetchElectionContent();
    } catch (err) {
      this.setState({ fetching: false });
    }
  }

  render() {
    if (this.state.fetching) {
      return (
        <div>Loading...</div>
      );
    }

    const { voted, votedTo } = this.state.voter;
    const { status, start, end, isManual, winner, candidates } = this.state.electionInfo;
    const Result = () => {
      return <div>{ "Winner: " + (winner && winner[1]) }</div>;
    }
    const VoteForm = () => {
      return (
        <form onSubmit={this.handleVote}>
          <select onChange={this.handleSelectedChange} value={this.state.voteForm.selected}>
            { candidates }
          </select>
          <input type="submit" value="Vote" />
        </form>
      );
    }

    const VotedTo = () => {
      return (
        <div>{ "You voted to " + votedTo}</div>
      );
    }

    return (
      <div>
        <div>voter poll</div>
        { status !== 1 && ((!isManual || status === 2) && <CountdownClock {...this.state.electionInfo} /> || "Waiting for organizer to close this shit") }
        { status === 1 && <Result /> }
        { (!voted && status === 0) && <VoteForm /> }
        { voted && <VotedTo /> }
      </div>
    );
  }
}
