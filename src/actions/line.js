import { createLine, crossingPoint } from '../services/editObject'
import sceneService from '../services/sceneService'
import { movePointInfo } from './pointInfo'
import { CAD_DO_SELECTION } from './cad'
import GeometryUtils from '../services/GeometryUtils'
import * as THREE from 'three'

export const LINE_TWO_POINT = 'LINE_TWO_POINT'

export const LINE_PARALLEL = 'LINE_PARALLEL'
export const LINE_PARALLEL_CLEAR = 'LINE_PARALLEL_CLEAR'
export const LINE_PARALLEL_BASE = 'LINE_PARALLEL_BASE'
export const LINE_PARALLEL_FIRST_POINT = 'LINE_PARALLEL_FIRST_POINT'

export const LINE_PERPENDICULAR = 'LINE_PERPENDICULAR'
export const LINE_TANGENT_TO_ARC = 'LINE_TANGENT_TO_ARC'

export const parallelLine = (event, editor) => {
  let {scene, camera} = editor
  let clickResult = sceneService.onClick(event, scene, camera)
  // console.log('clickResult =', clickResult)
  let mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  }
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities)
  let activeEntities = sceneService.doSelection(clickResult.activeEntities, editor)
  return dispatch => {
    crossing ? movePointInfo(event, 'Crossing')(dispatch) : movePointInfo(event, 'Click to select base line')(dispatch)
    dispatch({
      type: CAD_DO_SELECTION,
      payload: {activeEntities}
    })
  }
}

export const parallelLineSelect = (baseLile) => {
  return dispatch => {
    dispatch({
      type: LINE_PARALLEL_BASE,
      payload: {baseLine: baseLile}
    })
  }
}

export const parallelLineFirstPoint = (event, editor) => {
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

export const parallelLineSecondPoint = (event, editor, baseLine, firstPoint, distance) => {
  let {scene, camera, renderer} = editor
  let clickResult = sceneService.onClick(event, scene, camera)
  let mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  }
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities)

  let newLayer = scene.getObjectByName('newLayer')
  if (!newLayer) {
    newLayer = new THREE.Object3D()
    newLayer.name = 'newLayer'
    scene.getObjectByName('Layers').add(newLayer)
  }

  const parallelLine = scene.getObjectByName('parallelLine')
  const perpendicular = scene.getObjectByName('linePerpendicular')

  if (parallelLine) {
    parallelLine.parent.remove(parallelLine)
  }
  if (perpendicular) {
    perpendicular.parent.remove(perpendicular)
  }

  let parallelPoint
  if (baseLine.geometry.vertices[0].y === baseLine.geometry.vertices[1].y) {
    // console.log('|| Ox')
    parallelPoint = {
      x: mousePoint.x,
      y: firstPoint.y
    }
  } else if (baseLine.geometry.vertices[0].x === baseLine.geometry.vertices[1].x) {
    // console.log('|| Oy')
    parallelPoint = {
      x: firstPoint.x,
      y: mousePoint.y
    }
  } else {
    /**
     * Ах + Ву + С = 0.
     * y = kx + b
     * k = (y2 - y1) / (x2 - x1)
     * b = y - kx
     * k1 = -1/ k2 => Perpendicular
     * k1 = k2 => Parallel
     */
    const k1 = (baseLine.geometry.vertices[1].y - baseLine.geometry.vertices[0].y) /
      (baseLine.geometry.vertices[1].x - baseLine.geometry.vertices[0].x)
    const b1 = baseLine.geometry.vertices[0].y - (k1 * baseLine.geometry.vertices[0].x)
    const b1Parallel = firstPoint.y - (k1 * firstPoint.x)

    const k2Perpendicular = -(1 / k1)
    const b2Perpendicular = mousePoint.y - (k2Perpendicular * mousePoint.x)

    const perpendicularPoint = {
      x: (b2Perpendicular - b1) / (k1 - k2Perpendicular),
      y: k1 * ((b2Perpendicular - b1) / (k1 - k2Perpendicular)) + b1
    }
    const linePerpendicular = createLine(mousePoint, perpendicularPoint)
    linePerpendicular.name = 'linePerpendicular'
    // newLayer.add(linePerpendicular)

    parallelPoint = {
      x: (b2Perpendicular - b1Parallel) / (k1 - k2Perpendicular),
      y: k1 * ((b2Perpendicular - b1Parallel) / (k1 - k2Perpendicular)) + b1Parallel
    }
  }

  const lineParallel = createLine(firstPoint, parallelPoint)
  lineParallel.name = 'parallelLine'
  newLayer.add(lineParallel)

  renderer.render(scene, camera)
  return dispatch => {
    crossing ? movePointInfo(event, 'Crossing')(dispatch) : movePointInfo(event, 'Click to select second point')(dispatch)
  }
}

export const parallelLineFirstPointSelect = (event, editor, baseLine) => {
  let {scene, camera} = editor
  let clickResult = sceneService.onClick(event, scene, camera)
  let mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  }
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities)
  const first = crossing ? crossing : mousePoint
  const distance = GeometryUtils.distanseToLinePoint(baseLine, first)
  return dispatch => {
    dispatch({
      type: LINE_PARALLEL_FIRST_POINT,
      payload: {first, distance}
    })
  }
}

export const parallelLineSecondPointSelect = (event, editor) => {
  let {scene, camera, renderer} = editor
  const parallelLine = scene.getObjectByName('parallelLine')
  parallelLine.name = ''
  renderer.render(scene, camera)
  return dispatch => {
    dispatch({
      type: LINE_PARALLEL_CLEAR
    })
  }
}
