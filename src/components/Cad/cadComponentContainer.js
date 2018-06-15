import { connect } from 'react-redux'
import CadComponent from './cadComponent'
import { fetchProject } from '../../actions/project'
import {
  drawDxf,
  cadClick,
  cadDoubleClick, CAD_DO_SELECTION
} from '../../actions/cad'
import {
  selectionBegin,
  selectionUpdate,
  selectionEnd
} from '../../actions/selection'
import { spinnerShow, spinnerHide } from '../../actions/spinner'

import {
  TOOL_POINT,
  TOOL_SELECT
} from '../Toolbar/toolbarComponent'
import sceneService from '../../services/sceneService'
import { drawLine, firstPoint, movePoint, saveNewLine, savePoint, selectPoint, startNewLine } from '../../actions/edit'

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
      selection: state.selection
    },

    sidebarExpanded: state.sidebar.active,

    loading: state.project.loading,
    error: state.project.error,
    project: state.project.project,
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

        if (editor.tool === TOOL_SELECT) {
          selectionBegin(event, editor)(dispatch)
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
        !editor.editMode.newLineFirst ? startNewLine(event, editor)(dispatch) : drawLine(event, editor)(dispatch)
      }
    },

    onMouseUp: (event, editor) => {
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
    }

  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CadComponent)
