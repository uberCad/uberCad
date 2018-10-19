import { createLine, newArc } from '../services/editObject'
import sceneService from '../services/sceneService'
import { movePointInfo } from './pointInfo'
import { CAD_DO_SELECTION } from './cad'
import GeometryUtils from '../services/GeometryUtils'

export const CHAMFER_TWO_LENGTH = 'CHAMFER_TWO_LENGTH'
export const CHAMFER_TWO_LENGTH_CLEAR = 'CHAMFER_TWO_LENGTH_CLEAR'
export const CHAMFER_TWO_LENGTH_INPUT_CHANGE = 'CHAMFER_TWO_LENGTH_INPUT_CHANGE'
export const CHAMFER_TWO_LENGTH_LINE_ONE = 'CHAMFER_TWO_LENGTH_FIRST_LINE'

export const CHAMFER_LENGTH_ANGLE = 'CHAMFER_LENGTH_ANGLE'
export const CHAMFER_LENGTH_ANGLE_CLEAR = 'CHAMFER_LENGTH_ANGLE_CLEAR'
export const CHAMFER_LENGTH_ANGLE_INPUT_CHANGE = 'CHAMFER_LENGTH_ANGLE_INPUT_CHANGE'
export const CHAMFER_LENGTH_ANGLE_LINE_ONE = 'CHAMFER_LENGTH_ANGLE_LINE_ONE'

export const ROUNDING_RADIUS = 'ROUNDING_RADIUS'
export const ROUNDING_RADIUS_CLEAR = 'ROUNDING_RADIUS_CLEAR'
export const ROUNDING_RADIUS_INPUT = 'ROUNDING_RADIUS_INPUT'
export const ROUNDING_RADIUS_LINE_ONE = 'ROUNDING_RADIUS_LINE_ONE'

export const ROUNDING_LENGTH = 'ROUNDING_LENGTH'
export const ROUNDING_LENGTH_CLEAR = 'ROUNDING_LENGTH_CLEAR'
export const ROUNDING_LENGTH_INPUT = 'ROUNDING_LENGTH_INPUT'
export const ROUNDING_LENGTH_LINE_ONE = 'ROUNDING_LENGTH_LINE_ONE'


export const inputChange = (name, value, mode) => {
  let type
  switch (mode) {
    case CHAMFER_TWO_LENGTH:
      type = CHAMFER_TWO_LENGTH_INPUT_CHANGE
      break
    case CHAMFER_LENGTH_ANGLE:
      type = CHAMFER_LENGTH_ANGLE_INPUT_CHANGE
      break
    case ROUNDING_RADIUS:
      type = ROUNDING_RADIUS_INPUT
      break
    case ROUNDING_LENGTH:
      type = ROUNDING_LENGTH_INPUT
      break
    default:
      console.warn(`Unhandled input change for mode ${mode}`)
  }
  return dispatch => {
    dispatch({
      type,
      payload: {
        name,
        [name]: value
      }
    })
  }
}

