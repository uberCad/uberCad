import { connect } from 'react-redux'
import App from './App'

const mapStateToProps = (state, ownProps) => {
  return {
    lang: state.locale.lang,
    ...ownProps
  }
}

export default connect(mapStateToProps)(App)
