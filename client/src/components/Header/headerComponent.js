import React, {Component} from 'react'
import logo from './logo.svg'
import userPic from './userPhoto.png'
import {Link} from 'react-router-dom'
import {appName} from './../../config'
import './Header.css'

export default class HeaderComponent extends Component {
  render () {
    return (
      <header className='App-header'>
        <Link to='/' className='logo'>
          {appName}
          <img src={logo} alt='logo' />

        </Link>

        <ul className='nav'>
          <li>
            <Link to='/'>Projects</Link>
          </li>
          <li>
            <Link to='/demo'>Store</Link>
          </li>
          <li>
            <Link to='/demo'>Creators</Link>
          </li>
        </ul>

        <ul className='nav nav-right'>
          <li className='drop-down separator'>
            <Link to='/'>
              <img src={userPic} alt='user pic' className='img-circle' />
                            User Name
            </Link>
            <ul>
              <li>
                <Link to='/'>User profile</Link>
              </li>
              <li>
                <Link to='/'>Edit profile</Link>
              </li>
              <li>
                <Link to='/'>Logout</Link>
              </li>
            </ul>
          </li>

          <li>
            <Link to='/'>@</Link>
          </li>
          <li>
            <Link to='/'>@</Link>
          </li>
          <li>
            <Link to='/'>@</Link>
          </li>
        </ul>
      </header>
    )
  }
}
