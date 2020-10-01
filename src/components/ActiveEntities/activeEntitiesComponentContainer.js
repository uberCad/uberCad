import { connect } from 'react-redux';
import ActiveEntitiesComponent from './activeEntitiesComponent';
import {
  toggleVisible,
  unSelect,
  selectEntity,
  showAll,
  groupEntities
} from '../../actions/activeEntities';
import { isEdit } from '../../actions/editorActions/edit';

const mapStateToProps = (state, ownProps) => {
  return {
    lang: state.locale.lang,
    editor: {
      scene: state.cad.scene,
      camera: state.cad.camera,
      renderer: state.cad.renderer,
      cadCanvas: state.cad.cadCanvas,
      activeEntities: state.cad.activeEntities,
      copyEntities: state.cad.copyEntities, // todo тимчасове зберігання копіюємих об'єктів
      options: state.options,
      isEdit: state.cad.editMode.isEdit,
      activeLine: state.cad.activeLine
    },
    ...ownProps
  };
};

const mapDispatchToProps = dispatch => {
  return {
    toggleVisible: function(entity, visible, editor) {
      toggleVisible(entity, visible, editor)(dispatch);
    },
    unSelect: function(idx, activeEntities, editor) {
      unSelect(idx, activeEntities, editor)(dispatch);
    },
    selectEntity: function(idx, activeEntities, editor) {
      selectEntity(idx, activeEntities, editor)(dispatch);
    },
    showAll(editor) {
      showAll(editor, 'activeEntities')(dispatch);
    },
    groupEntities: function(editor) {
      groupEntities(editor)(dispatch);
    },
    isEdit: function(option, editor, object) {
      isEdit(option, editor, object)(dispatch);
    }
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ActiveEntitiesComponent);
