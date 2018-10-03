import { createLine } from '../services/editObject'
import sceneService from '../services/sceneService'
import { movePointInfo } from './pointInfo'
import { CAD_DO_SELECTION } from './cad'
import GeometryUtils from '../services/GeometryUtils'

export const CHAMFER_TWO_LENGTH = 'CHAMFER_TWO_LENGTH'
export const CHAMFER_TWO_LENGTH_CLEAR = 'CHAMFER_TWO_LENGTH_CLEAR'
export const CHAMFER_TWO_LENGTH_INPUT_CHANGE = 'CHAMFER_TWO_LENGTH_INPUT_CHANGE'
export const CHAMFER_TWO_LENGTH_LINE_ONE = 'CHAMFER_TWO_LENGTH_FIRST_LINE'

export const CHAMFER_LENGTH_ANGLE = 'CHAMFER_LENGTH_ANGLE'
export const ROUNDING_RADIUS = 'ROUNDING_RADIUS'
export const ROUNDING_LENGTH = 'ROUNDING_LENGTH'

export const inputChange = (name, value) => {
  return dispatch => {
    dispatch({
      type: CHAMFER_TWO_LENGTH_INPUT_CHANGE,
      payload: {
        name,
        [name]: value
      }
    })
  }
}

export const chamferFirstLine = (event, editor) => {
  let {scene, camera} = editor
  let clickResult = sceneService.onClick(event, scene, camera)
  let activeEntities = sceneService.doSelection(clickResult.activeEntities, editor)
  return dispatch => {
    movePointInfo(event, 'Click to select first line')(dispatch)
    dispatch({
      type: CAD_DO_SELECTION,
      payload: {activeEntities}
    })
  }
}

export const chamferSecondLine = (event, editor) => {
  let {scene, camera} = editor
  let clickResult = sceneService.onClick(event, scene, camera)
  let activeEntities = sceneService.doSelection(clickResult.activeEntities, editor)
  return dispatch => {
    movePointInfo(event, 'Click to select second line')(dispatch)
    dispatch({
      type: CAD_DO_SELECTION,
      payload: {activeEntities}
    })
  }
}

export const chamferFirstLineSelect = (lineOne) => {
  return dispatch => {
    dispatch({
      type: CHAMFER_TWO_LENGTH_LINE_ONE,
      payload: {lineOne}
    })
  }
}

export const chamferDraw = (event, editor, lineOne, lineTwo, lengthOne, lengthTwo) => {
  let {scene, camera, renderer} = editor
  const intersect = GeometryUtils.linesIntersect(
    lineOne.geometry.vertices[0],
    lineOne.geometry.vertices[1],
    lineTwo.geometry.vertices[0],
    lineTwo.geometry.vertices[1]
  )
  if (intersect.isIntersects) {
    const A = GeometryUtils.pointChamfer(lineOne, lengthOne, intersect.points[0].point)
    const B = GeometryUtils.pointChamfer(lineTwo, lengthTwo, intersect.points[0].point)
    const AB = createLine(A, B)
    AB.material.color.set(lineOne.material.color)
    lineOne.parent.add(AB)
    renderer.render(scene, camera)

    return dispatch => {
      dispatch({
        type: CHAMFER_TWO_LENGTH_CLEAR
      })
    }
  } else {
    return dispatch => {
      movePointInfo(event, 'Lines don\'t intersects')(dispatch)
    }
  }
}
