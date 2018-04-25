import sceneService from '../services/sceneService'

export const SELECTION_BEGIN = 'SELECTION_BEGIN'
export const SELECTION_UPDATE = 'SELECTION_UPDATE'
export const SELECTION_END = 'SELECTION_END'

export const selectionBegin = (event, editor) => {
  let {scene, camera} = editor
  let clickResult = sceneService.onClick(event, scene, camera)

  return dispatch => dispatch({
    type: SELECTION_BEGIN,
    payload: {
      active: true,
      x: event.pageX,
      y: event.pageY,
      drawStartPos: {
        x: clickResult.point.x,
        y: clickResult.point.y
      }
    }
  })
}

export const selectionUpdate = (event, editor) => {
  return dispatch => {
    dispatch({
      type: SELECTION_UPDATE,
      payload: {
        x: event.pageX,
        y: event.pageY
      }
    })
  }
}

export const selectionEnd = (event, editor, selection) => {
  let {scene, camera, renderer} = editor
  let clickResult = sceneService.onClick(event, scene, camera, renderer)

  return dispatch => {
    dispatch({
      type: SELECTION_END,
      payload: {
        active: false,
        x: event.pageX,
        y: event.pageY,
        drawEndPos: {
          x: clickResult.point.x,
          y: clickResult.point.y
        }
      }
    })

    return {
      x1: editor.selection.drawStartPos.x,
      y1: editor.selection.drawStartPos.y,
      x2: clickResult.point.x,
      y2: clickResult.point.y
    }
  }
}
