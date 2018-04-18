// import update from 'immutability-helper'

import {
  TOOLBAR_CHOOSE_TOOL
} from '../actions/toolbar'

let toolbarInitialState = {
  tool: false,
}

const toolbar = (state = toolbarInitialState, action) => {
  switch (action.type) {

    case TOOLBAR_CHOOSE_TOOL:
      return {
        ...state,
        tool: action.payload.tool
      }
    default:
      return state
  }
}

export default toolbar
