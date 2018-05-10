import { connect } from 'react-redux'
import ProjectsComponent from './projectsComponent'
import { fetchProjectsIfNeeded } from '../../actions/projects'

const mapStateToProps = (state, ownProps) => {
  const { projectsFilter, projectsByFilter } = state
  const {
    loading,
    lastUpdated,
    items
  } = projectsByFilter[projectsFilter] || {
    loading: true,
    items: []
  }

  return {
    projectsFilter,
    items,
    loading,
    lastUpdated,
    ...ownProps
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    fetchProjectsIfNeeded: function (filter, force = false) {
      fetchProjectsIfNeeded(filter, force)(dispatch)
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ProjectsComponent)
