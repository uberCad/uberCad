import { crossingPoint } from '../services/editObject'
import sceneService from '../services/sceneService'
import { disablePoint, movePointInfo } from './pointInfo'
import GeometryUtils from '../services/GeometryUtils'
import { CAD_DO_SELECTION } from './cad'

export const MEASUREMENT_POINT = 'MEASUREMENT_POINT'

export const MEASUREMENT_LINE = 'MEASUREMENT_LINE'
export const MEASUREMENT_LINE_FIRST = 'MEASUREMENT_LINE_FIRST'
export const MEASUREMENT_LINE_SECOND = 'MEASUREMENT_LINE_SECOND'
export const MEASUREMENT_LINE_ERASE = 'MEASUREMENT_LINE_ERASE'

export const MEASUREMENT_RADIAL = 'MEASUREMENT_RADIAL'

export const MEASUREMENT_ANGLE = 'MEASUREMENT_ANGLE'
export const MEASUREMENT_ANGLE_FIRST_LINE = 'MEASUREMENT_ANGLE_FIRST_LINE'
export const MEASUREMENT_ANGLE_SECOND_LINE = 'MEASUREMENT_ANGLE_SECOND_LINE'
export const MEASUREMENT_ANGLE_ERASE = 'MEASUREMENT_ANGLE_ERASE'

export const pointInfo = (event, editor) => {
  let {scene, camera} = editor
  let clickResult = sceneService.onClick(event, scene, camera)
  let mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  }
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities)
  return dispatch => {
    crossing ? movePointInfo(event, 'Crossing')(dispatch) : movePointInfo(event, 'Click to select point')(dispatch)
  }
}

export const pointSelect = (event, editor) => {
  let {scene, camera} = editor
  let clickResult = sceneService.onClick(event, scene, camera)
  let mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  }
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities)
  const point = crossing ? crossing : mousePoint

  return dispatch => {
    dispatch({
      type: MEASUREMENT_POINT,
      payload: {point}
    })
  }
}

export const lineFirstInfo = (event, editor) => {
  let {scene, camera} = editor
  let clickResult = sceneService.onClick(event, scene, camera)
  let mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  }
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities)
  return dispatch => {
    crossing ? movePointInfo(event, 'Crossing')(dispatch) : movePointInfo(event, 'Click to select first point')(dispatch)
  }
}

export const lineSecondInfo = (event, editor) => {
  let {scene, camera} = editor
  let clickResult = sceneService.onClick(event, scene, camera)
  let mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  }
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities)
  return dispatch => {
    crossing ? movePointInfo(event, 'Crossing')(dispatch) : movePointInfo(event, 'Click to select second point')(dispatch)
  }
}

export const lineFirstPoint = (event, editor) => {
  let {scene, camera} = editor
  let clickResult = sceneService.onClick(event, scene, camera)
  let mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  }
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities)
  const first = crossing ? crossing : mousePoint

  return dispatch => {
    dispatch({
      type: MEASUREMENT_LINE_FIRST,
      payload: {first}
    })
  }
}

export const lineSecondPoint = (event, editor, first) => {
  let {scene, camera} = editor
  let clickResult = sceneService.onClick(event, scene, camera)
  let mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  }
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities)
  const second = crossing ? crossing : mousePoint

  const distance = GeometryUtils.getDistance(first, second)
  return dispatch => {
    disablePoint()(dispatch)
    dispatch({
      type: MEASUREMENT_LINE_SECOND,
      payload: {
        second,
        distance
      }
    })
  }
}

export const eraseLine = () => {
  return dispatch => {
    dispatch({
      type: MEASUREMENT_LINE_ERASE,
      payload: {
        line: {
          first: null,
          second: null,
          distance: null
        }
      }
    })
  }
}

export const angleFirstInfo = (event, editor) => {
  let {scene, camera} = editor
  let clickResult = sceneService.onClick(event, scene, camera)
  let mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  }
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities)
  let activeEntities = sceneService.doSelection(clickResult.activeEntities, editor)
  return dispatch => {
    crossing ? movePointInfo(event, 'Crossing')(dispatch) : movePointInfo(event, 'Click to select first line')(dispatch)
    dispatch({
      type: CAD_DO_SELECTION,
      payload: {activeEntities}
    })
  }
}

export const angleSecondInfo = (event, editor, firstLine) => {
  let {scene, camera} = editor
  let clickResult = sceneService.onClick(event, scene, camera)
  let mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  }
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities)
  clickResult.activeEntities.push(firstLine)
  let activeEntities = sceneService.doSelection(clickResult.activeEntities, editor)

  return dispatch => {
    crossing ? movePointInfo(event, 'Crossing')(dispatch) : movePointInfo(event, 'Click to select second line')(dispatch)
    dispatch({
      type: CAD_DO_SELECTION,
      payload: {activeEntities}
    })
  }
}

export const angleSelectFirstLine = (line) => {
  return dispatch => {
    dispatch({
      type: MEASUREMENT_ANGLE_FIRST_LINE,
      payload: {line}
    })
  }
}

export const angleSelectSecondLine = (firstLine, secondLine) => {
  const angleValue =  GeometryUtils.angleBetweenLines(firstLine, secondLine, 'degree')
  return dispatch => {
    disablePoint()(dispatch)
    dispatch({
      type: MEASUREMENT_ANGLE_SECOND_LINE,
      payload: {
        secondLine,
        angleValue
      }
    })
  }
}

export const eraseAngle = () => {
  return dispatch => {
    dispatch({
      type: MEASUREMENT_ANGLE_ERASE,
      payload: {
        angle: {
          firstLine: null,
          secondLine: null,
          angleValue: null
        }
      }
    })
  }
}
