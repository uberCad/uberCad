import { connect } from 'react-redux';
import SpinnerComponent from './spinnerComponent';

const mapStateToProps = (state, ownProps) => {
  return {
    active: state.spinner.active,
    ...ownProps
  };
};

export default connect(mapStateToProps)(SpinnerComponent);
