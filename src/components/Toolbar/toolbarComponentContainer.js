import { connect } from 'react-redux'
import ToolbarComponent from './toolbarComponent'
import { chooseTool } from '../../actions/toolbar'
import { back, forward } from '../../actions/history'

const mapStateToProps = (state, ownProps) => {
  return {
    lang: state.locale.lang,
    tool: state.toolbar.tool,
    editor: {
      scene: state.cad.scene,
      camera: state.cad.camera,
      renderer: state.cad.renderer
    },
    history: state.cad.history,
    ...ownProps
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    chooseTool: function (tool) {
      chooseTool(tool)(dispatch)
    },
    back: function (history, editor) {
      back(history, editor)(dispatch)
    },
    forward: function (history, editor) {
      forward(history, editor)(dispatch)
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ToolbarComponent)
