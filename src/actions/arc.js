import {
  circleIntersectionAngle,
  createLine,
  editThetaLenght,
  helpArc,
  newArc
} from '../services/editObject'
import sceneService from '../services/sceneService'
import { movePointInfo } from './pointInfo'
import { CAD_DO_SELECTION } from './cad'
import GeometryUtils from '../services/GeometryUtils'
import * as THREE from 'three'

export const ARC_CENTER_TWO_POINT = 'ARC_CENTER_TWO_POINT'
export const ARC_CENTER_TWO_POINT_CLEAR = 'ARC_CENTER_TWO_POINT_CLEAR'
export const ARC_CENTER_TWO_POINT_CENTER_SELECT = 'ARC_CENTER_TWO_POINT_CENTER_SELECT'
export const ARC_CENTER_TWO_POINT_ONE_SELECT = 'ARC_CENTER_TWO_POINT_ONE_SELECT'

export const ARC_RADIUS_TWO_POINT = 'ARC_RADIUS_TWO_POINT'
export const ARC_RADIUS_TWO_POINT_CLEAR = 'ARC_RADIUS_TWO_POINT_CLEAR'
export const ARC_RADIUS_TWO_POINT_INPUT = 'ARC_RADIUS_TWO_POINT_INPUT'
export const ARC_RADIUS_TWO_POINT_ONE_SELECT = 'ARC_RADIUS_TWO_POINT_ONE_SELECT'
export const ARC_RADIUS_TWO_POINT_STOP_DRAW = 'ARC_RADIUS_TWO_POINT_STOP_DRAW'

export const ARC_TANGENT_LINE = 'ARC_TANGENT_LINE'
export const ARC_TANGENT_LINE_CLEAR = 'ARC_TANGENT_LINE_CLEAR'
export const ARC_TANGENT_LINE_FIRST_POINT = 'ARC_TANGENT_LINE_FIRST_POINT'
const tangentArc = 'tangentArc'
const radiusArc1 = 'radiusArc1'
const radiusArc2 = 'radiusArc2'

export const arcCenterPoint = (event, editor) => {
  let {scene, camera, renderer} = editor
  let clickResult = sceneService.onClick(event, scene, camera, renderer)
  return dispatch => {
    clickResult.binding ? movePointInfo(event, clickResult.binding)(dispatch) : movePointInfo(event, 'Click to add center arc')(dispatch)
  }
}

export const arcCenterFirstPoint = (event, editor, center) => {
  let {scene, camera, renderer} = editor
  let clickResult = sceneService.onClick(event, scene, camera, renderer)
  let pointOne = {
    x: clickResult.point.x,
    y: clickResult.point.y
  }
  const radius = GeometryUtils.getDistance(pointOne, center)

  let helpLine = helpArc(radius)
  helpLine.position.x = center.x
  helpLine.position.y = center.y
  const oldHelpLine = scene.getObjectByName('helpLine')
  if (oldHelpLine) oldHelpLine.parent.remove(oldHelpLine)
  scene.getObjectByName('HelpLayer').add(helpLine)
  renderer.render(scene, camera)
  return dispatch => {
    clickResult.binding ? movePointInfo(event, clickResult.binding)(dispatch) : movePointInfo(event, 'Click to add first point')(dispatch)
  }
}

export const arcCenterDraw = (event, editor, center, pointOne) => {
  let {scene, camera, renderer} = editor
  let clickResult = sceneService.onClick(event, scene, camera, renderer)
  let pointTwo = {
    x: clickResult.point.x,
    y: clickResult.point.y
  }

  const radius = GeometryUtils.getDistance(pointOne, center)

  let newLayer = scene.getObjectByName('newLayer')
  if (!newLayer) {
    newLayer = new THREE.Object3D()
    newLayer.name = 'newLayer'
    scene.getObjectByName('Layers').add(newLayer)
  }

  const thetaStart = circleIntersectionAngle(pointOne, center)
  const oldLine = scene.getObjectByName('newLine') || newArc(radius, thetaStart, 0.1)
  const t = editThetaLenght(pointTwo, oldLine)
  let line = newArc(radius, t.thetaStart, t.thetaLength)
  line.userData.helpGeometry = t
  line.position.x = center.x
  line.position.y = center.y
  if (oldLine && oldLine.parent) oldLine.parent.remove(oldLine)
  newLayer.add(line)

  renderer.render(scene, camera)
  return dispatch => {
    clickResult.binding ? movePointInfo(event, clickResult.binding)(dispatch) : movePointInfo(event, 'Click to add end point')(dispatch)
  }
}

export const arcCenterPointSelect = (event, editor) => {
  let {scene, camera, renderer} = editor
  const clickResult = sceneService.onClick(event, scene, camera, renderer)
  const center = {
    x: clickResult.point.x,
    y: clickResult.point.y
  }

  return dispatch => {
    dispatch({
      type: ARC_CENTER_TWO_POINT_CENTER_SELECT,
      payload: {center}
    })
  }
}

export const arcCenterFirstPointSelect = (event, editor) => {
  let {scene, camera, renderer} = editor
  const clickResult = sceneService.onClick(event, scene, camera, renderer)
  const pointOne = {
    x: clickResult.point.x,
    y: clickResult.point.y
  }

  return dispatch => {
    dispatch({
      type: ARC_CENTER_TWO_POINT_ONE_SELECT,
      payload: {pointOne}
    })
  }
}

