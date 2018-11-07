import React, { Component } from "react";
import * as moment from 'moment';
import { Link } from "react-router-dom";
import {
  notification, Modal, Card, Spin, Drawer, Radio, Tooltip, Form,
  Button, Col, Row, Input, Select, DatePicker, TimePicker, Icon,
  Breadcrumb, Upload, message
} from 'antd';
import saveAs from 'file-saver';

import { ENDPOINTS } from '../utils/config';
import AddCandidate from './addcandidate';
import AddVoter from './addvoter';

const { Option } = Select;
const { RangePicker } = DatePicker;
const FormItem = Form.Item;
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const { TextArea } = Input;

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
        endDateTime: 0,
        manuallyAddVoter: false,
      },
      address: [],
      startDate: null,
      endDate: null,
      loading: false,
      visibleTitle: false,
      visibleCandidate: false,
      fileList: []
    };
  }

  componentDidMount = async () => {
    const { unmounted } = this.state;

    if (unmounted) {
      return;
    }

    this.setState({ fetching: true });
    await this.listenCreateElectionEvent();
    this.setState({ fetching: false });
  }

  componentWillUnmount = () => {
    this.setState({ unmounted: true });
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
          this.sendEmailNotification(addr);
          this.handleResetForm();
        }
      }
    });
  }

  handleModeChange = (e) => {
    this.setState({ electionForm: {
      ...this.state.electionForm,
      isPublic: (e.target.value === "0") ? false : true,
      manuallyAddVoter: false
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
        this.setState({ fetching: true });
        const { email, userId } = this.props.match.params;
        const { election } = this.state.contract;
        const { accounts } = this.state.user;
        const { isPublic, isManual, startNow, manuallyAddVoter } = this.state.electionForm
        const { title, titleImgUrl, description, candidates_name, candidates_img, candidates_desc, voters, startDateTime, endDateTime } = values
        if (!isPublic && (!this.state.electionForm.voters || (this.state.electionForm.voters && this.state.electionForm.voters.length <= 0))) {
          this.setState({ fetching: false });
          this.openNotification('error', 'Error', 'Minimum numbers of voter should be 1.', 4.5)
          return;
        }

        let dStart = moment(startDateTime).unix();
        if (startNow) {
          dStart = moment().unix();
        }

        const dEnd = moment(endDateTime).unix();
        const content = [email, title, description];
        const setup = [isManual, isPublic];
        const start_end = [dStart, dEnd]
        const imgs = candidates_img.join('|');

        try {
          const response = await election.createElection(
            content, titleImgUrl || '', setup,
            candidates_name, imgs || '', candidates_desc, ((!isPublic && !manuallyAddVoter) ? this.state.electionForm.voters : (voters || [])),
            start_end, { from: accounts[0] });
          this.openNotification('success', 'Success', 'The poll was created successfully.', 4.5)
        } catch (err) {
          this.openNotification('error', 'Error', 'The poll was failed to create.', 4.5)
        }
        this.setState({ fetching: false });
      }
    });
  }

  sendEmailNotification = async(addr) => {
    await this.props.form.validateFieldsAndScroll({ scroll: {offsetTop: 64, offsetBottom: 160}}, async(err, values) => {
      if (!err) {
        const { email } = this.props.match.params;
        const { isPublic, isManual, startNow, manuallyAddVoter } = this.state.electionForm
        const { title, candidates, voters, startDateTime, endDateTime } = values
        const dStart = moment(startDateTime).unix();
        const dEnd = moment(endDateTime).unix();

        if (!isPublic) {
          const response = await fetch(ENDPOINTS + "/email", {
            credentials: 'same-origin',
            method: 'POST',
            headers: {
              'Content-Type':'application/json',
              'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({
              emails: ((!isPublic && !manuallyAddVoter) ? this.state.electionForm.voters : voters),
              creator: email,
              addr,
              isManual,
              startDate: moment(startDateTime).utc(),
              endDate: moment(endDateTime).utc(),
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

  handleVisibleTitle = (e) => {
    e.preventDefault();

    this.setState({ visibleTitle: !this.state.visibleTitle });
  }
  handleVisibleTitleClose = () => {
    this.setState({ visibleTitle: false })
  }
  handleUploadVoterChange = (e) => {
    this.setState({ electionForm: {
      ...this.state.electionForm,
      manuallyAddVoter: (e.target.value === "0") ? true : false
    }})
  }

  handleReadCSV = (file) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = this.loadCSVHandler;
  }

  loadCSVHandler = (e) => {
    const csv = e.target.result;
    // line splitter
    const voters = csv.split(/\r\n?|\n/);
    const re = /\S+@\S+\.\S+/;
    for (let i = 0; i < voters.length; i++){
      const valid = re.test(voters[i]);
      if (!valid) {
        this.openNotification('error', 'Error', `Please ensure the emails' format was correct.`, 4.5);
        this.setState({
          fileList: [],
        })
        return;
      }
    }
    this.setState({ electionForm: {
      ...this.state.electionForm,
      voters
    }});
  }

  handleDownload = async(e) => {
    e.preventDefault();

    saveAs(ENDPOINTS + '/dl/template.csv', 'template.csv');
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

    const uploadProps = {
      onRemove: (file) => {
        this.setState({ fileList: [], electionForm: { ...this.state.electionForm, voters: [] } });
      },
      beforeUpload: (file) => {
        const isCSV = file.type === 'text/csv';
        if (!isCSV) {
          this.openNotification('error', 'Error', 'Please ensure the selected file type is .csv', 4.5)
        } else {
          this.setState(({ fileList }) => ({
            fileList: [file],
          }));
          this.handleReadCSV(file);
        }
        return false;
      },
      fileList: this.state.fileList
    }

    return (
      <Spin spinning={this.state.fetching}>
        <Modal
          visible={this.state.visibleTitle}
          title="Optional Setting"
          footer={null}
          onCancel={this.handleVisibleTitleClose}
        >
          <FormItem colon={false} label="Title Image URL" extra="Example: jpg, png">
            {getFieldDecorator('titleImgUrl')(<Input placeholder="title image url" />)}
          </FormItem>
          <FormItem colon={false} label="Description" extra="">
            {getFieldDecorator('description', {})(<TextArea autosize placeholder="Description about the event..." />)}
          </FormItem>
        </Modal>
        <Row gutter={24}>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} style={{ marginBottom: '24px' }}>
            <Card title="Create Vote" bordered={false}>
              <Form layout="horizontal" >
                <Row gutter={16}>
                  <Col xs={24} sm={12} md={12} lg={12} xl={12} xxl={12}>
                    <FormItem colon={false} label="Title">
                      {getFieldDecorator('title', {
                        rules: [{ required: true, message: 'please enter voting title.' }],
                      })(<Input className="input-setting"
                        suffix={
                          <Button type="primary" onClick={this.handleVisibleTitle} icon="setting"/>
                        }
                        placeholder="please enter voting title" />)}
                    </FormItem>
                  </Col>
                  <Col xs={24} sm={12} md={12} lg={12} xl={12} xxl={12}>
                    <FormItem colon={false} label={(
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
                    <FormItem colon={false} label={(
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
                      <FormItem colon={false} label="Start Date">
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
                    <FormItem colon={false} label={(
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
                      <FormItem colon={false} label="End Date">
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
            sm={24}
            md={ !electionForm.isPublic && 14 || 24 }
            lg={ !electionForm.isPublic && 14 || 24 }
            xl={ !electionForm.isPublic && 16 || 24 }
            xxl={ !electionForm.isPublic && 16 || 24 }
            style={{ marginBottom: '24px' }}>
            <AddCandidate {...this.props} />
          </Col>

          { !electionForm.isPublic &&
            <Col xs={24} sm={24} md={10} lg={10} xl={8} xxl={8} style={{ marginButton: '24px' }}>
              <Card title="Voters" bordered={false}>
                <FormItem
                  colon={false}
                  label={(
                <span>
                  {"Add Voter Mode "}
                  <Tooltip placement="rightTop" title={
                    (<span>
                      {"Manually (default)"}
                      <br/>
                      {"Voters are added manually."}
                      <br/><br/>
                      {"CSV"}
                      <br/>
                      {"Voters are added from the .csv file."}
                    </span>)}>
                    <Icon type="question-circle-o" />
                  </Tooltip>
                </span>
              )}>
                {getFieldDecorator('manuallyAddVoter', {
                  rules: [{ required: true, message: 'Please choose the type' }],
                  initialValue: '1'
                })(
                  <RadioGroup onChange={this.handleUploadVoterChange}>
                    <RadioButton value="1">CSV</RadioButton>
                    <RadioButton value="0">Manually</RadioButton>
                  </RadioGroup>
                )}
              </FormItem>
                { electionForm.manuallyAddVoter && <AddVoter {...this.props} /> ||
                    <div>
                      <FormItem>
                        <Button type="primary" onClick={this.handleDownload} block>
                          <Icon type="download" /> Download .csv Template
                        </Button>
                      </FormItem>
                      <FormItem
                        extra={ !electionForm.manuallyAddVoter && electionForm.voters.length !== 0 && electionForm.voters.length + ' voters'}
                      >
                        <Upload {...uploadProps}>
                          <Button block>
                            <Icon type="upload" /> Upload .csv
                          </Button>
                        </Upload>
                      </FormItem>
                    </div>
                }
              </Card>
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
