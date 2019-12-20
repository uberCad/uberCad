import { connect } from 'react-redux';
import AddProjectComponent from './addProjectComponent';
import { addProject } from '../../actions/addProject';

const mapStateToProps = (state, ownProps) => {
  return {
    lang: state.locale.lang,
    ...ownProps
  };
};

const mapDispatchToProps = dispatch => {
  return {
    addProject: function(project) {
      addProject(project)(dispatch);
    }
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AddProjectComponent);
