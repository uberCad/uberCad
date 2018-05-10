import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

export default class ProjectsListComponent extends Component {
  render () {
    let {projects} = this.props
    return (
      <ul>
        {
          projects.map((project, i) =>
            <li key={i}>
              <h3>{project.title}</h3>
              <Link to={`/project/${project.id}`}>Go to project (id: {project.id})</Link>
            </li>
          )
        }
      </ul>
    )
  }

  static propTypes = {
    projects: PropTypes.array.isRequired
  }
}
