import { connect } from 'react-redux'
import PanelEditComponent from './panelEditComponent'
import {newLine, cancelNewLine, newCurve, cancelNewCurve} from '../../actions/edit'

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
    },
    newCurve: function () {
      newCurve()(dispatch)
    },
    cancelNewCurve: function (editor) {
      cancelNewCurve(editor)(dispatch)
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(PanelEditComponent)
