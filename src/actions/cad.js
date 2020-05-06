import DxfParser from 'dxf-parser';
import { Viewer } from './../services/dxfService';
import sceneService from './../services/sceneService';
import {
  TOOL_BORDER_RADIUS,
  TOOL_COPY_PASTE,
  TOOL_LINE,
  TOOL_MEASUREMENT,
  TOOL_NEW_CURVE,
  TOOL_POINT,
  TOOL_REDO,
  TOOL_SELECT,
  TOOL_UNDO,
  TOOL_FACET
} from '../components/Toolbar/toolbarComponent';
import {
  addHelpPoints,
  getScale,
  unselectLine,
  isPoint,
  changeArcGeometry,
  createLine,
  circleIntersectionAngle,
  changeGeometry
} from '../services/editObject';
import { selectionBegin, selectionEnd, selectionUpdate } from './selection';
import {
  radius,
  centerCurve,
  centerPoint,
  cloneObject,
  clonePoint,
  disableMovePoint,
  drawLine,
  firstPoint,
  moveObject,
  moveObjectPoint,
  movePoint,
  saveClone,
  saveNewCurve,
  saveNewLine,
  savePoint,
  selectClonePoint,
  selectMovePoint,
  selectPoint,
  setClone,
  startNewLine,
  thetaLength,
  thetaStart
} from './edit';
import {
  angleFirstInfo,
  angleSecondInfo,
  angleSelectFirstLine,
  angleSelectSecondLine,
  eraseAngle,
  eraseLine,
  lineFirstInfo,
  lineFirstPoint,
  lineSecondInfo,
  lineSecondPoint,
  MEASUREMENT_ANGLE,
  MEASUREMENT_LINE,
  MEASUREMENT_POINT,
  MEASUREMENT_RADIAL,
  pointInfo,
  pointSelect,
  radialInfo,
  radialSelectLine
} from './measurement';
import {
  LINE_PARALLEL,
  LINE_PERPENDICULAR,
  LINE_TANGENT_TO_ARC,
  LINE_TWO_POINT,
  parallelLine,
  parallelLineFirstPoint,
  parallelLineFirstPointSelect,
  parallelLineSecondPoint,
  parallelLineSecondPointSelect,
  parallelLineSelect,
  perpendicularBaseLine,
  perpendicularDraw,
  perpendicularFirstPoint,
  perpendicularFirstPointSelect,
  perpendicularLineSelect,
  perpendicularSecondPointSelect,
  tangentBaseArc,
  tangentBaseArcSelect,
  tangentLineDraw,
  tangentLineEnd
} from './line';
import { PANEL_LAYERS_TOGGLE } from './panelLayers';
import GeometryUtils from '../services/GeometryUtils';
import * as THREE from '../extend/THREE';
import { movePointInfo } from './pointInfo';
import helpLayerService from '../services/helpLayerService';

export const CAD_PARSE_DXF = 'CAD_PARSE_DXF';
export const CAD_DRAW_DXF = 'CAD_DRAW_DXF';
export const CAD_CLICK = 'CAD_CLICK';
export const CAD_DO_SELECTION = 'CAD_DO_SELECTION';
export const CAD_SELECT_LINE = 'CAD_SELECT_LINE';
export const CAD_TOGGLE_VISIBLE = 'CAD_TOGGLE_VISIBLE';
export const CAD_TOGGLE_VISIBLE_LAYER = 'CAD_TOGGLE_VISIBLE_LAYER';
export const CAD_SHOW_ALL = 'CAD_SHOW_ALL';
export const CAD_GROUP_ENTITIES = 'CAD_GROUP_ENTITIES';
export const CAD_COMBINE_EDGE_MODELS = 'CAD_COMBINE_EDGE_MODELS';
export const CAD_EDITMODE_SET_ACTIVE_LINE = 'CAD_EDITMODE_SET_ACTIVE_LINE';
export const CAD_EDITMODE_UNSELECT_ACTIVE_LINE =
  'CAD_EDITMODE_UNSELECT_ACTIVE_LINE';
export const CAD_IS_CHANGED = 'CAD_IS_CHANGED';

export const drawDxf = (data = null, container, snapshot = null) => {
  let cadCanvas = new Viewer(data, container, snapshot);
  let scene = cadCanvas.getScene();
  let camera = cadCanvas.getCamera();
  let renderer = cadCanvas.getRenderer();
  container.appendChild(renderer.domElement);

  /**
   * init
   */

  try {
    // let editor = {
    //     scene,
    //     camera,
    //     renderer,
    //     cadCanvas,
    //     options: {
    //         threshold: 0.01,
    //         selectMode: SELECT_MODE_NEW,
    //         singleLayerSelect: true
    //     }
    // };
    // testExample(editor);
  } catch (e) {
    console.error(e);
  }

  return dispatch =>
    dispatch({
      type: CAD_DRAW_DXF,
      payload: {
        scene,
        camera,
        renderer,
        cadCanvas
      }
    });
};

