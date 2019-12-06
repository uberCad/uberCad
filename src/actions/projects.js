import { spinnerShow, spinnerHide } from './spinner';
import Api from '../services/apiService';

export const PROJECTS_INVALIDATE_FILTER = 'PROJECTS_INVALIDATE_FILTER';
export const PROJECTS_FETCH_BEGIN = 'PROJECTS_FETCH_BEGIN';
export const PROJECTS_FETCH_SUCCESS = 'PROJECTS_FETCH_SUCCESS';
export const PROJECTS_FETCH_FAILURE = 'PROJECTS_FETCH_FAILURE';
export const PROJECTS_SORT_FIELD = 'PROJECTS_SORT_FIELD';

export const requestProjects = filter => ({
  type: PROJECTS_FETCH_BEGIN,
  payload: { filter }
});

export const receiveProjects = (filter, projects) => {
  return {
    type: PROJECTS_FETCH_SUCCESS,
    payload: {
      filter,
      items: projects,
      receivedAt: Date.now()
    }
  };
};

export const receiveProjectsError = (filter, error) => ({
  type: PROJECTS_FETCH_FAILURE,
  payload: {
    filter,
    error
  }
});

export const fetchProjects = filter => dispatch => {
  spinnerShow()(dispatch);
  dispatch(requestProjects(filter));

  // return Api.get(`/api/projects-list`)
  return Api.get(`/api/projects-list/${filter}`)
    .then(res => {
      spinnerHide()(dispatch);
      if (!res[0].error) {
        return dispatch(receiveProjects(filter, res));
      } else return null;
    })
    .catch(error => {
      dispatch(receiveProjectsError(filter, error));
      spinnerHide()(dispatch);
    });
};

export const sortField = (projects, filter, field, sortUp) => {
  let dynamicSort = (property, up = true) => {
    let sortOrder = 1;
    if (property[0] === '-') {
      sortOrder = -1;
      property = property.substr(1);
    }
    return function(a, b) {
      let result = up
        ? a[property] < b[property]
          ? -1
          : a[property] > b[property]
          ? 1
          : 0
        : a[property] > b[property]
        ? -1
        : a[property] < b[property]
        ? 1
        : 0;
      return result * sortOrder;
    };
  };
  projects.sort(dynamicSort(field, sortUp));
  return dispatch => {
    dispatch({
      type: PROJECTS_SORT_FIELD,
      payload: {
        projects,
        filter,
        field,
        sortUp
      }
    });
  };
};
