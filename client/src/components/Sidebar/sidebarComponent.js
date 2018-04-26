import React, { Component } from 'react'
import PropTypes from 'prop-types'
import './Sidebar.css'
import ActiveEntities from '../ActiveEntities/activeEntitiesComponentContainer'


export default class SidebarComponent extends Component {
  toggleSidebar = () => {
    console.log(this.props.active)
    this.props.toggleSidebar(!this.props.active, this.props.editor)
  }

  render () {
    const {active} = this.props
    return (
      <div id='sidebar' className={active ? 'active' : ''}>
        <span onClick={this.toggleSidebar} className='toggleSidebar' />

        <ActiveEntities />

        {this.props.children}
      </div>
    )
  }

  static propTypes = {
    active: PropTypes.bool.isRequired,
  }
}
