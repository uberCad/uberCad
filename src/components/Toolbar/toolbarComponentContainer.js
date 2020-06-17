import { connect } from 'react-redux';
import ToolbarComponent from './toolbarComponent';
import { chooseTool } from '../../actions/toolbar';

const mapStateToProps = (state, ownProps) => {
  return {
    lang: state.locale.lang,
    tool: state.toolbar.tool,
    editor: {
      editMode: state.cad.editMode,
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
    chooseTool: function(tool) {
      chooseTool(tool)(dispatch);
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ToolbarComponent);
