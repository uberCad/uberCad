import { connect } from 'react-redux'
import PanelEditComponent from './panelEditComponent'
import {
  newLine,
  cancelNewLine,
  newCurve,
  cancelNewCurve,
  deleteLine,
  cloneActive,
  cancelClone,
  mirror,
  moveActive,
  cancelMove,
  rotationActive,
  rotationSave,
  scaleActive,
  scaleSave
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
    },
    mirror: function (object, editor, option) {
      mirror(object, editor, option)(dispatch)
    },
    moveActive: function (object) {
      moveActive(object)(dispatch)
    },
    cancelMove: function () {
      cancelMove()(dispatch)
    },
    rotationActive: function (active, rotationObject) {
      rotationActive(active, rotationObject)(dispatch)
    },
    rotationSave: function (rotationObject, editor) {
      rotationSave(rotationObject, editor)(dispatch)
    },
    scaleActive: function (scaleObject) {
      scaleActive(scaleObject)(dispatch)
    },
    scaleSave: function () {
      scaleSave()(dispatch)
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(PanelEditComponent)