// function testExample(editor) {
//   let optionsCopy = document.getElementById("TOOL_COPY");
//     let optionsPaste = document.getElementById("TOOL_PASTE");
//     if (optionsCopy && optionsPaste) {
//       optionsCopy.addEventListener('click', () => {
//         editor.options.selectMode = "COPY";
//         copyPaste(editor);
//       });
//       optionsPaste.addEventListener('click', () => {
//         editor.options.selectMode = "Paste";
//         copyPaste(editor);
//       });
//     }
// }

export const cadClick = (event, editor) => {
  return dispatch => {
    let { scene, camera, tool, renderer } = editor;
    // todo в HelpLayerService і переробити з використанням changeArcGeometry
    let controls = editor.cadCanvas.getControls();
    controls.addEventListener('change', () => {
      let helpLayer = scene.getObjectByName('HelpLayer');
      if (helpLayer.children.length) {
        addHelpPoints(editor, scene, camera.top / 50);
      }
    });

    switch (tool) {
      case TOOL_POINT:
        {
          let clickResult = sceneService.onClick(event, scene, camera);
          console.log(
            `Click position [${clickResult.point.x.toFixed(
              4
            )}, ${clickResult.point.y.toFixed(4)}]`,
            clickResult
          );

          let payload = {
            ...clickResult,
            object: null
          };

          let selectResult = clickResult.activeEntities;
          // $scope.editor.lastClickResult.activeEntities = ArrayUtils.clone(clickResult.activeEntities);

          if (selectResult.length) {
            // check if entity belongs to object
            if (selectResult[0].userData.belongsToObject) {
              payload.object = selectResult[0].parent;
            }
          }

          if (!editor.editMode.isEdit) {
            let activeEntities = sceneService.doSelection(selectResult, editor);
            dispatch({
              type: CAD_DO_SELECTION,
              payload: {
                activeEntities
              }
            });
          } else {
            console.log('Start the party');
            console.log(editor.editMode);
            console.log(selectResult);
            if (
              selectResult.length &&
              selectResult[0].parent.name === editor.editMode.editObject.name &&
              !editor.editMode.isNewLine &&
              !editor.editMode.isNewCurve &&
              !editor.editMode.clone.active &&
              !editor.editMode.move.active
            ) {
              if (
                !editor.editMode.activeLine.length ||
                selectResult[0].id !== editor.editMode.activeLine[0].id
              ) {

                let activeEntities = sceneService.doSelection(
                  selectResult,
                  editor
                );
                dispatch({
                  type: CAD_DO_SELECTION,
                  payload: {
                    activeEntities
                  }
                });

                // console.log("we need more console.log or cad active entities");
                // console.log(activeEntities);
                // console.log(editor);
                // debugger;

                const rPoint = getScale(camera);
                addHelpPoints(editor, scene, rPoint);

                // todo костиль від 16.03.20
                if (editor.activeEntities.length) {
                  dispatch({
                    type: CAD_EDITMODE_SET_ACTIVE_LINE,
                    payload: {
                      activeLine: editor.activeEntities[0]
                    }
                  });
                }
                renderer.render(scene, camera);
              }
            } else {
              //unselect activeLine line
              if (editor.activeEntities.length) {
                let point = {
                  x: clickResult.point.x,
                  y: clickResult.point.y
                };

                // todo перевірка для всих хелппоінтів
                let isSelectPoint = false;
                let helpLayer = scene.getObjectByName('HelpLayer');
                if (helpLayer.children.length) {
                   helpLayer.children.forEach(testPoint => {
                    if (testPoint.name != "pointCurveCenter" && testPoint.name != "helpCenterLine") {
                      if (!isSelectPoint) {
                        isSelectPoint = isPoint(
                          testPoint.position,
                          testPoint.geometry.parameters.radius,
                          point
                        );
                      }
                    }
                  });
                }
                if (!isSelectPoint) {
                  unselectLine(editor.activeEntities, scene);
                  renderer.render(scene, camera);
                  dispatch({
                    type: CAD_EDITMODE_UNSELECT_ACTIVE_LINE,
                    payload: {
                      activeLine: []
                    }
                  });
                }
              }
            }
            //todo закінчуючи туточки
          }

          dispatch({
            type: CAD_CLICK,
            payload
          });
        }
        break;

      case TOOL_MEASUREMENT:
        {
          let clickResult = sceneService.onClick(event, scene, camera);
          console.log(
            `Click position [${clickResult.point.x.toFixed(
              4
            )}, ${clickResult.point.y.toFixed(4)}]`,
            clickResult
          );
        }
        break;

      default:
        //todo p.s. TOOL_SELECT сюди всерівно потрапляє
        console.log(`cadClick not handled for tool: ${tool}`);
        break;
    }
  };
};

