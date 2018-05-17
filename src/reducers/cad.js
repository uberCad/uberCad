import update from 'immutability-helper'

import {
  CAD_DRAW_DXF,
  CAD_DO_SELECTION,
  CAD_TOGGLE_VISIBLE,
  CAD_TOGGLE_VISIBLE_LAYER,
  CAD_SHOW_ALL,
  CAD_GROUP_ENTITIES
} from '../actions/cad'

import {
  SNAPSHOT_LOAD_SCENE
} from '../actions/panelSnapshots'

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
    case SNAPSHOT_LOAD_SCENE:
      return {
        ...state,
        scene: action.payload.scene
      }
    case CAD_DRAW_DXF:
      return {
        ...state,
        scene: action.payload.scene,
        camera: action.payload.camera,
        renderer: action.payload.renderer,
        cadCanvas: action.payload.cadCanvas
      }
    case CAD_DO_SELECTION:
      return update(state, {activeEntities: {$set: [...action.payload.activeEntities]}})
    case CAD_TOGGLE_VISIBLE:
      return update(state, {activeEntities: {$set: [...state.activeEntities]}})
    case CAD_TOGGLE_VISIBLE_LAYER:
      return update(state, {scene: {children: {$set: [...state.scene.children]}}})
    case CAD_SHOW_ALL:
      return update(state, {
        scene: {children: {$set: [...state.scene.children]}},
        activeEntities: {$set: [...state.activeEntities]}
      })
    case CAD_GROUP_ENTITIES:
      return update(state, {
        scene: {children: {$set: [...state.scene.children]}}
      })
    default:
      return state
  }
}

export default cad
