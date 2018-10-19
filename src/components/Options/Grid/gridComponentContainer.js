import { connect } from 'react-redux'
import gridComponent from './gridComponent'
import { setStep, toggleShow } from '../../../actions/grid'

const mapStateToProps = (state, ownProps) => {
  return {
    lang: state.locale.lang,
    grid: state.tools.grid,
    editor: {
      scene: state.cad.scene,
      camera: state.cad.camera,
      renderer: state.cad.renderer
    },
    ...ownProps
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    toggleShow: function (editor, view, step) {
      toggleShow(editor, view, step)(dispatch)
    },
    setStep: function (editor, view, step) {
      setStep(editor, view, step)(dispatch)
    },

  }
}

export default connect(mapStateToProps, mapDispatchToProps)(gridComponent)