export const saveCenterArc = (event, editor) => {
  let {scene, camera, renderer} = editor
  let arc = scene.getObjectByName('newLine')
  if (arc) arc.name = ''
  scene.getObjectByName('HelpLayer').children = []
  renderer.render(scene, camera)
  return dispatch => {
    dispatch({
      type: ARC_CENTER_TWO_POINT_CLEAR
    })
  }
}

export const inputRadius = (radius) => {
  return dispatch => {
    dispatch({
      type: ARC_RADIUS_TWO_POINT_INPUT,
      payload: {radius}
    })
  }
}

export const arcRadiusFirstPoint = (event, editor) => {
  let {scene, camera, renderer} = editor
  let clickResult = sceneService.onClick(event, scene, camera, renderer)

  return dispatch => {
    clickResult.binding ? movePointInfo(event, clickResult.binding)(dispatch) : movePointInfo(event, 'Click to add first point')(dispatch)
  }
}

export const arcRadiusFirstPointSelect = (event, editor) => {
  let {scene, camera, renderer} = editor
  const clickResult = sceneService.onClick(event, scene, camera, renderer)
  const pointOne = {
    x: clickResult.point.x,
    y: clickResult.point.y
  }

  return dispatch => {
    dispatch({
      type: ARC_RADIUS_TWO_POINT_ONE_SELECT,
      payload: {pointOne, drawing: true}
    })
  }
}

export const arcRadiusDraw = (event, editor, pointOne, radius) => {
  let {scene, camera, renderer} = editor
  const clickResult = sceneService.onClick(event, scene, camera, renderer)
  const pointTwo = {
    x: clickResult.point.x,
    y: clickResult.point.y
  }
  const distance = GeometryUtils.getDistance(pointOne, pointTwo)

  if (distance > 2 * radius) {
    return dispatch => {
      movePointInfo(event, 'Distance between points more then two radius')(dispatch)
    }
  } else {
    const center = GeometryUtils.centerRadiusArc(pointOne, pointTwo, radius)
    if (center[0].x && center[0].y && center[1].x && center[1].y) {
      let newLayer = scene.getObjectByName('newLayer')
      if (!newLayer) {
        newLayer = new THREE.Object3D()
        newLayer.name = 'newLayer'
        scene.getObjectByName('Layers').add(newLayer)
      }

      sceneService.removeLineByName(radiusArc1, scene)
      const param1 = GeometryUtils.arcParameters(pointOne, pointTwo, center[0])
      const arc1 = newArc(radius, param1.thetaStart, param1.thetaLength)
      arc1.position.x = center[0].x
      arc1.position.y = center[0].y
      arc1.name = radiusArc1
      newLayer.add(arc1)

      sceneService.removeLineByName(radiusArc2, scene)
      const param2 = GeometryUtils.arcParameters(pointOne, pointTwo, center[1])
      const arc2 = newArc(radius, param2.thetaStart, param2.thetaLength)
      arc2.position.x = center[1].x
      arc2.position.y = center[1].y
      arc2.name = radiusArc2
      newLayer.add(arc2)
    } else {
      console.warn('Center point error', center)
    }
    renderer.render(scene, camera)
    return dispatch => {
      clickResult.binding ? movePointInfo(event, clickResult.binding)(dispatch) : movePointInfo(event, 'Click to add second point')(dispatch)
    }
  }
}

export const stopDraw = () => {
  return dispatch => {
    dispatch({
      type: ARC_RADIUS_TWO_POINT_STOP_DRAW,
      payload: {drawing: false}
    })
  }
}

export const choseArc = (event, editor) => {
  let {scene, camera, renderer} = editor
  let clickResult = sceneService.onClick(event, scene, camera, renderer)
  const arc = clickResult.activeEntities.filter(item => {
    return (item.name === radiusArc1 || item.name === radiusArc2)
  })
  let activeEntities = sceneService.doSelection(arc, editor)
  return dispatch => {
    movePointInfo(event, 'Chose arc')(dispatch)
    dispatch({
      type: CAD_DO_SELECTION,
      payload: {activeEntities}
    })
  }
}

export const saveRadiusArc = (event, editor, arc) => {
  let {scene, camera, renderer} = editor
  if (arc.name !== radiusArc1) {
    sceneService.removeLineByName(radiusArc1, scene)
  } else {
    sceneService.removeLineByName(radiusArc2, scene)
  }
  arc.name = ''
  renderer.render(scene, camera)
  return dispatch => {
    dispatch({
      type: ARC_RADIUS_TWO_POINT_CLEAR
    })
  }
}

export const tangentFirstPoint = (event, editor) => {
  let {scene, camera, renderer} = editor
  let clickResult = sceneService.onClick(event, scene, camera, renderer)
  let activeEntities = sceneService.doSelection(clickResult.activeEntities, editor)
  return dispatch => {
    clickResult.binding ? movePointInfo(event, clickResult.binding)(dispatch) : movePointInfo(event, 'Click to add first point on line')(dispatch)
    dispatch({
      type: CAD_DO_SELECTION,
      payload: {activeEntities}
    })
  }
}

export const tangentFirstPointSelect = (event, editor, line) => {
  let {scene, camera, renderer} = editor
  const clickResult = sceneService.onClick(event, scene, camera, renderer)
  const point = {
    x: clickResult.point.x,
    y: clickResult.point.y
  }
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
  let clickResult = sceneService.onClick(event, scene, camera, renderer)
  let pointTwo = {
    x: clickResult.point.x,
    y: clickResult.point.y
  }
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
    clickResult.binding ? movePointInfo(event, clickResult.binding)(dispatch) : movePointInfo(event, 'Click to set point')(dispatch)
  }
}