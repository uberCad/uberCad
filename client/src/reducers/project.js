// import update from 'immutability-helper'

import {
  PROJECT_FETCH_BEGIN,
  PROJECT_FETCH_SUCCESS,
  PROJECT_FETCH_FAILURE
} from '../actions/project'

let projectsInitialState = {
  loading: false,
  id: null,
  project: null,
  error: null,
  lastUpdated: null
}

const project = (state = projectsInitialState, action) => {
  switch (action.type) {
    case PROJECT_FETCH_BEGIN:
      let preloadedProject = action.payload.preloadedProject

      return {
        ...state,
        id: action.payload.id,
        loading: true,
        ...preloadedProject && {project: preloadedProject},
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
