import { connect } from 'react-redux'
import CalculatePriceComponent from './calculatePriceComponent'
import {
  calculate,
  calculateHide,
  changeLaserOptions,
  checkLaser,
  checkObject,
  setLength
} from '../../actions/calculate'

const mapStateToProps = (state, ownProps) => {
  return {
    lang: state.locale.lang,
    show: state.price.show,
    polyamides: state.price.polyamideObjects,
    scene: state.cad.scene,
    forceRender: {},
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
    },
    checkObject: function (object) {
      checkObject(object)(dispatch)
    },
    checkLaser: function (object) {
      checkLaser(object)(dispatch)
    },
    changeLaserOptions: function (object, event) {
      changeLaserOptions(object, event)(dispatch)
    },
    setLength: function (object, length) {
      setLength(object, length)(dispatch)
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CalculatePriceComponent)
