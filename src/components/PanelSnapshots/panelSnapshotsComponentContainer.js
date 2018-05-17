import { connect } from 'react-redux'
import PanelSnapshotsComponent from './panelSnapshotsComponent'
import { addSnapshot, deleteSnapshot, loadSnapshot} from '../../actions/panelSnapshots'

const mapStateToProps = (state, ownProps) => {
  console.log('state= ', state)
  return {
    project: state.project.project,
    scene: state.cad.scene,
    ...ownProps
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    addSnapshot: function (snapshot, projectKey) {
      addSnapshot(snapshot, projectKey)(dispatch)
    },
    deleteSnapshot: function (snapshotKey) {
      deleteSnapshot(snapshotKey)(dispatch)
    },
    loadSnapshot: function (snapshotKey) {
      loadSnapshot(snapshotKey)(dispatch)
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(PanelSnapshotsComponent)
