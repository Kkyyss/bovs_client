import React, { Component } from "react";
import * as moment from 'moment';
import { Link } from "react-router-dom";
import { Breadcrumb, Button } from 'antd';

export default class Organizer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ...this.props.state,
      electionForm: {
        title: "",
        candidates: "",
        mode: 0,
        voters: "",
        manual: false,
        startNow: false,
        start: 0,
        end: 0
      },
      address: [],
      addressFetching: false
    };
  }

  componentDidMount = async () => {
    const { unmounted } = this.state;
    if (unmounted) {
      return;
    }
    await this.fetchElectionAddress();
  }

  componentWillUnmount = async() => {
    await this.setState({ unmounted: true });
  }

  fetchElectionAddress = async () => {
    this.setState({ addressFetching: true });
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
    this.setState({ address: myElectionAddress, addressFetching: false });
  };

  gotoCreate = (e) => {
    e.preventDefault();
    const { pathname } = this.props.location;

    this.props.history.push(pathname + "/create");
  }

  render() {
    if (this.state.fetching) {
      return (
        <div>Loading...</div>
      );
    }

    const { electionForm, addressFetching } = this.state;
    const { email, userId } = this.props.match.params;

    return (
      <div>
        <Breadcrumb style={{ margin: '16px 0' }}>
          <Breadcrumb.Item>Home</Breadcrumb.Item>
        </Breadcrumb>
        <div style={{ background: '#fff', padding: 24, margin: 0, height: '100%' }}>
          <Button type="primary" icon="plus-circle" ghost onClick={this.gotoCreate}>Create</Button>
          { (!addressFetching && this.state.address) || "Loading..." }
        </div>
      </div>
    );
  }
}

