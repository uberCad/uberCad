import { connect } from 'react-redux';
import { changeStateProps } from '../../actions';
import HeaderComponent from './headerComponent';
import { logout } from '../../actions/userLogin';
import { setLocale } from '../../actions/locale';
import { chooseTool } from '../../actions/toolbar';
import { getObjectFromDB } from '../../actions/getObjectFromDB';

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
    changeStateProps: (prop, value) => {
      dispatch(changeStateProps(prop, value));
    },
    logout: function(history) {
      logout(history)(dispatch);
    },
    setLocale: function(lang) {
      setLocale(lang)(dispatch);
    },
    getObjectFromDB: function(id) {
      getObjectFromDB(id)(dispatch);
    },
    chooseTool: function(tool) {
      chooseTool(tool)(dispatch);
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(HeaderComponent);
