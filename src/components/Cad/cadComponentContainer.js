import { connect } from 'react-redux';
import CadComponent from './cadComponent';
import { fetchProject } from '../../actions/project';
import {
  drawDxf,
  cadClick,
  onDoubleClick,
  toggleChanged,
  onMouseUp,
  onMouseMove,
  onMouseDown
} from '../../actions/cad';
import { redo, undo } from '../../actions/cad';
import { spinnerShow, spinnerHide } from '../../actions/spinner';

const mapStateToProps = (state, ownProps) => {
  return {
    editor: {
      scene: state.cad.scene,
      camera: state.cad.camera,
      renderer: state.cad.renderer,
      cadCanvas: state.cad.cadCanvas,
      tool: state.toolbar.tool,
      activeEntities: state.cad.activeEntities,
      options: {
        selectMode: state.options.selectMode,
        singleLayerSelect: state.options.singleLayerSelect,
        threshold: state.options.threshold
      },
      editMode: state.cad.editMode,
      selection: state.selection,
      activeLayer: state.sidebar.activeLayer,
      measurement: state.tools.measurement,
      line: state.tools.line
    },

    sidebarExpanded: state.sidebar.active,

    loading: state.project.loading,
    error: state.project.error,
    project: state.project.project,
    isChanged: state.cad.isChanged,
    ...ownProps
  };
};

const mapDispatchToProps = dispatch => {
  return {
    fetchProject: function(id) {
      fetchProject(id)(dispatch);
    },

    spinnerShow() {
      spinnerShow()(dispatch);
    },

    spinnerHide: function() {
      spinnerHide()(dispatch);
    },

    drawDxf: (data = null, container, snapshot = null) => {
      drawDxf(data, container, snapshot)(dispatch);
    },

    onClick: (event, editor) => {
      cadClick(event, editor)(dispatch);
    },

    onDoubleClick: (event, editor) => {
      onDoubleClick(event, editor)(dispatch);
    },

    onMouseDown: (event, editor) => {
      onMouseDown(event, editor)(dispatch);
    },

    onMouseMove: (event, editor) => {
      onMouseMove(event, editor)(dispatch);
    },

    onMouseUp: (event, editor) => {
      onMouseUp(event, editor)(dispatch);
    },

    toggleChanged: isChanged => {
      toggleChanged(isChanged)(dispatch);
    },

    undo(renderer, camera) {
      undo(renderer, camera)(dispatch);
    },
    redo(renderer, camera) {
      redo(renderer, camera)(dispatch);
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(CadComponent);
