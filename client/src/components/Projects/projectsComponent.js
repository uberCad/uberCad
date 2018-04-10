import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ProjectsFilter from '../ProjectsFilter/projectsFilterComponentContainer'
import ProjectsList from '../ProjectsList/projectsListComponentContainer'

export default class ProjectsComponent extends Component {

  componentDidMount () {
    const { projectsFilter } = this.props
    this.props.fetchProjectsIfNeeded(projectsFilter)
  }

  componentWillReceiveProps(nextProps) {



    if (nextProps.projectsFilter !== this.props.projectsFilter) {
      const { projectsFilter } = nextProps
      this.props.fetchProjectsIfNeeded(projectsFilter)
    }
  }


  handleChange = nextFilter => {
    this.props.selectFilter(nextFilter)
  }

  handleRefreshClick = e => {
    e.preventDefault()
    const { projectsFilter } = this.props
    this.props.fetchProjectsIfNeeded(projectsFilter, true)
  }

  render () {
    const {projectsFilter, items, loading, error, lastUpdated} = this.props

    const isEmpty = 0 && items.length === 0
    return (
      <div className='Projects'>
        <ProjectsFilter value={projectsFilter}
                        onChange={this.handleChange}
                        options={['all', 'shared', 'archive', '[some bad filter...]']}/>
        <p>

          {lastUpdated &&
          <span>
              Last updated at {new Date(lastUpdated).toLocaleTimeString()}.
            {' '}
            </span>
          }
          {!loading &&
          <button onClick={this.handleRefreshClick}>
            Refresh
          </button>
          }
        </p>

        <h3>Projects list</h3>
        <h4>loading: {loading ? 'true' : 'false'}</h4>
        <h4>error: {error ? 'true' : 'false'}</h4>

        {isEmpty
          ? (loading ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          : <div style={{opacity: loading ? 0.5 : 1}}>
            {/*{JSON.stringify(items)}*/}
            <ProjectsList projects={items} />
          </div>
        }
      </div>
    )

  }

  static propTypes = {
    items: PropTypes.array.isRequired,
    loading: PropTypes.bool.isRequired,
    error: PropTypes.object,
    projectsFilter: PropTypes.string.isRequired,
    lastUpdated: PropTypes.number
  }
}