import React, { Component } from "react";import * as moment from 'moment';
import { Breadcrumb } from 'antd';
import { Link } from "react-router-dom";

export default class OrganizerPoll extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ...this.props.state,
      electionInfo: {
        title: "",
        mode: 0,
        candidates: [],
        manual: false,
        status: null,
        start: 0,
        end: 0
      },
      fetchingContent: false,
      candidates: []
    };
  }

  componentDidMount = async () => {
    const { unmounted } = this.state;

    if (unmounted) {
      await this.setState({ unmounted: false });
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
    this.setState({ fetchingContent: true });
    const { electionId } = this.props.match.params;
    const { election } = this.state.contract;

    const title = await election.getTitle(electionId);
    const mode = await election.getMode(electionId);
    const manual = await election.isManual(electionId);
    const start = await election.getStartDate(electionId);
    if (manual) {
      const res = await election.getStatus(electionId);
      this.setState({ electionInfo: { ...this.state.electionInfo, start: start.toNumber(), status: res.toNumber() }  })
    } else {
      // Compare date
      const end = await election.getEndDate(electionId);
      const status = (moment().unix() >= end) ? 1 : 0;
      this.setState({ electionInfo: { ...this.state.electionInfo, start, end: end.toNumber(), status } })
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
      ...this.state.electionInfo, title, candidates, manual, mode
    }, fetchingContent: false });
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

    const { electionInfo, fetchingContent } = this.state;
    const { userId, email } = this.props.match.params;

    const contentbody = (
      <div>
        <div>{ "Poll:" + electionInfo.title }</div>
        <div>{ "Mode:" + ((electionInfo.mode === 0) ? "Private" : "Public") }</div>
        <div>{ "Start date: " + ((electionInfo.start !== 0) ? moment.unix(electionInfo.start).format('MMMM Do YYYY, h:mm:ss a') : "----") }</div>
        <div>{ "End date: " + ((electionInfo.end !== 0) ? moment.unix(electionInfo.end).format('MMMM Do YYYY, h:mm:ss a') : "----") }</div>
        { electionInfo.candidates }
        { (electionInfo.manual && electionInfo.status === 2) && <StartButton /> }
        { (electionInfo.manual && electionInfo.status === 0) && <CloseButton /> }
        { electionInfo.status === 1 && <ResultContent /> }
      </div>
    )

    return (
      <div>
        <Breadcrumb style={{ margin: '16px 0' }}>
          <Breadcrumb.Item><Link to={ "/" + userId + "/" + email + "/organizer" }>Home</Link></Breadcrumb.Item>
          <Breadcrumb.Item>{electionInfo.title}</Breadcrumb.Item>
        </Breadcrumb>
        <div style={{ background: '#fff', padding: 24, margin: 0, minHeight: 280 }}>
          { (!fetchingContent && contentbody) || "Loading..." }
        </div>
      </div>
    );
  }
}
