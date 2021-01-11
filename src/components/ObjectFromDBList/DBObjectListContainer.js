import { connect } from 'react-redux';
import DBObjectList from './DBObjectList';
import { getObjectFromDB } from '../../actions/getObjectFromDB';
import { chooseTool } from '../../actions/toolbar';

const mapStateToProps = (state, ownProps) => {
  return {
    lang: state.locale.lang,
    username: state.userLogin.username,
    pictureUrl: state.userLogin.pictureUrl,
    editor: {
      editMode: state.cad.editMode,
      scene: state.cad.scene,
      camera: state.cad.camera,
      renderer: state.cad.renderer,
      cadCanvas: state.cad.cadCanvas,
      activeEntities: state.cad.activeEntities,
      copyEntities: state.cad.copyEntities, // todo временное сохранение копированых линий
      options: state.options,
      isEdit: state.cad.editMode.isEdit,
      activeLine: state.cad.activeLine
    },
    onClose: false,
    ObjectFromDB: [],
    ...ownProps
  };
};

const mapDispatchToProps = dispatch => {
  return {
    loadObjectFromDB: function() {},
    getObjectFromDB: function(id) {
      getObjectFromDB(id)(dispatch);
    },
    chooseTool: function(tool) {
      chooseTool(tool)(dispatch);
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(DBObjectList);
