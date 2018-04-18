import React, { Component } from 'react'
// import PropTypes from 'prop-types'
import './Toolbar.css'

export default class ToolbarComponent extends Component {
  render () {
    const {tool, chooseTool} = this.props

    return (
      <div id='toolbar'>
        <h1>toolbar:</h1>
        <h2>{tool}</h2>
        <button onClick={() => chooseTool('aaaa')}>da?</button>
      </div>
    )


  }

  static propTypes = {
    // tool: PropTypes.object.isRequired,
  }
}