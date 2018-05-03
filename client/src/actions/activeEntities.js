import { CAD_TOGGLE_VISIBLE } from './cad'
import sceneService from '../services/sceneService'

export const toggleVisible = (entity, visible, editor) => {



  return dispatch => {
    entity.visible = visible;
    sceneService.render(editor);

    dispatch({
      type: CAD_TOGGLE_VISIBLE,
      payload: {
        entity
      }
    })
  }

}
