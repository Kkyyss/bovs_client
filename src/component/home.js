import React, { Component } from "react";
import { Link } from 'react-router-dom';
import { ENDPOINTS } from '../utils/config';

import { Spin, notification, Form, Icon, Input, Button, Tabs } from 'antd';

const FormItem = Form.Item;
const TabPane = Tabs.TabPane;

class Home extends Component {

  constructor(props) {
    super(props);
    this.state = {
      ...this.props.state,
      sentEmail: false,
      currentTab: '1',
    };

  }

  componentDidMount = async () => {
  }

  openNotification = (type, message, description) => {
    notification[type]({
      message,
      description,
      duration: 0
    });
  };

  login = async(e) => {
    e.preventDefault();
    const { form: { validateFields } } = this.props;
    const { currentTab } = this.state;

    if (currentTab === '1') {
      await validateFields(['orgEmail'], async(err, vals) => {
        if (err) {
          return;
        }
        await this.setState({ user: {
          ...this.state.user,
          email: vals.orgEmail,
          role: 'organizer'
        }});
        await this.sendMagicLink();
      });
    } else {
      await validateFields(['votEmail'], async(err, vals) => {
        if (err) {
          return;
        }
        await this.setState({ user: {
          ...this.state.user,
          email: vals.votEmail,
          role: 'voter'
        }});
        await this.sendMagicLink();
      });
    }
  }

  sendMagicLink = async() => {
    const { email, role } = this.state.user;

    this.setState({ fetching: true });
    const response = await fetch(ENDPOINTS + '/token', {
      credentials: 'same-origin',
      method: 'POST',
      headers: {
        'Content-Type':'application/json'
      },
      body: JSON.stringify({
        email,
        role
      })
    });
    this.setState({ fetching: false });

    if (response.status !== 200) {
      this.openNotification('error', 'Error', "The magic link was failed to send.");
    } else {
      this.openNotification('success', 'Success', "The magic link was sent successfully.");
    }
  }

  handleTabChange = (currentTab) => {
    this.setState({ currentTab });
  }

  render() {
    const { getFieldDecorator } = this.props.form;

    return (
      <Spin spinning={this.state.fetching}>
        <div className="login-container">
          <div className="login-header" />
          <div className="login-content">
            <div className="login-title-header center">
              <Link to="/">
                <img className="home-logo" src={ENDPOINTS + '/img/bovs-logo.png'} />
                <span className="login-title">B.O.V.S</span>
              </Link>
            </div>
            <div className="login-title-desc">B.O.V.S is a Blockchain-based Online Voting System</div>
            <div className="login-content-main">
              <Form onSubmit={this.login}>
                <Tabs defaultActiveKey="1" onTabClick={this.handleTabChange} animated={false}>
                  <TabPane tab="Organizer" key="1">
                    <FormItem>
                      {getFieldDecorator('orgEmail', {
                        rules: [{type: 'email', message: 'The input is not valid E-mail!'}, {required: true, message: 'Please input your E-mail!' }],
                      })(
                        <Input prefix={<Icon type="mail" style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="Email" />
                      )}
                    </FormItem>
                  </TabPane>
                  <TabPane tab="Voter" key="2">
                    <FormItem>
                      {getFieldDecorator('votEmail', {
                        rules: [{type: 'email', message: 'The input is not valid E-mail!'}, {required: true, message: 'Please input your E-mail!' }],
                      })(
                        <Input prefix={<Icon type="mail" style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="Email" />
                      )}
                    </FormItem>
                  </TabPane>
                </Tabs>
                <FormItem>
                  <Button type="primary" htmlType="submit" block>
                    Send Magic Link
                  </Button>
                </FormItem>
              </Form>
            </div>
          </div>
          <footer className="footer">
              { "2019 | [FYP] Blockchain-based Online Voting System | ONG KANG YI | ASIA PACIFIC UNIVERSITY" }
          </footer>
        </div>
      </Spin>
    );
  }
}

export default Form.create()(Home);
