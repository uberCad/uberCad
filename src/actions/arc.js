import { createLine, crossingPoint, newArc } from '../services/editObject'
import sceneService from '../services/sceneService'
import { movePointInfo } from './pointInfo'
import { CAD_DO_SELECTION } from './cad'
import GeometryUtils from '../services/GeometryUtils'

export const ARC_CENTER_TWO_POINT = 'ARC_CENTER_TWO_POINT'

export const ARC_RADIUS_TWO_POINT = 'ARC_RADIUS_TWO_POINT'
export const ARC_RADIUS_TWO_POINT_CLEAR = 'ARC_RADIUS_TWO_POINT_CLEAR'
export const ARC_RADIUS_TWO_POINT_INPUT = 'ARC_RADIUS_TWO_POINT_INPUT'

export const ARC_TANGENT_LINE = 'ARC_TANGENT_LINE'
export const ARC_TANGENT_LINE_CLEAR = 'ARC_TANGENT_LINE_CLEAR'
export const ARC_TANGENT_LINE_FIRST_POINT = 'ARC_TANGENT_LINE_FIRST_POINT'
const tangentArc = 'tangentArc'

export const inputRadius = (radius) => {
  return dispatch => {
    dispatch({
      type: ARC_RADIUS_TWO_POINT_INPUT,
      payload: {radius}
    })
  }
}

export const arcRadiusFirstPoint = (event, editor) => {
  let {scene, camera} = editor
  let clickResult = sceneService.onClick(event, scene, camera)
  let mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  }
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities)
  return dispatch => {
    crossing ? movePointInfo(event, 'Crossing')(dispatch) : movePointInfo(event, 'Click to add first point')(dispatch)
  }
}

export const tangentFirstPoint = (event, editor) => {
  let {scene, camera} = editor
  let clickResult = sceneService.onClick(event, scene, camera)
  let mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  }
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities)
  let activeEntities = sceneService.doSelection(clickResult.activeEntities, editor)
  return dispatch => {
    crossing ? movePointInfo(event, 'Crossing')(dispatch) : movePointInfo(event, 'Click to add first point on line')(dispatch)
    dispatch({
      type: CAD_DO_SELECTION,
      payload: {activeEntities}
    })
  }
}

export const tangentFirstPointSelect = (event, editor, line) => {
  let {scene, camera} = editor
  const clickResult = sceneService.onClick(event, scene, camera)
  const mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  }
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities)
  const point = crossing ? crossing : mousePoint
  const pointOne = GeometryUtils.pointOnLine(point, line)

  if (line && pointOne) {
    return dispatch => {
      dispatch({
        type: ARC_TANGENT_LINE_FIRST_POINT,
        payload: {pointOne, line}
      })
    }
  }
}

export const saveTangentArc = (editor) => {
  let {scene, camera, renderer} = editor
  let arc = scene.getObjectByName(tangentArc)
  if (arc) arc.name = ''
  renderer.render(scene, camera)
  return dispatch => {
    dispatch({
      type: ARC_TANGENT_LINE_CLEAR
    })
  }
}

export const tangentArcDraw = (event, editor, line, pointOne) => {
  let {scene, camera, renderer} = editor
  let clickResult = sceneService.onClick(event, scene, camera)
  let mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  }
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities)
  const pointTwo = crossing ? crossing : mousePoint
  const center = GeometryUtils.centerTangentArc(pointOne, pointTwo, line)
  if (center.x && center.y) {
    const radius = GeometryUtils.getDistance(pointOne, center)
    const line1 = createLine(pointOne, center)
    const line2 = createLine(pointTwo, center)
    const thetaLength = GeometryUtils.angleVector(line1, line2, center)
    let thetaStart
    const angle1Ox = GeometryUtils.angleVectorOx(line1, center)
    const angle2Ox = GeometryUtils.angleVectorOx(line2, center)
    if (angle1Ox < angle2Ox) {
      if (angle2Ox - angle1Ox < 2 * Math.PI - angle2Ox + angle1Ox) {
        thetaStart = angle1Ox
      } else {
        thetaStart = angle2Ox
      }
    } else {
      if (angle1Ox - angle2Ox < 2 * Math.PI - angle1Ox + angle2Ox) {
        thetaStart = angle2Ox
      } else {
        thetaStart = angle1Ox
      }
    }

    sceneService.removeLineByName(tangentArc, scene)
    const arc = newArc(radius, thetaStart, thetaLength)
    arc.position.x = center.x
    arc.position.y = center.y
    arc.name = tangentArc
    line.parent.add(arc)
  }
  renderer.render(scene, camera)
  return dispatch => {
    crossing ? movePointInfo(event, 'Crossing')(dispatch) : movePointInfo(event, 'Click to set point')(dispatch)
  }
}