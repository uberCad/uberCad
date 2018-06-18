import { connect } from 'react-redux'
import ProjectsComponent from './projectsComponent'
import { fetchProjects } from '../../actions/projects'
import { selectFilter } from '../../actions/projects_filter'

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
    lang: state.locale.lang,
    projectsFilter,
    items,
    loading,
    lastUpdated,
    ...ownProps
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    fetchProjects: function (filter) {
      fetchProjects(filter)(dispatch)
    },
    selectFilter: function (nextFilter) {
      // call of action in custom func
      selectFilter(nextFilter)(dispatch)
      fetchProjects(nextFilter)(dispatch)
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ProjectsComponent)
