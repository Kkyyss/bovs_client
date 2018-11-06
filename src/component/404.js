import React, { Component } from "react";
import { Link } from 'react-router-dom';
import { Card, Icon, Row, Col, Button } from 'antd';

export default class NotFound extends Component {
  backHome = (e) => {
    e.preventDefault();

    this.props.history.push('/')
  }
  render() {
    return (
      <Card style={{
        height: '100vh',
        backgroundImage: 'url("https://wallpapercave.com/wp/wp2516773.jpg")',
        backgroundSize: 'cover'
      }}
      bordered={false}>
        <Row gutter={24} style={{ marginTop: '24px' }}>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12} style={{ marginBottom: '24px' }}>
            <Card bordered={false} style={{ backgroundColor: 'rgba(255,255,255,.5)' }}>
              <div style={{ textAlign:'center', fontSize:'55px'}}>Oops...404!</div>
              <div style={{ textAlign: 'center' }} className='err-txt'>
                The page you were looking for appears to have been moved, deleted or does not exist.
              </div>
              <div style={{ textAlign: 'center' }} className='err-txt'>
                <Button type="primary" block onClick={this.backHome}>Home Page</Button>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>
    )
  }
}
