import { connect } from 'react-redux'
import PanelEditComponent from './panelEditComponent'

const mapStateToProps = (state, ownProps) => {
  return {
    editMode: state.cad.editMode,

    ...ownProps
  }
}

const mapDispatchToProps = (dispatch) => {
  return {}
}

export default connect(mapStateToProps, mapDispatchToProps)(PanelEditComponent)
