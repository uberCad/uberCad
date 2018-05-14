import React, {Component} from 'react'
import logo from './logo.svg'
import userPic from './userPhoto.png'
import {Link} from 'react-router-dom'
import {appName} from './../../config'
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
              <img src={logo} alt='logo' width={24} />
            </Link>
          </Navbar.Brand>
          <Navbar.Toggle />
        </Navbar.Header>
        <Navbar.Collapse>
          <Nav className='nav-group'>
            <NavItem href='/'>Projects</NavItem>
            <NavItem href='/demo'>Store</NavItem>
            <NavItem href='/demo'>Creators</NavItem>
          </Nav>
          <Nav className='nav-group-right' pullRight>
            {this.props.userName &&
            <NavDropdown
              title={
                <div className='pull-left'>
                  <img className='user-pic img-circle' src={userPic} alt='user pic' />
                  {this.props.userName}
                </div>
              }
              id='basic-nav-dropdown'>
              <MenuItem>My projects</MenuItem>
              <MenuItem>Edit profile</MenuItem>
              <MenuItem divider />
              <MenuItem onClick={this.logout}>Logout</MenuItem>
            </NavDropdown>}
            {!this.props.userName && <NavItem href='/login'>Login</NavItem>}
            {!this.props.userName && <NavItem href='/sign-up'>Sign Up</NavItem>}
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    )
  }
}
