import { connect } from 'react-redux';
import OrderComponent from './orderComponent';
import { getOrder } from '../../actions/order';

const mapStateToProps = (state, ownProps) => {
  return {
    lang: state.locale.lang,
    contactInformation: state.order.contactInformation,
    order: state.order.order,
    orderObjects: state.order.orderObjects,
    createdAt: state.order.createdAt,
    ...ownProps
  };
};

const mapDispatchToProps = dispatch => {
  return {
    getOrder: function(key, hash) {
      getOrder(key, hash)(dispatch);
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(OrderComponent);
