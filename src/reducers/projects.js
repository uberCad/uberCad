// import update from 'immutability-helper'

import {
  PROJECTS_INVALIDATE_FILTER,
  PROJECTS_FETCH_BEGIN,
  PROJECTS_FETCH_SUCCESS,
  PROJECTS_FETCH_FAILURE
} from '../actions/projects'

let initialState = {
  loading: false,
  didInvalidate: false,
  items: [],
  error: null,
  lastUpdated: null
}

const projects = (state = initialState, action) => {
  switch (action.type) {
    case PROJECTS_INVALIDATE_FILTER:
      return {
        ...state,
        didInvalidate: true
      }
    case PROJECTS_FETCH_BEGIN:
      return {
        ...state,
        loading: true,
        didInvalidate: false
      }
    case PROJECTS_FETCH_SUCCESS:
      return {
        ...state,
        loading: false,
        didInvalidate: false,
        items: action.payload.items,
        lastUpdated: action.payload.receivedAt
      }
    case PROJECTS_FETCH_FAILURE:
      return {
        ...state,
        loading: false,
        items: [],
        error: action.payload.error
      }
    default:
      return state
  }
}

const projectsByFilter = (state = {}, action) => {
  switch (action.type) {
    case PROJECTS_INVALIDATE_FILTER:
    case PROJECTS_FETCH_SUCCESS:
    case PROJECTS_FETCH_BEGIN:
    case PROJECTS_FETCH_FAILURE:
      return {
        ...state,
        [action.payload.filter]: projects(state[action.payload.filter], action)
      }
    default:
      return state
  }
}

export default projectsByFilter

// let initialState = {
//   items: [],
//   loading: false,
//   error: null
// }
//
// export default function projects (state = initialState, action) {
//   console.log('REDUCERS: projects(state, action)', state, action)
//
//   console.error(action.type, state, action)
//
//   switch (action.type) {
//     case FETCH_PROJECTS_BEGIN:
//       // Mark the state as "loading" so we can show a spinner or something
//       // Also, reset any errors. We're starting fresh.
//       return {
//         ...state,
//         loading: true,
//         error: null
//       }
//
//     case FETCH_PROJECTS_SUCCESS:
//       // All done: set loading "false".
//       // Also, replace the items with the ones from the server
//       return {
//         ...state,
//         loading: false,
//         items: action.payload.items
//       }
//
//     case FETCH_PROJECTS_FAILURE:
//       // The request failed, but it did stop, so set loading to "false".
//       // Save the error, and we can display it somewhere
//       // Since it failed, we don't have items to display anymore, so set it empty.
//       // This is up to you and your app though: maybe you want to keep the items
//       // around! Do whatever seems right.
//
//       return {
//         ...state,
//         loading: false,
//         error: action.payload.error,
//         items: []
//       }
//
//     default:
//       // ALWAYS have a default case in a reducer
//       return state
//   }
// }
