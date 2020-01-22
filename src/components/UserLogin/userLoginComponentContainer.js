import { connect } from 'react-redux';
import UserLoginComponent from './userLoginComponent';
import { authorize, logout, getProfile } from '../../actions/userLogin';

const mapStateToProps = (state, ownProps) => {
  return {
    lang: state.locale.lang,
    ...ownProps
  };
};

const mapDispatchToProps = dispatch => {
  return {
    getProfile: function() {
      getProfile()(dispatch);
    },
    authorize: function(login, password, history) {
      return authorize(login, password, history)(dispatch);
    },
    logout: function(history) {
      logout(history)(dispatch);
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(UserLoginComponent);
