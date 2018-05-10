import { connect } from 'react-redux'
import UserLoginComponent from './userLoginComponent'
import { authorize, logout, setUserName } from '../../actions/userLogin'

const mapStateToProps = (state, ownProps) => {
  return {
    ...ownProps
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    setUserName: function (userName) {
      setUserName(userName)(dispatch)
    },
    authorize: function (login, password, history) {
      return authorize(login, password, history)(dispatch)
    },
    logout: function (history) {
      logout(history)(dispatch)
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(UserLoginComponent)
