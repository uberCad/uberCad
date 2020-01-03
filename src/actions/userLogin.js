import userService from '../services/UserService';
import Api from '../services/apiService';
import { spinnerHide, spinnerShow } from './spinner';

export const LOGIN_ACTION = 'LOGIN_ACTION';
export const LOGOUT_ACTION = 'LOGOUT_ACTION';
export const SET_USER_NAME = 'SET_USER_NAME';
export const REGISTER_USER = 'REGISTER_USER';

export const authorize = (username, password, history) => {
  return dispatch => {
    return userService.login(username, password).then(res => {
      if (res.token) {
        history.push(`${process.env.PUBLIC_URL}/`);
        dispatch({
          type: LOGIN_ACTION,
          payload: {
            token: res.token,
            username: res.username
          }
        });
      } else {
        return res;
      }
    });
  };
};

export const logout = history => {
  return dispatch => {
    userService.logout().then(() => {
      history.push(`${process.env.PUBLIC_URL}/login`);
      dispatch({
        type: LOGOUT_ACTION,
        payload: {
          token: '',
          username: ''
        }
      });
    });
  };
};

export const setUsername = username => {
  return dispatch => {
    dispatch(spinnerShow());
    Api.get('/api/picture-url').then(pictureUrl => {
      dispatch(spinnerHide());
      dispatch({
        type: SET_USER_NAME,
        payload: {
          username,
          pictureUrl
        }
      });
    });
  };
};

export const register = (user, history) => {
  return dispatch => {
    return userService.createUser(user).then(res => {
      if (res && res.token) {
        history.push(`${process.env.PUBLIC_URL}/`);
        dispatch({
          type: REGISTER_USER,
          payload: {
            token: res.token,
            username: res.username
          }
        });
      } else {
        return res;
      }
    });
  };
};
