// import update from 'immutability-helper'

import {
  LOGIN_ACTION, LOGOUT_ACTION, SET_USER_NAME, REGISTER_USER
} from '../actions/userLogin'

let initialState = {
  sid: '',
  userName: ''
}

const userLogin = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN_ACTION:
      return {
        ...state,
        sid: action.payload.sid,
        userName: action.payload.userName
      }
    case SET_USER_NAME:
      return {
        ...state,
        userName: action.payload.userName
      }
    case LOGOUT_ACTION:
      return {
        ...state,
        sid: action.payload.sid,
        userName: action.payload.userName
      }
    case REGISTER_USER:
      return {
        ...state,
        sid: action.payload.sid,
        userName: action.payload.userName
      }

    default:
      return state
  }
}

export default userLogin
