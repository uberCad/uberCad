import { CAD_TOGGLE_VISIBLE_LAYER, CAD_COMBINE_EDGE_MODELS } from './cad'
import sceneService from '../services/sceneService'

export const PANEL_OBJECTS_TOGGLE = 'PANEL_OBJECTS_TOGGLE'

export const toggleObject = object => {
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
