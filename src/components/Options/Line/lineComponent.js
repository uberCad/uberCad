import React, { Component } from 'react'
import PropTypes from 'prop-types'
import './Line.css'
import { LINE_PARALLEL, LINE_PERPENDICULAR, LINE_TANGENT_TO_ARC, LINE_TWO_POINT } from '../../../actions/line'

export default class lineComponent extends Component {
  onChangeMode = ({currentTarget: {value}}) => {
    this.props.setSelectMode(value)
  }

  render () {
    const {
      measurementMode
    } = this.props
    return (
      <div className='tools-measurement'>
        <label>New line tool: </label>
        <label>
          <input type='radio' className='two-point'
                 title='Two point'
                 value={LINE_TWO_POINT}
                 checked={measurementMode === LINE_TWO_POINT}
                 onChange={this.onChangeMode}/>
        </label>
        <label>
          <input type='radio' className='parallel'
                 title='Parallel line'
                 value={LINE_PARALLEL}
                 checked={measurementMode === LINE_PARALLEL}
                 onChange={this.onChangeMode}/>
        </label>
        <label>
          <input type='radio' className='perpendicular'
                 title='Perpendicular line'
                 value={LINE_PERPENDICULAR}
                 checked={measurementMode === LINE_PERPENDICULAR}
                 onChange={this.onChangeMode}/>
        </label>
        <label>
          <input type='radio' className='tangent-to-arc'
                 title='Tangent to arc'
                 value={LINE_TANGENT_TO_ARC}
                 checked={measurementMode === LINE_TANGENT_TO_ARC}
                 onChange={this.onChangeMode}/>
        </label>
      </div>
    )
  }

  static propTypes = {
    lineMode: PropTypes.string.isRequired,
    setSelectMode: PropTypes.func
  }
}