export const onMouseDown = (event, editor) => {
  return dispatch => {
    let { scene, camera, renderer, tool, cadCanvas } = editor;
    if (event.button === 0) {

      //clone object
      if (editor.editMode.clone.active) {
        if (!editor.editMode.clone.point) {
          clonePoint(event, editor)(dispatch);
          cloneObject(editor, editor.editMode.editObject)(dispatch);
        } else if (editor.editMode.clone.cloneObject) {
          saveClone(editor.editMode.clone.cloneObject)(dispatch);
        }
      }

      //move object
      if (editor.editMode.move.active && !editor.editMode.move.point) {
        moveObjectPoint(event, editor)(dispatch);
      }

      switch (tool) {
        case TOOL_NEW_CURVE: {
          editor.editMode.isNewCurve = true;
          if (editor.editMode.isNewCurve) {
            if (!editor.editMode.newCurveCenter) {
              centerPoint(event, editor)(dispatch);
            } else if (!editor.editMode.thetaStart) {
              thetaStart(editor)(dispatch);
            } else if (!editor.editMode.thetaLength) {
              saveNewCurve(editor)(dispatch);
            }
          }
        }
          break;

        case TOOL_POINT: {
          // todo розібрати що тут твориться обєднати з функціоналом кадкдік
          if (editor.editMode.isEdit) {
            // do edit here
            if (editor.activeEntities.length) {
              if (!editor.editMode.activeLine.length) {
                editor.editMode.activeLine = editor.activeEntities;
              }
              selectPoint(
                editor.editMode.activeLine,
                event,
                editor
              )(dispatch);
            }
          }
        }
          break;

        case TOOL_MEASUREMENT: {
          if (editor.options.selectMode === MEASUREMENT_POINT) {
            pointSelect(event, editor)(dispatch);
          } else if (editor.options.selectMode === MEASUREMENT_LINE) {
            if (
              editor.measurement.line.first &&
              editor.measurement.line.second
            ) {
              eraseLine()(dispatch);
            } else {
              !editor.measurement.line.first
                ? lineFirstPoint(event, editor)(dispatch)
                : lineSecondPoint(
                event,
                editor,
                editor.measurement.line.first
                )(dispatch);
            }
          } else if (editor.options.selectMode === MEASUREMENT_RADIAL) {
            radialSelectLine(editor.activeEntities[0])(dispatch);
          } else if (editor.options.selectMode === MEASUREMENT_ANGLE) {
            if (
              editor.measurement.angle.firstLine &&
              editor.measurement.angle.secondLine
            ) {
              eraseAngle()(dispatch);
            } else {
              !editor.measurement.angle.firstLine
                ? angleSelectFirstLine(editor.activeEntities[0])(dispatch)
                : angleSelectSecondLine(
                editor.measurement.angle.firstLine,
                editor.activeEntities[0]
                )(dispatch);
            }
          }
        }
          break;

        case TOOL_SELECT: {
          selectionBegin(event, editor)(dispatch);
        }
          break;

        case TOOL_LINE: {
          if (editor.options.selectMode === LINE_TWO_POINT) {
            console.log(LINE_TWO_POINT, 'mouse down');
            !editor.editMode.newLineFirst
              ? firstPoint(event, editor)(dispatch)
              : saveNewLine(editor)(dispatch);
          } else if (editor.options.selectMode === LINE_PARALLEL) {
            if (!editor.line.parallel.baseLine) {
              parallelLineSelect(editor.activeEntities[0])(dispatch);
            } else if (!editor.line.parallel.firstPoint) {
              parallelLineFirstPointSelect(
                event,
                editor,
                editor.line.parallel.baseLine
              )(dispatch);
            } else {
              parallelLineSecondPointSelect(event, editor)(dispatch);
            }
          } else if (editor.options.selectMode === LINE_PERPENDICULAR) {
            if (!editor.line.perpendicular.baseLine) {
              perpendicularLineSelect(editor.activeEntities[0])(dispatch);
            } else if (!editor.line.perpendicular.firstPoint) {
              perpendicularFirstPointSelect(event, editor)(dispatch);
            } else {
              perpendicularSecondPointSelect(event, editor)(dispatch);
            }
          } else if (editor.options.selectMode === LINE_TANGENT_TO_ARC) {
            if (!editor.line.tangent.baseArc) {
              tangentBaseArcSelect(editor.activeEntities[0])(dispatch);
            } else {
              tangentLineEnd(event, editor)(dispatch);
            }
          }
        }
          break;

        case TOOL_COPY_PASTE: {
          copyPaste(editor);
        }
          break;

        case TOOL_BORDER_RADIUS: {
          if (editor.editMode.isEdit) {
            if (editor.activeEntities.length === 2) {
              let line0 = editor.activeEntities[0].geometry;
              let line1 = editor.activeEntities[1].geometry;
              if (line0.type === 'Geometry' && line1.type === 'Geometry') {
                if ((line0.vertices[0].x === line1.vertices[0].x &&
                  line0.vertices[0].y === line1.vertices[0].y) ||
                  (line0.vertices[0].x === line1.vertices[1].x &&
                    line0.vertices[0].y === line1.vertices[1].y) ||
                  (line0.vertices[1].x === line1.vertices[0].x &&
                    line0.vertices[1].y === line1.vertices[0].y) ||
                  (line0.vertices[1].x === line1.vertices[1].x &&
                    line0.vertices[1].y === line1.vertices[1].y)) {
                  let parent = editor.activeEntities[0].parent;
                  let helpLayer = scene.getObjectByName('HelpLayer');
                  let pointCurveCenter = helpLayer.getObjectByName('pointCurveCenter');

                  helpLayerService.selectCenterPoint(editor);
                  let curveParam = {
                    newCurveCenter: pointCurveCenter.position,
                    thetaStart: circleIntersectionAngle(
                      pointCurveCenter.userData.A,
                      pointCurveCenter.position
                    ),
                    thetaLength: 2 * Math.acos(pointCurveCenter.userData.EcenterAC /
                      pointCurveCenter.userData.radius),
                    radius: pointCurveCenter.userData.radius //????
                  };

                  // todo зашліфувати, убрати лишнє
                  let materialLine = new THREE.LineBasicMaterial({ color: 0x00ff00 });

                  let changedGeometry = {
                    radius: curveParam.radius,
                    thetaStart: curveParam.thetaStart,
                    thetaLength: curveParam.thetaLength
                  };

                  let copyCircleGeometry = changeArcGeometry(
                    { 0: 'copy' },
                    changedGeometry
                  );
                  let copyCircle = new THREE.Line(copyCircleGeometry, materialLine);
                  copyCircle.position.x = curveParam.newCurveCenter.x;
                  copyCircle.position.y = curveParam.newCurveCenter.y;

                  let pointEnd = {
                    x: copyCircle.position.x +
                      copyCircle.geometry.vertices[copyCircle.geometry.vertices.length - 1].x,
                    y: copyCircle.position.y +
                      copyCircle.geometry.vertices[copyCircle.geometry.vertices.length - 1].y
                  };
                  let pointStart = {
                    x: copyCircle.position.x +
                      copyCircle.geometry.vertices[0].x,
                    y: copyCircle.position.y +
                      copyCircle.geometry.vertices[0].y
                  };
                  let endA = helpLayerService.lengthLine(pointCurveCenter.userData.A, pointEnd);
                  let startA = helpLayerService.lengthLine(pointCurveCenter.userData.A, pointStart);
                  let endC = helpLayerService.lengthLine(pointCurveCenter.userData.C, pointEnd);
                  let startC = helpLayerService.lengthLine(pointCurveCenter.userData.C, pointStart);

                  if (!(startA < 1e-3 && endC < 1e-3) || (endA < 1e-3 && startC < 1e-3)) {

                    changedGeometry = {
                      radius: curveParam.radius,
                      thetaStart: circleIntersectionAngle(
                        pointCurveCenter.userData.C,
                        pointCurveCenter.position),
                      thetaLength: curveParam.thetaLength
                    };
                    copyCircleGeometry = changeArcGeometry(
                      { 0: 'copy' },
                      changedGeometry
                    );
                    copyCircle = new THREE.Line(copyCircleGeometry, materialLine);
                    copyCircle.position.x = curveParam.newCurveCenter.x;
                    copyCircle.position.y = curveParam.newCurveCenter.y;
                    // debugger;
                  }

                  if (parent.children.length) {
                    copyCircle.userData.originalColor =
                      parent.children[0].userData.originalColor;
                  } else {
                    copyCircle.userData.originalColor = 0x808000;
                  }
                  parent.add(copyCircle);

                  editor.scene.getObjectByName('HelpLayer').children = [];
                  cadCanvas.render();

                  renderer.render(scene, camera);
                  return;
                }
              }
            }

            let activeEntities = facetBorderRadiusClick (editor, event);
            dispatch({
              type: CAD_DO_SELECTION,
              payload: {
                activeEntities
              }
            });

            if (editor.activeEntities.length === 2) {
              let line0 = editor.activeEntities[0].geometry;
              let line1 = editor.activeEntities[1].geometry;
              if (line0.type === 'Geometry' && line1.type === 'Geometry') {
                if ((line0.vertices[0].x === line1.vertices[0].x &&
                  line0.vertices[0].y === line1.vertices[0].y) ||
                  (line0.vertices[0].x === line1.vertices[1].x &&
                    line0.vertices[0].y === line1.vertices[1].y) ||
                  (line0.vertices[1].x === line1.vertices[0].x &&
                    line0.vertices[1].y === line1.vertices[0].y) ||
                  (line0.vertices[1].x === line1.vertices[1].x &&
                    line0.vertices[1].y === line1.vertices[1].y)) {
                  helpLayerService.lengthNewLine(editor, event);
                  renderer.render(scene, camera);
                }
              }
            }
          }
        }
          break;
        case TOOL_FACET: {
          if (editor.editMode.isEdit) {
            if (editor.activeEntities.length === 2) {
              let line0 = editor.activeEntities[0].geometry;
              let line1 = editor.activeEntities[1].geometry;
              if (line0.type === 'Geometry' && line1.type === 'Geometry') {
                if ((line0.vertices[0].x === line1.vertices[0].x &&
                  line0.vertices[0].y === line1.vertices[0].y) ||
                  (line0.vertices[0].x === line1.vertices[1].x &&
                    line0.vertices[0].y === line1.vertices[1].y) ||
                  (line0.vertices[1].x === line1.vertices[0].x &&
                    line0.vertices[1].y === line1.vertices[0].y) ||
                  (line0.vertices[1].x === line1.vertices[1].x &&
                    line0.vertices[1].y === line1.vertices[1].y)) {


                  let clickResult = sceneService.onClick(event, scene, camera);
                  let helpLayer = scene.getObjectByName('HelpLayer');
                  let pointInLine0 = helpLayer.getObjectByName('pointInLine0');
                  let pointInLine1 = helpLayer.getObjectByName('pointInLine1');

                  let length0 = helpLayerService.lengthLine(clickResult.point, pointInLine0.position);
                  let length1 = helpLayerService.lengthLine(clickResult.point, pointInLine1.position);

                  if (!pointInLine1.userData.fix) {
                    if (length1 > length0 && !pointInLine0.userData.fix) {
                      pointInLine0.userData.fix = true;
                    } else {
                      pointInLine1.userData.fix = true;
                    }
                  } else if (!pointInLine0.userData.fix) {
                    pointInLine0.userData.fix = true;
                  }

                  if (pointInLine0.userData.fix && pointInLine1.userData.fix) {
                    // debugger;

                    let parent = editor.activeEntities[0].parent;
                    // debugger;
                    let lineParameters = {
                      0: {
                        x: pointInLine0.position.x,
                        y: pointInLine0.position.y
                      },
                      1: {
                        x: pointInLine1.position.x,
                        y: pointInLine1.position.y
                      }
                    };
                    const newFacetLine = createLine(
                      lineParameters[0],
                      lineParameters[1]
                    );
                    if (parent.children.length) {
                      newFacetLine.userData.originalColor =
                        parent.children[0].userData.originalColor;
                    } else {
                      newFacetLine.userData.originalColor = 0x808000;
                    }
                    parent.add(newFacetLine);
                    
                    if (line0.vertices[0].x === line1.vertices[0].x &&
                      line0.vertices[0].y === line1.vertices[0].y) {
                      changeGeometry([editor.activeEntities[0]], [0], pointInLine0.position, scene, editor);
                      changeGeometry([editor.activeEntities[1]], [0], pointInLine1.position, scene, editor);
                    } else if (line0.vertices[0].x === line1.vertices[1].x &&
                      line0.vertices[0].y === line1.vertices[1].y) {
                      changeGeometry([editor.activeEntities[0]], [0], pointInLine0.position, scene, editor);
                      changeGeometry([editor.activeEntities[1]], [1], pointInLine1.position, scene, editor);
                    } else if (line0.vertices[1].x === line1.vertices[0].x &&
                      line0.vertices[1].y === line1.vertices[0].y) {
                      changeGeometry([editor.activeEntities[0]], [1], pointInLine0.position, scene, editor);
                      changeGeometry([editor.activeEntities[1]], [0], pointInLine1.position, scene, editor);
                    } else if (line0.vertices[1].x === line1.vertices[1].x &&
                      line0.vertices[1].y === line1.vertices[1].y) {
                      changeGeometry([editor.activeEntities[0]], [1], pointInLine0.position, scene, editor);
                      changeGeometry([editor.activeEntities[1]], [1], pointInLine1.position, scene, editor);
                    }
                    editor.scene.getObjectByName('HelpLayer').children = [];
                    cadCanvas.render();
                    renderer.render(scene, camera);
                  }
                  return;
                }
              }
            }
            let activeEntities = facetBorderRadiusClick(editor, event);
            dispatch({
              type: CAD_DO_SELECTION,
              payload: {
                activeEntities
              }
            });
          // }
          }
        }
          break;
        default:
          console.log(`cadonMouseDown not handled for tool: ${tool}`);
          break;
      }
    }
  };
};

