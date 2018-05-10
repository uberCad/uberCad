import {connect} from 'react-redux'
import {changeStateProps} from '../../actions'
import HeaderComponent from './headerComponent'

const mapStateToProps = (state, ownProps) => {
  return {
    ...ownProps
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    changeStateProps: (prop, value) => {
      dispatch(changeStateProps(prop, value))
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(HeaderComponent)
