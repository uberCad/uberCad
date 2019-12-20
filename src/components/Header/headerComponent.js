import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import logo from './logo.svg';
import userPic from './userPhoto.png';
import { appName } from './../../config';
import './Header.css';
import history from '../../config/history';
import { Navbar, Nav, NavItem, NavDropdown, MenuItem } from 'react-bootstrap';

export default class HeaderComponent extends Component {
  logout = () => {
    this.props.logout(history);
  };

  render() {
    return (
      <Navbar className="nav-head header" collapseOnSelect fluid>
        <Navbar.Header>
          <Navbar.Brand>
            <a
              href={`${process.env.PUBLIC_URL}/`}
              className="logo navbar-brand"
            >
              {appName}
              <img src={logo} alt="logo" width={24} />
            </a>
          </Navbar.Brand>
          <Navbar.Toggle />
        </Navbar.Header>
        <Navbar.Collapse>
          <Nav className="nav-group">
            <NavItem href={`${process.env.PUBLIC_URL}/`}>
              <FormattedMessage
                id="header.projects"
                defaultMessage="Projects!"
              />
            </NavItem>
            <NavItem href={`${process.env.PUBLIC_URL}/demo`}>
              <FormattedMessage id="header.store" defaultMessage="Store" />
            </NavItem>
            <NavItem href={`${process.env.PUBLIC_URL}/demo`}>
              <FormattedMessage
                id="header.creators"
                defaultMessage="Creators"
              />
            </NavItem>
          </Nav>
          <Nav className="nav-group-right" pullRight>
            {this.props.userName && (
              <NavDropdown
                title={
                  <div className="pull-left">
                    <img
                      className="user-pic img-circle"
                      src={this.props.pictureUrl || userPic}
                      alt="user pic"
                    />
                    {this.props.userName}
                  </div>
                }
                id="basic-nav-dropdown"
              >
                <MenuItem>
                  <FormattedMessage
                    id="header.myProjects"
                    defaultMessage="My Projects"
                  />
                </MenuItem>
                <MenuItem>
                  <FormattedMessage
                    id="header.editProfile"
                    defaultMessage="Edit profile"
                  />
                </MenuItem>
                <MenuItem divider />
                <MenuItem onClick={this.logout}>
                  <FormattedMessage
                    id="header.logout"
                    defaultMessage="Logout"
                  />
                </MenuItem>
              </NavDropdown>
            )}
            {!this.props.userName && (
              <NavItem href={`${process.env.PUBLIC_URL}/login`}>
                <FormattedMessage id="header.login" defaultMessage="Login" />
              </NavItem>
            )}
            {!this.props.userName && (
              <NavItem href={`${process.env.PUBLIC_URL}/sign-up`}>
                <FormattedMessage id="header.signUp" defaultMessage="Sign Up" />
              </NavItem>
            )}

            <NavItem role="button" onClick={() => this.props.setLocale('en')}>
              EN
            </NavItem>
            <NavItem role="button" onClick={() => this.props.setLocale('ru')}>
              RU
            </NavItem>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    );
  }

  static propTypes = {
    setLocale: PropTypes.func.isRequired,
    changeStateProps: PropTypes.func.isRequired,
    logout: PropTypes.func.isRequired,
    lang: PropTypes.string.isRequired,
    userName: PropTypes.string.isRequired,
    pictureUrl: PropTypes.string
  };
}
