import Api from '../services/apiService'
import history from '../config/history'

export const ADD_PROJECT = 'ADD_PROJECT'

export const addProject = (project) => {
  return (dispatch) => {
    const config = {
      headers: {
        'content-type': 'multipart/form-data'
      }
    }
    Api.post('/add-project', {data: project}, config)
      .then((res) => {
        // selectFilter('all')(dispatch)
        // fetchProjectsIfNeeded('all', true)(dispatch)
        history.push(`/project/${res._key}`)
        dispatch({
          type: ADD_PROJECT,
          payload: {}
        })
      })
  }
}
