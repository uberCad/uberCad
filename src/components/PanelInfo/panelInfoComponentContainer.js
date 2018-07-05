import { connect } from 'react-redux'
import PanelInfoComponent from './panelInfoComponent'

const mapStateToProps = (state, ownProps) => {
  let material
  if (state.sidebar.activeObject && state.sidebar.activeObject.userData) {
    material = state.sidebar.activeObject.userData.material
  }
  return {
    activeObject: state.sidebar.activeObject,
    material,
    ...ownProps
  }
}

const mapDispatchToProps = (dispatch) => {
  return {}
}

export default connect(mapStateToProps, mapDispatchToProps)(PanelInfoComponent)
