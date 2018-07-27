import { CAD_TOGGLE_VISIBLE_LAYER, CAD_COMBINE_EDGE_MODELS } from './cad'
import sceneService from '../services/sceneService'
import { spinnerHide, spinnerShow } from './spinner'
import snapshotService from '../services/snapshotService'
import * as THREE from '../extend/THREE'
import GeometryUtils from '../services/GeometryUtils'

export const PANEL_OBJECTS_TOGGLE = 'PANEL_OBJECTS_TOGGLE'

export const SNAPSHOT_LOAD_OBJECT = 'SNAPSHOT_LOAD_OBJECT'

export const toggleObject = (editor, object) => {
  if (object) {
    sceneService.setPointOfInterest(editor, object)
  } else {
    sceneService.setPointOfInterest(editor, editor.scene)
  }
  return dispatch => {
    dispatch({
      type: PANEL_OBJECTS_TOGGLE,
      payload: {
        activeObject: object
      }
    })
  }
}

export const toggleVisible = (layer, visible, editor) => {
  return dispatch => {
    layer.visible = visible
    sceneService.render(editor)

    dispatch({
      type: CAD_TOGGLE_VISIBLE_LAYER,
      payload: {
        layer
      }
    })
  }
}

export const combineEdgeModels = editor => {
  return dispatch => {
    let {svg} = sceneService.combineEdgeModels(editor, true)
    try {
      sceneService.sendToFlixo(svg)
    } catch (e) {
      console.error(e)
    }


    dispatch({
      type: CAD_COMBINE_EDGE_MODELS,
      payload: {}
    })
  }
}

export const loadObjectSnapshot = (key, cadCanvas) => {
  return (dispatch) => {
    dispatch(spinnerShow())

    snapshotService.getObjectSnapshot(key)
      .then(snapshot => {
        dispatch(spinnerHide())
        const scene = cadCanvas.getScene()
        let loader = new THREE.ObjectLoader()
        const object = loader.parse(JSON.parse(snapshot.parameters))
        sceneService.fixSceneAfterImport(object)
        const oldObject = scene.getObjectByName(object.name)
        oldObject.parent.remove(oldObject)
        const objects = scene.getObjectByName('Objects')
        objects.add(object)

        GeometryUtils.fixObjectsPaths(scene)
        cadCanvas.render()

        let objectsIds = []
        if (objects.children) {
          objects.children.forEach(item => {
            objectsIds.push(item.id)
          })
        }
        dispatch({
          type: SNAPSHOT_LOAD_OBJECT,
          payload: {
            scene,
            objectsIds,
            isChanged: true
          }
        })
      })
  }
}
