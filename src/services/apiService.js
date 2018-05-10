import axios from 'axios'
import { API_HOST } from '../config'
import UserService from './UserService'

axios.defaults.baseURL = API_HOST
if (window && window.localStorage.userToken) {
  axios.defaults.headers.common['x-code'] = JSON.parse(window.localStorage.userToken)
}

export default class ApiService {
  static post (url, options) {
    options = options || {}
    options.headers = options.headers || {}
    options.data = options.data || {}

    return new Promise((resolve, reject) => {
      axios.post(`${url}`, options.data, { headers: options.headers })
        .then(response => {
          resolve(response.data)
        })
        .catch((error) => {
          if (error.response && error.response.status === 401) {
            UserService.logout()
          }
          reject(error)
        })
    })
  }

  static get (url) {
    return new Promise((resolve, reject) => {
      axios.get(`${url}`)
        .then(response => {
          resolve(response.data)
        })
        .catch((error) => {
          if (error.response && error.response.status === 401) {
            UserService.logout()
          }
          reject(error)
        })
    })
  }

  static put (url, options) {
    options = options || {}
    options.data = options.data || {}
    return new Promise((resolve, reject) => {
      axios.put(`${url}`, options.data)
        .then(response => {
          resolve(response.data)
        })
        .catch((error) => {
          if (error.response && error.response.status === 401) {
            UserService.logout()
          }
          reject(error)
        })
    })
  }

  static delete (url) {
    return new Promise((resolve, reject) => {
      axios.delete(`${url}`)
        .then(response => {
          resolve(response.data)
        })
        .catch((error) => {
          if (error.response && error.response.status === 401) {
            UserService.logout()
          }
          reject(error)
        })
    })
  }
}
//
//
// export default {
//   get: (url, json = true) => {
//     return fetch(url)
//       .then(handleErrors)
//       .then(res => {
//         return json ? res.json() : res.text()
//       })
//   }
// }
//
// // Handle HTTP errors since fetch won't.
// function handleErrors (response) {
//   if (!response.ok) {
//     throw Error(response.statusText)
//   }
//   return response
// }
