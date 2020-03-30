import { connect } from 'react-redux';
import OptionsComponent from './optionsComponent';
import {
  setSelectMode,
  setSingleLayerSelect,
  setThreshold
} from '../../actions/options';

import {
  cancelEdit,
  cancelNewCurve,
  cancelNewLine,
  rotationAngle,
  saveEdit,
  saveNewCurve,
  saveNewLine,
  scaleChange,
  setScale
} from '../../actions/edit';

import {
  copyClick,
  pasteClick
} from '../../actions/cad';

// todo mapStateToProps об'являється двічі тут і в .\src\components\ActiveEntities\activeEntitiesComponentContainer.js
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
      editMode: state.cad.editMode,
      isEdit: state.cad.editMode.isEdit,
      activeLine: state.cad.activeLine
    },
    scene: state.cad.scene,
    tool: state.toolbar.tool,
    editMode: state.cad.editMode,
    selectMode: state.options.selectMode,
    singleLayerSelect: state.options.singleLayerSelect,
    threshold: state.options.threshold,
    rotationObject: state.cad.editMode.rotation.rotationObject,
    ...ownProps
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setSelectMode: function(mode) {
      setSelectMode(mode)(dispatch);
    },

    setSingleLayerSelect: function(value) {
      setSingleLayerSelect(value)(dispatch);
    },

    setThreshold: function(value) {
      setThreshold(value)(dispatch);
    },
    cancelEdit: function(editor, editObject, backup) {
      cancelEdit(editor, editObject, backup)(dispatch);
    },
    saveEdit: function(editor) {
      saveEdit(editor)(dispatch);
    },
    cancelNewLine: function(editor) {
      cancelNewLine(editor)(dispatch);
    },
    saveNewLine: function(editor) {
      saveNewLine(editor)(dispatch);
    },
    cancelNewCurve: function(editor) {
      cancelNewCurve(editor)(dispatch);
    },
    saveNewCurve: function(editor) {
      saveNewCurve(editor)(dispatch);
    },
    rotationAngle: function(angle, rotationObject, editor) {
      rotationAngle(angle, rotationObject, editor)(dispatch);
    },
    scaleChange: function(scale) {
      scaleChange(scale)(dispatch);
    },
    setScale: function(scale, scaleObject, editor) {
      setScale(scale, scaleObject, editor)(dispatch);
    },

    copyClick: function(editor, event) {
      copyClick (editor, event);
    },
    pasteClick: function(editor, event) {
      pasteClick (editor, event);
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(OptionsComponent);
