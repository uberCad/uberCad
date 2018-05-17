import snapshotService from '../services/snapshotService'
import * as THREE from '../extend/THREE'

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

export const loadSnapshot = snapshotKey => {

  return (dispatch) => {
    snapshotService.getSnapshotScene(snapshotKey)
      .then(res => {

        let loader = new THREE.ObjectLoader()
        const scene = loader.parse(JSON.parse(res))

        scene.children.forEach(object => {
          object.traverse(function (child) {
            if (child.geometry instanceof THREE.CircleGeometry) {
              //remove zero vertex from arc with coordinates (0,0,0) (points to center)
              let zeroVertex = child.geometry.vertices[0]
              if (!zeroVertex.x && !zeroVertex.y && !zeroVertex.z) {
                child.geometry.vertices.shift()
              }
            }
          })
        })

        console.log('scene', scene)
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
