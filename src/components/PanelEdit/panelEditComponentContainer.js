import { connect } from 'react-redux'
import PanelEditComponent from './panelEditComponent'
import {
  newLine,
  cancelNewLine,
  newCurve,
  cancelNewCurve,
  deleteLine,
  cloneActive,
  cancelClone
} from '../../actions/edit'

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
    },
    deleteLine: function (editor, line) {
      deleteLine(editor, line)(dispatch)
    },
    cancelClone: function (editor, cloneObject) {
      cancelClone(editor, cloneObject)(dispatch)
    },
    cloneActive: function (option) {
      cloneActive(option)(dispatch)
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(PanelEditComponent)
