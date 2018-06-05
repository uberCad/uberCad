import { connect } from 'react-redux'
import MaterialComponent from './materialComponent'
import { loadMaterials, setMaterial } from '../../actions/materials'

const mapStateToProps = (state, ownProps) => {
  return {
    lang: state.locale.lang,
    activeObject: state.sidebar.activeObject,
    materials: state.materials,
    scene: state.cad.scene,
    ...ownProps
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    loadMaterials: function () {
      loadMaterials()(dispatch)
    },
    setMaterial: function (material, object) {
      setMaterial(material, object)(dispatch)
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MaterialComponent)
