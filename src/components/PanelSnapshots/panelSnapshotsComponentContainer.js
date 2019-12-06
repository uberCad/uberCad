import { connect } from 'react-redux';
import PanelSnapshotsComponent from './panelSnapshotsComponent';
import {
  addSnapshot,
  deleteSnapshot,
  loadSnapshot
} from '../../actions/panelSnapshots';

const mapStateToProps = (state, ownProps) => {
  return {
    lang: state.locale.lang,
    project: state.project.project,
    scene: state.cad.scene,
    cadCanvas: state.cad.cadCanvas,
    isChanged: state.cad.isChanged,
    ...ownProps
  };
};

const mapDispatchToProps = dispatch => {
  return {
    addSnapshot: function(snapshot, projectKey) {
      addSnapshot(snapshot, projectKey)(dispatch);
    },
    deleteSnapshot: function(snapshotKey) {
      deleteSnapshot(snapshotKey)(dispatch);
    },
    loadSnapshot: function(snapshotKey, cadCanvas) {
      loadSnapshot(snapshotKey, cadCanvas)(dispatch);
    }
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PanelSnapshotsComponent);
