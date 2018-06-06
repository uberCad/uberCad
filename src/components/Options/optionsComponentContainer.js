import { connect } from 'react-redux'
import OptionsComponent from './optionsComponent'
import {
  setSelectMode,
  setSingleLayerSelect,
  setThreshold
} from '../../actions/options'

import { isEdit } from '../../actions/edit'

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
    isEdit: function (option, editor) {
      isEdit(option, editor)(dispatch)
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(OptionsComponent)
