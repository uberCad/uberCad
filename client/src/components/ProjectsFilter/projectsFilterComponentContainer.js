import { connect } from 'react-redux'
import ProjectsFilterComponent from './projectsFilterComponent'
import { selectFilter } from '../../actions/projects_filter'

const mapStateToProps = (state, ownProps) => {
  return {
    projectsFilter: state.projectsFilter,
    ...ownProps
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    selectFilter: function (nextFilter) {
      // call of action in custom func
      selectFilter(nextFilter)(dispatch)
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ProjectsFilterComponent)
