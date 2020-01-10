// import update from 'immutability-helper'

import {
  LOGIN_ACTION,
  LOGOUT_ACTION,
  SET_USER_NAME,
  REGISTER_USER
} from '../actions/userLogin';

let initialState = {
  token: '',
  username: '',
  pictureUrl: ''
};

const userLogin = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN_ACTION:
      return {
        ...state,
        token: action.payload.token,
        username: action.payload.username,
        pictureUrl: action.payload.pictureUrl
      };
    case SET_USER_NAME:
      return {
        ...state,
        username: action.payload.username,
        pictureUrl: action.payload.pictureUrl
      };
    case LOGOUT_ACTION:
      return {
        ...state,
          token: action.payload.token,
        username: action.payload.username
      };
    case REGISTER_USER:
      return {
        ...state,
        token: action.payload.token,
        username: action.payload.username
      };

    default:
      return state;
  }
};

export default userLogin;
