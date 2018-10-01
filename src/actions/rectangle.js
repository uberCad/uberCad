import { createLine, crossingPoint } from '../services/editObject'
import sceneService from '../services/sceneService'
import { movePointInfo } from './pointInfo'
import * as THREE from 'three'

export const RECTANGLE_TWO_POINT = 'RECTANGLE_TWO_POINT'
export const RECTANGLE_TWO_POINT_CLEAR = 'RECTANGLE_TWO_POINT_CLEAR'
export const RECTANGLE_TWO_POINT_FIRST_POINT = 'RECTANGLE_TWO_POINT_FIRST_POINT'

const AB = 'AB'
const BC = 'BC'
const CD = 'CD'
const DA = 'DA'

export const rectangleFirstPoint = (event, editor) => {
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

export const rectangleDraw = (event, editor, A) => {
  let {scene, camera, renderer} = editor
  sceneService.removeLineByName(AB, scene)
  sceneService.removeLineByName(BC, scene)
  sceneService.removeLineByName(CD, scene)
  sceneService.removeLineByName(DA, scene)
  let clickResult = sceneService.onClick(event, scene, camera)
  let mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  }
  let newLayer = scene.getObjectByName('newLayer')
  if (!newLayer) {
    newLayer = new THREE.Object3D()
    newLayer.name = 'newLayer'
    scene.getObjectByName('Layers').add(newLayer)
  }
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities)
  const C = {
    x: crossing ? crossing.x : mousePoint.x,
    y: crossing ? crossing.y : mousePoint.y
  }
  const B = {
    x: C.x,
    y: A.y
  }
  const D = {
    x: A.x,
    y: C.y
  }

  const lineAB =createLine(A, B)
  lineAB.name = AB
  newLayer.add(lineAB)

  const lineBC =createLine(B, C)
  lineBC.name = BC
  newLayer.add(lineBC)

  const lineCD =createLine(C, D)
  lineCD.name = CD
  newLayer.add(lineCD)

  const lineDA =createLine(D, A)
  lineDA.name = DA
  newLayer.add(lineDA)

  renderer.render(scene, camera)
  return dispatch => {
    crossing ? movePointInfo(event, 'Crossing')(dispatch) : movePointInfo(event, 'Click to select second point')(dispatch)
  }
}

export const rectangleFirstPointSelect = (event, editor) => {
  let {scene, camera} = editor
  let clickResult = sceneService.onClick(event, scene, camera)
  let mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  }
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities)
  const firstPoint = crossing ? crossing : mousePoint
  return dispatch => {
    dispatch({
      type: RECTANGLE_TWO_POINT_FIRST_POINT,
      payload: {firstPoint}
    })
  }
}

export const rectangleClear = (event, editor) => {
  let {scene, camera, renderer} = editor
  const lineAB = scene.getObjectByName(AB)
  const lineBC = scene.getObjectByName(BC)
  const lineCD = scene.getObjectByName(CD)
  const lineDA = scene.getObjectByName(DA)
  if (lineAB) {
    lineAB.name = ''
  }
  if (lineBC) {
    lineBC.name = ''
  }
  if (lineCD) {
    lineCD.name = ''
  }
  if (lineDA) {
    lineDA.name = ''
  }
  renderer.render(scene, camera)
  return dispatch => {
    dispatch({
      type: RECTANGLE_TWO_POINT_CLEAR
    })
  }
}
