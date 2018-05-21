import { connect } from 'react-redux'
import MaterialComponent from './materialComponent'
import { loadMaterials } from '../../actions/materials'

const mapStateToProps = (state, ownProps) => {
  return {
    materials: state.materials,
    scene: state.cad.scene,
    ...ownProps
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    loadMaterials: function () {
      loadMaterials()(dispatch)
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MaterialComponent)
