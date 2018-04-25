import { connect } from 'react-redux'
import SelectionComponent from './selectionComponent'
import {
  selectionUpdate,
  selectionEnd
} from '../../actions/selection'
import sceneService from '../../services/sceneService'
import { CAD_DO_SELECTION } from '../../actions/cad'

const mapStateToProps = (state, ownProps) => {
  return {
    active: state.selection.active,
    editor: {
      scene: state.cad.scene,
      camera: state.cad.camera,
      renderer: state.cad.renderer,
      selection: state.selection
    },
    ...ownProps
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    onMouseMove: function (event, editor) {
      selectionUpdate(event, editor)(dispatch)
    },

    onMouseUp: function (event, editor) {
      let drawRectangle = selectionEnd(event, editor)(dispatch)
      let selectResult = sceneService.selectInFrustum(drawRectangle, editor.scene)
      let activeEntities = sceneService.doSelection(selectResult, editor)
      dispatch({
        type: CAD_DO_SELECTION,
        payload: {
          activeEntities
        }
      })
      console.warn('selectResult (selectionComponentContainer)', selectResult)
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(SelectionComponent)
