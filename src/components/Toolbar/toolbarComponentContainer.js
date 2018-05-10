import { connect } from 'react-redux'
import ToolbarComponent from './toolbarComponent'
import { chooseTool } from '../../actions/toolbar'

const mapStateToProps = (state, ownProps) => {
  return {
    tool: state.toolbar.tool,
    ...ownProps
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    chooseTool: function (tool) {
      chooseTool(tool)(dispatch)
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ToolbarComponent)
