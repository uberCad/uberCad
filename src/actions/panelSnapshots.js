import snapshotService from '../services/snapshotService'
import * as THREE from '../extend/THREE'
import sceneService from '../services/sceneService'
import GeometryUtils from '../services/GeometryUtils'
import { spinnerHide, spinnerShow } from './spinner'

export const SNAPSHOT_ADD = 'SNAPSHOT_ADD'
export const SNAPSHOT_LOAD_SCENE = 'SNAPSHOT_LOAD'
export const SNAPSHOT_DELETE = 'SNAPSHOT_DELETE'

export const addSnapshot = (snapshot, projectKey) => {
  return (dispatch) => {
    dispatch(spinnerShow())
    snapshotService.createSnapshot(snapshot, projectKey)
      .then(res => {
        dispatch(spinnerHide())
        dispatch({
          type: SNAPSHOT_ADD,
          payload: {
            snapshot: res,
            isChanged: false
          }
        })
      })
  }
}

export const loadSnapshot = (snapshotKey, cadCanvas) => {
  return (dispatch) => {
    dispatch(spinnerShow())
    snapshotService.getSnapshotScene(snapshotKey)
      .then(snapshot => {
        dispatch(spinnerHide())
        let loader = new THREE.ObjectLoader()
        const scene = cadCanvas.getScene()

        let layers = scene.getObjectByName('Layers')
        scene.remove(layers)
        const l = loader.parse(JSON.parse(snapshot.layers))
        sceneService.fixSceneAfterImport(l)
        scene.add(l)

        const objects = scene.getObjectByName('Objects')
        objects.children.forEach(item => {
          item.parent.remove(item)
        })

        snapshot.objects.forEach(item => {
          const object = loader.parse(JSON.parse(item.parameters))
          sceneService.fixSceneAfterImport(object)
          objects.add(object)
        })

        GeometryUtils.fixObjectsPaths(scene)
        cadCanvas.setScene(scene)
        dispatch({
          type: SNAPSHOT_LOAD_SCENE,
          payload: {
            scene,
            isChanged: false
          }
        })
      })
  }
}

export const deleteSnapshot = snapshotKey => {
  return (dispatch) => {
    dispatch(spinnerShow())
    snapshotService.delSnapshot(snapshotKey)
      .then(res => {
        dispatch(spinnerHide())
        dispatch({
          type: SNAPSHOT_DELETE,
          payload: {
            snapshot: res
          }
        })
      })
  }
}
