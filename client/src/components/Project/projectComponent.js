import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { fetchProject } from '../../actions/project'
import {Link} from 'react-router-dom'

export default class ProjectComponent extends Component {

  componentDidMount () {
    const { id } = this.props.match.params
    const {dispatch, projectsList} = this.props
    dispatch(fetchProject(id, projectsList))
  }

  componentWillReceiveProps(nextProps) {

    if (nextProps.match.params.id !== this.props.match.params.id) {
      const { id } = nextProps.match.params
      const { dispatch, projectsList } = nextProps
      dispatch(fetchProject(id, projectsList))
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

        {!loading && <Link to={`/cad/${project.id}`}>Open cad</Link>}
      </div>
    )

  }

  static propTypes = {
    projectsList: PropTypes.object.isRequired,
    loading: PropTypes.bool.isRequired,
    error: PropTypes.object,
    project: PropTypes.object.isRequired,
    lastUpdated: PropTypes.number
  }
}