import snapshotService from '../services/snapshotService'
import * as THREE from '../extend/THREE'
import sceneService from '../services/sceneService'

export const SNAPSHOT_ADD = 'SNAPSHOT_ADD'
export const SNAPSHOT_LOAD_SCENE = 'SNAPSHOT_LOAD'
export const SNAPSHOT_DELETE = 'SNAPSHOT_DELETE'

export const addSnapshot = (snapshot, projectKey) => {
  return (dispatch) => {
    snapshotService.createSnapshot(snapshot, projectKey)
      .then(res => {
        dispatch({
          type: SNAPSHOT_ADD,
          payload: {
            snapshot: res
          }
        })
      })
  }
}

export const loadSnapshot = (snapshotKey, cadCanvas) => {
  return (dispatch) => {
    snapshotService.getSnapshotScene(snapshotKey)
      .then(sceneData => {
        let loader = new THREE.ObjectLoader()
        const scene = loader.parse(JSON.parse(sceneData))
        sceneService.fixSceneAfterImport(scene)
        cadCanvas.setScene(scene)
        dispatch({
          type: SNAPSHOT_LOAD_SCENE,
          payload: {
            scene: scene
          }
        })
      })
  }
}

export const deleteSnapshot = snapshotKey => {
  return (dispatch) => {
    snapshotService.delSnapshot(snapshotKey)
      .then(res => {
        dispatch({
          type: SNAPSHOT_DELETE,
          payload: {
            snapshot: res
          }
        })
      })
  }
}
