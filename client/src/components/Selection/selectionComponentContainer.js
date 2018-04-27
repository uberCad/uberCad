import { connect } from 'react-redux'
import SelectionComponent from './selectionComponent'
import { selectionUpdate } from '../../actions/selection'

const mapStateToProps = (state, ownProps) => {
  return {
    active: state.selection.active,
    style: state.selection.style,
    ...ownProps
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    onMouseMove: function (event) {
      selectionUpdate(event)(dispatch)
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(SelectionComponent)
