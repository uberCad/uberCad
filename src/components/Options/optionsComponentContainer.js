import { connect } from 'react-redux'
import OptionsComponent from './optionsComponent'
import {
  setSelectMode,
  setSingleLayerSelect,
  setThreshold
} from '../../actions/options'

import { cancelEdit, saveEdit } from '../../actions/edit'

const mapStateToProps = (state, ownProps) => {
  return {
    lang: state.locale.lang,
    editor: {
      scene: state.cad.scene,
      camera: state.cad.camera,
      renderer: state.cad.renderer
    },
    scene: state.cad.scene,
    tool: state.toolbar.tool,
    editMode: state.cad.editMode,
    selectMode: state.options.selectMode,
    singleLayerSelect: state.options.singleLayerSelect,
    threshold: state.options.threshold,
    ...ownProps
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    setSelectMode: function (mode) {
      setSelectMode(mode)(dispatch)
    },

    setSingleLayerSelect: function (value) {
      setSingleLayerSelect(value)(dispatch)
    },

    setThreshold: function (value) {
      setThreshold(value)(dispatch)
    },
    cancelEdit: function (editor, editObject, backup) {
      cancelEdit(editor, editObject, backup)(dispatch)
    },
    saveEdit: function (editor) {
      saveEdit(editor)(dispatch)
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(OptionsComponent)
