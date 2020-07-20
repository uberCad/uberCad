import React, { Component } from 'react';

import { Router, Route, Switch, Redirect } from 'react-router-dom';
import Header from './components/Header/headerComponentContainer';
import Spinner from './components/Spinner/spinnerComponentContainer';

import Projects from './components/Projects/projectsComponentContainer';
import Project from './components/Project/projectComponentContainer';
import Order from './components/Order/orderComponentContainer';
import Cad from './components/Cad/cadComponentContainer';
import UserLogin from './components/UserLogin/userLoginComponentContainer';
import SignUp from './components/SignUp/signUpComponentContainer';
import './App.css';
import { IntlProvider } from 'react-intl';
import PropTypes from 'prop-types';
import messages from './messages';
import { flattenMessages } from './services/intlUtil';
import history from './config/history';
import Modal from './components/Modal/modalComponentContainer';

class App extends Component {
  render() {
    const { lang } = this.props;

    return (
      <IntlProvider locale={lang} messages={flattenMessages(messages[lang])}>
        <Router history={history}>
          <div className="uberCad">
            <Header />
            <div className="content">
              <Switch>
                <Route
                  path={`${process.env.PUBLIC_URL}/`}
                  exact
                  component={Projects}
                />
                <Route
                  path={`${process.env.PUBLIC_URL}/project/:id`}
                  component={Project}
                />
                <Route
                  path={`${process.env.PUBLIC_URL}/order/:key/:hash+`}
                  component={Order}
                />
                <Route
                  path={`${process.env.PUBLIC_URL}/cad/:projectId/:snapshotId?`}
                  component={Cad}
                />
                <Route
                  path={`${process.env.PUBLIC_URL}/login/:username?/:token?`}
                  component={UserLogin}
                />
                <Route
                  path={`${process.env.PUBLIC_URL}/sign-up`}
                  component={SignUp}
                />

                <Route
                  path="*"
                  render={() => {
                    return <Redirect to={`${process.env.PUBLIC_URL}/`} />;
                  }}
                />
              </Switch>
            </div>
            <Spinner />
            <Modal />
          </div>
        </Router>
      </IntlProvider>
    );
  }
}

App.propTypes = {
  lang: PropTypes.string.isRequired
};

export default App;
