import { connect } from 'react-redux'
import CalculatePriceComponent from './calculatePriceComponent'
import { calculate, calculateHide } from '../../actions/calculate'

const mapStateToProps = (state, ownProps) => {
  return {
    show: state.price.show,
    polyamides: state.price.polyamideObjects,
    scene: state.cad.scene,
    ...ownProps
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    calculate: function (scene) {
      calculate(scene)(dispatch)
    },
    calculateHide: function () {
      calculateHide()(dispatch)
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CalculatePriceComponent)
