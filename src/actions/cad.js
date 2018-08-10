import DxfParser from 'dxf-parser'
import dxfService from './../services/dxfService'
import sceneService from './../services/sceneService'
import { TOOL_MEASUREMENT, TOOL_POINT } from '../components/Toolbar/toolbarComponent'
import { SELECT_MODE_NEW } from '../components/Options/optionsComponent'
import { addHelpPoints, getScale, unselectLine } from '../services/editObject'

export const CAD_PARSE_DXF = 'CAD_PARSE_DXF'
export const CAD_DRAW_DXF = 'CAD_DRAW_DXF'
export const CAD_CLICK = 'CAD_CLICK'
export const CAD_DO_SELECTION = 'CAD_DO_SELECTION'
export const CAD_SELECT_LINE = 'CAD_SELECT_LINE'
export const CAD_TOGGLE_VISIBLE = 'CAD_TOGGLE_VISIBLE'
export const CAD_TOGGLE_VISIBLE_LAYER = 'CAD_TOGGLE_VISIBLE_LAYER'
export const CAD_SHOW_ALL = 'CAD_SHOW_ALL'
export const CAD_GROUP_ENTITIES = 'CAD_GROUP_ENTITIES'
export const CAD_COMBINE_EDGE_MODELS = 'CAD_COMBINE_EDGE_MODELS'
export const CAD_EDITMODE_SET_ACTIVE_LINE = 'CAD_EDITMODE_SET_ACTIVE_LINE'
export const CAD_EDITMODE_UNSELECT_ACTIVE_LINE = 'CAD_EDITMODE_UNSELECT_ACTIVE_LINE'
export const CAD_IS_CHANGED = 'CAD_IS_CHANGED'

export const drawDxf = (data = null, container, snapshot = null) => {
  let cadCanvas = new dxfService.Viewer(data, container, snapshot)
  let scene = cadCanvas.getScene()
  let camera = cadCanvas.getCamera()
  let renderer = cadCanvas.getRenderer()
  container.appendChild(renderer.domElement)

  /**
   * init
   */

  let editor = {
    scene,
    camera,
    renderer,
    cadCanvas,
    options: {threshold: 0.01, selectMode: SELECT_MODE_NEW, singleLayerSelect: true}
  }

  try {
    testExample(editor)
  } catch (e) {
    console.error(e)
  }

  return dispatch => dispatch({
    type: CAD_DRAW_DXF,
    payload: {
      scene,
      camera,
      renderer,
      cadCanvas
    }
  })
}

function testExample (editor) {
  let objectsDraft = [
    // // [191],
    // // [239],
    // [370, 429],
    // // [650, 659],
    // // [544],
    // // [698],
    // // [1154, 1134, 1139],
    // [284],
    // // [494],
    // // [741],
    // // [1025],
    // // [773, 825],
    // // [878, 960],
    //
    // // [97, 92, 87],
    // // [1117, 1098, 1086],
    // [316, 463, -1043, -1042, -1041, -1083, -1081, -1080, -1079, -1078, -1077, -1076, -1075, -1074, -1073, -1072, -1071, -1070, -1069, -1068, -1067, -1066, -1065, -1064, -1062, -1061, -1060, -1059, -1058, -1057, -1056, -1055, -1054, -1053, -1052, -1051, -1050, -1049, -1048, -1047, -1046, -1045, -1044, -1082, -1063],
    // [1080],
    // [138, 173, 163],
    // [49, 46, 80, -1037, -1038, -1039, -1040],
    // [1038]
  ]
  let idsToFind = []
  objectsDraft.forEach(entityContainer => idsToFind.push(...entityContainer.map(id => Math.abs(id))))
  let result = {}

  let iterator = sceneService.entityIterator(editor.scene)
  let entity = iterator.next()
  while (!entity.done) {
    if (idsToFind.indexOf(entity.value.id) >= 0) {
      result[entity.value.id] = entity.value
    }
    entity = iterator.next()
  }

  let frames = []

  objectsDraft.forEach((frameData, frameId) => {
    let entities = []
    editor.options.selectMode = SELECT_MODE_NEW

    frameData.forEach(entityId => {
      if (entityId < 0) {
        entities.splice(entities.indexOf(result[Math.abs(entityId)]), 1)
      } else {
        entities = [...entities, ...sceneService.recursiveSelect(result[entityId], editor)]
        // console.error(entities.map(e => e.id))
      }
    })

    sceneService.highlightEntities(editor, entities)
    frames.push(sceneService.groupEntities(editor, entities, `Frame${frameId + 1}`))
  })

  if (frames.length) {
    // let {svg} = sceneService.combineEdgeModels(editor)
    // try {
    //   sceneService.sendToFlixo(svg)
    // } catch (e) {
    //   console.error(e)
    // }

    // let svg = sceneService.someSvg
    // try {
    //   sceneService.sendToFlixo(svg)
    // } catch (e) {
    //   console.error(e)
    // }
  }

  // let svg = sceneService.someSvg
  // try {
  //   sceneService.sendToFlixo(svg)
  // } catch (e) {
  //   console.error(e)
  // }
}

