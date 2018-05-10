import { CAD_TOGGLE_VISIBLE, CAD_DO_SELECTION, CAD_SHOW_ALL } from './cad'
import sceneService from '../services/sceneService'

export const toggleVisible = (entity, visible, editor) => {
  return dispatch => {
    entity.visible = visible
    sceneService.render(editor)

    dispatch({
      type: CAD_TOGGLE_VISIBLE,
      payload: {
        entity
      }
    })
  }
}

export const unSelect = (idx, activeEntities, editor) => {
  return dispatch => {
    sceneService.highlightEntities(editor, editor.activeEntities, true, undefined, false)
    activeEntities.splice(idx, 1)
    sceneService.highlightEntities(editor, editor.activeEntities)

    dispatch({
      type: CAD_DO_SELECTION,
      payload: {
        activeEntities
      }
    })
  }
}

export const selectEntity = (idx, activeEntities, editor) => {
  return dispatch => {
    sceneService.highlightEntities(editor, editor.activeEntities, true, undefined, false)
    sceneService.highlightEntities(editor, activeEntities[idx])
    sceneService.setPointOfInterest(editor, activeEntities[idx])
    console.log('selectEntity', activeEntities[idx])

    // dispatch({
    //   type: CAD_SELECT_ENTITY,
    //   payload: {
    //     activeEntities
    //   }
    // })
  }
}

export const showAll = editor => {
  return dispatch => {
    sceneService.showAll(editor)
    dispatch({
      type: CAD_SHOW_ALL,
      payload: {
        activeEntities: editor.activeEntities
      }
    })
  }
}

export const groupEntities = editor => {
  return dispatch => {
    sceneService.groupEntities(editor)

    // dispatch({
    //   type: CAD_DO_SELECTION,
    //   payload: {
    //     activeEntities: editor.activeEntities
    //   }
    // })
  }
}
