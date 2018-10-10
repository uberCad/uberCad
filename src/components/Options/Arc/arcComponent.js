import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import './Arc.css'
import { ARC_CENTER_TWO_POINT, ARC_RADIUS_TWO_POINT, ARC_TANGENT_LINE } from '../../../actions/arc'

export default class arcComponent extends Component {
  onChangeMode = ({currentTarget: {value}}) => {
    this.props.setSelectMode(value)
  }
  inputChange = (event) => {
    this.props.inputRadius(event.target.value)
  }

  render () {
    const {mode, options} = this.props
    return (
      <Fragment>
        <div className='tools-arc'>
          <label>New arc tool: </label>
          <label>
            <input type='radio' className='center-two-point'
                   title='Center two point'
                   value={ARC_CENTER_TWO_POINT}
                   checked={mode === ARC_CENTER_TWO_POINT}
                   onChange={this.onChangeMode}/>
          </label>
          <label>
            <input type='radio' className='radius-two-point'
                   title='Radius two point'
                   value={ARC_RADIUS_TWO_POINT}
                   checked={mode === ARC_RADIUS_TWO_POINT}
                   onChange={this.onChangeMode}/>
          </label>
          <label>
            <input type='radio' className='tangent-line'
                   title='Tangent line'
                   value={ARC_TANGENT_LINE}
                   checked={mode === ARC_TANGENT_LINE}
                   onChange={this.onChangeMode}/>
          </label>
        </div>

        {mode === ARC_RADIUS_TWO_POINT &&
        <div className='arc-options'>
          <label>Radius
            <input type="number"
                   value={options.radiusTwoPoint.radius}
                   data-name='radius'
                   onChange={this.inputChange}/>
          </label>
        </div>
        }
      </Fragment>
    )
  }

  static propTypes = {
    mode: PropTypes.string.isRequired,
    options: PropTypes.object.isRequired,
    setSelectMode: PropTypes.func,
    inputRadius: PropTypes.func
  }
}
