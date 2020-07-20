import { connect } from 'react-redux';
import addElementToDB from './addElementToDB';
import { addObjectToDB } from '../../actions/addObjectToDB';

const mapStateToProps = (state, ownProps) => {
  return {
    lang: state.locale.lang,
    scene: state.cad.scene,
    forceRender: {},
    form: state.form,
    activeObject: state.sidebar.activeObject,

    ...ownProps
  };
};

const mapDispatchToProps = dispatch => {
  return {
    sendToDB: function(target, boundingBox) {
      addObjectToDB(target, boundingBox)(dispatch);
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(addElementToDB);
