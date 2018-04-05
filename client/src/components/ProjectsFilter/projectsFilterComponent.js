import React, { Component } from 'react'
import PropTypes from 'prop-types'

export default class ProjectsFilterComponent extends Component {

  render () {
    return (
      <span>
        <h1>{this.props.value}</h1>
        <select onChange={e => this.props.onChange(e.target.value)}
                value={this.props.value}>
          {
            this.props.options.map(option =>
              <option value={option} key={option}>
                {option}
              </option>
            )
          }
        </select>
      </span>
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