export const onMouseUp = (event, editor) => {
  return dispatch => {
    let { tool } = editor;

    //move object
    if (editor.editMode.move.active && editor.editMode.move.point) {
      disableMovePoint(editor.editMode.move.moveObject)(dispatch);
    }

    switch (tool) {
      case TOOL_SELECT:
        {
          // end select
          if (editor.selection.active) {
            let drawRectangle = selectionEnd(event, editor)(dispatch);
            let selectResult = sceneService.selectInFrustum(
              drawRectangle,
              editor.scene
            );

            let activeEntities = sceneService.doSelection(selectResult, editor);
            dispatch({
              type: CAD_DO_SELECTION,
              payload: {
                activeEntities
              }
            });

            let { scene, camera, renderer } = editor;

            //TODO викинути непотрібне, залишити важливе

            renderer.render(scene, camera);
            // debugger;
            if (selectResult.length !== 0) {
              if (editor.editMode.isEdit) {
                const rPoint = getScale(camera);
                addHelpPoints(editor, scene, rPoint);
              }
              // dispatch({
              //   type: CAD_EDITMODE_SET_ACTIVE_LINE,
              //   payload: {
              //     activeLine: editor.activeEntities[0]
              //   }
              // });

              renderer.render(scene, camera);
              // }
            }
          }
        }
        break;
      case TOOL_POINT:
        {
          if (
            event.button === 0 &&
            editor.editMode.isEdit &&
            editor.editMode.activeLine.length
          ) {
            // do edit here
            savePoint(editor.editMode.selectPointIndex)(dispatch);
          }
        }
        break;
      default:
        console.log(`cadonMouseUp not handled for tool: ${tool}`);
        break;
    }
  };
};

