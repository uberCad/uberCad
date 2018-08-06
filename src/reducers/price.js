// import update from 'immutability-helper'

import {
  CALCULATE, CALCULATE_HIDE
} from '../actions/calculate'

let initialState = {
  prices: [],
  polyamideObjects: [],
  info: [],
  show: false,
  error: null
}

const price = (state = initialState, action) => {
  switch (action.type) {
    case CALCULATE:
      return {
        ...state,
        error: action.payload.error,
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

    default:
      return state
  }
}

export default price
