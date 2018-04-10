import { spinnerShow, spinnerHide } from './spinner'

export const PROJECT_FETCH_BEGIN = 'PROJECT_FETCH_BEGIN'
export const PROJECT_FETCH_SUCCESS = 'PROJECT_FETCH_SUCCESS'
export const PROJECT_FETCH_FAILURE = 'PROJECT_FETCH_FAILURE'

export const requestProject = (id, preloadedProject) => ({
  type: PROJECT_FETCH_BEGIN,
  payload: {id, preloadedProject}
})

export const receiveProject = (id, project) => {
  return {
    type: PROJECT_FETCH_SUCCESS,
    payload: {
      id,
      project,
      receivedAt: Date.now()
    }
  }
}

export const receiveProjectError = (id, error) => ({
  type: PROJECT_FETCH_FAILURE,
  payload: {
    id,
    error
  }
})

export const fetchProject = (id, preloadedProject) => dispatch => {
  dispatch(spinnerShow())
  dispatch(requestProject(id, preloadedProject))
  return fetch(`/api/project/${id}`)
    .then(handleErrors)
    .then(res => res.json())
    .then(json => {
      dispatch(spinnerHide())
      return dispatch(receiveProject(id, json.project))
    })
    .catch(error => {
      dispatch(receiveProjectError(id, error))
      dispatch(spinnerHide())
    })
}

// Handle HTTP errors since fetch won't.
function handleErrors (response) {
  if (!response.ok) {
    throw Error(response.statusText)
  }
  return response
}
