// import update from 'immutability-helper'

import { MODAL_HIDE, MODAL_SHOW } from '../actions/modal'

let initialState = {
  show: false,
  message: '',
  title: ''
}

const modal = (state = initialState, action) => {
  switch (action.type) {
    case MODAL_HIDE:
      return {
        ...state,
        show: action.payload.show,
        message: action.payload.message,
        title: action.payload.title
      }

    case MODAL_SHOW:
      return {
        ...state,
        show: action.payload.show,
        message: action.payload.message,
        title: action.payload.title
      }

    default:
      return state
  }
}

export default modal