export const onMouseMove = (event, editor) => {
  return dispatch => {
    let { scene, camera, renderer, tool, cadCanvas } = editor;

    //clone object
    if (editor.editMode.clone.active) {
      selectClonePoint(event, editor)(dispatch);
      if (editor.editMode.clone.point && editor.editMode.clone.cloneObject) {
        setClone(event, editor)(dispatch);
      }
    }
    //move object
    if (editor.editMode.move.active) {
      selectMovePoint(event, editor)(dispatch);
      if (editor.editMode.move.point && editor.editMode.move.moveObject) {
        moveObject(event, editor)(dispatch);
      }
    }

    switch (tool) {
      case TOOL_SELECT:
        {
          if (editor.selection.active) {
            selectionUpdate(event, editor)(dispatch);
          }
        }
        break;

      case TOOL_POINT:
        {
          if (
            event.button === 0 &&
            editor.editMode.isEdit &&
            (editor.editMode.activeLine.id || editor.editMode.activeLine[0]) &&
            (editor.editMode.selectPointIndex ||
              editor.editMode.selectPointIndex === 0)
          ) {
            movePoint(
              editor.editMode.activeLine,
              editor.editMode.selectPointIndex,
              event,
              editor
            )(dispatch);
          }
        }
        break;

      case TOOL_MEASUREMENT:
        {
          // if (editor.tool === TOOL_MEASUREMENT) {
          if (editor.options.selectMode === MEASUREMENT_POINT) {
            pointInfo(event, editor)(dispatch);
          } else if (editor.options.selectMode === MEASUREMENT_LINE) {
            if (!editor.measurement.line.first) {
              lineFirstInfo(event, editor)(dispatch);
            } else if (!editor.measurement.line.second) {
              lineSecondInfo(event, editor)(dispatch);
            }
          } else if (editor.options.selectMode === MEASUREMENT_RADIAL) {
            radialInfo(event, editor)(dispatch);
          } else if (editor.options.selectMode === MEASUREMENT_ANGLE) {
            if (!editor.measurement.angle.firstLine) {
              angleFirstInfo(event, editor)(dispatch);
            } else if (!editor.measurement.angle.secondLine) {
              angleSecondInfo(
                event,
                editor,
                editor.measurement.angle.firstLine
              )(dispatch);
            }
          }
          // }
        }
        break;

      case TOOL_LINE:
        {
          let parent = editor.editMode.isEdit
            ? editor.editMode.editObject
            : cadCanvas.getNewLineLayer();
          if (!parent || parent.metadata) {
            parent = editor.scene.getObjectByName('Layers').children[0];
            dispatch({
              type: PANEL_LAYERS_TOGGLE,
              payload: {
                activeLayer: parent
              }
            });
          }

          // todo розібратись з куском кода вище і нище, розібратись з новими лініями які паралельні і перпендикулярні
          // if (editor.tool === TOOL_LINE) {
          switch (editor.options.selectMode) {
            case LINE_TWO_POINT:
              {

                !editor.editMode.newLineFirst
                  ? startNewLine(event, editor)(dispatch)
                  : drawLine(event, editor, parent)(dispatch);
              }
              break;
            case LINE_PARALLEL:
              if (!editor.line.parallel.baseLine) {
                parallelLine(event, editor)(dispatch);
              } else if (!editor.line.parallel.firstPoint) {
                parallelLineFirstPoint(event, editor)(dispatch);
              } else {
                parallelLineSecondPoint(
                  event,
                  editor,
                  editor.line.parallel.baseLine,
                  editor.line.parallel.firstPoint,
                  editor.line.parallel.distance,
                  parent
                )(dispatch);
              }

              break;
            case LINE_PERPENDICULAR:
              if (!editor.line.perpendicular.baseLine) {
                perpendicularBaseLine(event, editor)(dispatch);
              } else if (!editor.line.perpendicular.firstPoint) {
                perpendicularFirstPoint(event, editor)(dispatch);
              } else {
                perpendicularDraw(
                  event,
                  editor,
                  editor.line.perpendicular.baseLine,
                  editor.line.perpendicular.firstPoint,
                  parent
                )(dispatch);
              }

              break;
            case LINE_TANGENT_TO_ARC:
              if (!editor.line.tangent.baseArc) {
                tangentBaseArc(event, editor)(dispatch);
              } else {
                tangentLineDraw(
                  event,
                  editor,
                  editor.line.tangent.baseArc,
                  parent
                )(dispatch);
              }

              break;
            default: {
              console.error(
                `Unknown editor.options.selectMode = ${editor.options.selectMode}`
              );
            }
          }
          // }
        }
        break;

      case TOOL_NEW_CURVE:
        {
          // todo добавити слой parent у випадку isEdit - false
          let parent = editor.editMode.isEdit
            ? editor.editMode.editObject
            : editor.activeLayer;
          if (!parent || parent.metadata) {
            parent = editor.scene.getObjectByName('Layers').children[0];
            dispatch({
              type: PANEL_LAYERS_TOGGLE,
              payload: {
                activeLayer: parent
              }
            });
          }
          if (!editor.editMode.newCurveCenter) {
            centerCurve(event, editor)(dispatch);
          } else if (!editor.editMode.thetaStart) {
            radius(event, editor)(dispatch);
          } else if (!editor.editMode.thetaLength) {
            thetaLength(event, editor, parent)(dispatch);
          }
        }
        break;

      case TOOL_BORDER_RADIUS:{
        if (editor.editMode.isEdit) {
          movePointInfo(event, 'Сhoose a corner')(dispatch);
          if (editor.activeEntities.length === 2) {
            let line0 = editor.activeEntities[0].geometry;
            let line1 = editor.activeEntities[1].geometry;
            if (line0.type === 'Geometry' && line1.type === 'Geometry') {
              if ((line0.vertices[0].x === line1.vertices[0].x && line0.vertices[0].y === line1.vertices[0].y) ||
                (line0.vertices[1].x === line1.vertices[0].x && line0.vertices[1].y === line1.vertices[0].y) ||
                (line0.vertices[1].x === line1.vertices[1].x && line0.vertices[1].y === line1.vertices[1].y) ||
                (line0.vertices[0].x === line1.vertices[1].x && line0.vertices[0].y === line1.vertices[1].y)
              ) {
                let center = helpLayerService.lengthNewLine (editor, event);
                renderer.render(scene, camera);
                let radius = Math.floor(helpLayerService.lengthLine(center.userData.B, center.position) * 100) / 100;
                movePointInfo(event, 'Radius:   ' + radius.toString() )(dispatch);
              }
            }
           }
        }
      }
        break;

      case TOOL_FACET:{
        if (editor.editMode.isEdit) {
          if (editor.activeEntities.length === 2) {
            let line0 = editor.activeEntities[0].geometry;
            let line1 = editor.activeEntities[1].geometry;
            if (line0.type === 'Geometry' && line1.type === 'Geometry') {
              if ((line0.vertices[0].x === line1.vertices[0].x && line0.vertices[0].y === line1.vertices[0].y) ||
                (line0.vertices[1].x === line1.vertices[0].x && line0.vertices[1].y === line1.vertices[0].y) ||
                (line0.vertices[1].x === line1.vertices[1].x && line0.vertices[1].y === line1.vertices[1].y) ||
                (line0.vertices[0].x === line1.vertices[1].x && line0.vertices[0].y === line1.vertices[1].y)
              ) {
                let {camera, scene} = editor;
                // debugger;
                let clickResult = sceneService.onClick(event, scene, camera);
                let helpLayer = scene.getObjectByName('HelpLayer');
                let pointInLine0 = helpLayer.getObjectByName('pointInLine0');
                let pointInLine1 = helpLayer.getObjectByName('pointInLine1');
                // debugger;
                if (!pointInLine0){
                  pointInLine0 = helpLayerService.positionInLine (editor, line0.vertices, clickResult.point);
                  pointInLine1 = helpLayerService.positionInLine (editor, line1.vertices, clickResult.point);
                  pointInLine0.name = 'pointInLine0';
                  pointInLine1.name = 'pointInLine1';
                  helpLayer.add(pointInLine0);
                  helpLayer.add(pointInLine1);
                } else {
                  if (!pointInLine0.userData.fix) {
                    helpLayerService.positionInLine(editor, line0.vertices, clickResult.point, pointInLine0);
                  }
                  if (!pointInLine1.userData.fix) {
                    helpLayerService.positionInLine(editor, line1.vertices, clickResult.point, pointInLine1);
                  }
                }

                let length0 = Math.floor(helpLayerService.lengthLine(clickResult.point, pointInLine0.position) * 100) / 100;
                let length1 = Math.floor(helpLayerService.lengthLine(clickResult.point, pointInLine1.position) * 100) / 100;
                if (!pointInLine1.userData.fix) {
                  if (length1 > length0 && !pointInLine0.userData.fix) {
                    movePointInfo(event, 'line length:   ' + length1.toString())(dispatch);
                  } else {
                    movePointInfo(event, 'line length:   ' + length0.toString())(dispatch);
                  }
                } else if (!pointInLine0.userData.fix) {
                  movePointInfo(event, 'line length:   ' + length1.toString())(dispatch);
                }

                renderer.render(scene, camera);
                return;
              }
            }
          }
            movePointInfo(event, 'Сhoose a corner')(dispatch);
        }


      }
        break;

      default:
        console.log(`cadonMouseMove not handled for tool: ${tool}`);
        break;
    }
  };
};

