import React, { Component } from 'react'
import PropTypes from 'prop-types'
import './Grid.css'

export default class gridComponent extends Component {
  render () {
    const {editor} = this.props
    const {view, style, step} = this.props.grid
    return (
      <div className='grid-options'>
        <label>View:</label>
        <button onClick={() => this.props.show(editor, view, step)}>{view ? 'On' : 'Off'}</button>

        <label>Style: {style}</label>
        <label>Step:
          <input type="number"
                 value={step}
                 onChange={e => this.props.setStep(editor, view, e.target.value)}
          />
        </label>
      </div>
    )
  }

  static propTypes = {
    grid: PropTypes.object.isRequired,
    show: PropTypes.func.isRequired,
    setStep: PropTypes.func.isRequired,
  }
}
