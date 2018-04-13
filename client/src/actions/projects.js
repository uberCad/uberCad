import { spinnerShow, spinnerHide } from './spinner'

export const PROJECTS_INVALIDATE_FILTER = 'PROJECTS_INVALIDATE_FILTER'
export const PROJECTS_FETCH_BEGIN = 'PROJECTS_FETCH_BEGIN'
export const PROJECTS_FETCH_SUCCESS = 'PROJECTS_FETCH_SUCCESS'
export const PROJECTS_FETCH_FAILURE = 'PROJECTS_FETCH_FAILURE'

export const invalidateFilter = filter => {
  return dispatch => dispatch({
    type: PROJECTS_INVALIDATE_FILTER,
    payload: {filter}
  })
}

export const requestProjects = filter => ({
  type: PROJECTS_FETCH_BEGIN,
  payload: {filter}
})

export const receiveProjects = (filter, projects) => {
  return {
    type: PROJECTS_FETCH_SUCCESS,
    payload: {
      filter,
      items: projects,
      receivedAt: Date.now()
    }
  }
}

export const receiveProjectsError = (filter, error) => ({
  type: PROJECTS_FETCH_FAILURE,
  payload: {
    filter,
    error
  }
})

const fetchProjects = filter => dispatch => {
  spinnerShow()(dispatch)
  dispatch(requestProjects(filter))
  return fetch(`/api/projects/${filter}`)
    .then(handleErrors)
    .then(res => res.json())
    .then(json => {
      spinnerHide()(dispatch)
      return dispatch(receiveProjects(filter, json.projects))
    })
    .catch(error => {
      dispatch(receiveProjectsError(filter, error))
      spinnerHide()(dispatch)
    })
}

// Handle HTTP errors since fetch won't.
function handleErrors (response) {
  if (!response.ok) {
    throw Error(response.statusText)
  }
  return response
}

export const fetchProjectsIfNeeded = (filter) => {
  return dispatch => {
    return dispatch(fetchProjects(filter))
  }
}
