import { connect } from 'react-redux'
import CatalogComponent from './catalogComponent'
import { catalogHide, catalogShow } from '../../actions/catalog'

const mapStateToProps = (state, ownProps) => {
  return {
    lang: state.locale.lang,
    show: state.catalog.show,
    ...ownProps
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    catalogShow: function () {
      catalogShow()(dispatch)
    },
    catalogHide: function () {
      catalogHide()(dispatch)
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CatalogComponent)
