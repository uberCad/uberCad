import React, { Component } from 'react'
// import PropTypes from 'prop-types'
import './PanelEdit.css'

export default class PanelEditComponent extends Component {

  render () {
    const {activeLine} = this.props.editMode
    return (
      <div id='panel-edit'>
        <h5>Title: {this.props.editMode.editObject.name}</h5>
        <h5> Active line: {activeLine.uuid}</h5>
        {activeLine.geometry && (activeLine.geometry.type === 'CircleGeometry' &&
        <div>
          <div>radius: {activeLine.geometry.parameters.radius}</div>
          <div>thetaLength: {activeLine.geometry.parameters.thetaLength}</div>
          <div>thetaStart: {activeLine.geometry.parameters.thetaStart}</div>
        </div>)}
      </div>
    )
  }

  // static propTypes = {
  //
  // }
}
