import { spinnerShow, spinnerHide } from './spinner';
import Api from '../services/apiService';
import history from '../config/history';

export const PROJECT_FETCH_BEGIN = 'PROJECT_FETCH_BEGIN';
export const PROJECT_FETCH_SUCCESS = 'PROJECT_FETCH_SUCCESS';
export const PROJECT_FETCH_FAILURE = 'PROJECT_FETCH_FAILURE';
export const PROJECT_RENAME = 'PROJECT_RENAME';
export const PROJECT_RENAME_SAVE = 'PROJECT_RENAME_SAVE';
export const PROJECT_SNAPSHOT_RENAME = 'PROJECT_SNAPSHOT_RENAME';
export const PROJECT_SNAPSHOT_RENAME_SAVE = 'PROJECT_SNAPSHOT_RENAME_SAVE';
export const PROJECT_ARCHIVE = 'PROJECT_ARCHIVE';

export const requestProject = (id, preloadedProject) => ({
  type: PROJECT_FETCH_BEGIN,
  payload: { id, preloadedProject }
});

export const receiveProject = (id, project) => {
  return {
    type: PROJECT_FETCH_SUCCESS,
    payload: {
      id,
      project,
      receivedAt: Date.now()
    }
  };
};

export const receiveProjectError = (id, error) => ({
  type: PROJECT_FETCH_FAILURE,
  payload: {
    id,
    error
  }
});

export const fetchProject = (id, preloadedProject) => dispatch => {
  dispatch(spinnerShow());
  dispatch(requestProject(id, preloadedProject));
  return Api.get(`/projects/${id}`) //done
    .then(res => {
      // debugger;
      dispatch(spinnerHide());
      return dispatch(receiveProject(id, res[0]));
    })
    .catch(error => {
      dispatch(receiveProjectError(id, error));
      dispatch(spinnerHide());
    });
};

export const delProject = key => dispatch => {
  dispatch(spinnerShow());
  return Api.delete(`/project/${key}`).then(res => {
    history.push(`/projects`);
    dispatch(spinnerHide());
  });
};

export const renameProject = title => {
  return dispatch => {
    dispatch({
      type: PROJECT_RENAME,
      payload: {
        title
      }
    });
  };
};

export const saveProjectTitle = (key, title) => {
  return dispatch => {
    dispatch(spinnerShow());
    Api.post('/project/rename', { data: { key, title } }).then(res => {
      //done
      dispatch(spinnerHide());
      dispatch({
        type: PROJECT_RENAME_SAVE,
        payload: {
          title: res.title
        }
      });
    });
  };
};

export const renameSnapshot = snapshot => {
  return dispatch => {
    dispatch({
      type: PROJECT_SNAPSHOT_RENAME,
      payload: {
        snapshot
      }
    });
  };
};

export const saveSnapshotTitle = snapshot => {
  return dispatch => {
    dispatch(spinnerShow());
    Api.post('/snapshot/rename', {
      data: { key: snapshot._key, title: snapshot.title }
    }).then(res => {
      dispatch(spinnerHide());
      dispatch({
        type: PROJECT_SNAPSHOT_RENAME_SAVE,
        payload: {
          snapshot: res
        }
      });
    });
  };
};

export const archive = project => {
  return dispatch => {
    dispatch(spinnerShow());
    Api.post('/project/archive', {
      //done
      data: { key: project._key, status: 'archive' }
    }).then(res => {
      dispatch(spinnerHide());
      dispatch({
        type: PROJECT_ARCHIVE,
        payload: {
          status: res.status
        }
      });
    });
  };
};
