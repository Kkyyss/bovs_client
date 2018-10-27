import React, { Component } from "react";
import { Link } from 'react-router-dom';
import { Layout, Menu, Breadcrumb, Icon, Row, Col, Button } from 'antd';

const { SubMenu } = Menu;
const { Header, Content, Sider, Footer } = Layout;


export default class AuthNavigation extends Component {

  constructor(props) {
    super(props);

    this.state = {
      collapsed: false,
      clickMenu: false,
    }
    this.sidebarRef = React.createRef();
  }

  handleLogout = () => {
    this.props.history.push("/logout");
  }

  handleOverlayOnClick = (e) => {
    this.sidebarRef.current.setCollapsed(true, "clickTrigger");
    this.setState({ collapsed: true, clickMenu: true });
  }


  render() {
    const elation = {
      marginLeft: 0,
    }

    const erosion = {
      marginLeft: '200px',
    }

    const overlay = {
      position: 'fixed',
      display: 'block',
      width: '100%',
      height: '100%',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 2,
      cursor: 'pointer'
    }

    const { email, userId } = this.props.match.params;

    return (
      <div>
        <Layout>
          <Sider
            id="sidebar"
            ref={this.sidebarRef}
            breakpoint="lg"
            collapsedWidth="0"
            onBreakpoint={(broken) => {
              if (!broken && this.state.clickMenu) {
                this.setState({ collapsed: broken, clickMenu: false });
              }
            }}
            onCollapse={(collapsed, type) => {
              if (type === "clickTrigger") {
                this.setState({ collapsed, clickMenu: true });
              } else {
                this.setState({ collapsed, clickMenu: false });
              }
            }}
          >
            <Link to={ "/" }>
              <div className="logo" />
            </Link>
            <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>
              <Menu.Item key="1" onClick={this.handleLogout}>
                <Icon type="logout" />
                <span className="nav-text">LOGOUT</span>
              </Menu.Item>
            </Menu>
          </Sider>
          <div onClick={this.handleOverlayOnClick} style={ ((!this.state.collapsed && this.state.clickMenu) && overlay) || null } />
          <Layout
            style={ ((this.state.collapsed && !this.state.clickMenu) && elation) ||
                ((!this.state.collapsed && !this.state.clickMenu) && erosion) || null
            }
          >
            <Content id="content">
              <div>
                {this.props.children}
              </div>
            </Content>
            <Footer style={{ textAlign: 'center' }}>
              Blockchain Online Voting System ©2018 Created by KY
            </Footer>
          </Layout>
        </Layout>
      </div>
    );
  }
}
