import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import PanelObjects, { IDispatchProps, IProps } from './index';
// import { spinnerShow } from '../../actions/spinner';

import {
  toggleVisible,
  combineEdgeModels,
  toggleObject,
  loadObjectSnapshot
} from '../../actions/panelObjects';
import { showAll } from '../../actions/activeEntities';
import { ungroup } from '../../actions/edit';
import { isEdit } from '../../actions/editorActions/edit';

const mapStateToProps = (state, ownProps): IProps => {
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

const mapDispatchToProps = (dispatch: Dispatch): IDispatchProps => {
  return {
    toggleVisible(visible, editor, entity) {
      toggleVisible(entity, visible, editor)(dispatch);
    },
    combineEdgeModels(editor) {
      /* tslint:disable */
      // spinnerShow('edgeModel')(dispatch)?.then(() =>
      combineEdgeModels(editor)(dispatch)
      // );
      /* tslint:enable */
    },
    showAll(editor) {
      showAll(editor)(dispatch);
    },
    isEdit(option, editor, object) {
      isEdit(option, editor, object)(dispatch);
    },
    toggleObject(editor, object) {
      toggleObject(editor, object)(dispatch);
    },
    loadObjectSnapshot(key, cadCanvas) {
      loadObjectSnapshot(key, cadCanvas)(dispatch);
    },
    ungroup(editor, object) {
      ungroup(editor, object)(dispatch);
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(PanelObjects);
