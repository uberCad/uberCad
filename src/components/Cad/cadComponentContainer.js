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
  TOOL_MEASUREMENT,
  TOOL_NEW_CURVE,
  TOOL_NEW_LINE,
  TOOL_POINT,
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
  pointInfo, pointSelect
} from '../../actions/measurement'

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
      measurement: state.tools.measurement
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
        if (editor.tool === TOOL_NEW_LINE || editor.editMode.isNewLine) {
          !editor.editMode.newLineFirst ? firstPoint(event, editor)(dispatch) : saveNewLine(editor)(dispatch)
        }
        //new curve
        if (editor.tool === TOOL_NEW_CURVE || editor.editMode.isNewCurve) {
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
            console.log('click MEASUREMENT_RADIAL')
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
      if (editor.tool === TOOL_NEW_LINE || editor.editMode.isNewLine) {
        let parent = editor.tool === TOOL_NEW_LINE ? editor.activeLayer : editor.editMode.editObject
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
      if (editor.tool === TOOL_NEW_CURVE || editor.editMode.isNewCurve) {
        let parent = editor.tool === TOOL_NEW_CURVE ? editor.activeLayer : editor.editMode.editObject
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
          console.log('move MEASUREMENT_RADIAL')
        } else if (editor.options.selectMode === MEASUREMENT_ANGLE) {
          if (!editor.measurement.angle.firstLine) {
            angleFirstInfo(event, editor)(dispatch)
          } else if (!editor.measurement.angle.secondLine) {
            angleSecondInfo(event, editor, editor.measurement.angle.firstLine)(dispatch)
          }
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
      }

  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CadComponent)
