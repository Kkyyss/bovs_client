import React, { Component } from "react";
import { Route, Switch, Redirect, withRouter } from "react-router-dom";
import Home from "./component/home";
import Voter from "./component/voter";
import Login from "./component/login";
import Logout from "./component/logout";
import VoterPoll from "./component/voterpoll";
import Organizer from "./component/organizer";
import OrganizerCreate from "./component/organizercreate";
import OrganizerPoll from "./component/organizerpoll";
import AuthNavigation from "./component/AuthNavigation";
import NotFound from "./component/404";


class Routes extends Component {

  constructor(props) {
    super(props);

    this.state = this.props.state;
  }


  render() {
    const { accounts, email } = this.state.user

    // Navigate: Key features
    const Nav = ({ navigation: Navigation, component: Component, ...rest }) => {
      return (
        <Navigation {...rest} >
          <Component {...rest} />
        </Navigation>
      )
    }

    return (
      <Switch>
        <Route exact path="/" render={(props)=><Home {...props} state={this.state} />} />
        <Route exact path="/login/:email/:role/:token" render={(props)=><Login {...props} state={this.state} />} />
        <Route exact path="/logout" component={Logout} />
        <Route exact path="/:userId/:email/voter" render={(props)=><Nav navigation={AuthNavigation} component={Voter} {...props} state={this.state} />} />
        <Route exact path="/:userId/:email/voter/:electionId" render={(props)=><Nav navigation={AuthNavigation} component={VoterPoll} {...props} state={this.state} />} />
        <Route exact path="/:userId/:email/organizer" render={(props)=><Nav navigation={AuthNavigation} component={Organizer} {...props} state={this.state} />} />
        <Route exact path="/:userId/:email/organizer/create" render={(props)=><Nav navigation={AuthNavigation} component={OrganizerCreate} {...props} state={this.state} />} />
        <Route exact path="/:userId/:email/organizer/:electionId" render={(props)=><Nav navigation={AuthNavigation} component={OrganizerPoll} {...props} state={this.state} />} />
        <Route path="/404" render={(props)=><NotFound {...props} state={this.state} />} />
        <Redirect from="*" to="/404" />
      </Switch>
    )
  }
}

export default withRouter(Routes);
