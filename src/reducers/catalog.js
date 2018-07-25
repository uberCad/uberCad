// import update from 'immutability-helper'

import { CATALOG_HIDE, CATALOG_SHOW } from '../actions/catalog'

let initialState = {
  show: false
}

const catalog = (state = initialState, action) => {
  switch (action.type) {
    case CATALOG_SHOW:
      return {
        ...state,
        show: action.payload.show
      }

    case CATALOG_HIDE:
      return {
        ...state,
        show: action.payload.show
      }

    default:
      return state
  }
}

export default catalog
