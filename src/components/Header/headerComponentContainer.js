import {connect} from 'react-redux'
import {changeStateProps} from '../../actions'
import HeaderComponent from './headerComponent'
import { logout } from '../../actions/userLogin'
import { setLocale } from '../../actions/locale'

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
    },
    setLocale: function (lang) {
      setLocale(lang)(dispatch)
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(HeaderComponent)
