import React, { Component } from 'react'
import PropTypes from 'prop-types'
import './Grid.css'

export default class gridComponent extends Component {
  render () {
    const {editor, checkBinding} = this.props
    const {view, style, step, binding} = this.props.grid
    return (
      <div className='grid-options'>
        <label>Grid view:</label>
        <button onClick={() => this.props.toggleShow(editor, view, step)}>{view ? 'On' : 'Off'}</button>

        <label>Style: {style}</label>
        <label>Step:
          <input type='number'
                 value={step}
                 className='step'
                 onChange={e => this.props.setStep(editor, view, e.target.value)}
          />
        </label>

        <label>Select binding:</label>
        {
          binding.map((item, idx )=>
            <label key={idx}>
              <input
                type='checkbox'
                checked={item.active}
                onChange={e => checkBinding(editor.scene, idx, e.target.checked)}
              />
              {item.name}
            </label>
          )
        }

      </div>
    )
  }

  static propTypes = {
    grid: PropTypes.object.isRequired,
    toggleShow: PropTypes.func.isRequired,
    setStep: PropTypes.func.isRequired,
    checkBinding: PropTypes.func.isRequired
  }
}
