import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { FormattedMessage } from 'react-intl'
import logo from './logo.svg'
import userPic from './userPhoto.png'
import { Link } from 'react-router-dom'
import { appName } from './../../config'
import './Header.css'
import history from '../../config/history'
import { Navbar, Nav, NavItem, NavDropdown, MenuItem } from 'react-bootstrap'

export default class HeaderComponent extends Component {
  logout = () => {
    this.props.logout(history)
  }

  render () {
    return (
      <Navbar className='nav-head header' collapseOnSelect fluid>
        <Navbar.Header>
          <Navbar.Brand>
            <Link to='/' className='logo'>
              {appName}
              <img src={logo} alt='logo' width={24}/>
            </Link>
          </Navbar.Brand>
          <Navbar.Toggle/>
        </Navbar.Header>
        <Navbar.Collapse>
          <Nav className='nav-group'>
            <NavItem href='/'>
              <FormattedMessage id='header.projects' defaultMessage='Projects!' />
            </NavItem>
            <NavItem href='/demo'>
              <FormattedMessage id='header.store' defaultMessage='Store' />
            </NavItem>
            <NavItem href='/demo'>
              <FormattedMessage id='header.creators' defaultMessage='Creators' />
            </NavItem>
          </Nav>
          <Nav className='nav-group-right' pullRight>
            {this.props.userName &&
            <NavDropdown
              title={
                <div className='pull-left'>
                  <img className='user-pic img-circle' src={userPic} alt='user pic'/>
                  {this.props.userName}
                </div>
              }
              id='basic-nav-dropdown'>
              <MenuItem>
                <FormattedMessage id='header.myProjects' defaultMessage='My Projects' />
              </MenuItem>
              <MenuItem>
                <FormattedMessage id='header.editProfile' defaultMessage='Edit profile' />
              </MenuItem>
              <MenuItem divider/>
              <MenuItem onClick={this.logout}>
                <FormattedMessage id='header.logout' defaultMessage='Logout' />
              </MenuItem>
            </NavDropdown>}
            {!this.props.userName && <NavItem href='/login'>
              <FormattedMessage id='header.login' defaultMessage='Login' />
            </NavItem>}
            {!this.props.userName && <NavItem href='/sign-up'>
              <FormattedMessage id='header.signUp' defaultMessage='Sign Up' />
            </NavItem>}

            <NavItem role='button' onClick={() => this.props.setLocale('en')}>EN</NavItem>
            <NavItem role='button' onClick={() => this.props.setLocale('ru')}>RU</NavItem>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    )
  }

  static
  propTypes = {
    setLocale: PropTypes.func.isRequired
  }
}
