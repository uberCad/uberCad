import { connect } from 'react-redux'
import PanelInfoComponent from './panelInfoComponent'

const mapStateToProps = (state, ownProps) => {
  return {
    editObject: state.cad.editMode.editObject,
    ...ownProps
  }
}

const mapDispatchToProps = (dispatch) => {
  return {}
}

export default connect(mapStateToProps, mapDispatchToProps)(PanelInfoComponent)
