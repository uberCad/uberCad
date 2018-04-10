import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {Link} from 'react-router-dom'

export default class ProjectComponent extends Component {

  componentDidMount () {
    const { id } = this.props.match.params
    const { preloadedProject } = this.props
    this.props.fetchProject(id, preloadedProject)
  }

  componentWillReceiveProps(nextProps) {

    if (nextProps.match.params.id !== this.props.match.params.id) {
      const { id } = nextProps.match.params
      const { preloadedProject } = nextProps
      this.props.fetchProject(id, preloadedProject)
    }
  }

  render () {
    const {project, loading, error} = this.props

    return (
      <div>
        <h1>Project:</h1>
        {JSON.stringify(project)}
        <p>Loading {loading ? 'true': 'false'}</p>
        <p>Error {error ? 'true': 'false'}</p>

        {!loading && project && <Link to={`/cad/${project.id}`}>Open cad</Link>}
      </div>
    )

  }

  static propTypes = {
    // projectsList: PropTypes.object.isRequired,
    loading: PropTypes.bool.isRequired,
    error: PropTypes.object,
    project: PropTypes.object,
    lastUpdated: PropTypes.number
  }
}