import { connect } from 'react-redux';
import PanelObjectsComponent from './panelObjectsComponent';
import {
  toggleVisible,
  combineEdgeModels,
  toggleObject,
  loadObjectSnapshot
} from '../../actions/panelObjects';
import { showAll } from '../../actions/activeEntities';
import { isEdit, ungroup } from '../../actions/edit';

const mapStateToProps = (state, ownProps) => {
  return {
    snapshots: state.project.project.snapshots,
    lang: state.locale.lang,
    editor: {
      scene: state.cad.scene,
      camera: state.cad.camera,
      renderer: state.cad.renderer,
      cadCanvas: state.cad.cadCanvas,
      activeEntities: state.cad.activeEntities,
      options: state.options,
      isEdit: state.cad.editMode.isEdit
    },
    activeObject: state.sidebar.activeObject,
    isChanged: state.cad.isChanged,
    objectsIds: state.cad.objectsIds,
    ...ownProps
  };
};

const mapDispatchToProps = dispatch => {
  return {
    toggleVisible: function(entity, visible, editor) {
      toggleVisible(entity, visible, editor)(dispatch);
    },
    combineEdgeModels: function(editor) {
      combineEdgeModels(editor)(dispatch);
    },
    showAll: function(editor) {
      showAll(editor)(dispatch);
    },
    isEdit: function(option, editor, object) {
      isEdit(option, editor, object)(dispatch);
    },
    toggleObject: function(editor, object) {
      toggleObject(editor, object)(dispatch);
    },
    loadObjectSnapshot: function(key, cadCanvas) {
      loadObjectSnapshot(key, cadCanvas)(dispatch);
    },
    ungroup: function(editor, object) {
      ungroup(editor, object)(dispatch);
    }
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PanelObjectsComponent);
