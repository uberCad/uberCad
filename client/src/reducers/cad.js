// import update from 'immutability-helper'

import {
  CAD_DRAW_DXF
} from '../actions/cad'

let initialState = {
  scene: null,
  camera: null,
  renderer: null,

  loading: false,
  didInvalidate: false,
  items: [],
  error: null,
  lastUpdated: null
}

const cad = (state = initialState, action) => {
  switch (action.type) {
    case CAD_DRAW_DXF:
      return {
        ...state,
        scene: action.payload.scene,
        camera: action.payload.camera,
        renderer: action.payload.renderer,
      }

    default:
      return state
  }
}

export default cad