export const onDoubleClick = (event, editor) => {
  return dispatch => {
    let { scene, camera, tool } = editor;

    // console.warn('Double click: TODO recursive select entities')

    switch (tool) {
      case TOOL_POINT:
        if (!editor.editMode.isEdit) {
          let clickResult = sceneService.onClick(event, scene, camera);
          console.log(
            `DOUBLE Click position [${clickResult.point.x.toFixed(
              4
            )}, ${clickResult.point.y.toFixed(4)}]`,
            clickResult
          );

          if (clickResult.activeEntities.length) {
            console.log('has active entities');
            // check if entity belongs to object
            let activeEntities;
            if (clickResult.activeEntities[0].userData.belongsToObject) {
              // completely select object
              // $scope.editor.activeEntities = $scope.editor.activeEntities[0].parent.children;
              activeEntities = clickResult.activeEntities[0].parent.children;
            } else {
              activeEntities = sceneService.recursiveSelect(
                clickResult.activeEntities[0],
                editor
              );
            }

            activeEntities = sceneService.doSelection(activeEntities, editor);
            dispatch({
              type: CAD_DO_SELECTION,
              payload: {
                activeEntities
              }
            });
          }
        }

        break;
      default:
        console.log(`cadDoubleClick not handled for tool: ${tool}`);
        break;
    }
  };
};

