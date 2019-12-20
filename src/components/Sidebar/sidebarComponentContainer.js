import { connect } from 'react-redux';
import SidebarComponent from './sidebarComponent';
import { toggleSidebar, toggleTab } from '../../actions/sidebar';

const mapStateToProps = (state, ownProps) => {
  return {
    active: state.sidebar.active,
    panels: state.sidebar.panels,
    editor: {
      renderer: state.cad.renderer,
      cadCanvas: state.cad.cadCanvas
    },
    ...ownProps
  };
};

const mapDispatchToProps = dispatch => {
  return {
    toggleSidebar: function(active, editor) {
      toggleSidebar(active, editor)(dispatch);
    },

    toggleTab: function(panelIdx, tabIdx) {
      toggleTab(panelIdx, tabIdx)(dispatch);
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(SidebarComponent);
