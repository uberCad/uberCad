import { connect } from 'react-redux';
import PanelInfoComponent from './panelInfoComponent';

const mapStateToProps = (state, ownProps) => {
  let material;
  if (state.sidebar.activeObject && state.sidebar.activeObject.userData) {
    material = state.sidebar.activeObject.userData.material;
  }
  return {
    activeObject: state.sidebar.activeObject,
    material,
    measurement: state.tools.measurement,
    selectMode: state.options.selectMode,
    ...ownProps
  };
};

export default connect(mapStateToProps)(PanelInfoComponent);