export const chamferFirstLine = (event, editor) => {
  let {scene, camera, renderer} = editor
  let clickResult = sceneService.onClick(event, scene, camera, renderer)
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
  let {scene, camera, renderer} = editor
  let clickResult = sceneService.onClick(event, scene, camera, renderer)
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

export const chamferLengthAngleFirstLineSelect = (lineOne) => {
  return dispatch => {
    dispatch({
      type: CHAMFER_LENGTH_ANGLE_LINE_ONE,
      payload: {lineOne}
    })
  }
}

export const chamferLengthAngleDraw = (event, editor, lineOne, lineTwo, length, angle) => {
  let {scene, camera, renderer} = editor
  const intersect = GeometryUtils.linesIntersect(
    lineOne.geometry.vertices[0],
    lineOne.geometry.vertices[1],
    lineTwo.geometry.vertices[0],
    lineTwo.geometry.vertices[1]
  )
  if (intersect.isIntersects) {
    const angleRadian = angle * Math.PI / 180
    const pointA = GeometryUtils.pointChamfer(lineOne, length, intersect.points[0].point)
    let pointB = {x: 0, y: 0}
    if (lineTwo.geometry.vertices[1].x === lineTwo.geometry.vertices[0].x) {
      const lengthTwo = length * Math.tan(angleRadian)
      pointB = GeometryUtils.pointChamfer(lineTwo, lengthTwo, intersect.points[0].point)
    } else {
      /**
       * y = kx + b
       * k = (y2 - y1) / (x2 - x1) => (x1, y1) first line point, (x2, y2) second line point,
       * b = y - kx
       * y1 = k1 * x1 + b1
       * y2 = k2 * x2 + b2
       * point intersects y1 & y2 :
       * pointX = (b2 - b1) / (k1 - k2)
       * pointY = k1 * ((b2 - b1) / (k1 - k2)) + b1
       */
      const kOne = (lineOne.geometry.vertices[1].y - lineOne.geometry.vertices[0].y) /
        (lineOne.geometry.vertices[1].x - lineOne.geometry.vertices[0].x)
      const kTwo = (lineTwo.geometry.vertices[1].y - lineTwo.geometry.vertices[0].y) /
        (lineTwo.geometry.vertices[1].x - lineTwo.geometry.vertices[0].x)
      const fi = Math.atan(kOne)
      const k1 = Math.tan(fi + angleRadian)
      const k2 = Math.tan(fi - angleRadian)
      const b1 = pointA.y - k1 * pointA.x
      const b2 = pointA.y - k2 * pointA.x

      const bTwo = lineTwo.geometry.vertices[0].y - kTwo * lineTwo.geometry.vertices[0].x
      const B1 = {
        x: (bTwo - b1) / (k1 - kTwo),
        y: k1 * ((bTwo - b1) / (k1 - kTwo)) + b1
      }
      const B2 = {
        x: (bTwo - b2) / (k2 - kTwo),
        y: k2 * ((bTwo - b2) / (k2 - kTwo)) + b2
      }
      const distance = GeometryUtils.getDistance(lineTwo.geometry.vertices[0], lineTwo.geometry.vertices[1])
      const distanceB10 = GeometryUtils.getDistance(B1, lineTwo.geometry.vertices[0])
      const distanceB11 = GeometryUtils.getDistance(B1, lineTwo.geometry.vertices[1])
      const distanceB20 = GeometryUtils.getDistance(B2, lineTwo.geometry.vertices[0])
      const distanceB21 = GeometryUtils.getDistance(B2, lineTwo.geometry.vertices[1])

      if (distanceB10 - distanceB20 < 0.01) {
        const distanceToB1 = GeometryUtils.getDistance(B1, lineTwo.geometry.vertices[1])
        pointB = distanceToB1 < distance ? B1 : B2
      } else if (distanceB11 - distanceB21 < 0.01) {
        const distanceToB1 = GeometryUtils.getDistance(B1, lineTwo.geometry.vertices[0])
        pointB = distanceToB1 < distance ? B1 : B2
      } else {
        console.warn('Something went wrong in chamferLengthAngleDraw')
      }

      if (lineTwo.geometry.vertices[0].x - intersect.points[0].point.x < 0.001 &&
        lineTwo.geometry.vertices[0].x - intersect.points[0].point.x > -0.001 &&
        lineTwo.geometry.vertices[0].y - intersect.points[0].point.y < 0.001 &&
        lineTwo.geometry.vertices[0].y - intersect.points[0].point.y > -0.001
      ) {
        lineTwo.geometry.vertices[0].x = pointB.x
        lineTwo.geometry.vertices[0].y = pointB.y
      } else {
        lineTwo.geometry.vertices[1].x = pointB.x
        lineTwo.geometry.vertices[1].y = pointB.y
      }
      lineTwo.geometry.verticesNeedUpdate = true
      lineTwo.computeLineDistances()
      lineTwo.geometry.computeBoundingSphere()
    }

    const chamfer = createLine(pointA, pointB)
    lineTwo.parent.add(chamfer)
    renderer.render(scene, camera)
    return dispatch => {
      dispatch({
        type: CHAMFER_LENGTH_ANGLE_CLEAR
      })
    }
  } else {
    return dispatch => {
      movePointInfo(event, 'Lines don\'t intersects')(dispatch)
    }
  }
}

export const chamferRoundingRadiusFirstLineSelect = (lineOne) => {
  return dispatch => {
    dispatch({
      type: ROUNDING_RADIUS_LINE_ONE,
      payload: {lineOne}
    })
  }
}

export const roundingRadiusDraw = (event, editor, lineOne, lineTwo, radius) => {
  let {scene, camera, renderer} = editor
  const intersect = GeometryUtils.linesIntersect(
    lineOne.geometry.vertices[0],
    lineOne.geometry.vertices[1],
    lineTwo.geometry.vertices[0],
    lineTwo.geometry.vertices[1]
  )
  if (intersect.isIntersects) {
    const angle = GeometryUtils.angleVector(lineOne, lineTwo, intersect.points[0].point)
    const length = radius / Math.tan(angle / 2)
    const pointA = GeometryUtils.pointChamfer(lineOne, length, intersect.points[0].point)
    const pointB = GeometryUtils.pointChamfer(lineTwo, length, intersect.points[0].point)
    let center, thetaStart, thetaLength
    if ((lineOne.geometry.vertices[1].y).toFixed(12) === (lineOne.geometry.vertices[0].y).toFixed(12)) {
      if (pointA.y > pointB.y) {
        center = {
          x: pointA.x,
          y: pointA.y - radius
        }
      } else {
        center = {
          x: pointA.x,
          y: pointA.y + Number(radius)
        }
      }
    } else if ((lineTwo.geometry.vertices[1].y).toFixed(12) === (lineTwo.geometry.vertices[0].y).toFixed(12)) {
      if (pointA.y < pointB.y) {
        center = {
          x: pointB.x,
          y: pointB.y - radius
        }
      } else {
        center = {
          x: pointB.x,
          y: pointB.y + Number(radius)
        }
      }
    } else {
      /**
       * k = (y2 - y1) / (x2 - x1) => (x1, y1) first line point, (x2, y2) second line point,
       * k1 = -1/ k2 => Perpendicular
       * b = y - kx
       * point intersects y1 & y2 :
       * pointX = (b2 - b1) / (k1 - k2)
       * pointY = k1 * ((b2 - b1) / (k1 - k2)) + b1
       */
      const kOne = (lineOne.geometry.vertices[1].y - lineOne.geometry.vertices[0].y) /
        (lineOne.geometry.vertices[1].x - lineOne.geometry.vertices[0].x)
      const kOnePerpendicular = -1 / kOne
      const bOnePerpendicular = pointA.y - kOnePerpendicular * pointA.x

      const kTwo = (lineTwo.geometry.vertices[1].y - lineTwo.geometry.vertices[0].y) /
        (lineTwo.geometry.vertices[1].x - lineTwo.geometry.vertices[0].x)
      const kTwoPerpendicular = -1 / kTwo
      const bTwoPerpendicular = pointB.y - kTwoPerpendicular * pointB.x

      center = {
        x: (bTwoPerpendicular - bOnePerpendicular) / (kOnePerpendicular - kTwoPerpendicular),
        y: kOnePerpendicular * ((bTwoPerpendicular - bOnePerpendicular) / (kOnePerpendicular - kTwoPerpendicular)) + bOnePerpendicular
      }
    }

    const angle1Ox = GeometryUtils.angleVectorOx(createLine(pointA, center), center)
    const angle2Ox = GeometryUtils.angleVectorOx(createLine(pointB, center), center)
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

    if ((thetaStart || thetaStart === 0) && center) {
      const line1 = createLine(pointA, center)
      const line2 = createLine(pointB, center)
      thetaLength = GeometryUtils.angleVector(line1, line2, center)
      let arc = newArc(radius, thetaStart, thetaLength)
      arc.position.x = center.x
      arc.position.y = center.y
      arc.material.color.set(lineOne.material.color)
      lineOne.parent.add(arc)
    }

    renderer.render(scene, camera)
    return dispatch => {
      dispatch({
        type: ROUNDING_RADIUS_CLEAR
      })
    }
  } else {
    return dispatch => {
      movePointInfo(event, 'Lines don\'t intersects')(dispatch)
    }
  }
}


export const chamferRoundingLengthFirstLineSelect = (lineOne) => {
  return dispatch => {
    dispatch({
      type: ROUNDING_LENGTH_LINE_ONE,
      payload: {lineOne}
    })
  }
}

export const roundingLengthDraw = (event, editor, lineOne, lineTwo, length) => {
  let {scene, camera, renderer} = editor
  const intersect = GeometryUtils.linesIntersect(
    lineOne.geometry.vertices[0],
    lineOne.geometry.vertices[1],
    lineTwo.geometry.vertices[0],
    lineTwo.geometry.vertices[1]
  )
  if (intersect.isIntersects) {
    const angle = GeometryUtils.angleVector(lineOne, lineTwo, intersect.points[0].point)
    const radius = length * Math.tan(angle / 2)
    const pointA = GeometryUtils.pointChamfer(lineOne, length, intersect.points[0].point)
    const pointB = GeometryUtils.pointChamfer(lineTwo, length, intersect.points[0].point)
    let center, thetaStart, thetaLength
    if ((lineOne.geometry.vertices[1].y).toFixed(12) === (lineOne.geometry.vertices[0].y).toFixed(12)) {
      if (pointA.y > pointB.y) {
        center = {
          x: pointA.x,
          y: pointA.y - radius
        }
      } else {
        center = {
          x: pointA.x,
          y: pointA.y + Number(radius)
        }
      }
    } else if ((lineTwo.geometry.vertices[1].y).toFixed(12) === (lineTwo.geometry.vertices[0].y).toFixed(12)) {
      if (pointA.y < pointB.y) {
        center = {
          x: pointB.x,
          y: pointB.y - radius
        }
      } else {
        center = {
          x: pointB.x,
          y: pointB.y + Number(radius)
        }
      }
    } else {
      /**
       * k = (y2 - y1) / (x2 - x1) => (x1, y1) first line point, (x2, y2) second line point,
       * k1 = -1/ k2 => Perpendicular
       * b = y - kx
       * point intersects y1 & y2 :
       * pointX = (b2 - b1) / (k1 - k2)
       * pointY = k1 * ((b2 - b1) / (k1 - k2)) + b1
       */
      const kOne = (lineOne.geometry.vertices[1].y - lineOne.geometry.vertices[0].y) /
        (lineOne.geometry.vertices[1].x - lineOne.geometry.vertices[0].x)
      const kOnePerpendicular = -1 / kOne
      const bOnePerpendicular = pointA.y - kOnePerpendicular * pointA.x

      const kTwo = (lineTwo.geometry.vertices[1].y - lineTwo.geometry.vertices[0].y) /
        (lineTwo.geometry.vertices[1].x - lineTwo.geometry.vertices[0].x)
      const kTwoPerpendicular = -1 / kTwo
      const bTwoPerpendicular = pointB.y - kTwoPerpendicular * pointB.x

      center = {
        x: (bTwoPerpendicular - bOnePerpendicular) / (kOnePerpendicular - kTwoPerpendicular),
        y: kOnePerpendicular * ((bTwoPerpendicular - bOnePerpendicular) / (kOnePerpendicular - kTwoPerpendicular)) + bOnePerpendicular
      }
    }

    const angle1Ox = GeometryUtils.angleVectorOx(createLine(pointA, center), center)
    const angle2Ox = GeometryUtils.angleVectorOx(createLine(pointB, center), center)
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

    if ((thetaStart || thetaStart === 0) && center) {
      const line1 = createLine(pointA, center)
      const line2 = createLine(pointB, center)
      thetaLength = GeometryUtils.angleVector(line1, line2, center)
      let arc = newArc(radius, thetaStart, thetaLength)
      arc.position.x = center.x
      arc.position.y = center.y
      arc.material.color.set(lineOne.material.color)
      lineOne.parent.add(arc)
    }

    renderer.render(scene, camera)
    return dispatch => {
      dispatch({
        type: ROUNDING_LENGTH_CLEAR
      })
    }
  } else {
    return dispatch => {
      movePointInfo(event, 'Lines don\'t intersects')(dispatch)
    }
  }
}