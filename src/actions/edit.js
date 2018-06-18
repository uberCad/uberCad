import * as THREE from '../extend/THREE'
import {
  setColor,
  setOriginalColor,
  startPointIndex,
  changeGeometry,
  crossingPoint,
  createLine
} from '../services/editObject'
import sceneService from '../services/sceneService'
import GeometryUtils from '../services/GeometryUtils'
import { activePoint, disablePoint, movePointInfo } from './pointInfo'

export const EDIT_IS_EDIT = 'EDIT_IS_EDIT'
export const EDIT_CANCEL = 'EDIT_CANCEL'
export const EDIT_SELECT_POINT = 'EDIT_SELECT_POINT'
export const EDIT_MOVE_POINT = 'EDIT_MOVE_POINT'
export const EDIT_SAVE_POINT = 'EDIT_SAVE_POINT'

export const EDIT_NEW_LINE = 'EDIT_NEW_LINE'
export const EDIT_CANCEL_NEW_LINE = 'EDIT_CANCEL_NEW_LINE'
export const EDIT_LINE_FIRST_POINT = 'EDIT_LINE_FIRST_POINT'
export const EDIT_NEW_LINE_SAVE = 'EDIT_NEW_LINE_SAVE'

export const EDIT_NEW_ARC = 'EDIT_NEW_ARC'

export const isEdit = (option, editor, object = {}) => {
  if (option) {
    let bgColor = new THREE.Color(0xaaaaaa)
    let objColor = new THREE.Color(0x00ff00)
    setColor(editor.scene, bgColor, object.name, objColor)
  } else {
    setOriginalColor(editor.scene)
  }
  object.userData.parentName = object.parent.name
  const beforeEdit = JSON.stringify(object)
  editor.renderer.render(editor.scene, editor.camera)
  return dispatch => dispatch({
    type: EDIT_IS_EDIT,
    payload: {
      isEdit: option,
      beforeEdit: beforeEdit,
      editObject: object,
      scene: editor.scene
    }
  })
}

export const cancelEdit = (editor, editObject, backUp) => {
  if (backUp && !editObject.metadata) { //for developer after save/restart, editObject = json object
    let loader = new THREE.ObjectLoader()
    const object = loader.parse(JSON.parse(backUp))
    editObject.parent.remove(editObject)
    editor.scene.getObjectByName(object.userData.parentName).add(object)
  }
  editor.scene.getObjectByName('HelpLayer').children = []
  sceneService.fixSceneAfterImport(editor.scene)
  GeometryUtils.fixObjectsPaths(editor.scene)
  setOriginalColor(editor.scene)
  editor.renderer.render(editor.scene, editor.camera)
  return dispatch => dispatch({
    type: EDIT_CANCEL,
    payload: {
      editMode: {
        isEdit: false,
        beforeEdit: {},
        editObject: {},
        activeLine: {},
        selectPointIndex: null
      }
    }
  })
}

export const selectPoint = (line, event, editor) => {
  let {scene, camera} = editor
  let clickResult = sceneService.onClick(event, scene, camera)
  let mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  }
  const selectPointIndex = startPointIndex(line, mousePoint)
  if (line.geometry.type === 'CircleGeometry') {
    if (!line.userData.helpGeometry) {
      line.userData.helpGeometry = {}
    }
    line.userData.helpGeometry.helpLength = line.geometry.parameters.thetaLength
    line.userData.helpGeometry.helpStart = line.geometry.parameters.thetaStart
  }

  return dispatch => {
    activePoint()(dispatch)
    dispatch({
      type: EDIT_SELECT_POINT,
      payload: {selectPointIndex}
    })
  }
}

export const movePoint = (line, index, event, editor) => {
  let {scene, camera, renderer} = editor
  let clickResult = sceneService.onClick(event, scene, camera)
  let point = {
    x: clickResult.point.x,
    y: clickResult.point.y
  }
  const crossing = crossingPoint(point, clickResult.activeEntities)
  const pointCnange = crossing ? crossing : point
  changeGeometry(line, index, pointCnange, scene)
  renderer.render(scene, camera)

  return dispatch => {
    crossing ? movePointInfo(event, 'Crossing point')(dispatch) : disablePoint()(dispatch)
    dispatch({
      type: EDIT_MOVE_POINT,
      payload: {}
    })
  }
}

export const savePoint = () => {
  return dispatch => {
    disablePoint()(dispatch)
    dispatch({
      type: EDIT_SAVE_POINT,
      payload: {index: null}
    })
  }
}

//* Create new line
export const newLine = () => {
  return dispatch => {
    dispatch({
      type: EDIT_NEW_LINE,
      payload:
        {isNewLine: true}

    })
  }
}

export const cancelNewLine = (editor) => {
  let {scene, camera, renderer} = editor
  const line = scene.getObjectByName('newLine')
  if (line) {
    line.parent.remove(line)
    renderer.render(scene, camera)
  }
  return dispatch => {
    disablePoint()(dispatch)
    dispatch({
      type: EDIT_CANCEL_NEW_LINE,
      payload: {
        isNewLine: false,
        newLineFirst: null
      }
    })
  }
}

export const firstPoint = (event, editor) => {
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
      type: EDIT_LINE_FIRST_POINT,
      payload: {firstPoint}
    })
  }
}

export const startNewLine = (event, editor) => {
  let {scene, camera} = editor
  let clickResult = sceneService.onClick(event, scene, camera)
  let mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  }
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities)
  return dispatch => {
    crossing ? movePointInfo(event, 'Crossing first')(dispatch) : movePointInfo(event, 'Select first')(dispatch)
  }
}

export const drawLine = (event, editor) => {
  let {scene, camera, renderer, editMode} = editor
  let clickResult = sceneService.onClick(event, scene, camera)
  let mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  }
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities)
  const secondPoint = crossing ? crossing : mousePoint

  let changeLine = scene.getObjectByName('newLine')
  if (changeLine) {
    changeGeometry(changeLine, 1, secondPoint, scene)
  } else {
    const line = createLine(editMode.newLineFirst, secondPoint)
    editMode.editObject.add(line)
  }
  renderer.render(scene, camera)
  return dispatch => {
    crossing ? movePointInfo(event, 'Crossing second')(dispatch) : movePointInfo(event, 'Select second')(dispatch)
  }
}

export const saveNewLine = (editor) => {
  editor.scene.getObjectByName('newLine').name = ''
  return dispatch => {
    disablePoint()(dispatch)
    dispatch({
      type: EDIT_NEW_LINE_SAVE,
      payload: {
        isNewLine: false,
        newLineFirst: null
      }
    })
  }
}
