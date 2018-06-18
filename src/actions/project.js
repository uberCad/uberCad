import { spinnerShow, spinnerHide } from './spinner'
import Api from '../services/apiService'
import history from '../config/history'

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
  return Api.get(`/api/project/${id}`)
    .then(res => {
      dispatch(spinnerHide())
      return dispatch(receiveProject(id, res[0]))
    })
    .catch(error => {
      dispatch(receiveProjectError(id, error))
      dispatch(spinnerHide())
    })
}

export const delProject = (key) => dispatch => {
  dispatch(spinnerShow())
  return Api.delete(`/api/project/${key}`)
    .then((res) => {
      console.log(res)
      history.push(`/projects`)
      dispatch(spinnerHide())
    })
}
