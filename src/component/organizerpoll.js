import React, { Component } from "react";
import * as moment from 'moment';
import { Breadcrumb, Card, Spin } from 'antd';
import { Link } from "react-router-dom";

export default class OrganizerPoll extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ...this.props.state,
      electionInfo: {
        title: "",
        isPublic: 0,
        candidates: [],
        isManual: false,
        status: 0,
        start: 0,
        end: 0
      },
      submitting: false,
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
  }
  componentWillUnmount = async() => {
    await this.setState({ unmounted: true });
  }

  listenVoteEvent = async() => {
    const { electionId } = this.props.match.params;
    const { election } = this.state.contract;
    const { web3 } = this.state;

    const latestBlock = await web3.eth.getBlockNumber();
    election.votedEvent().watch((err, response) => {
      if (response.blockNumber > latestBlock) {
        const { addr } = response;

        if (addr === electionId) {
          this.fetchElectionContent();
        }
      }
    });
  }

  closeElection = async(e) => {
    e.preventDefault();
    const { email, electionId } = this.props.match.params;
    const { election } = this.state.contract;
    const { accounts } = this.state.user;

    this.setState({ submitting: true });

    try {
      await election.close(electionId, email, { from: accounts[0] });
      this.setState({ submitting: false });
      this.fetchElectionContent();
    } catch (err) {
      this.setState({ submitting: false });
    }
  }

  compareDate = async() => {
    const { start, end, status } = this.state.electionInfo;
    if (status === 1) {
      await this.setState({ electionInfo: { ...this.state.electionInfo, status } });
      return;
    }
    const curStatus = (moment().unix() < start) ? 2 : (end !== 0 && moment().unix() >= end) ? 1 : 0;

    if (status !== 0 && curStatus === 0) {
      this.fetchElectionContent();
    }

    if (curStatus === 1) {
      this.fetchElectionContent();
      return;
    }
    setTimeout(this.compareDate, 1000);
  }

  fetchElectionContent = async() => {
    this.setState({ fetching: true });
    const { electionId } = this.props.match.params;
    const { election } = this.state.contract;

    const title = await election.getTitle(electionId);
    const isPublic = await election.getMode(electionId);
    const start = await election.getStartDate(electionId);
    const end = await election.getEndDate(electionId);
    if (end.toNumber() === 0) {
      const status = (moment().unix() < start) ? 2 : 0;
      this.setState({ electionInfo: { ...this.state.electionInfo, start: start.toNumber(), isManual: true, status: 0 }  })
      if (status === 2) this.compareDate();
    } else {
      // Compare date
      const status = (moment().unix() < start) ? 2 : (moment().unix() >= end) ? 1 : 0;
      this.setState({ electionInfo: { ...this.state.electionInfo, start: start.toNumber(), end: end.toNumber(), status } })
      if (status !== 1) this.compareDate();
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
      ...this.state.electionInfo, title, candidates, isPublic: isPublic.toNumber()
    }, fetching: false });
  }

  render() {
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

    const { electionInfo, fetching, submitting } = this.state;
    const { userId, email } = this.props.match.params;

    const contentbody = (
      <div>
        <div>{ "Poll: " + electionInfo.title }</div>
        <div>{ "Mode: " + ((electionInfo.isPublic === 0) ? "Private" : "Public") }</div>
        <div>{ "Start date: " + ((electionInfo.start !== 0) ? moment.unix(electionInfo.start).format('MMMM Do YYYY, h:mm:ss a') : "----") }</div>
        <div>{ "End date: " + ((electionInfo.end !== 0) ? moment.unix(electionInfo.end).format('MMMM Do YYYY, h:mm:ss a') : "----") }</div>
        { electionInfo.candidates }
        { (electionInfo.isManual && electionInfo.status === 0) && <CloseButton /> }
        { electionInfo.status === 1 && <ResultContent /> }
      </div>
    )

    return (
      <div>
        <Breadcrumb style={{ margin: '16px 0' }}>
          <Breadcrumb.Item><Link to={ "/" + userId + "/" + email + "/organizer" }>Dashboard</Link></Breadcrumb.Item>
          <Breadcrumb.Item>{electionInfo.title}</Breadcrumb.Item>
        </Breadcrumb>
        <Spin spinning={submitting}>
          <Card style={{ minHeight: '200px' }} loading={fetching} bordered={false}>
            { contentbody }
          </Card>
        </Spin>
      </div>
    );
  }
}
