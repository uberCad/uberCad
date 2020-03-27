import DxfParser from 'dxf-parser';
import { Viewer } from './../services/dxfService';
import sceneService from './../services/sceneService';
import {
  TOOL_COPY_PASTE,
  TOOL_LINE,
  TOOL_MEASUREMENT,
  TOOL_NEW_CURVE,
  TOOL_POINT, TOOL_REDO,
  TOOL_SELECT, TOOL_UNDO
} from '../components/Toolbar/toolbarComponent';
import { addHelpPoints, getScale, unselectLine, isPoint, changeArcGeometry } from '../services/editObject';
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
//   // let objectsDraft = [];
//   // // let idsToFind = [319];
//   let idsToFind = [65];
//   let result = {};
//
//   let iterator = sceneService.entityIterator(editor.scene);
//   let entity = iterator.next();
//   while (!entity.done) {
//     if (idsToFind.indexOf(entity.value.id) >= 0) {
//       result[entity.value.id] = entity.value;
//     }
//     entity = iterator.next();
//   }
//
//   let neighbours = sceneService.getEntityNeighbours(
//     result[idsToFind[0]],
//     editor
//   );
//
//   console.log('neighbours', neighbours);
//
//   let variants = GeometryUtils.getPathVariants(neighbours);
//
//   variants = GeometryUtils.filterSelfIntersectingPaths(variants);
//
//   console.log('variants', variants);
//
//   let minArea = Infinity;
//   let variantWithSmallestArea = [];
//   variants.forEach(variant => {
//     let vertices = GeometryUtils.getSerialVerticesFromOrderedEntities(variant);
//     let area = GeometryUtils.pathArea(vertices);
//     // let vertices = GeometryUtils.getSerialVertices(variant);
//     console.log('area', area, variant);
//     consoleUtils.previewPathInConsole(vertices);
//     if (area < minArea) {
//       variantWithSmallestArea = variant;
//       minArea = area;
//     }
//   });
//   let object = sceneService.groupEntities(
//     editor,
//     variantWithSmallestArea,
//     'test'
//   );
//
//   //
//   //
//   //
//   //
//   //
//   //
//   //
//   //
//   //
//   //
//   //
//   // // sceneService.highlightEntities(editor, Object.values(result));
//   // sceneService.highlightEntities(editor, variantWithSmallestArea);
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

    // todo тут мав би бути лісенер зміни  editor.options щоб реагувати на нажаття кнопки "копировать" і "вставить" з
    // todo place - місце для зберігання copyEntities, треба подумати де зберігати
    // let place = camera;
    //
    // if (!place.copyEntities) {
    //   place.copyEntities = [];
    // }
    // // Object.observe ( editor.options,()=> {
    // let controlsCopy = editor.options.getControls();
    // controlsCopy.addEventListener('change', () => {
    //
    //   editor.options.selectMode.getControls().addEventListener('change', () => {
    //     debugger;
    //     if (editor.options.selectMode === "COPY" || editor.options.selectMode === "PASTE") {
    //       debugger;
    //       copyPaste(editor, place, event);
    //     }
    //   });
    // });
    // export const copyChecker = () => {
    //   copyPaste(editor, place, event);
    // };

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
                // if (editor.editMode.activeLine.id) {
                //   unselectLine(editor.editMode.activeLine, scene);
                // }
                // console.log(editor.editMode.activeLine);

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
                };
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
                  // console.log(helpLayer.children[helpLayer.children.length - 1]);
                  helpLayer.children.forEach(testPoint=>{

                    if (!isSelectPoint){
                      isSelectPoint = isPoint(
                        testPoint.position,
                        testPoint.geometry.parameters.radius,
                        point
                      );
                    }
                  });
                }
                if (!isSelectPoint){
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

      //todo не булоб логічно сюди перенести і інструмент TOOL_SELECT?

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
      case TOOL_LINE:
        {
          // let clickResult = sceneService.onClick(event, scene, camera);
          // console.log(
          //   `Click position [${clickResult.point.x.toFixed(
          //     4
          //   )}, ${clickResult.point.y.toFixed(4)}]`,
          //   clickResult
          // );
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
    let { tool, camera } = editor;
    if (event.button === 0) {
      //new line
      // if (editor.editMode.isNewLine) {
      //   !editor.editMode.newLineFirst
      //     ? firstPoint(event, editor)(dispatch)
      //     : saveNewLine(editor)(dispatch);
      // }
      //new curve
      // if (editor.editMode.isNewCurve) {
      //   debugger;
      //   if (!editor.editMode.newCurveCenter) {
      //     centerPoint(event, editor)(dispatch);
      //   } else if (!editor.editMode.thetaStart) {
      //     thetaStart(editor)(dispatch);
      //   } else if (!editor.editMode.thetaLength) {
      //     saveNewCurve(editor)(dispatch);
      //   }
      // }
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

      // copy paste

      // todo place - місце для зберігання copyEntities, треба подумати де зберігати
      let place = camera;

      if (!place.copyEntities) {
        place.copyEntities = [];
      }

      // todo тут мав би бути лісенер зміни  editor.options щоб реагувати на нажаття кнопки "копировать" і "вставить"
      // console.log(editor.options.selectMode);
      // debugger;
      // Object.observe ( editor.options,()=>{
      // // editor.options.selectMode.getControls().addEventListener('change', () => {
      //   debugger;
      //   if (editor.options.selectMode === "COPY" || editor.options.selectMode === "PASTE"){
      //     debugger;
      //     // copyPaste (editor, place, event);
      //   }
      // });

      // if (tool === "TOOL_UNDO") {
        // if (editor.activeEntities) {
        //   place.copyEntities = editor.activeEntities.slice();
        // } else {
        //   place.copyEntities = [];
        // }
      //
      // } else if (tool === "TOOL_REDO") {
      //   console.log(place.copyEntities);
        // if (place.copyEntities.length) {
        //   let changeGeometry = {};
        //   let copyEntitiesBoundingBox = GeometryUtils.getBoundingBox(place.copyEntities);
        //   console.log(editor.camera);
        //   changeGeometry = {
        //     x: copyEntitiesBoundingBox.center.x - editor.camera.position.x,
        //     y: copyEntitiesBoundingBox.center.y - editor.camera.position.y
        //   };
        //   let parent;
        //   if (!editor.editMode.isEdit) {
        //     parent = cadCanvas.getNewLineLayer();
        //   } else {
        //     // todo де зберігаються нові лінії якщо без режиму змін об'єкту
        //     parent = editor.editMode.editObject;
        //   }
        //
        //   place.copyEntities.forEach(line => {
        //     if (line.geometry.type === "Geometry") {
        //       let copyLines = {
        //         0: {
        //           x: line.geometry.vertices[0].x - changeGeometry.x,
        //           y: line.geometry.vertices[0].y - changeGeometry.y
        //         },
        //         1: {
        //           x: line.geometry.vertices[1].x - changeGeometry.x,
        //           y: line.geometry.vertices[1].y - changeGeometry.y
        //         }
        //       };
        //
        //
        //       startNewLine(event, editor, copyLines[0]);
        //       drawLine(event, editor, parent, copyLines);
        //       saveNewLine(editor)
        //
        //     } else if (line.geometry.type === "CircleGeometry") {
        //       editor.editMode.isNewCurve = true;
        //       let copyLines = {
        //         0: {
        //           x: line.position.x - changeGeometry.x,
        //           y: line.position.y - changeGeometry.y
        //         },
        //         1: {
        //           x: line.userData.helpPoints.pointStart.position.x - changeGeometry.x,
        //           y: line.userData.helpPoints.pointStart.position.y - changeGeometry.y
        //         },
        //         2: {
        //           x: line.userData.helpPoints.pointEnd.position.x - changeGeometry.x,
        //           y: line.userData.helpPoints.pointEnd.position.y - changeGeometry.y
        //         }
        //       };
        //       centerPoint(event, editor, copyLines[0])(dispatch);
        //       radius(event, editor, copyLines[1])(dispatch);
        //       thetaStart(editor)(dispatch);
        //       thetaLength(event, editor, parent, copyLines[2])(dispatch);
        //       saveNewCurve(editor)(dispatch);
        //     }
        //   });
        //   renderer.render(scene, camera);
        // }
      // }

      switch (tool) {
        case TOOL_NEW_CURVE:
          {
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
        case TOOL_POINT:
          {
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
        case TOOL_MEASUREMENT:
          {
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
        case TOOL_SELECT:
          {
            selectionBegin(event, editor)(dispatch);
          }
          break;
        case TOOL_LINE:
          {
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
        case TOOL_COPY_PASTE:
          {
            copyPaste (editor, place, event);
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
    // console.log(event);
    // console.log(editor);
    // debugger;

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
            // console.log(selectResult);
            // debugger;
            // debugger;
            // let activeEntities = sceneService.doSelection(
            //   selectResult,
            //   editor
            // );
            // dispatch({
            //   type: CAD_DO_SELECTION,
            //   payload: {
            //     activeEntities
            //   }
            // });
            // dispatch({
            //   type: CAD_EDITMODE_SET_ACTIVE_LINE,
            //   payload: {
            //     activeLine: editor.activeEntities[0]
            //   }
            // });
            renderer.render(scene, camera);
            // debugger;
            if (selectResult.length !== 0) {
              // debugger;
              // if (selectResult[0].id !== editor.editMode.activeLine[0].id) {
              // debugger;
              // let activeEntities = sceneService.doSelection(
              //   selectResult,
              //   editor
              // );
              // dispatch({
              //   type: CAD_DO_SELECTION,
              //   payload: {
              //     activeEntities
              //   }
              // });
              // debugger;
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
    let { tool } = editor;

    //new Line
    if (editor.editMode.isNewLine) {
      let parent = editor.editMode.editObject;
      if (!parent || parent.metadata) {
        parent = editor.scene.getObjectByName('Layers').children[0];
        dispatch({
          type: PANEL_LAYERS_TOGGLE,
          payload: {
            activeLayer: parent
          }
        });
      }
      !editor.editMode.newLineFirst
        ? startNewLine(event, editor)(dispatch)
        : drawLine(event, editor, parent)(dispatch);
    }
    //new Curve

    // if (editor.editMode.isNewCurve) {
    //   let parent =
    //     editor.tool === TOOL_NEW_CURVE
    //       ? editor.activeLayer
    //       : editor.editMode.editObject;
    //   if (!parent || parent.metadata) {
    //     parent = editor.scene.getObjectByName('Layers').children[0];
    //     dispatch({
    //       type: PANEL_LAYERS_TOGGLE,
    //       payload: {
    //         activeLayer: parent
    //       }
    //     });
    //   }
    // // debugger;
    // //   if (!editor.editMode.newCurveCenter) {
    // //     centerCurve(event, editor)(dispatch);
    // //   } else if (!editor.editMode.thetaStart) {
    // //     radius(event, editor)(dispatch);
    // //   } else if (!editor.editMode.thetaLength) {
    // //     thetaLength(event, editor, parent)(dispatch);
    // //   }
    // }

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
            // do edit here
            console.log(editor);
            console.log(editor.activeEntities);
            // debugger;
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
          // if (editor.tool === TOOL_LINE) {
          switch (editor.options.selectMode) {
            case LINE_TWO_POINT:
              {
                let parent =
                  editor.tool === TOOL_LINE
                    ? editor.activeLayer
                    : editor.editMode.editObject;
                if (!parent || parent.metadata) {
                  parent = editor.scene.getObjectByName('Layers').children[0];
                  dispatch({
                    type: PANEL_LAYERS_TOGGLE,
                    payload: {
                      activeLayer: parent
                    }
                  });
                }
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
                  editor.line.parallel.distance
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
                  editor.line.perpendicular.firstPoint
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
                  editor.line.tangent.baseArc
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
          let parent =
            editor.editMode.isEdit
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


let copyPaste = (editor, place, event) => {
  let { renderer, scene, cadCanvas, camera } = editor;
  if (editor.options.selectMode === "COPY"){
    place.copyEntities = [];

    editor.activeEntities.forEach((line, i) => {
      if (line.geometry.type === "Geometry") {
        place.copyEntities[i] = {
          geometry: {
            type: line.geometry.type,
            vertices: [new THREE.Vector3().copy(line.geometry.vertices[0]),
              new THREE.Vector3().copy(line.geometry.vertices[1])]
          }
        };
      } else if (line.geometry.type === "CircleGeometry") {
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
    place.copyEntities[place.copyEntities.length] = GeometryUtils.getBoundingBox(editor.activeEntities);
  } else if (editor.options.selectMode === "PASTE"){
    if (place.copyEntities.length) {
      let copyEntitiesBoundingBox = place.copyEntities[place.copyEntities.length-1];
      let changeGeometry = {
        x: copyEntitiesBoundingBox.center.x - editor.camera.position.x,
        y: copyEntitiesBoundingBox.center.y - editor.camera.position.y
      };
      let parent;
      if (!editor.editMode.isEdit) {
        parent = cadCanvas.getNewLineLayer();
      } else {
        // todo де зберігаються нові лінії якщо без режиму змін об'єкту
        parent = editor.editMode.editObject;
      }

      place.copyEntities.forEach(line => {
        if (line.geometry) {
          if (line.geometry.type === "Geometry") {
            let copyLines = {
              0: {
                x: line.geometry.vertices[0].x - changeGeometry.x,
                y: line.geometry.vertices[0].y - changeGeometry.y
              },
              1: {
                x: line.geometry.vertices[1].x - changeGeometry.x,
                y: line.geometry.vertices[1].y - changeGeometry.y
              }
            };
            startNewLine(event, editor, copyLines[0]);
            drawLine(event, editor, parent, copyLines);
            saveNewLine(editor)

          } else if (line.geometry.type === "CircleGeometry") {
            let changedGeometry = {
              radius: line.geometry.parameters.radius,
              thetaStart: line.geometry.parameters.thetaStart,
              thetaLength: line.geometry.parameters.thetaLength
            };
            let materialLine = new THREE.LineBasicMaterial({ color: 0x00ff00 });
            let copyCircleGeometry = changeArcGeometry({ 0: "copy" }, changedGeometry);
            let copyCircle = new THREE.Line(copyCircleGeometry, materialLine);
            copyCircle.position.x = line.position.x - changeGeometry.x;
            copyCircle.position.y = line.position.y - changeGeometry.y;
            if (parent.children.length) {
              copyCircle.userData.originalColor = parent.children[0].userData.originalColor;
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

// todo у функцію нижче присобачити dispatch

// let copyLine = (editor, event, lines, parent, changeGeometry) => {
//   // debugger;
//   if (!changeGeometry){
//     changeGeometry = {
//       x: 0,
//       y: 0
//     }
//   }
//   lines.forEach(line => {
//     if (line.geometry) {
//       if (line.geometry.type === "Geometry") {
//         // debugger;
//         let copyLines = {
//           0: {
//             x: line.geometry.vertices[0].x - changeGeometry.x,
//             y: line.geometry.vertices[0].y - changeGeometry.y
//           },
//           1: {
//             x: line.geometry.vertices[1].x - changeGeometry.x,
//             y: line.geometry.vertices[1].y - changeGeometry.y
//           }
//         };
//         startNewLine(event, editor, copyLines[0]);
//         drawLine(event, editor, parent, copyLines);
//         saveNewLine(editor)
//
//       } else if (line.geometry.type === "CircleGeometry") {
//         let changedGeometry = {
//           radius: line.geometry.parameters.radius,
//           thetaStart: line.geometry.parameters.thetaStart,
//           thetaLength: line.geometry.parameters.thetaLength
//         };
//         let materialLine = new THREE.LineBasicMaterial({ color: 0x00ff00 });
//         let copyCircleGeometry = changeArcGeometry({ 0: "copy" }, changedGeometry);
//         let copyCircle = new THREE.Line(copyCircleGeometry, materialLine);
//         copyCircle.position.x = line.position.x - changeGeometry.x;
//         copyCircle.position.y = line.position.y - changeGeometry.y;
//         if (parent.children.length) {
//           copyCircle.userData.originalColor = parent.children[0].userData.originalColor;
//         } else {
//           copyCircle.userData.originalColor = 0x808000;
//         }
//         parent.add(copyCircle);
//       }
//     }
//   });
//
// };

// let cadToolUndoRedoTest = (editor, event) => {
//   let { tool, renderer, scene, cadCanvas, camera } = editor;
//   let place = camera;
//   if (!place.copyEntities) {
//     place.copyEntities = [];
//   }
//   if (tool === "TOOL_UNDO") {
//     // copy
//     // debugger;
//     // console.log (editor);
//     // editor
//     if (editor.activeEntities) {
//       // copyEntities = [];
//       place.copyEntities = editor.activeEntities.slice();
//     } else {
//       place.copyEntities = [];
//     }
//
//   } else if (tool === "TOOL_REDO") {
//     // paste
//     console.log(place.copyEntities);
//     // debugger;
//
//     if (place.copyEntities.length) {
//       let changeGeometry = {};
//       // if (place.copyEntities.length > 1) {
//       let copyEntitiesBoundingBox = GeometryUtils.getBoundingBox(place.copyEntities);
//       console.log(editor.camera);
//       changeGeometry = {
//         x: copyEntitiesBoundingBox.center.x - editor.camera.position.x,
//         y: copyEntitiesBoundingBox.center.y - editor.camera.position.y
//       };
//       // debugger;
//       // } else {
//       //   debugger;
//       //   if (place.copyEntities[0].geometry.type === "Geometry") {
//       //     changeGeometry = {
//       //       x: (place.copyEntities[0].geometry.vertices[0].x
//       //       + place.copyEntities[0].geometry.vertices[1].x)/2
//       // - editor.camera.position.x,
//       //       y: (place.copyEntities[0].geometry.vertices[0].y
//       //         + place.copyEntities[0].geometry.vertices[1].y)/2
//       // - editor.camera.position.y
//       //     }
//       //   } else if (place.copyEntities[0].geometry.type === "circleGeometry"){
//       //     changeGeometry = {
//       //       // x: (place.copyEntities[0].geometry.vertices[0].x
//       //       //   + place.copyEntities[0].geometry.vertices[1].x)/2,
//       //       // y: (place.copyEntities[0].geometry.vertices[0].y
//       //       //   + place.copyEntities[0].geometry.vertices[1].y)/2
//       //     }
//       //   }
//       // }
//       // let copyLines = [];
//       let parent;
//       if (!editor.editMode.isEdit) {
//         parent = cadCanvas.getNewLineLayer();
//       } else {
//         // todo де зберігаються нові лінії якщо без режиму змін об'єкту
//         parent = editor.editMode.editObject;
//       }
//
//       place.copyEntities.forEach(line => {
//         // debugger;
//         if (line.geometry.type === "Geometry") {
//           let copyLines = {
//             0: {
//               x: line.geometry.vertices[0].x - changeGeometry.x,
//               y: line.geometry.vertices[0].y - changeGeometry.y
//             },
//             1: {
//               x: line.geometry.vertices[1].x - changeGeometry.x,
//               y: line.geometry.vertices[1].y - changeGeometry.y
//             }
//           };
//
//
//           // debugger;
//           startNewLine(event, editor, copyLines[0]);
//           // debugger;
//           drawLine(event, editor, parent, copyLines);
//           saveNewLine(editor)
//
//           // copyLines[i] = line.clone();
//           // copyLines[i].userData.helpPoints = {};
//           // debugger;
//           // copyLines[i].geometry.vertices[0].x = line.geometry.vertices[0].x - changeGeometry.x;
//           // copyLines[i].geometry.vertices[1].x = line.geometry.vertices[1].x - changeGeometry.x;
//           // copyLines[i].geometry.vertices[0].y = line.geometry.vertices[0].y - changeGeometry.y;
//           // copyLines[i].geometry.vertices[1].y = line.geometry.vertices[1].y - changeGeometry.y;
//           // console.log(copyLines[i].geometry.vertices);
//           // console.log(line.geometry.vertices);
//           // console.log(line);
//           // debugger;
//         } else if (line.geometry.type === "CircleGeometry") {
//           // editor.editMode.newCurveCenter = true;
//           editor.editMode.isNewCurve = true;
//           // debugger;
//           let copyLines = {
//             0: {
//               x: line.position.x - changeGeometry.x,
//               y: line.position.y - changeGeometry.y
//             },
//             1: {
//               x: line.userData.helpPoints.pointStart.position.x - changeGeometry.x,
//               y: line.userData.helpPoints.pointStart.position.y - changeGeometry.y
//             },
//             2: {
//               x: line.userData.helpPoints.pointEnd.position.x - changeGeometry.x,
//               y: line.userData.helpPoints.pointEnd.position.y - changeGeometry.y
//             }
//           };
//
//           // console.log (line);
//           // console.log (line.userData.helpPoints);
//           // debugger;
//
//           // if (!editor.editMode.newCurveCenter) {
//
//           // debugger;
//           // centerCurve(event, editor, copyLines[0]);
//           // debugger;
//           // console.log(editor.editMode.newCurveCenter);
//           centerPoint(event, editor, copyLines[0]);
//           // debugger;
//           editor.editMode.newCurveCenter = {
//             x: copyLines[0].x,
//             y: copyLines[0].y
//           };
//           // console.log(editor.editMode.newCurveCenter);
//
//           // } else if (!editor.editMode.thetaStart) {
//
//           // debugger;
//
//
//           // console.log(editor.editMode.newCurveCenter);
//           radius(event, editor, copyLines[1]);
//           // thetaStart(editor, copyLines[1]);
//           // debugger;
//           // editor.editMode.start = {
//           //   x: copyLines[1].x,
//           //   y: copyLines[1].y
//           // };
//           // editor.editMode.radius = line.geometry.parameters.radius;
//
//           thetaStart(editor);
//           // editor.editMode.thetaStart = line.geometry.parameters.thetaStart;
//
//           // console.log(editor.editMode.thetaStart);
//
//           // } else if (!editor.editMode.thetaLength) {
//
//           // debugger;
//           thetaLength(event, editor, parent, copyLines[2]);
//           // editor.editMode.thetaLength = line.geometry.parameters.thetaLength;
//           // editor.editMode.thetaLength = {
//           //   x: copyLines[2].x,
//           //   y: copyLines[2].y
//           // };
//           // debugger;
//           // console.log(editor.editMode.thetaLength)(dispatch);
//           saveNewCurve(editor);
//           // saveNewCurve(editor, copyLines[2]);
//           // }
//           // debugger
//
//         }
//       });
//       renderer.render(scene, camera);
//     }
//   }
// };