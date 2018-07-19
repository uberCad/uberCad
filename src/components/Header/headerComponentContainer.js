import {connect} from 'react-redux'
import {changeStateProps} from '../../actions'
import HeaderComponent from './headerComponent'
import { logout } from '../../actions/userLogin'
import { setLocale } from '../../actions/locale'

const mapStateToProps = (state, ownProps) => {
  return {
    lang: state.locale.lang,
    userName: state.userLogin.userName,
    pictureUrl: state.userLogin.pictureUrl,
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
