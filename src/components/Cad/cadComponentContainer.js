import { connect } from 'react-redux'
import CadComponent from './cadComponent'
import { fetchProject } from '../../actions/project'
import {
  drawDxf,
  cadClick,
  cadDoubleClick, CAD_DO_SELECTION,
  toggleChanged
} from '../../actions/cad'
import {
  selectionBegin,
  selectionUpdate,
  selectionEnd
} from '../../actions/selection'
import { spinnerShow, spinnerHide } from '../../actions/spinner'

import {
  TOOL_ARC,
  TOOL_CHAMFER,
  TOOL_LINE,
  TOOL_MEASUREMENT,
  TOOL_POINT,
  TOOL_RECTANGLE,
  TOOL_SELECT
} from '../Toolbar/toolbarComponent'
import sceneService from '../../services/sceneService'
import {
  centerCurve,
  centerPoint, cloneObject, clonePoint, disableMovePoint,
  drawLine,
  firstPoint, moveObject, moveObjectPoint,
  movePoint, radius, saveClone, saveNewCurve,
  saveNewLine,
  savePoint, selectClonePoint, selectMovePoint,
  selectPoint, setClone,
  startNewLine,
  thetaLength,
  thetaStart
} from '../../actions/edit'
import { PANEL_LAYERS_TOGGLE } from '../../actions/panelLayers'
import {
  angleFirstInfo, angleSecondInfo, angleSelectFirstLine, angleSelectSecondLine, eraseAngle,
  eraseLine,
  lineFirstInfo, lineFirstPoint, lineSecondInfo, lineSecondPoint,
  MEASUREMENT_ANGLE,
  MEASUREMENT_LINE,
  MEASUREMENT_POINT,
  MEASUREMENT_RADIAL,
  pointInfo, pointSelect, radialInfo, radialSelectLine
} from '../../actions/measurement'
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
} from '../../actions/line'
import {
  RECTANGLE_TWO_POINT,
  rectangleClear, rectangleDraw,
  rectangleFirstPoint,
  rectangleFirstPointSelect
} from '../../actions/rectangle'
import {
  CHAMFER_LENGTH_ANGLE,
  CHAMFER_TWO_LENGTH,
  chamferDraw,
  chamferFirstLine,
  chamferFirstLineSelect,
  chamferLengthAngleDraw,
  chamferLengthAngleFirstLineSelect, chamferRoundingLengthFirstLineSelect,
  chamferRoundingRadiusFirstLineSelect,
  chamferSecondLine,
  ROUNDING_LENGTH,
  ROUNDING_RADIUS,
  roundingLengthDraw,
  roundingRadiusDraw
} from '../../actions/chamfer'
import {
  ARC_CENTER_TWO_POINT,
  ARC_RADIUS_TWO_POINT,
  ARC_TANGENT_LINE,
  arcCenterDraw,
  arcCenterFirstPoint,
  arcCenterFirstPointSelect,
  arcCenterPoint,
  arcCenterPointSelect,
  arcRadiusDraw,
  arcRadiusFirstPoint,
  arcRadiusFirstPointSelect,
  choseArc, saveCenterArc,
  saveRadiusArc,
  saveTangentArc, stopDraw,
  tangentArcDraw,
  tangentFirstPoint,
  tangentFirstPointSelect
} from '../../actions/arc'
import { showGrid } from '../../actions/grid'

