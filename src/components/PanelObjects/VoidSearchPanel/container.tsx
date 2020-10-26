import { connect } from 'react-redux';
import VoidSearchPanel from './VoidSearchPanel';
// import { addObjectToDB } from '../../../actions/addObjectToDB';
import { spinnerHide, spinnerShow } from '../../../actions/spinner';
import { combineEdgeModels, searchColPoints } from '../../../actions/panelObjects';

const mapStateToProps = (state, ownProps) => {
  return {
    lang: state.locale.lang,
    scene: state.cad.scene,
    editor: {
      voidSearchOptions: state.cad.voidSearchOptions,
      scene: state.cad.scene,
      camera: state.cad.camera,
      renderer: state.cad.renderer,
      cadCanvas: state.cad.cadCanvas,
      activeEntities: state.cad.activeEntities,
      options: state.options,
      isEdit: state.cad.editMode.isEdit
    },
    forceRender: {},
    form: state.form,
    activeObject: state.sidebar.activeObject,

    ...ownProps
  };
};

const mapDispatchToProps = dispatch => {
  return {

    combineEdgeModels: function(editor) {
      dispatch(spinnerShow());
      combineEdgeModels(editor)(dispatch);
      dispatch(spinnerHide());
    },

    searchColPoints: function(editor) {
      searchColPoints (editor)(dispatch);
      // addObjectToDB(target, boundingBox)(dispatch);
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(VoidSearchPanel);
