import { connect } from 'react-redux'
import CadComponent from './cadComponent'

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

export default connect(mapStateToProps)(CadComponent)
// export default connect(mapStateToProps, mapDispatchToProps)(ProjectsFilterComponent)
