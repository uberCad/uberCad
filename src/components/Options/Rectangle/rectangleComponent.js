import React, { Component } from 'react'
import PropTypes from 'prop-types'
import './Rectangle.css'
import { RECTANGLE_TWO_POINT } from '../../../actions/rectangle'

export default class rectangleComponent extends Component {
  onChangeMode = ({currentTarget: {value}}) => {
    this.props.setSelectMode(value)
  }

  render () {
    const {
      rectangleMode
    } = this.props
    return (
      <div className='tools-rectangle'>
        <label>New rectangle tool: </label>
        <label>
          <input type='radio' className='two-point'
                 title='Two point'
                 value={RECTANGLE_TWO_POINT}
                 checked={rectangleMode === RECTANGLE_TWO_POINT}
                 onChange={this.onChangeMode}/>
        </label>
      </div>
    )
  }

  static propTypes = {
    rectangleMode: PropTypes.string.isRequired,
    setSelectMode: PropTypes.func
  }
}
