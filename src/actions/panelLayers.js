import { CAD_TOGGLE_VISIBLE_LAYER } from './cad'
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
