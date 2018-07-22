import { connect } from 'react-redux'
import ModalComponent from './modalComponent'
import { modalHide } from '../../actions/modal'

const mapStateToProps = (state, ownProps) => {
  return {
    lang: state.locale.lang,
    show: state.modal.show,
    message: state.modal.message,
    title: state.modal.title,
    ...ownProps
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    modalHide: function () {
      modalHide()(dispatch)
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ModalComponent)
