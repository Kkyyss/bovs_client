import React, { Component } from "react";
import { Route, Switch, Redirect, withRouter } from "react-router-dom";
import Home from "./component/home";
import Voter from "./component/voter";
import Login from "./component/login";
import Logout from "./component/logout";
import VoterPoll from "./component/voterpoll";
import Organizer from "./component/organizer";
import OrganizerPoll from "./component/organizerpoll";
import AuthNavigation from "./component/AuthNavigation";
import NotFound from "./component/404";
import CreateVote from './component/organizercreate';

class Routes extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    const { accounts, email } = this.props.state.user

    // Navigate: Key features
    const Nav = ({ navigation: Navigation, component: Component, ...rest }) => {
      return (
        <Navigation {...rest} >
          <Component {...rest} />
        </Navigation>
      )
    }

    const AuthRoute = ({ component: Component, ...rest }) => {
      return (
        <Route {...rest} render={(props) => <Nav navigation={AuthNavigation} component={Component} {...props} state={this.props.state} />}
        />
      )
    }

    return (
      <Switch>
        <Route exact path="/" render={(props)=><Home {...props} state={this.props.state} />} />
        <Route exact path="/login/basic/:email/:role/:token" render={(props)=><Login {...props} state={this.props.state} auth={this.props.auth} />} />
        <Route exact path="/login/:role/:email/:token/:addr" render={(props)=><Login {...props} state={this.props.state} />} />
        <Route exact path="/logout" component={Logout} />
        <AuthRoute exact path="/:userId/:email/:role/voter" component={Voter} />
        <AuthRoute exact path="/:userId/:email/:role/voter/:electionId/vote-info" component={VoterPoll} />
        <AuthRoute exact path="/:userId/:email/:role/organizer" component={Organizer}/>
        <AuthRoute exact path="/:userId/:email/:role/organizer/create" component={CreateVote} />
        <AuthRoute exact path="/:userId/:email/:role/organizer/:electionId/vote-info" component={OrganizerPoll} />
        <Route path="/404" render={(props)=><NotFound {...props} state={this.props.state} />} />
        <Redirect from="*" to="/404" />
      </Switch>
    )
  }
}

export default withRouter(Routes);
