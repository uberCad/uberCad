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
    Api.post('/api/add-project', {data: project}, config)
      .then((res) => {
        // selectFilter('all')(dispatch)
        // fetchProjects('all', true)(dispatch)
        history.push(`${process.env.PUBLIC_URL}/project/${res._key}`)
        dispatch({
          type: ADD_PROJECT,
          payload: {}
        })
      })
  }
}
