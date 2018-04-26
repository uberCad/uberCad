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

    drawDxf: (data, container) => {
      drawDxf(data, container)(dispatch)
    },

    onClick: (event, editor) => {
      cadClick(event, editor)(dispatch)
    },

    onDoubleClick: (event, editor) => {
      cadDoubleClick(event, editor)(dispatch)
    },

    onMouseDown: (event, editor) => {
      // console.log('onMouseDown', event, editor)

      // on left button
      if (event.button === 0) {
        if (editor.tool === TOOL_POINT) {
          if (editor.editMode.isEdit) {
            // do edit here
          }
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
    },

    onMouseUp: (event, editor) => {
      // console.log('onMouseUp', event, editor)

      if (editor.tool === TOOL_SELECT) {
        // begin select
        let drawRectangle = selectionEnd(event, editor)(dispatch)
        let selectResult = sceneService.selectInFrustum(drawRectangle, editor.scene)
        let activeEntities = sceneService.doSelection(selectResult, editor)
        dispatch({
          type: CAD_DO_SELECTION,
          payload: {
            activeEntities
          }
        })
        // console.warn('selectResult', selectResult)
      }
    }

  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CadComponent)
