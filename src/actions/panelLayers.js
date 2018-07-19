import { CAD_TOGGLE_VISIBLE_LAYER } from './cad'
import sceneService from '../services/sceneService'
export const PANEL_LAYERS_TOGGLE = 'PANEL_LAYERS_TOGGLE'

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

export const toggleLayer = (editor, layer) => {
  if (layer) {
    sceneService.setPointOfInterest(editor, layer)
  } else {
    sceneService.setPointOfInterest(editor, editor.scene)
  }
  return dispatch => {
    dispatch({
      type: PANEL_LAYERS_TOGGLE,
      payload: {
        activeLayer: layer
      }
    })
  }
}
