import { connect } from 'react-redux';
import SignUpComponent from './signUpComponent';

import { register, logout, setUserName } from '../../actions/userLogin';

const mapStateToProps = (state, ownProps) => {
  return {
    lang: state.locale.lang,
    ...ownProps
  };
};

const mapDispatchToProps = dispatch => {
  return {
    register: function(user, history) {
      return register(user, history)(dispatch);
    },
    setUserName: function(userName) {
      setUserName(userName)(dispatch);
    },
    logout: function(history) {
      logout(history)(dispatch);
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(SignUpComponent);