export const parseDxf = dxf => {
  let parser = new DxfParser();
  return dispatch =>
    dispatch({
      type: CAD_PARSE_DXF,
      payload: {
        parsedData: parser.parseSync(dxf)
      }
    });
};

export const toggleChanged = isChanged => {
  return dispatch =>
    dispatch({
      type: CAD_IS_CHANGED,
      payload: {
        isChanged: !isChanged
      }
    });
};

export const copyClick = editor => {
  // let lastMode = editor.options.selectMode;
  // editor.options.selectMode = "COPY";
  copyPaste(editor, 'COPY');
};

export const pasteClick = editor => {
  // editor.options.selectMode = "PASTE";
  copyPaste(editor, 'PASTE');
};

let facetBorderRadiusClick = (editor, event) => {
  let { scene, camera } = editor;
  let clickResult = sceneService.onClick(event, scene, camera);
  console.log(
    `Click position [${clickResult.point.x.toFixed(
      4
    )}, ${clickResult.point.y.toFixed(4)}]`,
    clickResult
  );
  let payload = {
    ...clickResult,
    object: null
  };
  let selectResult = clickResult.activeEntities;
  if (selectResult.length) {
    if (selectResult[0].userData.belongsToObject) {
      payload.object = selectResult[0].parent;
    }
  }
  return sceneService.doSelection(selectResult, editor);
};

