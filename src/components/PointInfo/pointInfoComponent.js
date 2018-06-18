import React, { Component } from 'react'
import PropTypes from 'prop-types'
import './PointInfo.css'

export default class PointInfoComponent extends Component {

  render () {
    const {message, style} = this.props
    return (
      <div className='pointInfo' style={style}>
        {message}
      </div>
    )
  }

  static
  propTypes = {
    lang: PropTypes.string.isRequired,
    style: PropTypes.object.isRequired,
    message: PropTypes.string.isRequired
  }
}
