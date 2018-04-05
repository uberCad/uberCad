// import update from 'immutability-helper'

import {
  PROJECT_FETCH_BEGIN,
  PROJECT_FETCH_SUCCESS,
  PROJECT_FETCH_FAILURE
} from '../actions/project'

let projectsInitialState = {
  loading: false,
  project: null,
  error: null,
  lastUpdated: null
}

const project = (state = projectsInitialState, action) => {
  switch (action.type) {
    case PROJECT_FETCH_BEGIN:

      // try to find basic info about project in storage
      try {
        let keys = Object.keys(action.payload.projectsList)

        for (let key of keys) {
          let projects = action.payload.projectsList[key].items
          // console.error(projects)
          if (Array.isArray(projects)) {
            let project = projects.find(project => parseInt(project.id, 10) === parseInt(action.payload.id, 10))
            if (project) {
              let projectToThrow = {
                ...project,
                title: project.title + ' LOADING!!!'
              }
              throw projectToThrow
            }
          }
        }
      } catch (project) {
        return {
          ...state,
          loading: true,
          project
        }
      }

      return {
        ...state,
        loading: true,
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
