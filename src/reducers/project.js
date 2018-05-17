import update from 'immutability-helper'

import {
  PROJECT_FETCH_BEGIN,
  PROJECT_FETCH_SUCCESS,
  PROJECT_FETCH_FAILURE
} from '../actions/project'

import {
  SNAPSHOT_ADD,
  SNAPSHOT_DELETE
} from '../actions/panelSnapshots'

let initialState = {
  loading: false,
  id: null,
  project: null,
  error: null,
  lastUpdated: null
}

const project = (state = initialState, action) => {
  switch (action.type) {
    case SNAPSHOT_ADD:
      return update(state, {
        project: {
          snapshots: {$push: [action.payload.snapshot]}
        }
      })
    case SNAPSHOT_DELETE:
      let index
      state.project.snapshots.forEach((item, i) => {
        if (item._key === action.payload.snapshot._key) { index = i }
      })
      return update(state, {
        project: {
          snapshots: {$splice: [[index, 1]]}
        }
      })
    case PROJECT_FETCH_BEGIN:
      let preloadedProject = action.payload.preloadedProject

      return {
        ...state,
        id: action.payload.id,
        loading: true,
        ...preloadedProject && {project: preloadedProject}
      }
    case PROJECT_FETCH_SUCCESS:
      return {
        ...state,
        loading: false,
        project: action.payload.project,
        lastUpdated: action.payload.receivedAt
      }
    case PROJECT_FETCH_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload.error
      }
    default:
      return state
  }
}

export default project
