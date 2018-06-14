import { connect } from 'react-redux'
import PanelEditComponent from './panelEditComponent'
import {newLine, cancelNewLine} from '../../actions/edit'

const mapStateToProps = (state, ownProps) => {
  return {
    editMode: state.cad.editMode,

    ...ownProps
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    newLine: function (event) {
      newLine(event)(dispatch)
    },
    cancelNewLine: function () {
      cancelNewLine()(dispatch)
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(PanelEditComponent)
