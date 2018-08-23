import { connect } from 'react-redux'
import ProjectsListComponent from './projectsListComponent'
import { sortField } from '../../actions/projects'

const mapStateToProps = (state, ownProps) => {
  return {
    lang: state.locale.lang,
    ...ownProps
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    sortField: function (projects, filter, field, sortUp) {
      sortField(projects, filter, field, sortUp)(dispatch)
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ProjectsListComponent)
