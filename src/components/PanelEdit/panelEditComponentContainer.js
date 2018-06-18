import { connect } from 'react-redux'
import PanelEditComponent from './panelEditComponent'
import {newLine, cancelNewLine} from '../../actions/edit'

const mapStateToProps = (state, ownProps) => {
  return {
    editMode: state.cad.editMode,
    editor: {
      scene: state.cad.scene,
      camera: state.cad.camera,
      renderer: state.cad.renderer
    },
    ...ownProps
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    newLine: function () {
      newLine()(dispatch)
    },
    cancelNewLine: function (editor) {
      cancelNewLine(editor)(dispatch)
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(PanelEditComponent)
