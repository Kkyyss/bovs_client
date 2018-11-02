import React, { Component } from "react";
import * as moment from 'moment';
import { Link } from "react-router-dom";
import { notification, Card, Spin, Drawer, Radio, Tooltip, Form, Button, Col, Row, Input, Select, DatePicker, TimePicker, Icon, Breadcrumb } from 'antd';

import { EMAIL_ENDPOINT } from '../utils/config';
import AddCandidate from './addcandidate';
import AddVoter from './addvoter';

const { Option } = Select;
const { RangePicker } = DatePicker;
const FormItem = Form.Item;
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

class CreateVote extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ...this.props.state,
      addr: null,
      electionForm: {
        title: "",
        candidates: [],
        isPublic: false,
        voters: [],
        isManual: false,
        startNow: false,
        startDateTime: 0,
        endDateTime: 0
      },
      address: [],
      startDate: null,
      endDate: null,
      loading: false
    };

    this.listenCreateElectionEvent();
  }

  listenCreateElectionEvent = async() => {
    const { election } = this.state.contract;
    const { email } = this.props.match.params;
    const { web3 } = this.state;

    const latestBlock = await web3.eth.getBlockNumber();
    election.electionCreated().watch((err, response) => {
      if (response.blockNumber > latestBlock) {
        const { addr, owner } = response.args;

        if (owner === email) {
          // this.setState({ addr }, this.sendEmailNotification);
          this.handleResetForm();
        }
      }
    });
  }

  handleModeChange = (e) => {
    this.setState({ electionForm: {
      ...this.state.electionForm,
      isPublic: (e.target.value === "0") ? false : true
    }})
  }
  handleStartModeChange = (e) => {
    this.setState({ electionForm: {
      ...this.state.electionForm,
      startNow: (e.target.value === "0") ? false : true
    }})
  }
  handleEndModeChange = (e) => {
    this.setState({ electionForm: {
      ...this.state.electionForm,
      isManual: (e.target.value === "0") ? false : true
    }})
  }
  handleStartDateRange = (rule, value, callback) => {
    const { getFieldValue } = this.props.form;
    const startDate = getFieldValue('startDateTime');
    const endDate = getFieldValue('endDateTime');

    if (!value) {
      callback();
    }

    if (startDate && startDate.startOf('minute').valueOf() <= moment().startOf('minute').valueOf()) {
      callback('Please ensure the start datetime is more than the current datetime');
    }

    if (endDate && startDate && startDate.valueOf() >= endDate.valueOf()) {
      callback('Please ensure the start datetime is not more than or equal to the end datetime');
    }
    callback();
  }
  handleEndDateRange = (rule, value, callback) => {
    const { getFieldValue } = this.props.form;
    const startDate = getFieldValue('startDateTime');
    const endDate = getFieldValue('endDateTime');

    if (!value) {
      callback();
    }

    if (endDate && endDate.startOf('minute').valueOf() <= moment().startOf('minute').valueOf()) {
      callback('Please ensure the end datetime is more than the current datetime');
    }

    if (startDate && endDate && endDate.valueOf() <= startDate.valueOf()) {
      callback('Please ensure the end datetime is more than the start datetime');
    }
    callback();
  }

  openNotification = (type, message, description, duration) => {
    notification[type]({
      message,
      description,
      duration
    });
  };

  createElection = async (e) => {
    e.preventDefault();

    await this.props.form.validateFieldsAndScroll({ scroll: {offsetTop: 64, offsetBottom: 160}}, async(err, values) => {
      if (!err) {
        console.log('Received values of form: ', values);
        this.setState({ fetching: true });
        const { email, userId } = this.props.match.params;
        const { election } = this.state.contract;
        const { accounts } = this.state.user;
        const { isPublic, isManual, startNow } = this.state.electionForm
        const { title, candidates, voters, startDateTime, endDateTime } = values

        let dStart = moment(startDateTime).unix();
        if (startNow) {
          dStart = moment().unix();
        }

        const dEnd = moment(endDateTime).unix();

        try {
          const response = await election.createElection(
            email, title, isPublic,
            candidates, (voters || []),
            isManual, dStart, dEnd, { from: accounts[0] });
          this.openNotification('success', 'Success', 'The poll was created successfully.', 4.5)
        } catch (err) {
          console.log(err)
          this.openNotification('error', 'Error', 'The poll was failed to create.', 0)
        }
        this.setState({ fetching: false });
      }
    });
  }

  sendEmailNotification = async() => {
    await this.props.form.validateFieldsAndScroll({ scroll: {offsetTop: 64, offsetBottom: 160}}, async(err, values) => {
      if (!err) {
        const { isPublic, isManual, startNow } = this.state.electionForm
        const { title, candidates, voters, startDateTime, endDateTime } = values
        const { addr } = this.state
        const dStart = moment(startDateTime).unix();
        const dEnd = moment(endDateTime).unix();

        if (!isPublic) {
          const response = await fetch(EMAIL_ENDPOINT + "/email", {
            credentials: 'same-origin',
            method: 'POST',
            headers: {
              'Content-Type':'application/json',
              'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({
              emails: voters,
              addr,
              election: {
                title,
                isManual,
                startNow,
                dStart,
                dEnd
              }
            })
          });
        }
      }
    });

    this.setState({ fetching: false });
  }

  handleResetForm = () => {
    this.props.form.resetFields();
    this.setState({
      electionForm: {
      ...this.state.electionForm,
      isPublic: false,
      isManual: false,
      startNow: false
    }})
  }

  render() {
    const { electionForm } = this.state;
    const { email, userId } = this.props.match.params;
    const { getFieldDecorator, getFieldValue } = this.props.form;

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 8 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 },
      },
    };

    const TitleSetting = () => {
      return (
        <div>
          <Button type="primary" icon="setting"/>
        </div>
      )
    }

    return (
      <Spin spinning={this.state.fetching}>
        <Row gutter={24}>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} style={{ marginBottom: '24px' }}>
            <Card title="Create Vote" bordered={false}>
              <Form layout="horizontal" >
                <Row gutter={16}>
                  <Col xs={24} sm={12} md={12} lg={12} xl={12} xxl={12}>
                    <FormItem label="Title">
                      {getFieldDecorator('title', {
                        rules: [{ required: true, message: 'please enter voting title.' }],
                      })(<Input className="input-setting" suffix={<TitleSetting />} laceholder="please enter voting title" />)}
                    </FormItem>
                  </Col>
                  <Col xs={24} sm={12} md={12} lg={12} xl={12} xxl={12}>
                    <FormItem label={(
                      <span>
                        {"Vote Mode "}
                        <Tooltip placement="rightTop" title={
                          (<span>
                            {"Private (default)"}
                            <br/>
                            {"Only for voters who are invited."}
                            <br/><br/>
                            {"Public"}
                            <br/>
                            {"All voters are able to join."}
                          </span>)}>
                          <Icon type="question-circle-o" />
                        </Tooltip>
                      </span>
                    )}>
                      {getFieldDecorator('isPublic', {
                        rules: [{ required: true, message: 'Please choose the type' }],
                        initialValue: '0'
                      })(
                        <RadioGroup onChange={this.handleModeChange}>
                          <RadioButton value="0">Private</RadioButton>
                          <RadioButton value="1">Public</RadioButton>
                        </RadioGroup>
                      )}
                    </FormItem>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} sm={12} md={12} lg={12} xl={12} xxl={12}>
                    <FormItem label={(
                      <span>
                        {"Start Mode"}
                      </span>
                    )}>
                      {getFieldDecorator('startNow', {
                        rules: [{ required: true, message: 'Please choose the start date mode' }],
                        initialValue: '0'
                      })(
                        <RadioGroup onChange={this.handleStartModeChange}>
                          <RadioButton value="0">Custom</RadioButton>
                          <RadioButton value="1">Now</RadioButton>
                        </RadioGroup>
                      )}
                    </FormItem>
                    { !electionForm.startNow &&
                      <FormItem label="Start Date">
                      {  getFieldDecorator('startDateTime', {
                        rules: [
                          { required: true, message: 'Please choose the start date' },
                          {
                            validator: this.handleStartDateRange
                          }
                        ],
                      })(
                        <DatePicker showTime={{ format: 'HH:mm' }} style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
                      )}
                      </FormItem>
                    }
                  </Col>
                  <Col xs={24} sm={12} md={12} lg={12} xl={12} xxl={12}>
                    <FormItem label={(
                      <span>
                        {"End Mode"}
                      </span>
                    )}>
                      {getFieldDecorator('isManual', {
                        rules: [{ required: true, message: 'Please choose the end date mode' }],
                        initialValue: '0'
                      })(
                        <RadioGroup onChange={this.handleEndModeChange}>
                          <RadioButton value="0">Custom</RadioButton>
                          <RadioButton value="1">Manual</RadioButton>
                        </RadioGroup>
                      )}
                    </FormItem>
                    { !electionForm.isManual &&
                      <FormItem label="End Date">
                        { getFieldDecorator('endDateTime', {
                          rules: [
                            {
                              required: true, message: 'Please choose the end datetime'
                            },
                            {
                              validator: this.handleEndDateRange
                            }
                          ],
                        })(
                          <DatePicker showTime={{ format: 'HH:mm' }} style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
                        )}
                      </FormItem>
                    }
                  </Col>
                </Row>
              </Form>
            </Card>
          </Col>
        </Row>
        <Row gutter={24}>
          <Col
            xs={24}
            sm={ !electionForm.isPublic && 14 || 24 }
            md={ !electionForm.isPublic && 14 || 24 }
            lg={ !electionForm.isPublic && 14 || 24 }
            xl={ !electionForm.isPublic && 16 || 24 }
            xxl={ !electionForm.isPublic && 16 || 24 }
            style={{ marginBottom: '24px' }}>
            <AddCandidate {...this.props} />
          </Col>

          { !electionForm.isPublic &&
            <Col xs={24} sm={10} md={10} lg={10} xl={8} xxl={8} style={{ marginButton: '24px' }}>
              <AddVoter {...this.props} />
            </Col>
          }
        </Row>
        <div id="fixed-footer">
          <div className="fixed-footer-right">
            <Button onClick={this.createElection} type="primary" htmlType="submit">Create</Button>
          </div>
        </div>
      </Spin>
    );
  }
}

export default Form.create()(CreateVote);
