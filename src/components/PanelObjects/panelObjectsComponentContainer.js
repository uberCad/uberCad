import { connect } from 'react-redux'
import PanelObjectsComponent from './panelObjectsComponent'
import { toggleVisible, combineEdgeModels } from '../../actions/panelObjects'
import { showAll } from '../../actions/activeEntities'
import { isEdit } from '../../actions/options'

const mapStateToProps = (state, ownProps) => {
  return {
    editor: {
      scene: state.cad.scene,
      camera: state.cad.camera,
      renderer: state.cad.renderer,
      cadCanvas: state.cad.cadCanvas,
      activeEntities: state.cad.activeEntities,
      options: state.options,
      isEdit: state.cad.editMode.isEdit
    },
    ...ownProps
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    toggleVisible: function (entity, visible, editor) {
      toggleVisible(entity, visible, editor)(dispatch)
    },
    combineEdgeModels: function (editor) {
      combineEdgeModels(editor)(dispatch)
    },
    showAll: function (editor) {
      showAll(editor)(dispatch)
    },
    isEdit: function (option, object) {
      isEdit(option, object)(dispatch)
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(PanelObjectsComponent)
