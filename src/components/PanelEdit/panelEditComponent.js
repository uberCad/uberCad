import React, { Component } from 'react'
// import PropTypes from 'prop-types'
import './PanelEdit.css'

export default class PanelEditComponent extends Component {

  render () {
    return (
      <div id='panel-edit'>
        <h5>Title: {this.props.editMode.editObject.name}</h5>
        <h5> Active line: {this.props.editMode.activeLine.uuid}</h5>
      </div>
    )
  }

  // static propTypes = {
  //
  // }
}
