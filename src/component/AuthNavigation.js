import React, { Component } from "react";
import { Link } from 'react-router-dom';
import { Layout, Avatar, Menu, Breadcrumb, Icon, Row, Col, Button } from 'antd';

const { SubMenu } = Menu;
const { Header, Content, Sider, Footer } = Layout;


export default class AuthNavigation extends Component {

  constructor(props) {
    super(props);

    this.state = {
      collapsed: false,
      clickMenu: false,
      broken: false,
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

  toggle = () => {
    this.sidebarRef.current.setCollapsed(!this.state.collapsed, "clickTrigger");
    this.setState({ collapsed: !this.state.collapsed, clickMenu: true });
  }

  render() {
    const contentPlus = {
      paddingLeft: 0,
    }

    const contentMinus = {
      paddingLeft: '256px',
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
      zIndex: 10,
      cursor: 'pointer'
    }

    const siderHide = {
      flex: '0 0 0',
      maxWidth: 0,
      minWidth: 0,
      width: 0
    }

    const headerPlus = {
      padding: 0,
      width: '100%'
    }
    const headerMinus = {
      padding: 0,
      width: 'calc(100% - 256px)'
    }

    const { email, userId } = this.props.match.params;

    let activeMenuItem = []
    const lastPath = window.location.pathname.replace(/(^\/|\/$)/g, '').split('/').slice(-1)[0];
    if (lastPath === 'vote-info') {
      activeMenuItem.push('home');
    }
    activeMenuItem.push((lastPath === "organizer" || lastPath === "voter") ? 'home' : lastPath);

    return (
      <div>
        <Layout>
          <Sider
            id="sider"
            width={256}
            ref={this.sidebarRef}
            theme="light"
            collapsible
            collapsed={this.state.collapsed}
            breakpoint="lg"
            collapsedWidth="0"
            style={ this.state.collapsed && siderHide }
            onBreakpoint={(broken) => {
              if (!broken && this.state.clickMenu) {
                this.setState({ collapsed: broken, clickMenu: false, broken });
              } else {
                this.setState({ broken });
              }
            }}
            onCollapse={(collapsed, type) => {
              if (type === "responsive") {
                this.setState({ collapsed, clickMenu: false });
              } else {
                this.setState({ collapsed, clickMenu: true });
              }
            }}
          >
            <Link to={ "/" }>
              <div className="logo" />
            </Link>
            <Menu mode="inline" defaultSelectedKeys={activeMenuItem}>
              <Menu.Item key="home" >
                <Link to={ "/" + userId + "/" + email + "/organizer" } className="nav-text">
                  <Icon type="dashboard" theme="outlined" />
                  <span className="nav-text">Dashboard</span>
                </Link>
              </Menu.Item>
              <Menu.Item key="create" >
                <Link to={ "/" + userId + "/" + email + "/organizer/create" } className="nav-text">
                  <Icon type="plus" theme="outlined" />
                  <span>Create Vote</span>
                </Link>
              </Menu.Item>
            </Menu>
          </Sider>
          <div onClick={this.handleOverlayOnClick} style={ ((!this.state.collapsed && this.state.clickMenu && this.state.broken) && overlay) || null } />
          <Layout id="layout"
            style={ ((this.state.collapsed || this.state.broken) && contentPlus) ||
                ((!this.state.collapsed || !this.state.broken) && contentMinus) || null
            }
          >
            <Header id="header"
              style={
                (this.state.broken || (this.state.collapsed && !this.state.broken)) && headerPlus ||
                  (!this.state.collapsed && !this.state.broken && headerMinus) || headerMinus }
            >
              <div className="header-body">
                <Icon
                  className="header-icon"
                  type={this.state.collapsed ? 'menu-unfold' : 'menu-fold'}
                  onClick={this.toggle}
                />
                <div className="header-item-right">
                  <Menu mode="horizontal" defaultSelectedKeys={['1']} style={{ lineHeight: '64px' }}>
                    <Menu.Item key="1" onClick={this.handleLogout}>
                      <Icon type="logout" />
                      <span className="nav-text">LOGOUT</span>
                    </Menu.Item>
                  </Menu>
                </div>
              </div>
            </Header>
            <Content id="content">
              <div className="content-main">
                {this.props.children}
              </div>
            </Content>
            <footer className="footer">
              {"Copyright "}
              <Icon type="copyright" theme="outlined" />
              { "2018 | [FYP] Blockchain-based Online Voting System | ONG KANG YI | ASIA PACIFIC UNIVERSITY" }
            </footer>
          </Layout>
        </Layout>
      </div>
    );
  }
}
