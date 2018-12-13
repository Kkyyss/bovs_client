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
        cand_name: [],
        cand_img: [],
        cand_desc: [],
        isPublic: false,
        voters: [],
        isManual: false,
        startNow: false,
        startDateTime: 0,
        endDateTime: 0,
        manuallyAddVoter: false,
        manuallyAddCandidate: false,
      },
      startDateRange: false,
      startDRMsg: '',
      endDateRangeErr: false,
      endDRMsg: '',
      address: [],
      startDate: null,
      endDate: null,
      loading: false,
      visibleTitle: false,
      visibleCandidate: false,
      voterFileList: [],
      candFileList: []
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
    election.electionCreated().watch(async(err, response) => {
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

    this.props.form.resetFields('voterUploader');

    this.setState({ electionForm: {
      ...this.state.electionForm,
      isPublic: (e.target.value === "0") ? false : true,
      manuallyAddVoter: false,
      voters: [],
    },
      voterFileList: [],
    })
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
  handleStartDateRange = (value) => {
    const { getFieldValue } = this.props.form;
    const startDate = getFieldValue('startDateTime');
    const endDate = getFieldValue('endDateTime');


    if (value === null) {
      this.setState({ startDateRangeErr: false, startDRMsg:''});
      return;
    }

    let err = false;
    if (value) {
      err = value && value.startOf('minute').valueOf() <= moment().startOf('minute').valueOf();
    } else {
      err = startDate && startDate.startOf('minute').valueOf() <= moment().startOf('minute').valueOf();
    }
    if (err) {
      this.setState({ startDateRangeErr: true, startDRMsg: 'Please ensure the start datetime is more than the current datetime'});
      return false;
    }

    if (value) {
      err = value && value.valueOf() >= endDate.valueOf();
    } else {
      err = endDate && startDate && startDate.valueOf() >= endDate.valueOf();
    }

    if (err) {
      this.setState({ startDateRangeErr: true, startDRMsg:'Please ensure the start datetime is less than the end datetime'});
      return false;
    }
    this.setState({ startDateRangeErr: false, startDRMsg:''});
    return true;
  }
  handleEndDateRange = (value) => {
    const { getFieldValue } = this.props.form;
    const startDate = getFieldValue('startDateTime');
    const endDate = getFieldValue('endDateTime');

    if (value === null) {
      this.setState({ endDateRangeErr: false, endDRMsg:''});
      return;
    }

    let err = false;
    if (value) {
      err = value.startOf('minute').valueOf() <= moment().startOf('minute').valueOf();
    } else {
      err = endDate && endDate.startOf('minute').valueOf() <= moment().startOf('minute').valueOf();
    }
    if (err) {
      this.setState({ endDateRangeErr: true, endDRMsg: 'Please ensure the end datetime is more than the current datetime'});
      return false;
    }

    if (value && startDate){
      err = value && value.valueOf() <= startDate.valueOf();
    } else {
      err = startDate && endDate && endDate.valueOf() <= startDate.valueOf();
    }
    if (err) {
      this.setState({ endDateRangeErr: true, endDRMsg: 'Please ensure the end datetime is more than the start datetime'});
      return false;
    }
    this.setState({ endDateRangeErr: false, endDRMsg:''});
    return true;
  }

  openNotification = (type, message, description, duration) => {
    notification[type]({
      message,
      description,
      duration
    });
  };

  verifyDateRange = () => {
    if (!this.handleStartDateRange() || !this.handleEndDateRange()) {
      return false;
    }
    return true;
  }

  createElection = async (e) => {
    e.preventDefault();

    await this.props.form.validateFieldsAndScroll({ scroll: {offsetTop: 64, offsetBottom: 160}}, async(err, values) => {
      const vdr = this.verifyDateRange();
      if (!err && vdr) {
        this.setState({ fetching: true });
        const { email, userId } = this.props.match.params;
        const { election } = this.state.contract;
        const { accounts } = this.state.user;
        const { isPublic, isManual, startNow, manuallyAddVoter, manuallyAddCandidate, cand_name, cand_img, cand_desc } = this.state.electionForm
        const { title, titleImgUrl, description, candidates_name, candidates_img, candidates_desc, voters, startDateTime, endDateTime } = values

        let dStart = moment(startDateTime).unix();
        if (startNow) {
          dStart = moment().unix();
        }

        const dEnd = moment(endDateTime).unix();
        const content = [email, title, description];
        const setup = [isManual, isPublic];
        const start_end = [dStart, dEnd]
        let imgs = (!manuallyAddCandidate) && cand_img.join('|') || candidates_img.join('|');
        let candName = (!manuallyAddCandidate) && cand_name || candidates_name;
        let candDesc = (!manuallyAddCandidate) && cand_desc || candidates_desc;

        try {
          const response = await election.createElection(
            content, titleImgUrl || '', setup,
            candName, imgs || '', candDesc, ((!isPublic && !manuallyAddVoter) ? this.state.electionForm.voters : (voters || [])),
            start_end, { from: accounts[0], gasPrice: 0 });
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
        const { title, voters, startDateTime, endDateTime } = values
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
        startNow: false,
        voters: [],
        cand_name: [],
        cand_img: [],
        cand_desc: []
      },
      voterFileList: [],
      candFileList: [],
    })
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
  handleUploadCandChange = (e) => {
    this.setState({ electionForm: {
      ...this.state.electionForm,
      manuallyAddCandidate: (e.target.value === "0") ? true : false
    }})
  }

  handleReadCandCSV = (file) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = this.loadCandCSVHandler;
  }
  handleReadVoterCSV = (file) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = this.loadVoterCSVHandler;
  }

  loadVoterCSVHandler = (e) => {
    const csv = e.target.result;
    // line splitter
    const voters = csv.split(/\r\n?|\n/);
    const re = /\S+@\S+\.\S+/;
    if (voters.length < 1) {
        this.props.form.resetFields('voterUploader')
        this.openNotification('error', 'Error', 'Minimum numbers of voter should be at least 1.', 4.5)
        this.setState({
          voterFileList: [],
        })
        return;
    }
    for (let i = 0; i < voters.length; i++){
      const valid = re.test(voters[i]);
      if (!valid) {
        this.props.form.resetFields('voterUploader')
        this.openNotification('error', 'Error', `Please ensure the emails' format was correct.`, 4.5);
        this.setState({
          voterFileList: [],
        })
        return;
      }
    }
    this.setState({ electionForm: {
      ...this.state.electionForm,
      voters
    }});
  }
  loadCandCSVHandler = (e) => {
    const csv = e.target.result;
    // line splitter
    const candidates_split = csv.split(/\r\n?|\n/);
    const cand_name = []
    const cand_img = []
    const cand_desc = []
    if (candidates_split.length < 2) {
      this.openNotification('error', 'Error', `Please ensure there is minimum 2 candidates/options.`, 4.5);
      this.props.form.resetFields('candUploader')
      this.setState({
        candFileList: [],
      })
      return;
    }
    for (let i = 0; i < candidates_split.length; i++){
      const candidate = candidates_split[i].split(',');
      if (candidate[0] && !candidate[0].trim()) {
        this.openNotification('error', 'Error', `Please ensure the candidate/option name is not empty.`, 4.5);
        this.props.form.resetFields('candUploader')
        this.setState({
          candFileList: [],
        })
        return;
      }
      cand_name.push(candidate[0])
      cand_img.push(candidate[1])
      cand_desc.push(candidate[2]);
    }
    this.setState({ electionForm: {
      ...this.state.electionForm,
      cand_name,
      cand_img,
      cand_desc
    }});
  }


  handleDownloadVoterTemplate = async(e) => {
    e.preventDefault();

    saveAs(ENDPOINTS + '/dl/voter_template.csv', 'voter_template.csv');
  }
  handleDownloadCandidateTemplate = async(e) => {
    e.preventDefault();

    saveAs(ENDPOINTS + '/dl/candidate_template.csv', 'candidate_template.csv');
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

    const voterUploadProps = {
      onRemove: (file) => {
        this.setState({ voterFileList: [], electionForm: { ...this.state.electionForm, voters: [] } });
        this.props.form.resetFields('voterUploader')
      },
      beforeUpload: (file) => {
        const isCSV = file.type === 'text/csv';
        if (!isCSV) {
          this.openNotification('error', 'Error', 'Please ensure the selected file type is .csv', 4.5)
        } else {
          this.setState(({ voterFileList }) => ({
            voterFileList: [file],
          }));
          this.handleReadVoterCSV(file);
        }
        return false;
      },
      fileList: this.state.voterFileList
    }
    const candUploadProps = {
      onRemove: (file) => {
        this.setState({ candFileList: [], electionForm: { ...this.state.electionForm, cand_name: [], cand_img: [], cand_desc: [] } });
        this.props.form.resetFields('candUploader')
      },
      beforeUpload: (file) => {
        const isCSV = file.type === 'text/csv';
        if (!isCSV) {
          this.openNotification('error', 'Error', 'Please ensure the selected file type is .csv', 4.5)
        } else {
          this.setState(({ candFileList }) => ({
            candFileList: [file],
          }));
          this.handleReadCandCSV(file);
        }
        return false;
      },
      fileList: this.state.candFileList
    }

    return (
      <div>
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
                        rules: [{ required: true, message: 'Please enter voting title.' }],
                      })(<Input className="input-setting"
                        suffix={
                          <Button type="primary" onClick={this.handleVisibleTitle} icon="setting"/>
                        }
                        placeholder="Please enter voting title" />)}
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
                      <FormItem colon={false} label="Start Date" >
                      {  getFieldDecorator('startDateTime', {
                        rules: [
                          { required: true, message: 'Please choose the start date' }
                        ],
                      })(
                        <DatePicker showTime={{ format: 'HH:mm' }} onChange={this.handleStartDateRange} style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
                      )}
                      { this.state.startDateRangeErr &&
                        <div className="ant-form-explain" style={{ color: '#f5222d' }}>{this.state.startDRMsg}</div>
                      }
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
                        rules: [{ required: true, message: 'Please choose the end date mode.' }],
                        initialValue: '0'
                      })(
                        <RadioGroup onChange={this.handleEndModeChange}>
                          <RadioButton value="0">Custom</RadioButton>
                          <RadioButton value="1">Manually</RadioButton>
                        </RadioGroup>
                      )}
                    </FormItem>
                    { !electionForm.isManual &&
                      <FormItem colon={false} label="End Date">
                        { getFieldDecorator('endDateTime', {
                          rules: [
                            {
                              required: true, message: 'Please choose the end date.'
                            }
                          ],
                        })(
                          <DatePicker showTime={{ format: 'HH:mm' }} onChange={this.handleEndDateRange} style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
                        )}
                        { this.state.endDateRangeErr &&
                          <div className="ant-form-explain" style={{ color: '#f5222d' }}>{this.state.endDRMsg}</div>
                        }
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
            md={ !electionForm.isPublic && 12 || 24 }
            lg={ !electionForm.isPublic && 12 || 24 }
            xl={ !electionForm.isPublic && 12 || 24 }
            xxl={ !electionForm.isPublic && 12 || 24 }
            style={{ marginBottom: '24px' }}>
              <Card title="Candidates/Options" bordered={false}>
                <FormItem
                  colon={false}
                  label={(
                <span>
                  {"Add Candidate/Option Mode "}
                  <Tooltip placement="rightTop" title={
                    (<span>
                      {"Manually (default)"}
                      <br/>
                      {"Candidates/Options are added manually."}
                      <br/><br/>
                      {"CSV"}
                      <br/>
                      {"Candidates/Options are added from the .csv file."}
                    </span>)}>
                    <Icon type="question-circle-o" />
                  </Tooltip>
                </span>
              )}>
                {getFieldDecorator('manuallyAddCandidate', {
                  rules: [{ required: true, message: 'Please choose the type' }],
                  initialValue: '1'
                })(
                  <RadioGroup onChange={this.handleUploadCandChange}>
                    <RadioButton value="1">CSV</RadioButton>
                    <RadioButton value="0">Manually</RadioButton>
                  </RadioGroup>
                )}
              </FormItem>
                { electionForm.manuallyAddCandidate && <AddCandidate {...this.props} /> ||
                    <div>
                      <FormItem>
                        <Button type="primary" onClick={this.handleDownload} block>
                          <Icon type="download" /> Download .csv Template
                        </Button>
                      </FormItem>
                      <FormItem
                        extra={ !electionForm.manuallyAddCandidate && electionForm.cand_name.length !== 0 && electionForm.cand_name.length + ' candidates/options'}
                      >
                        {getFieldDecorator('candUploader', {
                          rules: [{ required: true, message: 'Please select a CSV file.' }],
                        })(
                          <Upload {...candUploadProps}>
                            <Button block>
                              <Icon type="upload" /> Upload .csv
                            </Button>
                          </Upload>
                        )}
                      </FormItem>
                    </div>
                }
              </Card>
            </Col>
          { !electionForm.isPublic &&
            <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12} style={{ marginButton: '24px' }}>
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
                      {getFieldDecorator('voterUploader', {
                        rules: [{ required: true, message: 'Please select a CSV file.' }],
                      })(
                        <Upload {...voterUploadProps}>
                          <Button block>
                            <Icon type="upload" /> Upload .csv
                          </Button>
                        </Upload>
                      )}
                      </FormItem>
                    </div>
                }
              </Card>
            </Col>
          }
        </Row>
        </Spin>
        <div id="fixed-footer">
          <div className="fixed-footer-right">
            <Button onClick={this.handleResetForm} style={{ marginRight: '8px' }} loading={this.state.fetching} type="primary" ghost>Reset</Button>
            <Button onClick={this.createElection} loading={this.state.fetching} type="primary" >Create</Button>
          </div>
        </div>
      </div>
    );
  }
}

export default Form.create()(CreateVote);
