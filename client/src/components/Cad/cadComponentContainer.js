import { connect } from 'react-redux'
import CadComponent from './cadComponent'
import { fetchProject } from '../../actions/project'
import { getPreloadedProject } from '../Project/projectComponentContainer'

const mapStateToProps = (state, ownProps) => {
  return {
    loading: state.project.loading,
    error: state.project.error,
    project: state.project.project,
    lastUpdated: state.project.lastUpdated,
    preloadedProject: getPreloadedProject(state, ownProps),
    ...ownProps
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    fetchProject: function (id) {
      fetchProject(id)(dispatch)
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CadComponent)
