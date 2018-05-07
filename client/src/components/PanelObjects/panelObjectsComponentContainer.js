import { connect } from 'react-redux'
import PanelObjectsComponent from './panelObjectsComponent'
import { toggleVisible, combineEdgeModels } from '../../actions/panelObjects'
import { showAll } from '../../actions/activeEntities'

const mapStateToProps = (state, ownProps) => {
  return {
    editor: {
      scene: state.cad.scene,
      camera: state.cad.camera,
      renderer: state.cad.renderer,
      cadCanvas: state.cad.cadCanvas,
      activeEntities: state.cad.activeEntities,
      options: state.options
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
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(PanelObjectsComponent)
