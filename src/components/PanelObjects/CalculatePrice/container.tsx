import { connect } from 'react-redux';
import CalculatePriceComponent from './calculatePriceComponent';
import { calculate, calculateHide, order } from '../../../actions/calculate';

const mapStateToProps = (state, ownProps) => {
  return {
    lang: state.locale.lang,
    error: state.price.error,
    show: state.price.show,
    polyamides: state.price.polyamideObjects,
    scene: state.cad.scene,
    forceRender: {},
    form: state.form,
    ...ownProps
  };
};

const mapDispatchToProps = dispatch => {
  return {
    calculate: function(scene) {
      calculate(scene)(dispatch);
    },
    calculateHide: function() {
      calculateHide()(dispatch);
    },
    order: function(orderObjects, contactInformation) {
      order(orderObjects, contactInformation)(dispatch);
    }
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CalculatePriceComponent);
