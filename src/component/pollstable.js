import React, { Component } from "react";
import * as moment from 'moment';
import { Link } from "react-router-dom";
import { Breadcrumb, Button, Card, Spin, Table, Divider, Tag} from 'antd';
import { ENDPOINTS } from '../utils/config';

export default class PollsTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ...this.props.state,
      address: [],
      dataSource: [],
      filteredInfo: null,
      sortedInfo: null,
      count: 0,
      fetching: false,
    };
  }

  componentDidMount = async () => {
    const { unmounted } = this.state;

    if (unmounted) {
      return;
    }

    this.setState({ fetching: true });
    await this.fetchElectionAddress();
    await this.listenCreateElectionEvent();
    await this.listenClosedElectionEvent();
    this.setState({ fetching: false });
  }
  componentWillUnmount = () => {
    this.setState({ unmounted: true });
  }

  compareDate = async(key) => {
    const { startDate, endDate, status } = this.state.dataSource[key];
    if (status === 'end') return;
    const curStatus = (moment().valueOf() < moment(startDate).valueOf()) && 'starting' || ((endDate !== '---') && moment().valueOf() >= moment(endDate).valueOf()) && 'end' || 'now';

    if (status === 'starting' && curStatus === 'now') {
      this.setState({
        dataSource: this.state.dataSource.map(item => item.key === key ? { ...item, status: curStatus } : item)
      })

      if (endDate === '---') {
        return;
      }
    }

    if (curStatus === 'end') {
      this.setState({
        dataSource: this.state.dataSource.map(item => item.key === key ? { ...item, status: curStatus } : item)
      })
      return;
    }

    setTimeout(() => this.compareDate(key), 1000);
  }

  listenClosedElectionEvent = async() => {
    const { election } = this.state.contract;
    const { email, electionId } = this.props.match.params;
    const { web3 } = this.state;

    const latestBlock = await web3.eth.getBlockNumber();
    election.closedElection().watch( async(err, response) => {
      if (response.blockNumber > latestBlock) {
        const { addr, owner } = response.args;

        const isVoter = await election.isVoter(addr, email);
        if (owner === email || isVoter) {
          const startDate = await election.getStartDate(addr);
          const startDateStr = moment.unix(startDate.toNumber()).format("YYYY-MM-DD HH:mm:ss");
          const endDate = await election.getEndDate(addr);
          const endDateStr = (endDate.toNumber() === 0) && "---" || moment.unix(endDate.toNumber()).format("YYYY-MM-DD HH:mm:ss");
          const status = (moment().valueOf() < moment(startDateStr).valueOf()) ? 'starting' : (endDate.toNumber() !== 0 && moment().valueOf() >= moment(endDateStr).valueOf()) ? 'end' : 'now';
          const selected = this.state.dataSource.filter(item => item.address === addr);

          this.setState({
            dataSource: this.state.dataSource.map(item => item.key === selected[0].key ? {
              ...item,
              endDate: endDateStr,
              status,
              description: `The ${item.mode} poll have ${item.candidates} candidates and ${item.voters} voters, it was started from ${item.startDate} ${ (endDate.toNumber() === 0) && "and until the organizer stop it" || `to ${endDateStr}` }.`
            } : item)
          })
        }
      }
    });
  }

  listenCreateElectionEvent = async() => {
    const { election } = this.state.contract;
    const { email, electionId } = this.props.match.params;
    const { web3 } = this.state;

    const latestBlock = await web3.eth.getBlockNumber();
    election.electionCreated().watch( async(err, response) => {
      if (response.blockNumber > latestBlock) {
        const { addr, owner } = response.args;

        const isVoter = await election.isVoter(addr, email);
        if (owner === email || isVoter) {
          // this.setState({ addr }, this.sendEmailNotification);
          this.setState({ fetching: true });
          const title = await election.getTitle(addr);
          const candSize = await election.getCandidateSize(addr);
          const votrSize = await election.getVoterSize(addr);
          const mode = await election.getMode(addr);
          const modeStr = (mode === 0) && "Private" || "Public";
          const startDate = await election.getStartDate(addr);
          const startDateStr = moment.unix(startDate.toNumber()).format("YYYY-MM-DD HH:mm:ss");
          const endDate = await election.getEndDate(addr);
          const endDateStr = (endDate.toNumber() === 0) && "---" || moment.unix(endDate.toNumber()).format("YYYY-MM-DD HH:mm:ss");

          const status = (moment().valueOf() < moment(startDateStr).valueOf()) ? 'starting' : (endDate.toNumber() !== 0 && moment().valueOf() >= moment(endDateStr).valueOf()) ? 'end' : 'now';
          this.state.dataSource.push({
            key: this.state.count,
            title,
            address: addr,
            mode: (mode === 0) && "Private" || "Public",
            voters: votrSize.toNumber(),
            candidates: candSize.toNumber(),
            startDate: startDateStr,
            endDate: endDateStr,
            status,
            description: `The ${modeStr} poll have ${candSize.toNumber()} candidates and ${votrSize.toNumber()} voters, it was started from ${startDateStr} ${ (endDate.toNumber() === 0) && "and until the organizer stop it" || `to ${endDateStr}` }.`
          })
          if (status !== 'end') this.compareDate(this.state.count);
          this.setState({ fetching: false, count: this.state.count + 1 });
        }
      }
    });
  }

  fetchElectionAddress = async () => {
    const { email, userId } = this.props.match.params;
    const { user, election } = this.state.contract;

    // Get election size
    const electionSize = await election.getSize();
    const myElectionAddress = [];
    let count = 0;

    // Get election address
    for (let i = 0; i < electionSize; i++) {
      const addr = await election.getVoterElectionAddress(email, i);

      if (!addr[1]) {
        continue;
      }
      if (!addr[1]) {
        continue;
      }
      const title = await election.getTitle(addr[0]);
      const candSize = await election.getCandidateSize(addr[0]);
      const votrSize = await election.getVoterSize(addr[0]);
      const mode = await election.getMode(addr[0]) === 0;
      const modeStr = (mode === 0) && "Private" || "Public";
      const startDate = await election.getStartDate(addr[0]);
      const startDateStr = moment.unix(startDate.toNumber()).format("YYYY-MM-DD HH:mm:ss");
      const endDate = await election.getEndDate(addr[0]);
      const endDateStr = (endDate.toNumber() === 0) && "---" || moment.unix(endDate.toNumber()).format("YYYY-MM-DD HH:mm:ss");

      const status = (moment().valueOf() < moment(startDateStr).valueOf()) ? 'starting' : (endDate.toNumber() !== 0 && moment().valueOf() >= moment(endDateStr).valueOf()) ? 'end' : 'now';
      myElectionAddress.push({
        key: i,
        title,
        address: addr[0],
        mode: (mode === 0) && "Private" || "Public",
        voters: votrSize.toNumber(),
        candidates: candSize.toNumber(),
        startDate: startDateStr,
        endDate: endDateStr,
        status,
        description: `The ${modeStr} poll have ${candSize.toNumber()} candidates and ${votrSize.toNumber()} voters, it was started from ${startDateStr} ${ (endDate.toNumber() === 0) && "and until the organizer stop it" || `to ${endDateStr}` }.`
      });
      count++;
    }

    // Update state with the result.
    await this.setState({ dataSource: myElectionAddress, count });
    for (let i = 0; i < count; i++) {
      if (this.state.dataSource[i] && this.state.dataSource[i].status !== 'end') this.compareDate(i);
    }
  };

  expandedRowRender = (record) => <p>{record.description}</p>;

  handleRedirect = (e, key) => {
    e.preventDefault();

    const { pathname } = this.props.location;
    const data = this.state.dataSource.filter(item => item.key === key)
    this.props.history.push(pathname + "/" + data[0].address + (!this.props.isVoter &&  "/vote-info" || ""));
  }

  handleTableChange = (pagination, filters, sorter) => {
    this.setState({
      filteredInfo: filters,
      sortedInfo: sorter,
    });
  }

  render() {
    const { electionForm, fetching, dataSource } = this.state;
    const { email, userId } = this.props.match.params;

    const statusColor = {
      starting: 'yellow',
      now: 'green',
      end: 'lightgray'
    }

    let { sortedInfo, filteredInfo } = this.state;
    sortedInfo = sortedInfo || {};
    filteredInfo = filteredInfo || {};
    const columns = [{
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      sorter: (a, b) => a.title.length - b.title.length,
      sortOrder: sortedInfo.columnKey === 'title' && sortedInfo.order,
    }, {
      title: 'Mode',
      dataIndex: 'mode',
      key: 'mode',
      filters: [
        { text: 'Private', value: 'Private' },
        { text: 'Public', value: 'Public' },
      ],
      filteredValue: filteredInfo.mode || null,
      onFilter: (value, record) => record.mode.includes(value),
    }, {
      title: 'Candidates',
      dataIndex: 'candidates',
      key: 'candidates',
    }, {
      title: 'Voters',
      dataIndex: 'voters',
      key: 'voters',
    }, {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      sorter: (a, b) => moment(a.startDate).valueOf() > moment(b.startDate).valueOf(),
      sortOrder: sortedInfo.columnKey === 'startDate' && sortedInfo.order,
    }, {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      sorter: (a, b) => (a.endDate !== '---' && b.endDate !== '---') && moment(a.endDate).valueOf() > moment(b.endDate).valueOf(),
      sortOrder: sortedInfo.columnKey === 'endDate' && sortedInfo.order,
    }, {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => (
        <span>
          <Tag color={statusColor[status]} key={status}>{status}</Tag>
        </span>
      ),
    }, {
      title: 'Action',
      key: 'action',
      render: (text, record) => (
        <span>
          <a href="javascript:;" onClick={(e) => this.handleRedirect(e, record.key)}>Enter</a>
        </span>
      ),
    }];
    return (
      <div>
        <Card title="Polls" bordered={false}>
          <Table
            size='small'
            expandedRowRender={this.expandedRowRender}
            locale={{
              emptyText: this.props.isVoter && 'No invitation so far.' || 'No polls were created so far.'
            }}
            pagination={{
              pageSize: 10,
              showQuickJumper: true,
              position: 'both',
            }}
            dataSource={dataSource}
            columns={columns}
            onChange={this.handleTableChange}
            loading={this.state.fetching}
          />
        </Card>
      </div>
    );
  }
}
