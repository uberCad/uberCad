import { connect } from 'react-redux'
import ActiveEntitiesComponent from './activeEntitiesComponent'
import {
  toggleVisible,
  unSelect,
  selectEntity,
  showAll,
  groupEntities
} from '../../actions/activeEntities'

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
    unSelect: function (idx, activeEntities, editor) {
      unSelect(idx, activeEntities, editor)(dispatch)
    },
    selectEntity: function (idx, activeEntities, editor) {
      selectEntity(idx, activeEntities, editor)(dispatch)
    },
    showAll: function (editor) {
      showAll(editor)(dispatch)
    },
    groupEntities: function (editor) {
      groupEntities(editor)(dispatch)
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ActiveEntitiesComponent)