export const cadClick = (event, editor) => {
  return dispatch => {
    let {scene, camera, tool, renderer} = editor

    switch (tool) {
      case TOOL_POINT: {
        let clickResult = sceneService.onClick(event, scene, camera)
        console.log(`Click position [${clickResult.point.x.toFixed(4)}, ${clickResult.point.y.toFixed(4)}]`, clickResult)

        let payload = {
          ...clickResult,
          object: null
        }

        let selectResult = clickResult.activeEntities
        // $scope.editor.lastClickResult.activeEntities = ArrayUtils.clone(clickResult.activeEntities);

        if (selectResult.length) {
          // check if entity belongs to object
          if (selectResult[0].userData.belongsToObject) {
            payload.object = selectResult[0].parent
          }
        }

        if (!editor.editMode.isEdit) {
          let activeEntities = sceneService.doSelection(selectResult, editor)
          dispatch({
            type: CAD_DO_SELECTION,
            payload: {
              activeEntities
            }
          })
        } else {
          if (selectResult.length
            && selectResult[0].parent.name === editor.editMode.editObject.name
            && !editor.editMode.isNewLine
            && !editor.editMode.isNewCurve
            && !editor.editMode.clone.active
            && !editor.editMode.move.active
          ) {
            if (selectResult[0].id !== editor.editMode.activeLine.id) {
              if (editor.editMode.activeLine.id) {
                unselectLine(editor.editMode.activeLine, scene)
              }
              let activeEntities = sceneService.doSelection(selectResult, editor)
              const rPoint = getScale(camera)
              activeEntities[0].name = 'ActiveLine'
              addHelpPoints(activeEntities[0], scene, rPoint)
              renderer.render(scene, camera)
              dispatch({
                type: CAD_EDITMODE_SET_ACTIVE_LINE,
                payload: {
                  activeLine: activeEntities[0]
                }
              })
            }
          } else {
            //unselect activeLine line
            if (editor.editMode.activeLine.id && editor.editMode.activeLine !== editor.editMode.editObject) {
              unselectLine(editor.editMode.activeLine, scene)
              renderer.render(scene, camera)
              dispatch({
                type: CAD_EDITMODE_UNSELECT_ACTIVE_LINE,
                payload: {
                  activeLine: {}
                }
              })
            }
          }
        }
        // else {
        //   if (clickResult.activeEntities.length > 0 &&
        //     !$scope.editor.editMode.activeLine.hasOwnProperty('id') &&
        //     !$scope.editor.editMode.newLine.active &&
        //     !$scope.editor.editMode.newArc.active&&
        //     (clickResult.activeEntities[0].parent.uuid === $scope.editor.editMode.uuid ||
        //       clickResult.activeEntities[0].uuid === $scope.editor.editMode.uuid)
        //   ) {
        //     $scope.editGeometry(clickResult.activeEntities[0]);
        //   } else {
        //     //do nothing
        //   }
        // }

        // console.log('Click RESULT', clickResult)

        dispatch({
          type: CAD_CLICK,
          payload
        })
      }
        break

      case TOOL_MEASUREMENT: {
        // let clickResult = sceneService.onClick(event, scene, camera)
        // console.log(`Click position [${clickResult.point.x.toFixed(4)}, ${clickResult.point.y.toFixed(4)}]`, clickResult)
        //
        // let payload = {
        //   ...clickResult,
        //   object: null
        // }
        //
        // let selectResult = clickResult.activeEntities
        //
        // if (selectResult.length) {
        //   // check if entity belongs to object
        //   if (selectResult[0].userData.belongsToObject) {
        //     payload.object = selectResult[0].parent
        //   }
        // }
        //
        // dispatch({
        //   type: CAD_CLICK,
        //   payload
        // })
      }
        break

      default:
        console.log(`cadClick not handled for tool: ${tool}`)
        break
    }
  }
}

export const cadDoubleClick = (event, editor) => {
  return dispatch => {
    let {scene, camera, tool} = editor

    // console.warn('Double click: TODO recursive select entities')

    switch (tool) {
      case TOOL_POINT:
        if (!editor.editMode.isEdit) {
          let clickResult = sceneService.onClick(event, scene, camera)
          console.log(`DOUBLE Click position [${clickResult.point.x.toFixed(4)}, ${clickResult.point.y.toFixed(4)}]`, clickResult)

          if (clickResult.activeEntities.length) {
            console.log('has active entities')
            // check if entity belongs to object
            let activeEntities
            if (clickResult.activeEntities[0].userData.belongsToObject) {
              // completely select object
              // $scope.editor.activeEntities = $scope.editor.activeEntities[0].parent.children;
              activeEntities = clickResult.activeEntities[0].parent.children
            } else {
              activeEntities = sceneService.recursiveSelect(clickResult.activeEntities[0], editor)
            }

            activeEntities = sceneService.doSelection(activeEntities, editor)
            dispatch({
              type: CAD_DO_SELECTION,
              payload: {
                activeEntities
              }
            })
          }
        }

        break
      default:
        console.log(`cadDoubleClick not handled for tool: ${tool}`)
        break
    }
  }
}

export const parseDxf = dxf => {
  let parser = new DxfParser()
  return dispatch => dispatch({
    type: CAD_PARSE_DXF,
    payload: {
      parsedData: parser.parseSync(dxf)
    }
  })
}

export const toggleChanged = isChanged => {
  return dispatch => dispatch({
    type: CAD_IS_CHANGED,
    payload: {
      isChanged: !isChanged
    }
  })
}

