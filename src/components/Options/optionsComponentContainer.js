import { connect } from 'react-redux'
import OptionsComponent from './optionsComponent'
import {
  isEdit,
  setSelectMode,
  setSingleLayerSelect,
  setThreshold
} from '../../actions/options'

const mapStateToProps = (state, ownProps) => {
  console.log('optionsComponent state.cad.editMode = ', state.cad.editMode)

  return {
    tool: state.toolbar.tool,
    editMode: state.cad.editMode,
    selectMode: state.options.selectMode,
    singleLayerSelect: state.options.singleLayerSelect,
    threshold: state.options.threshold,
    ...ownProps
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    setSelectMode: function (mode) {
      setSelectMode(mode)(dispatch)
    },

    setSingleLayerSelect: function (value) {
      setSingleLayerSelect(value)(dispatch)
    },

    setThreshold: function (value) {
      setThreshold(value)(dispatch)
    },
    isEdit: function (option) {
      isEdit(option)(dispatch)
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(OptionsComponent)
