// import update from 'immutability-helper'

import { ORDER_GET } from '../actions/order'

let initialState = {
  contactInformation: null,
  order: [],
  orderObjects: [],
  createdAt: null
}

const order = (state = initialState, action) => {
  switch (action.type) {
    case ORDER_GET:
      return {
        ...state,
        contactInformation: action.payload.contactInformation,
        order: action.payload.order,
        orderObjects: action.payload.orderObjects,
        createdAt: action.payload.createdAt
      }

    default:
      return state
  }
}

export default order
