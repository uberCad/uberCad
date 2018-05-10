import { CAD_TOGGLE_VISIBLE_LAYER, CAD_COMBINE_EDGE_MODELS } from './cad'
import sceneService from '../services/sceneService'

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
    sceneService.combineEdgeModels(editor)

    dispatch({
      type: CAD_COMBINE_EDGE_MODELS,
      payload: {

      }
    })
  }
}
