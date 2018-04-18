import { connect } from 'react-redux'
import CadComponent from './cadComponent'
import { fetchProject } from '../../actions/project'
import { drawDxf } from '../../actions/cad'
import { spinnerShow, spinnerHide } from '../../actions/spinner'
import { getPreloadedProject } from '../Project/projectComponentContainer'

const mapStateToProps = (state, ownProps) => {
  return {
    scene: state.cad.scene,
    camera: state.cad.camera,
    renderer: state.cad.renderer,
    cadCanvas: state.cad.cadCanvas,

    loading: state.project.loading,
    error: state.project.error,
    project: state.project.project,
    lastUpdated: state.project.lastUpdated,
    preloadedProject: getPreloadedProject(state, ownProps),
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
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CadComponent)
