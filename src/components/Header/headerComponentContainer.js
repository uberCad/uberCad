import {connect} from 'react-redux'
import {changeStateProps} from '../../actions'
import HeaderComponent from './headerComponent'
import { logout } from '../../actions/userLogin'

const mapStateToProps = (state, ownProps) => {
  return {
    userName: state.userLogin.userName,
    ...ownProps
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    changeStateProps: (prop, value) => {
      dispatch(changeStateProps(prop, value))
    },
    logout: function (history) {
      logout(history)(dispatch)
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(HeaderComponent)
