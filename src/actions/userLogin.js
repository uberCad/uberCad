import userService from '../services/UserService'
import Api from '../services/apiService'
import { spinnerHide, spinnerShow } from './spinner'

export const LOGIN_ACTION = 'LOGIN_ACTION'
export const LOGOUT_ACTION = 'LOGOUT_ACTION'
export const SET_USER_NAME = 'SET_USER_NAME'
export const REGISTER_USER = 'REGISTER_USER'

export const authorize = (username, password, history) => {
  return (dispatch) => {
    return userService.login(username, password)
      .then(res => {
        if (res.sid) {
          history.push('/')
          dispatch({
            type: LOGIN_ACTION,
            payload: {
              sid: res.sid,
              userName: res.userName
            }
          })
        } else {
          return res
        }
      })
  }
}

export const logout = (history) => {
  return (dispatch) => {
    userService.logout()
      .then(() => {
        history.push('/login')
        dispatch({
          type: LOGOUT_ACTION,
          payload: {
            sid: '',
            userName: ''
          }
        })
      })
  }
}

export const setUserName = (userName) => {
  return (dispatch) => {
    dispatch(spinnerShow())
    Api.get('/api/picture-url')
      .then((pictureUrl) => {
        dispatch(spinnerHide())
        dispatch({
          type: SET_USER_NAME,
          payload: {
            userName,
            pictureUrl
          }
        })
      })
  }
}

export const register = (user, history) => {
  return (dispatch) => {
    return userService.createUser(user)
      .then(res => {
        if (res && res.sid) {
          history.push('/')
          dispatch({
            type: REGISTER_USER,
            payload: {
              sid: res.sid,
              userName: res.userName
            }
          })
        } else {
          return res
        }
      })
  }
}
