import React, { Component } from "react";
import { Link } from 'react-router-dom';
import { Card, Icon, Row, Col } from 'antd';

export default class ErrorPage extends Component {
  render() {
    return (
      <Card style={{
        height: '100vh',
        backgroundImage: 'url("https://i.pinimg.com/originals/a2/94/e1/a294e148d0d3081ee76421371b27e5d3.jpg")',
        backgroundSize: 'cover'
      }}
      bordered={false}>
        <Row gutter={24} style={{ marginTop: '24px' }}>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12} style={{ marginBottom: '24px' }}>
            <Card bordered={false} style={{ backgroundColor: 'rgba(255,255,255,.5)' }}>
              <div style={{ textAlign:'center', fontSize:'45px'}}>Oops!</div>
              <div style={{ textAlign: 'center' }} className='err-txt'>
                Please ensure the {<a href="https://metamask.io/" target="_blank">metamask</a>} is installed, login with the valid account, and connect to the network.
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12} style={{ marginBottom: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <img src='https://metamask.io/img/metamask.png' className="err-img" />
            </div>
          </Col>
        </Row>
      </Card>
    )
  }
}
