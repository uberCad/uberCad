import { connect } from 'react-redux'
import ProjectComponent from './projectComponent'

const mapStateToProps = (state, ownProps) => {
  return {
    loading: state.project.loading,
    error: state.project.error,
    project: state.project.project,
    lastUpdated: state.project.lastUpdated,
    projectsList: state.projectsByFilter,
    ...ownProps
  }
}

export default connect(mapStateToProps)(ProjectComponent)
// export default connect(mapStateToProps, mapDispatchToProps)(ProjectsFilterComponent)
