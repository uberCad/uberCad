import sceneService from '../services/sceneService'
import { disablePoint, movePointInfo } from './pointInfo'
import GeometryUtils from '../services/GeometryUtils'
import { CAD_DO_SELECTION } from './cad'
import * as THREE from '../extend/THREE'

export const MEASUREMENT_POINT = 'MEASUREMENT_POINT'

export const MEASUREMENT_LINE = 'MEASUREMENT_LINE'
export const MEASUREMENT_LINE_FIRST = 'MEASUREMENT_LINE_FIRST'
export const MEASUREMENT_LINE_SECOND = 'MEASUREMENT_LINE_SECOND'
export const MEASUREMENT_LINE_ERASE = 'MEASUREMENT_LINE_ERASE'

export const MEASUREMENT_RADIAL = 'MEASUREMENT_RADIAL'
export const MEASUREMENT_RADIAL_LINE = 'MEASUREMENT_RADIAL_LINE'

export const MEASUREMENT_ANGLE = 'MEASUREMENT_ANGLE'
export const MEASUREMENT_ANGLE_FIRST_LINE = 'MEASUREMENT_ANGLE_FIRST_LINE'
export const MEASUREMENT_ANGLE_SECOND_LINE = 'MEASUREMENT_ANGLE_SECOND_LINE'
export const MEASUREMENT_ANGLE_ERASE = 'MEASUREMENT_ANGLE_ERASE'

export const pointInfo = (event, editor) => {
  let {scene, camera, renderer} = editor
  let clickResult = sceneService.onClick(event, scene, camera, renderer)

  return dispatch => {
    clickResult.binding ?
      movePointInfo(event, `${clickResult.binding} x:${clickResult.point.x}, y:${clickResult.point.y}`)(dispatch)
      : movePointInfo(event, `Click to select point x:${clickResult.point.x}, y:${clickResult.point.y}`)(dispatch)
  }
}

export const pointSelect = (event, editor) => {
  let {scene, camera, renderer} = editor
  let clickResult = sceneService.onClick(event, scene, camera, renderer)
  let point = {
    x: clickResult.point.x,
    y: clickResult.point.y
  }

  return dispatch => {
    dispatch({
      type: MEASUREMENT_POINT,
      payload: {point}
    })
  }
}

export const lineFirstInfo = (event, editor) => {
  let {scene, camera, renderer} = editor
  let clickResult = sceneService.onClick(event, scene, camera, renderer)
  return dispatch => {
    clickResult.binding ? movePointInfo(event, clickResult.binding)(dispatch) : movePointInfo(event, 'Click to select first point')(dispatch)
  }
}

export const lineSecondInfo = (event, editor) => {
  let {scene, camera, renderer} = editor
  let clickResult = sceneService.onClick(event, scene, camera, renderer)
  return dispatch => {
    clickResult.binding ? movePointInfo(event, clickResult.binding)(dispatch) : movePointInfo(event, 'Click to select second point')(dispatch)
  }
}

export const lineFirstPoint = (event, editor) => {
  let {scene, camera, renderer} = editor
  let clickResult = sceneService.onClick(event, scene, camera, renderer)
  let first = {
    x: clickResult.point.x,
    y: clickResult.point.y
  }
  return dispatch => {
    dispatch({
      type: MEASUREMENT_LINE_FIRST,
      payload: {first}
    })
  }
}

export const lineSecondPoint = (event, editor, first) => {
  let {scene, camera, renderer} = editor
  let clickResult = sceneService.onClick(event, scene, camera, renderer)
  let second = {
    x: clickResult.point.x,
    y: clickResult.point.y
  }
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
  let {scene, camera, renderer} = editor
  let clickResult = sceneService.onClick(event, scene, camera, renderer)
  let activeEntities = sceneService.doSelection(clickResult.activeEntities, editor)
  return dispatch => {
    clickResult.binding ? movePointInfo(event, clickResult.binding)(dispatch) : movePointInfo(event, 'Click to select first line')(dispatch)
    dispatch({
      type: CAD_DO_SELECTION,
      payload: {activeEntities}
    })
  }
}

export const angleSecondInfo = (event, editor, firstLine) => {
  let {scene, camera, renderer} = editor
  let clickResult = sceneService.onClick(event, scene, camera, renderer)
  clickResult.activeEntities.push(firstLine)
  let activeEntities = sceneService.doSelection(clickResult.activeEntities, editor)

  return dispatch => {
    clickResult.binding ? movePointInfo(event, clickResult.binding)(dispatch) : movePointInfo(event, 'Click to select second line')(dispatch)
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

export const radialInfo = (event, editor) => {
  let {scene, camera, renderer} = editor
  let clickResult = sceneService.onClick(event, scene, camera, renderer)
  const circle = clickResult.activeEntities.filter(item => {
    return (item.geometry instanceof THREE.CircleGeometry)
  })

  let activeEntities = sceneService.doSelection(circle, editor)
  return dispatch => {
    clickResult.binding ? movePointInfo(event, clickResult.binding)(dispatch) : movePointInfo(event, 'Click to select arc')(dispatch)
    dispatch({
      type: CAD_DO_SELECTION,
      payload: {activeEntities}
    })
  }
}

export const radialSelectLine = (line) => {
  return dispatch => {
    dispatch({
      type: MEASUREMENT_RADIAL_LINE,
      payload: {line}
    })
  }
}
