import * as THREE from '../extend/THREE'
import sceneService from '../services/sceneService'

export const HISTORY_ADD = 'HISTORY_ADD'
export const HISTORY_CLEAR = 'HISTORY_CLEAR'
export const HISTORY_BACK = 'HISTORY_BACK'
export const HISTORY_FORWARD = 'HISTORY_FORWARD'

export const addHistory = (line, scene) => {
  let change = {}
  change.lines = []
  line.userData.id = line.id
  line.userData.parentId = line.parent.id
  line.userData.parentUuid = line.parent.uuid
  change.lines.push(line.toJSON())
  change.helpLayer = scene.getObjectByName('HelpLayer').toJSON()
  return dispatch => dispatch({
    type: HISTORY_ADD,
    payload: {
      change
    }
  })
}

export const clearHistory = () => {
  return dispatch => dispatch({
    type: HISTORY_CLEAR,
    payload: {
      history: {
        index: -1,
        changes: []
      }
    }
  })
}

export const back = (history, editor) => {
  let {scene, camera, renderer} = editor
  let loader = new THREE.ObjectLoader()
  history.changes[history.index].lines.forEach(line => {
    let object = loader.parse(line)
    let objUUID = sceneService.getLineByUuid(scene, object.uuid)
    object.traverse(function (child) {
      if (child.geometry instanceof THREE.CircleGeometry) {
        //remove zero vertex from arc with coordinates (0,0,0) (points to center)
        let zeroVertex = child.geometry.vertices[0]
        if (!zeroVertex.x && !zeroVertex.y && !zeroVertex.z) {
          child.geometry.vertices.shift()
        }
      }
    })

    if (object.name === 'newLine') {
      objUUID.parent.remove(objUUID)
    } else if (object.name === 'deleteLine') {
      object.name = ''
      let parent = sceneService.getLineByUuid(scene, object.userData.parentUuid)
      parent.add(object)
    } else {
      objUUID.geometry = object.geometry
      objUUID.material = object.material
      objUUID.position.x = object.position.x
      objUUID.position.y = object.position.y
    }
  })

  renderer.render(scene, camera)
  return dispatch => {
    dispatch({
      type: HISTORY_BACK,
      payload: {
        index: history.index - 1
      }
    })
  }
}

export const forward = (history, editor) => {
  let {scene, camera, renderer} = editor
  let index = history.index
  index += 1
  if (index <= history.changes.length - 1) {
    let loader = new THREE.ObjectLoader()
    //lines history
    history.changes[index].lines.forEach(function (line) {
      let object = loader.parse(line)
      let objUUID = sceneService.getLineByUuid(scene, object.uuid)

      object.traverse(function (child) {
        if (child.geometry instanceof THREE.CircleGeometry) {
          //remove zero vertex from arc with coordinates (0,0,0) (points to center)
          let zeroVertex = child.geometry.vertices[0]
          if (!zeroVertex.x && !zeroVertex.y && !zeroVertex.z) {
            child.geometry.vertices.shift()
          }
        }
      })

      if (object.name === 'newLine') {
        object.name = ''
        let parent = sceneService.getLineByUuid(scene, object.userData.parentUuid)
        parent.add(object)
      } else if (object.name === 'deleteLine') {
        let parent = sceneService.getLineByUuid(scene, object.userData.parentUuid)
        let delObject = sceneService.getLineByUuid(scene, object.uuid)
        parent.remove(delObject)
      } else {
        objUUID.geometry = object.geometry
        objUUID.material = object.material
        objUUID.position.x = object.position.x
        objUUID.position.y = object.position.y
      }
    })
    renderer.render(scene, camera)
  } else {
    console.log('head of the history')
  }
  return dispatch => dispatch({
    type: HISTORY_FORWARD,
    payload: {index}
  })
}