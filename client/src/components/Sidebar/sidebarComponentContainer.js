import { connect } from 'react-redux'
import SidebarComponent from './sidebarComponent'
import {
  toggleSidebar,
} from '../../actions/sidebar'

const mapStateToProps = (state, ownProps) => {
  return {
    active: state.sidebar.active,
    editor: {
      renderer: state.cad.renderer,
      cadCanvas: state.cad.cadCanvas
    },
    ...ownProps
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    toggleSidebar: function (active, editor) {
      toggleSidebar(active, editor)(dispatch)
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(SidebarComponent)
