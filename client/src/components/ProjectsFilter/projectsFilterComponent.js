import React, { Component } from 'react'
import PropTypes from 'prop-types'

export default class ProjectsFilterComponent extends Component {

  render () {
    return (
      <ul className='ProjectsFilter'>
        {
          this.props.options.map(option =>
            <li className={this.props.value === option ? 'active': ''} key={option} onClick={e => this.props.onChange(option)}>
              {option}
            </li>
          )
        }
      </ul>
    )
  }

  static propTypes = {
    options: PropTypes.arrayOf(
      PropTypes.string.isRequired
    ).isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired
  }
}