import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { fetchProject } from '../../actions/project'

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
      </div>
    )

  }

  static propTypes = {
    projectsList: PropTypes.array.isRequired,
    loading: PropTypes.bool.isRequired,
    error: PropTypes.object,
    project: PropTypes.string.isRequired,
    lastUpdated: PropTypes.number
  }
}