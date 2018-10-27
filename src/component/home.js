import React, { Component } from "react";
import { Link } from 'react-router-dom';
import { EMAIL_ENDPOINT } from '../utils/config';

import { Form, Icon, Input, Button, Tabs } from 'antd';

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

  login = async(e) => {
    e.preventDefault();
    const { form: { validateFields } } = this.props;
    const { currentTab } = this.state;

    if (currentTab === '1') {
      await validateFields(['orgEmail'], (err, vals) => {
        if (err) {
          return;
        }
        this.setState({ user: {
          ...this.state.user,
          email: vals.orgEmail,
          role: 'organizer'
        } });
      });
    } else {
      await validateFields(['votEmail'], (err, vals) => {
        if (err) {
          return;
        }
        this.setState({ user: {
          ...this.state.user,
          email: vals.votEmail,
          role: 'voter'
        } });
      });
    }

    const { email, role } = this.state.user;


    this.setState({ fetching: true });
    const response = await fetch(EMAIL_ENDPOINT + '/token', {
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

    if (response.status !== 200) {
      console.log(response);
    }

    this.setState({ fetching: false });
  }

  handleTabChange = (currentTab) => {
    this.setState({ currentTab });
  }

  render() {
    if (this.state.fetching) {
      return (
        <div>Loading...</div>
      );
    }


    const { getFieldDecorator } = this.props.form;

    return (
      <div className="login-container">
        <div className="login-header" />
        <div className="login-content">
          <div className="login-title-header center">
            <Link to="/">
              <span className="login-title">Blockchain-based Online Voting System</span>
            </Link>
          </div>
          <div className="login-title-desc"></div>
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
      </div>
    );
  }
}

export default Form.create()(Home);
