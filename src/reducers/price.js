// import update from 'immutability-helper'

import {
  CALCULATE, CALCULATE_CHECK_OBJECT, CALCULATE_HIDE
} from '../actions/calculate'

let initialState = {
  prices: [],
  polyamideObjects: [],
  info: [],
  show: false
}

const price = (state = initialState, action) => {
  switch (action.type) {
    case CALCULATE:
      return {
        ...state,
        prices: action.payload.prices,
        polyamideObjects: action.payload.polyamideObjects,
        info: action.payload.info,
        show: true
      }

    case CALCULATE_HIDE:
      return {
        ...state,
        show: false
      }
    case CALCULATE_CHECK_OBJECT:
      return {
        ...state,
        forceRender: {}
      }
    default:
      return state
  }
}

export default price
