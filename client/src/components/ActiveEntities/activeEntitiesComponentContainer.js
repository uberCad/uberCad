import { connect } from 'react-redux'
import ActiveEntitiesComponent from './activeEntitiesComponent'
import {
  toggleVisible
} from '../../actions/activeEntities'

const mapStateToProps = (state, ownProps) => {
  return {
    activeEntities: state.cad.activeEntities,
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
    toggleVisible: function (entity, visible, editor) {
      toggleVisible(entity, visible, editor)(dispatch)
    },
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ActiveEntitiesComponent)