const mapStateToProps = (state, ownProps) => {
  return {
    editor: {
      scene: state.cad.scene,
      camera: state.cad.camera,
      renderer: state.cad.renderer,
      cadCanvas: state.cad.cadCanvas,
      tool: state.toolbar.tool,
      activeEntities: state.cad.activeEntities,
      options: {
        selectMode: state.options.selectMode,
        singleLayerSelect: state.options.singleLayerSelect,
        threshold: state.options.threshold
      },
      editMode: state.cad.editMode,
      selection: state.selection,
      activeLayer: state.sidebar.activeLayer,
      measurement: state.tools.measurement,
      line: state.tools.line,
      rectangle: state.tools.rectangle,
      chamfer: state.tools.chamfer,
      arc: state.tools.arc,
      grid: state.tools.grid
    },

    sidebarExpanded: state.sidebar.active,

    loading: state.project.loading,
    error: state.project.error,
    project: state.project.project,
    isChanged: state.cad.isChanged,
    ...ownProps
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    fetchProject: function (id) {
      fetchProject(id)(dispatch)
    },
    // fetchDxf: function (url) {
    //   fetchDxf(url)(dispatch)
    // },

    spinnerShow: function () {
      spinnerShow()(dispatch)
    },

    spinnerHide: function () {
      spinnerHide()(dispatch)
    },

    // parseDxf: function (dxf) {
    //   parseDxf(dxf)(dispatch)
    // }

    drawDxf: (data = null, container, snapshot = null) => {
      drawDxf(data, container, snapshot)(dispatch)
    },

    onClick: (event, editor) => {
      cadClick(event, editor)(dispatch)
    },

    onDoubleClick: (event, editor) => {
      cadDoubleClick(event, editor)(dispatch)
    },

    onMouseDown: (event, editor) => {
      // on left button
      if (event.button === 0) {
        if (editor.tool === TOOL_POINT) {
          if (editor.editMode.isEdit) {
            // do edit here
            if (editor.editMode.activeLine.id) {
              selectPoint(editor.editMode.activeLine, event, editor)(dispatch)
            }
          }
        }
        //new line
        if (editor.editMode.isNewLine) {
          !editor.editMode.newLineFirst ? firstPoint(event, editor)(dispatch) : saveNewLine(editor)(dispatch)
        }
        //new curve
        if (editor.editMode.isNewCurve) {
          if (!editor.editMode.newCurveCenter) {
            centerPoint(event, editor)(dispatch)
          } else if (!editor.editMode.thetaStart) {
            thetaStart(editor)(dispatch)
          } else if (!editor.editMode.thetaLength) {
            saveNewCurve(editor)(dispatch)
          }
        }
        //clone object
        if (editor.editMode.clone.active) {
          if (!editor.editMode.clone.point) {
            clonePoint(event, editor)(dispatch)
            cloneObject(editor, editor.editMode.editObject)(dispatch)
          } else if (editor.editMode.clone.cloneObject) {
            saveClone(editor.editMode.clone.cloneObject)(dispatch)
          }
        }

        //move object
        if (editor.editMode.move.active && !editor.editMode.move.point) {
          moveObjectPoint(event, editor)(dispatch)
        }

        if (editor.tool === TOOL_SELECT) {
          selectionBegin(event, editor)(dispatch)
        }

        //mouse down
        if (editor.tool === TOOL_MEASUREMENT) {
          if (editor.options.selectMode === MEASUREMENT_POINT) {
            pointSelect(event, editor)(dispatch)
          } else if (editor.options.selectMode === MEASUREMENT_LINE) {
            if (editor.measurement.line.first && editor.measurement.line.second) {
              eraseLine()(dispatch)
            } else {
              !editor.measurement.line.first ?
                lineFirstPoint(event, editor)(dispatch)
                : lineSecondPoint(event, editor, editor.measurement.line.first)(dispatch)
            }
          } else if (editor.options.selectMode === MEASUREMENT_RADIAL) {
            radialSelectLine(editor.activeEntities[0])(dispatch)
          } else if (editor.options.selectMode === MEASUREMENT_ANGLE) {
            if (editor.measurement.angle.firstLine && editor.measurement.angle.secondLine) {
              eraseAngle()(dispatch)
            } else {
              !editor.measurement.angle.firstLine ?
                angleSelectFirstLine(editor.activeEntities[0])(dispatch)
                : angleSelectSecondLine(editor.measurement.angle.firstLine, editor.activeEntities[0])(dispatch)
            }
          }
        }

        //mouse down
        if (editor.tool === TOOL_LINE) {
          if (editor.options.selectMode === LINE_TWO_POINT) {
            console.log(LINE_TWO_POINT, 'mouse down')
            !editor.editMode.newLineFirst ? firstPoint(event, editor)(dispatch) : saveNewLine(editor)(dispatch)
          } else if (editor.options.selectMode === LINE_PARALLEL) {
            if (!editor.line.parallel.baseLine) {
              parallelLineSelect(editor.activeEntities[0])(dispatch)
            } else if (!editor.line.parallel.firstPoint) {
              parallelLineFirstPointSelect(event, editor, editor.line.parallel.baseLine)(dispatch)
            } else {
              parallelLineSecondPointSelect(event, editor)(dispatch)
            }
          } else if (editor.options.selectMode === LINE_PERPENDICULAR) {
            if (!editor.line.perpendicular.baseLine) {
              perpendicularLineSelect(editor.activeEntities[0])(dispatch)
            } else if (!editor.line.perpendicular.firstPoint) {
              perpendicularFirstPointSelect(event, editor)(dispatch)
            } else {
              perpendicularSecondPointSelect(event, editor)(dispatch)
            }
          } else if (editor.options.selectMode === LINE_TANGENT_TO_ARC) {
            if (!editor.line.tangent.baseArc) {
              tangentBaseArcSelect(editor.activeEntities[0])(dispatch)
            } else {
              tangentLineEnd(event, editor)(dispatch)
            }
          }
        }

        if (editor.tool === TOOL_RECTANGLE) {
          if (editor.options.selectMode === RECTANGLE_TWO_POINT) {
            if (!editor.rectangle.firstPoint) {
              rectangleFirstPointSelect(event, editor)(dispatch)
            } else {
              rectangleClear(event, editor)(dispatch)
            }
          }
        }

        if (editor.tool === TOOL_CHAMFER) {
            switch (editor.options.selectMode) {
              case CHAMFER_TWO_LENGTH:
                if (!editor.chamfer.twoLength.lineOne) {
                  chamferFirstLineSelect(editor.activeEntities[0])(dispatch)
                } else {
                  chamferDraw(
                    event,
                    editor,
                    editor.chamfer.twoLength.lineOne,
                    editor.activeEntities[0],
                    editor.chamfer.twoLength.lengthOne,
                    editor.chamfer.twoLength.lengthTwo
                  )(dispatch)
                }
                break
              case CHAMFER_LENGTH_ANGLE:
                if (!editor.chamfer.lengthAngle.lineOne) {
                  chamferLengthAngleFirstLineSelect(editor.activeEntities[0])(dispatch)
                } else {
                  chamferLengthAngleDraw(
                    event,
                    editor,
                    editor.chamfer.lengthAngle.lineOne,
                    editor.activeEntities[0],
                    editor.chamfer.lengthAngle.length,
                    editor.chamfer.lengthAngle.angle
                  )(dispatch)
                }
                break
              case ROUNDING_RADIUS:
                if (!editor.chamfer.rounding.lineOne) {
                  chamferRoundingRadiusFirstLineSelect(editor.activeEntities[0])(dispatch)
                } else {
                  roundingRadiusDraw(
                    event,
                    editor,
                    editor.chamfer.rounding.lineOne,
                    editor.activeEntities[0],
                    editor.chamfer.rounding.radius
                  )(dispatch)
                }
                break
              case ROUNDING_LENGTH:
                if (!editor.chamfer.roundingLength.lineOne) {
                  chamferRoundingLengthFirstLineSelect(editor.activeEntities[0])(dispatch)
                } else {
                  roundingLengthDraw(
                    event,
                    editor,
                    editor.chamfer.roundingLength.lineOne,
                    editor.activeEntities[0],
                    editor.chamfer.roundingLength.length
                  )(dispatch)
                }
                break

              default:
                console.warn(`Unhandled mouse down for select mode ${editor.options.selectMode} in ${TOOL_CHAMFER}`)

          }
        }

        if (editor.tool === TOOL_ARC) {
          switch (editor.options.selectMode) {
            case ARC_CENTER_TWO_POINT:
              if (!editor.arc.centerTwoPoint.center) {
                arcCenterPointSelect(event, editor)(dispatch)
              } else if (!editor.arc.centerTwoPoint.pointOne) {
                arcCenterFirstPointSelect(event, editor)(dispatch)
              } else {
                saveCenterArc(event, editor)(dispatch)
              }
              break

            case ARC_RADIUS_TWO_POINT:
              if (!editor.arc.radiusTwoPoint.pointOne) {
                arcRadiusFirstPointSelect(event, editor)(dispatch)
              } else  if (editor.arc.radiusTwoPoint.drawing){
                stopDraw()(dispatch)
                // arcRadiusDraw(event, editor, editor.arc.radiusTwoPoint.pointOne, editor.arc.radiusTwoPoint.radius)(dispatch)
              } else  if (editor.activeEntities[0]){
                saveRadiusArc(event, editor, editor.activeEntities[0])(dispatch)
              }
              break
            case ARC_TANGENT_LINE:
              if (!editor.arc.tangentLine.pointOne) {
                if (editor.activeEntities[0]){
                  tangentFirstPointSelect(event, editor, editor.activeEntities[0])(dispatch)
                }
              } else {
                saveTangentArc(editor)(dispatch)
              }
              break

            default:
              console.warn(`Unhandled move event select mode ${editor.options.selectMode} in ${TOOL_ARC}`)
          }
        }
      }
    },

    onMouseMove: (event, editor) => {
      // console.log('onMouseMove', event, editor)

      if (editor.tool === TOOL_SELECT) {
        if (editor.selection.active) {
          selectionUpdate(event, editor)(dispatch)
        }
      }

      if (event.button === 0
        && editor.tool === TOOL_POINT
        && editor.editMode.isEdit
        && editor.editMode.activeLine.id
        && (editor.editMode.selectPointIndex || editor.editMode.selectPointIndex === 0)
      ) {
        // do edit here
        movePoint(
          editor.editMode.activeLine,
          editor.editMode.selectPointIndex,
          event,
          editor)(dispatch)
      }

      //new Line
      if (editor.editMode.isNewLine) {
        let parent = editor.editMode.editObject
        if (!parent || parent.metadata) {
          parent = editor.scene.getObjectByName('Layers').children[0]
          dispatch({
            type: PANEL_LAYERS_TOGGLE,
            payload: {
              activeLayer: parent
            }
          })
        }
        !editor.editMode.newLineFirst ? startNewLine(event, editor)(dispatch) : drawLine(event, editor, parent)(dispatch)
      }

      //new Curve
      if (editor.editMode.isNewCurve) {
        let parent = editor.editMode.editObject
        if (!parent || parent.metadata) {
          parent = editor.scene.getObjectByName('Layers').children[0]
          dispatch({
            type: PANEL_LAYERS_TOGGLE,
            payload: {
              activeLayer: parent
            }
          })
        }

        if (!editor.editMode.newCurveCenter) {
          centerCurve(event, editor)(dispatch)
        } else if (!editor.editMode.thetaStart) {
          radius(event, editor)(dispatch)
        } else if (!editor.editMode.thetaLength) {
          thetaLength(event, editor, parent)(dispatch)
        }
      }
      //clone object
      if (editor.editMode.clone.active) {
        selectClonePoint(event, editor)(dispatch)
        if (editor.editMode.clone.point && editor.editMode.clone.cloneObject) {
          setClone(event, editor)(dispatch)
        }
      }
      //move object
      if (editor.editMode.move.active) {
        selectMovePoint(event, editor)(dispatch)
        if (editor.editMode.move.point && editor.editMode.move.moveObject) {
          moveObject(event, editor)(dispatch)
        }
      }

      //mouse move event
      if (editor.tool === TOOL_MEASUREMENT) {
        if (editor.options.selectMode === MEASUREMENT_POINT) {
          pointInfo(event, editor)(dispatch)
        } else if (editor.options.selectMode === MEASUREMENT_LINE) {
          if (!editor.measurement.line.first) {
            lineFirstInfo(event, editor)(dispatch)
          } else if (!editor.measurement.line.second) {
            lineSecondInfo(event, editor)(dispatch)
          }
        } else if (editor.options.selectMode === MEASUREMENT_RADIAL) {
          radialInfo(event, editor)(dispatch)
        } else if (editor.options.selectMode === MEASUREMENT_ANGLE) {
          if (!editor.measurement.angle.firstLine) {
            angleFirstInfo(event, editor)(dispatch)
          } else if (!editor.measurement.angle.secondLine) {
            angleSecondInfo(event, editor, editor.measurement.angle.firstLine)(dispatch)
          }
        }
      }

      //mouse move event
      if (editor.tool === TOOL_LINE) {
        if (editor.options.selectMode === LINE_TWO_POINT) {
          let parent = editor.tool === TOOL_LINE ? editor.activeLayer : editor.editMode.editObject
          if (!parent || parent.metadata) {
            parent = editor.scene.getObjectByName('Layers').children[0]
            dispatch({
              type: PANEL_LAYERS_TOGGLE,
              payload: {
                activeLayer: parent
              }
            })
          }
          !editor.editMode.newLineFirst ? startNewLine(event, editor)(dispatch) : drawLine(event, editor, parent)(dispatch)
        } else if (editor.options.selectMode === LINE_PARALLEL) {
          if (!editor.line.parallel.baseLine) {
            parallelLine(event, editor)(dispatch)
          } else if (!editor.line.parallel.firstPoint) {
            parallelLineFirstPoint(event, editor)(dispatch)
          } else {
            parallelLineSecondPoint(event, editor, editor.line.parallel.baseLine, editor.line.parallel.firstPoint, editor.line.parallel.distance)(dispatch)
          }
        } else if (editor.options.selectMode === LINE_PERPENDICULAR) {
          if (!editor.line.perpendicular.baseLine) {
            perpendicularBaseLine(event, editor)(dispatch)
          } else if (!editor.line.perpendicular.firstPoint) {
            perpendicularFirstPoint(event, editor)(dispatch)
          } else {
            perpendicularDraw(event, editor, editor.line.perpendicular.baseLine, editor.line.perpendicular.firstPoint)(dispatch)
          }
        } else if (editor.options.selectMode === LINE_TANGENT_TO_ARC) {
          if (!editor.line.tangent.baseArc) {
            tangentBaseArc(event, editor)(dispatch)
          } else {
            tangentLineDraw(event, editor, editor.line.tangent.baseArc)(dispatch)
          }
        }
      }

      if (editor.tool === TOOL_RECTANGLE) {
        if (editor.options.selectMode === RECTANGLE_TWO_POINT) {
          if (!editor.rectangle.firstPoint) {
            rectangleFirstPoint(event, editor)(dispatch)
          } else {
            rectangleDraw(event, editor, editor.rectangle.firstPoint)(dispatch)
          }
        }
      }
      //mouse move event
      if (editor.tool === TOOL_CHAMFER) {
        switch (editor.options.selectMode) {
          case CHAMFER_TWO_LENGTH:
            if (!editor.chamfer.twoLength.lineOne) {
              chamferFirstLine(event, editor)(dispatch)
            } else {
              chamferSecondLine(event, editor)(dispatch)
            }
            break
          case CHAMFER_LENGTH_ANGLE:
            if (!editor.chamfer.lengthAngle.lineOne) {
              chamferFirstLine(event, editor)(dispatch)
            } else {
              chamferSecondLine(event, editor)(dispatch)
            }
            break
          case ROUNDING_RADIUS:
            if (!editor.chamfer.rounding.lineOne) {
              chamferFirstLine(event, editor)(dispatch)
            } else {
              chamferSecondLine(event, editor)(dispatch)
            }
            break
          case ROUNDING_LENGTH:
            if (!editor.chamfer.roundingLength.lineOne) {
              chamferFirstLine(event, editor)(dispatch)
            } else {
              chamferSecondLine(event, editor)(dispatch)
            }
            break

          default:
            console.warn(`Unhandled select mode ${editor.options.selectMode} in ${TOOL_CHAMFER}`)
        }
      }

      if (editor.tool === TOOL_ARC) {
        switch (editor.options.selectMode) {
          case ARC_CENTER_TWO_POINT:
            if (!editor.arc.centerTwoPoint.center) {
              arcCenterPoint(event, editor)(dispatch)
            } else if (!editor.arc.centerTwoPoint.pointOne) {
              arcCenterFirstPoint(event, editor, editor.arc.centerTwoPoint.center)(dispatch)
            } else {
              arcCenterDraw(event, editor, editor.arc.centerTwoPoint.center, editor.arc.centerTwoPoint.pointOne)(dispatch)
            }
            break

          case ARC_RADIUS_TWO_POINT:
            if (!editor.arc.radiusTwoPoint.pointOne) {
              arcRadiusFirstPoint(event, editor)(dispatch)
            } else if (editor.arc.radiusTwoPoint.drawing) {
              arcRadiusDraw(event, editor, editor.arc.radiusTwoPoint.pointOne, editor.arc.radiusTwoPoint.radius)(dispatch)
            } else {
              choseArc(event, editor)(dispatch)
            }
            break

          case ARC_TANGENT_LINE:
            if (!editor.arc.tangentLine.pointOne) {
              tangentFirstPoint(event, editor)(dispatch)
            } else {
              tangentArcDraw(event, editor, editor.arc.tangentLine.line, editor.arc.tangentLine.pointOne)(dispatch)
            }
            break

          default:
            console.warn(`Unhandled move event select mode ${editor.options.selectMode} in ${TOOL_ARC}`)
        }
      }
    },

    onMouseUp:
      (event, editor) => {
        // console.log('onMouseUp', event, editor)

        if (editor.tool === TOOL_SELECT) {
          // end select
          if (editor.selection.active) {
            let drawRectangle = selectionEnd(event, editor)(dispatch)
            let selectResult = sceneService.selectInFrustum(drawRectangle, editor.scene)
            let activeEntities = sceneService.doSelection(selectResult, editor)
            dispatch({
              type: CAD_DO_SELECTION,
              payload: {
                activeEntities
              }
            })
          }
          // console.warn('selectResult', selectResult)
        }

        // do edit here
        if (event.button === 0 && editor.tool === TOOL_POINT && editor.editMode.isEdit && editor.editMode.activeLine.id) {
          // do edit here
          savePoint(editor.editMode.selectPointIndex)(dispatch)
        }

        //move object
        if (editor.editMode.move.active && editor.editMode.move.point) {
          disableMovePoint(editor.editMode.move.moveObject)(dispatch)
        }
      },

    toggleChanged:
      (isChanged) => {
        toggleChanged(isChanged)(dispatch)
      },

    showGrid: function (editor, view, step) {
      showGrid(editor, view, step)
    }

  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CadComponent)
