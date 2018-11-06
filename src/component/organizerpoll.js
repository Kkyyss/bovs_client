import React, { Component } from "react";
import * as moment from 'moment';
import { Breadcrumb, Progress, Card, Spin, Row, Col, Button, Tag, Icon } from 'antd';
import { Link } from "react-router-dom";
import CountdownClock from './countdown';
import { ENDPOINTS } from '../utils/config';

export default class OrganizerPoll extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ...this.props.state,
      electionInfo: {
        title: "",
        imgURL: "",
        description: "",
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
      return;
    }

    this.setState({ fetching: true });
    await this.fetchElectionContent();
    await this.listenVoteEvent();
    this.setState({ fetching: false });
  }
  componentWillUnmount = () => {
    this.setState({ unmounted: true });
  }

  listenVoteEvent = async() => {
    const { electionId } = this.props.match.params;
    const { election } = this.state.contract;
    const { web3 } = this.state;

    const latestBlock = await web3.eth.getBlockNumber();
    election.votedEvent().watch((err, response) => {
      if (response.blockNumber > latestBlock) {
        const { addr } = response.args;

        if (addr === electionId) {
          this.fetchCandidates();
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
    if (status === 1) return;
    const curStatus = (moment().unix() < start) ? 2 : (end !== 0 && moment().unix() >= end) ? 1 : 0;

    if (status === 2 && curStatus === 0) {
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
      this.fetchCandidates();
      return;
    }
    setTimeout(this.compareDate, 1000);
  }

  fetchCandidates = async() => {
    const { electionId } = this.props.match.params;
    const { election } = this.state.contract;
    const candSize = await election.getCandidateSize(electionId);
    const votrSize = await election.getVoterSize(electionId);
    const candidates = [];
    for (let i = 0; i < candSize; i++) {
      const cand = await election.getCandidate(electionId, i);
      candidates.push(
        <Col key={i} xs={24} sm={24} md={8} lg={8} xl={6} xxl={4} style={{ marginBottom: '24px' }}>
          <Card  cover={<img height="192" onError={this.handleBrokenImg} src={cand[2]} />}>
            <Card.Meta title={cand[1]} description={cand[3]} />
            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <Progress type="circle" strokeWidth={10} percent={(cand[4].toNumber() / votrSize.toNumber()) * 100}
                format={percent =>
                    <div style={{ fontSize: '16px' }}>
                      <span>{cand[4].toNumber() + '/' + votrSize.toNumber()}</span>
                      <br/>
                      <span>{percent.toFixed(2) + '%'}</span>
                    </div>
                } />
            </div>
          </Card>
        </Col>
      );
    }
    this.setState({ electionInfo: { ...this.state.electionInfo, candidates }  })
  }

  fetchElectionContent = async() => {
    this.setState({ fetching: true });
    const { electionId } = this.props.match.params;
    const { election } = this.state.contract;

    const content = await election.getContent(electionId);
    const isPublic = await election.getMode(electionId);
    const start = await election.getStartDate(electionId);
    const end = await election.getEndDate(electionId);
    if (end.toNumber() === 0) {
      const status = (moment().unix() < start) ? 2 : 0;
      this.setState({ electionInfo: { ...this.state.electionInfo, start: start.toNumber(), isManual: true, status }  })
      if (status === 2) this.compareDate();
    } else {
      // Compare date
      const status = (moment().unix() < start) ? 2 : (moment().unix() >= end) ? 1 : 0;
      this.setState({ electionInfo: { ...this.state.electionInfo, start: start.toNumber(), end: end.toNumber(), status } })
      if (status !== 1) this.compareDate();
    }

    await this.fetchCandidates();

    this.setState({ electionInfo: {
      ...this.state.electionInfo, title: content[0], imgURL: content[1], description: content[2], isPublic: isPublic.toNumber()
    }, fetching: false });
  }

  handleBrokenImg = (e) => {
    e.target.src = ENDPOINTS + '/img/no-image.png';
  }

  render() {
    const CloseButton = () => {
      return (
        <Button onClick={this.closeElection} type="primary">Stop</Button>
      )
    };
    const { fetching, submitting } = this.state;
    const { userId, email } = this.props.match.params;
    const { title, imgURL, description, isPublic, status, start, end, isManual, candidates } = this.state.electionInfo;

    const statusColor = ['green', 'lightgray', 'yellow']
    const statusText = ['now', 'end', 'starting']

    return (
      <div>
        <Breadcrumb style={{ margin: '16px 0' }}>
          <Breadcrumb.Item><Link to={ "/" + userId + "/" + email + "/0/organizer" }>Dashboard</Link></Breadcrumb.Item>
          <Breadcrumb.Item>{title}</Breadcrumb.Item>
        </Breadcrumb>
        <Row gutter={24}>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} style={{ marginBottom: '24px' }}>
            <Card
              cover={imgURL &&
                    <div
                      style={{
                      backgroundImage: `url("${imgURL}")`,
                      height: '200px',
                      backgroundAttachment: 'fixed',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: 'cover'
                      }} />
                  }
              loading={fetching}
              bordered={false}
            >
              <Card.Meta
                title={<div>{title + ' '}<Tag color={statusColor[status]}>{statusText[status]}</Tag></div>}
                description={description}
              />
              <div style={{ marginTop: '24px' }}>
                {status !== 1 && ((!isManual || status === 2) &&
                  <div className='clock' style={{ marginBottom: '24px' }}>
                    <CountdownClock {...this.state.electionInfo} />
                  </div>
                )}
                <Row gutter={24}>
                  <Col xs={24} sm={24} md={4} lg={4} xl={4} xxl={4}>
                    <Icon type="info-circle" theme="outlined" />{' Mode:'}
                  </Col>
                  <Col xs={24} sm={24} md={20} lg={20} xl={20} xxl={20}>
                    <div>{((isPublic === 0) ? "Private" : "Public") }</div>
                  </Col>
                </Row>
                <Row gutter={24}>
                  <Col xs={24} sm={24} md={4} lg={4} xl={4} xxl={4}>
                    <Icon type="calendar" theme="outlined" />{' Start Date:'}
                  </Col>
                  <Col xs={24} sm={24} md={20} lg={20} xl={20} xxl={20}>
                    <div>{ ((start !== 0) ? moment.unix(start).format('MMMM Do YYYY, h:mm:ss a') : "----") }</div>
                  </Col>
                </Row>
                <Row gutter={24}>
                  <Col xs={24} sm={24} md={4} lg={4} xl={4} xxl={4}>
                    <Icon type="calendar" theme="outlined" />{' End Date:'}
                  </Col>
                  <Col xs={24} sm={24} md={20} lg={20} xl={20} xxl={20}>
                    <div>{((end !== 0) ? moment.unix(end).format('MMMM Do YYYY, h:mm:ss a') : "Manually")}</div>
                  </Col>
                </Row>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} style={{ marginBottom: '24px' }}>
            <Spin spinning={submitting}>
              <Card
                title="Candidates"
                style={{ minHeight: '400px' }}
                loading={fetching}
                bordered={false}>
                <div style={{ marginTop: '24px' }}>
                  <Row gutter={24}>
                    { candidates }
                  </Row>
                </div>
              </Card>
            </Spin>
          </Col>
        </Row>
        <div id="fixed-footer">
          <div className="fixed-footer-right">
            { (isManual && status === 0) && <CloseButton /> }
          </div>
        </div>
      </div>
    );
  }
}
