import update from 'immutability-helper'

import {
  CAD_DRAW_DXF,
  CAD_DO_SELECTION
} from '../actions/cad'

let initialState = {
  scene: null,
  camera: null,
  renderer: null,
  cadCanvas: null,
  activeEntities: [],
  editMode: {
    isEdit: false
  },

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
        cadCanvas: action.payload.cadCanvas
      }
    case CAD_DO_SELECTION:
      console.error(CAD_DO_SELECTION, 'TIME TO IMPLEMENT IMMUTABILITY-HELPER', action.payload.activeEntities)
      return update(state, {
        activeEntities: {$set: action.payload.activeEntities}
      })

      // console.error(CAD_DO_SELECTION, 'TIME TO IMPLEMENT IMMUTABILITY-HELPER', action.payload.activeEntities)
      // return {
      //   ...state,
      //   activeEntities: action.payload.activeEntities
      // }

    default:
      return state
  }
}

export default cad
