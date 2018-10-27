import React, { Component } from "react";
import * as moment from 'moment';
import { Link } from "react-router-dom";
import { Breadcrumb } from 'antd';

import { EMAIL_ENDPOINT } from '../utils/config';

export default class OrganizerCreate extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ...this.props.state,
      electionForm: {
        title: "",
        candidates: "",
        isPublic: false,
        voters: "",
        manual: false,
        startNow: false,
        start: 0,
        end: 0
      },
      address: []
    };
  }

  createElection = async (e) => {
    e.preventDefault();

    this.setState({ fetching: true });
    const { email, userId } = this.props.match.params;
    const { election } = this.state.contract;
    const { accounts } = this.state.user;
    const { title, candidates, isPublic, voters, manual, startNow, start, end } = this.state.electionForm
    const dStart = moment(start).unix();
    const dEnd = moment(end).unix();

    try {
      await election.createElection(
        email, title, isPublic,
        candidates.split(";"), voters.split(";"),
        manual, startNow,
        dStart, dEnd, { from: accounts[0] });
      // sent emails to notify voters
      const emails = voters.split(";");

      const response = await fetch(EMAIL_ENDPOINT + "/email", {
        credentials: 'same-origin',
        method: 'POST',
        headers: {
          'Content-Type':'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({
          emails,
          election: {
            title,
            manual,
            startNow,
            dStart,
            dEnd
          }
        })
      });

      await this.clearElectionForm();
      this.setState({ fetching: false });
    } catch (err) {
      console.log(err)
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
  handleModeChange = (e) => {
    this.setState({ electionForm: {
      ...this.state.electionForm,
      isPublic: e.target.checked
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
    const { email, userId } = this.props.match.params;

    return (
      <div>
        <Breadcrumb style={{ margin: '16px 0' }}>
          <Breadcrumb.Item><Link to={ "/" + userId + "/" + email + "/organizer" }>Home</Link></Breadcrumb.Item>
          <Breadcrumb.Item>Create</Breadcrumb.Item>
        </Breadcrumb>
        <div style={{ background: '#fff', padding: 24, margin: 0, minHeight: 280 }}>
          <form onSubmit={this.createElection}>
            Title <input type="text" value={electionForm.title} onChange={this.handleTitleChange} />
            <br/>
            Candidates <input type="text" value={electionForm.candidates} onChange={this.handleCandidatesChange} />
            <br/>
            Voters <input type="text" value={electionForm.voters} onChange={this.handleVotersChange} />
            <br/>
            Manual <input type="checkbox" value={electionForm.manual} onChange={this.handleManualChange} />
            <br/>
            Mode <input type="checkbox" value={electionForm.isPublic} onChange={this.handleModeChange} />
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
      </div>
    );
  }
}

