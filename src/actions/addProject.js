import Api from '../services/apiService';
import history from '../config/history';

export const ADD_PROJECT = 'ADD_PROJECT';

export const addProject = project => {
  return dispatch => {
    const config = {
      headers: {
        'content-type': 'multipart/form-data'
      }
    };
    Api.post('/project/add', { data: project }, config).then(res => {
      //done
      history.push(`/project/${res._key}`);
      dispatch({
        type: ADD_PROJECT,
        payload: {}
      });
    });
  };
};
