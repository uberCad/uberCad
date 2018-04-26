// import update from 'immutability-helper'

import {
  SIDEBAR_TOGGLE
} from '../actions/sidebar'

let initialState = {
  active: true
}

const options = (state = initialState, action) => {
  switch (action.type) {
    case SIDEBAR_TOGGLE:
      return {
        ...state,
        active: action.payload.active
      }
    default:
      return state
  }
}

export default options
