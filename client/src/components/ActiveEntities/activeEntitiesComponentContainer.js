import { connect } from 'react-redux'
import ActiveEntitiesComponent from './activeEntitiesComponent'
import {
  setSelectMode,
  setSingleLayerSelect,
  setThreshold
} from '../../actions/activeEntities'

const mapStateToProps = (state, ownProps) => {
  return {
    activeEntities: state.cad.activeEntities,
    ...ownProps
  }
}

const mapDispatchToProps = (dispatch) => {
  return {


  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ActiveEntitiesComponent)
