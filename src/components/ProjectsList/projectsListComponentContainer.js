import { connect } from 'react-redux'
import ProjectsListComponent from './projectsListComponent'

const mapStateToProps = (state, ownProps) => {
  return {
    lang: state.locale.lang,
    ...ownProps
  }
}

export default connect(mapStateToProps)(ProjectsListComponent)
