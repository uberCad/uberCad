import {connect} from 'react-redux'
import PointInfoComponent from './pointInfoComponent'

const mapStateToProps = (state, ownProps) => {
  return {
    lang: state.locale.lang,
    style: state.cad.pointInfo.style,
    message: state.cad.pointInfo.message,
    ...ownProps
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(PointInfoComponent)
