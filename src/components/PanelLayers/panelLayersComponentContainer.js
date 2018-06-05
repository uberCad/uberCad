import { connect } from 'react-redux'
import PanelLayersComponent from './panelLayersComponent'
import { showAll } from '../../actions/activeEntities'
import { toggleVisible } from '../../actions/panelLayers'

const mapStateToProps = (state, ownProps) => {
  return {
    lang: state.locale.lang,
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
    showAll: function (editor) {
      showAll(editor)(dispatch)
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(PanelLayersComponent)