let copyPaste = (editor, copyPasteMode) => {
  let { renderer, scene, cadCanvas, camera } = editor;
  // todo place - місце для зберігання copyEntities, треба подумати де зберігати
  let place = camera;
  if (!place.copyEntities) {
    place.copyEntities = [];
  }
  if (copyPasteMode === 'COPY') {
    place.copyEntities = [];

    editor.activeEntities.forEach((line, i) => {
      if (line.geometry.type === 'Geometry') {
        place.copyEntities[i] = {
          geometry: {
            type: line.geometry.type,
            vertices: [
              new THREE.Vector3().copy(line.geometry.vertices[0]),
              new THREE.Vector3().copy(line.geometry.vertices[1])
            ]
          }
        };
      } else if (line.geometry.type === 'CircleGeometry') {
        console.log(line.geometry);
        place.copyEntities[i] = {
          geometry: {
            type: line.geometry.type,
            parameters: {
              radius: line.geometry.parameters.radius,
              thetaStart: line.geometry.parameters.thetaStart,
              thetaLength: line.geometry.parameters.thetaLength
            }
          },
          position: new THREE.Vector3().copy(line.position)
        };
      }
    });
    place.copyEntities[
      place.copyEntities.length
    ] = GeometryUtils.getBoundingBox(editor.activeEntities);
  } else if (copyPasteMode === 'PASTE') {
    if (place.copyEntities.length) {
      let copyEntitiesBoundingBox =
        place.copyEntities[place.copyEntities.length - 1];
      let changeGeometry = {
        x: copyEntitiesBoundingBox.center.x - editor.camera.position.x,
        y: copyEntitiesBoundingBox.center.y - editor.camera.position.y
      };
      let parent = !editor.editMode.isEdit
        ? cadCanvas.getNewLineLayer()
        : editor.editMode.editObject;
      // todo де зберігаються нові лінії якщо без режиму змін об'єкту
      let materialLine = new THREE.LineBasicMaterial({ color: 0x00ff00 });
      place.copyEntities.forEach(line => {
        if (line.geometry) {
          if (line.geometry.type === 'Geometry') {
            let changeLineParameters = {
              0: {
                x: line.geometry.vertices[0].x - changeGeometry.x,
                y: line.geometry.vertices[0].y - changeGeometry.y
              },
              1: {
                x: line.geometry.vertices[1].x - changeGeometry.x,
                y: line.geometry.vertices[1].y - changeGeometry.y
              }
            };
            const copyLine = createLine(
              changeLineParameters[0],
              changeLineParameters[1]
            );
            if (parent.children.length) {
              copyLine.userData.originalColor =
                parent.children[0].userData.originalColor;
            } else {
              copyLine.userData.originalColor = 0x808000;
            }
            parent.add(copyLine);
          } else if (line.geometry.type === 'CircleGeometry') {
            let changedGeometry = {
              radius: line.geometry.parameters.radius,
              thetaStart: line.geometry.parameters.thetaStart,
              thetaLength: line.geometry.parameters.thetaLength
            };

            let copyCircleGeometry = changeArcGeometry(
              { 0: 'copy' },
              changedGeometry
            );
            let copyCircle = new THREE.Line(copyCircleGeometry, materialLine);
            copyCircle.position.x = line.position.x - changeGeometry.x;
            copyCircle.position.y = line.position.y - changeGeometry.y;
            if (parent.children.length) {
              copyCircle.userData.originalColor =
                parent.children[0].userData.originalColor;
            } else {
              copyCircle.userData.originalColor = 0x808000;
            }
            parent.add(copyCircle);
          }
        }
      });

      renderer.render(scene, camera);
    }
  }
};
